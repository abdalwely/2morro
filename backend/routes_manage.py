import asyncio
import os
import uuid
import json
import re
from datetime import datetime, timezone

from bson import ObjectId, json_util
from pymongo.errors import DuplicateKeyError
from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask
import tempfile

from db import db, doc_to_model, log_activity, now_iso
import storage
from backup_zip import (
    create_full_backup,
    restore_full_backup,
    MAX_ARCHIVE_SIZE,
)
from defaults import HEX_RE, TEXT_KEYS, default_pages, default_theme
from models import ThemeIn, UserCreate, UserUpdate
from security import get_current_admin, hash_password
from seed import _seed_admin, default_settings, reset_demo_content
from seed_en import SETTINGS_EN

manage_router = APIRouter(prefix='/api/admin')

EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')
BACKUP_PARTS = {
    'content': ['services', 'projects', 'delivery_models', 'files'],
    'users': ['users'],
    'settings': ['settings'],
    'activity': ['activity'],
}
MAX_BACKUP_SIZE = 25 * 1024 * 1024


# ---------------- Users ----------------

def _public_user(u: dict) -> dict:
    return {'id': str(u['_id']), 'name': u.get('name', ''), 'email': u.get('email', ''),
            'role': u.get('role', 'editor'), 'active': u.get('active', True), 'created_at': u.get('created_at', '')}


def _oid(user_id: str) -> ObjectId:
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=404, detail='المستخدم غير موجود')
    return ObjectId(user_id)


async def _ensure_other_admin(exclude: ObjectId):
    others = await db.users.count_documents({'_id': {'$ne': exclude}, 'role': 'admin', 'active': {'$ne': False}})
    if others == 0:
        raise HTTPException(status_code=400, detail='يجب أن يبقى مدير واحد نشط على الأقل')


@manage_router.get('/users')
async def list_users(user: dict = Depends(get_current_admin)):
    users = await db.users.find({}, {'password_hash': 0}).sort('created_at', 1).to_list(500)
    return [_public_user(u) for u in users]


@manage_router.post('/users')
async def create_user(data: UserCreate, user: dict = Depends(get_current_admin)):
    email = data.email.strip().lower()
    if not EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail='صيغة البريد الإلكتروني غير صحيحة')
    if await db.users.find_one({'email': email}):
        raise HTTPException(status_code=400, detail='يوجد حساب مسجل بهذا البريد الإلكتروني')
    doc = {'name': data.name.strip(), 'email': email, 'password_hash': hash_password(data.password),
           'role': data.role, 'active': True, 'created_at': now_iso()}
    result = await db.users.insert_one(doc)
    doc['_id'] = result.inserted_id
    await log_activity('create', 'users', doc['name'], user)
    return _public_user(doc)


@manage_router.put('/users/{user_id}')
async def update_user(user_id: str, data: UserUpdate, user: dict = Depends(get_current_admin)):
    oid = _oid(user_id)
    target = await db.users.find_one({'_id': oid})
    if not target:
        raise HTTPException(status_code=404, detail='المستخدم غير موجود')
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    losing_admin = (updates.get('role', target.get('role')) != 'admin' or updates.get('active') is False)
    if target.get('role') == 'admin' and losing_admin:
        if user_id == user['id']:
            raise HTTPException(status_code=400, detail='لا يمكنك إيقاف حسابك أو إزالة صلاحية المدير عن نفسك')
        await _ensure_other_admin(oid)
    if 'password' in updates:
        updates['password_hash'] = hash_password(updates.pop('password'))
    if 'name' in updates:
        updates['name'] = updates['name'].strip()
    updates['updated_at'] = now_iso()
    await db.users.update_one({'_id': oid}, {'$set': updates})
    await log_activity('update', 'users', target.get('name', ''), user)
    return _public_user(await db.users.find_one({'_id': oid}))


@manage_router.delete('/users/{user_id}')
async def delete_user(user_id: str, user: dict = Depends(get_current_admin)):
    oid = _oid(user_id)
    if user_id == user['id']:
        raise HTTPException(status_code=400, detail='لا يمكنك حذف حسابك الحالي')
    target = await db.users.find_one({'_id': oid})
    if not target:
        raise HTTPException(status_code=404, detail='المستخدم غير موجود')
    if target.get('role') == 'admin':
        await _ensure_other_admin(oid)
    await db.users.delete_one({'_id': oid})
    await log_activity('delete', 'users', target.get('name', ''), user)
    return {'message': 'تم حذف المستخدم'}


# ---------------- Backup ----------------

def _date_query(date_from: str, date_to: str) -> dict:
    q = {}
    if date_from:
        q['$gte'] = date_from
    if date_to:
        q['$lte'] = date_to + 'T23:59:59.999999+00:00'
    return {'created_at': q} if q else {}


def _parse_parts(parts: str) -> list:
    chosen = [p for p in (parts or '').split(',') if p in BACKUP_PARTS]
    if not chosen:
        raise HTTPException(status_code=400, detail='اختر نوع البيانات المطلوب نسخها')
    return chosen


@manage_router.get('/backup')
async def export_backup(parts: str = 'content,users,settings,activity', date_from: str = '', date_to: str = '',
                        user: dict = Depends(get_current_admin)):
    for d in (date_from, date_to):
        if d and not re.fullmatch(r'\d{4}-\d{2}-\d{2}', d):
            raise HTTPException(status_code=400, detail='صيغة التاريخ غير صحيحة')
    chosen = _parse_parts(parts)
    date_q = _date_query(date_from, date_to)
    collections = {}
    for part in chosen:
        for col in BACKUP_PARTS[part]:
            query = {} if col == 'settings' else date_q
            collections[col] = await db[col].find(query).to_list(100000)
    payload = {'app': '2morro-site', 'version': 1, 'created_at': now_iso(), 'parts': chosen,
               'date_from': date_from, 'date_to': date_to, 'collections': collections}
    await log_activity('export', 'backup', '، '.join(chosen), user)
    stamp = datetime.now(timezone.utc).strftime('%Y%m%d-%H%M')
    return Response(content=json_util.dumps(payload, ensure_ascii=False), media_type='application/json',
                    headers={'Content-Disposition': f'attachment; filename="2morro-backup-{stamp}.json"'})


def _load_backup(raw: bytes) -> dict:
    try:
        payload = json_util.loads(raw.decode('utf-8'))
    except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(status_code=400, detail='ملف النسخة الاحتياطية غير صالح') from exc
    if not isinstance(payload, dict) or payload.get('app') != '2morro-site' or not isinstance(payload.get('collections'), dict):
        raise HTTPException(status_code=400, detail='هذا الملف ليس نسخة احتياطية من هذا الموقع')
    return payload


def _prepare(payload: dict, allowed: set) -> dict:
    prepared = {}
    for col, docs in payload['collections'].items():
        if col not in allowed or not isinstance(docs, list):
            continue
        clean = [d for d in docs if isinstance(d, dict) and '_id' in d]
        if col == 'users':
            emails = [str(d.get('email', '')).strip().lower() for d in clean]
            if any(not e for e in emails) or len(set(emails)) != len(emails):
                raise HTTPException(status_code=400, detail='ملف النسخة يحتوي على حسابات بدون بريد أو ببريد مكرر')
        prepared[col] = clean
    if not prepared:
        raise HTTPException(status_code=400, detail='لا توجد بيانات قابلة للاستعادة في هذا الملف')
    return prepared


async def _upsert_user(d: dict, current: dict):
    email = str(d.get('email', '')).strip().lower()
    if email == current['email'] or str(d['_id']) == current['id']:
        return False
    existing = await db.users.find_one({'email': email})
    if existing and existing['_id'] != d['_id']:
        fields = {k: v for k, v in d.items() if k != '_id'}
        await db.users.update_one({'_id': existing['_id']}, {'$set': fields})
    else:
        await db.users.replace_one({'_id': d['_id']}, d, upsert=True)
    return True


async def _restore_collection(col: str, docs: list, mode: str, current: dict) -> int:
    if mode == 'replace':
        query = {'_id': {'$ne': ObjectId(current['id'])}} if col == 'users' else {}
        await db[col].delete_many(query)
    count = 0
    for d in docs:
        try:
            if col == 'users':
                count += await _upsert_user(d, current)
                continue
            await db[col].replace_one({'_id': d['_id']}, d, upsert=True)
            count += 1
        except DuplicateKeyError:
            continue
    return count


@manage_router.post('/backup/restore')
async def restore_backup(file: UploadFile = File(...), mode: str = Form('merge'), parts: str = Form(''),
                         user: dict = Depends(get_current_admin)):
    if mode not in ('merge', 'replace'):
        raise HTTPException(status_code=400, detail='طريقة الاستعادة غير صحيحة')
    raw = await file.read()
    if len(raw) > MAX_BACKUP_SIZE:
        raise HTTPException(status_code=400, detail='حجم الملف أكبر من المسموح (25 ميجابايت)')
    payload = _load_backup(raw)
    if mode == 'replace' and (payload.get('date_from') or payload.get('date_to')):
        raise HTTPException(status_code=400, detail='هذه النسخة مأخوذة لفترة زمنية محددة، لذلك لا يمكن استعادتها بالاستبدال الكامل حتى لا تُحذف البيانات خارج الفترة. استخدم طريقة الدمج.')
    allowed = {c for p in (_parse_parts(parts) if parts else BACKUP_PARTS) for c in BACKUP_PARTS[p]}
    prepared = _prepare(payload, allowed)
    restored = {}
    for col, docs in prepared.items():
        restored[col] = await _restore_collection(col, docs, mode, user)
    await _seed_admin()
    await log_activity('restore', 'backup', '، '.join(restored), user)
    return {'restored': restored, 'mode': mode}


# ---------------- Full ZIP Backup ----------------

@manage_router.post('/backup/zip')
async def create_zip_backup(
    admin=Depends(get_current_admin)
):
    temp_path = None

    try:
        # إنشاء ملف ZIP مؤقت يحتوي على قاعدة البيانات والملفات
        temp_path, summary = await create_full_backup()

        # إنشاء اسم فريد للنسخة الاحتياطية
        timestamp = datetime.now(timezone.utc).strftime(
            "%Y%m%d-%H%M%S"
        )

        filename = (
            f"2morro-full-{timestamp}-{uuid.uuid4().hex[:8]}.zip"
        )

        # رفع الملف مباشرة من القرص إلى Supabase Storage
        upload_result = await asyncio.to_thread(
            storage.put_backup_file,
            filename,
            temp_path
        )

        return {
            "success": True,
            "message": "تم إنشاء النسخة الاحتياطية ZIP ورفعها بنجاح.",
            "filename": filename,
            "path": upload_result["path"],
            "archive_size": upload_result["size"],
            "collection_count": summary["collection_count"],
            "collection_counts": summary["collection_counts"],
            "file_count": summary["file_count"],
            "total_file_size": summary["total_file_size"],
            "created_at": summary["created_at"]
        }

    except Exception:
        import logging
        logging.exception("ZIP backup creation failed")
        raise HTTPException(
            status_code=500,
            detail="تعذر إنشاء النسخة الاحتياطية ZIP أو رفعها."
        )

    finally:
        # حذف الملف المؤقت من جهاز الخادم بعد انتهاء العملية
        if temp_path and os.path.isfile(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass


@manage_router.get('/backup/zip')
async def list_zip_backups(
    limit: int = 100,
    offset: int = 0,
    admin=Depends(get_current_admin)
):
    try:
        if limit < 1 or limit > 100:
            raise HTTPException(
                status_code=400,
                detail="يجب أن يكون limit بين 1 و100."
            )

        if offset < 0:
            raise HTTPException(
                status_code=400,
                detail="قيمة offset غير صحيحة."
            )

        objects = await asyncio.to_thread(
            storage.list_backup_objects,
            limit=limit,
            offset=offset
        )

        backups = []

        for item in objects:
            filename = item.get("name", "")

            # عرض النسخ التي أنشأها النظام فقط.
            if not re.fullmatch(
                r"2morro-full-\d{8}-\d{6}-[a-f0-9]{8}\.zip",
                filename
            ):
                continue

            metadata = item.get("metadata") or {}

            backups.append({
                "filename": filename,
                "path": filename,
                "size": metadata.get("size"),
                "content_type": metadata.get("mimetype"),
                "created_at": item.get("created_at"),
                "updated_at": item.get("updated_at")
            })

        return {
            "success": True,
            "count": len(backups),
            "limit": limit,
            "offset": offset,
            "backups": backups
        }

    except HTTPException:
        raise

    except Exception:
        import logging
        logging.exception("ZIP backup listing failed")

        raise HTTPException(
            status_code=500,
            detail="تعذر جلب قائمة النسخ الاحتياطية."
        )


@manage_router.get('/backup/zip/{filename}')
async def download_zip_backup(
    filename: str,
    admin=Depends(get_current_admin)
):
    if not re.fullmatch(
        r"2morro-full-\d{8}-\d{6}-[a-f0-9]{8}\.zip",
        filename
    ):
        raise HTTPException(
            status_code=400,
            detail="اسم ملف النسخة الاحتياطية غير صالح."
        )

    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(
            suffix=".zip",
            delete=False
        ) as temp_file:
            temp_path = temp_file.name

        download_info = await asyncio.to_thread(
            storage.download_backup_to_file,
            filename,
            temp_path,
            max_size=MAX_ARCHIVE_SIZE,
        )

        if download_info["size"] <= 0:
            raise HTTPException(
                status_code=422,
                detail="ملف النسخة الاحتياطية فارغ."
            )

        return FileResponse(
            path=temp_path,
            media_type="application/zip",
            filename=filename,
            background=BackgroundTask(
                os.remove,
                temp_path
            )
        )

    except HTTPException:
        if temp_path and os.path.isfile(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass
        raise

    except Exception:
        import logging
        logging.exception(
            "ZIP backup download failed: %s",
            filename
        )

        if temp_path and os.path.isfile(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass

        raise HTTPException(
            status_code=500,
            detail="تعذر تنزيل النسخة الاحتياطية."
        )

@manage_router.delete('/backup/zip/{filename}')
async def delete_zip_backup(
    filename: str,
    admin=Depends(get_current_admin)
):
    # السماح فقط بأسماء النسخ التي ينشئها النظام
    if not re.fullmatch(
        r"2morro-full-\d{8}-\d{6}-[a-f0-9]{8}\.zip",
        filename
    ):
        raise HTTPException(
            status_code=400,
            detail="اسم ملف النسخة الاحتياطية غير صالح."
        )

    try:
        await asyncio.to_thread(
            storage.delete_backup_object,
            filename
        )

        return {
            "success": True,
            "message": "تم إرسال طلب حذف النسخة الاحتياطية بنجاح.",
            "filename": filename
        }

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="تعذر حذف النسخة الاحتياطية."
        )


@manage_router.post('/backup/zip/{filename}/restore')
async def restore_zip_backup(
    filename: str,
    admin=Depends(get_current_admin),
):
    if not re.fullmatch(
        r"2morro-full-\d{8}-\d{6}-[a-f0-9]{8}\.zip",
        filename,
    ):
        raise HTTPException(
            status_code=400,
            detail="اسم ملف النسخة الاحتياطية غير صالح.",
        )

    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(
            prefix="2morro-restore-",
            suffix=".zip",
            delete=False,
        ) as temp_file:
            temp_path = temp_file.name

        # Download is bounded by the same archive limit used by validation.
        from backup_zip import MAX_ARCHIVE_SIZE

        download_info = await asyncio.to_thread(
            storage.download_backup_to_file,
            filename,
            temp_path,
            MAX_ARCHIVE_SIZE,
        )

        if download_info["size"] <= 0:
            raise HTTPException(
                status_code=422,
                detail="ملف النسخة الاحتياطية فارغ.",
            )

        result = await restore_full_backup(
            temp_path,
            admin,
        )

        # Log only after a successful restore.
        await log_activity(
            "restore",
            "backup",
            filename,
            admin,
        )

        return {
            "success": True,
            "message": "تمت استعادة النسخة الاحتياطية بنجاح.",
            "filename": filename,
            "restored_collections": result["restored_collections"],
            "restored_files": result["restored_files"],
        }

    except HTTPException:
        raise

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=f"ملف النسخة الاحتياطية غير صالح: {str(exc)}",
        ) from exc

    except Exception as exc:
        # Keep technical details in server logs, not in the API response.
        import logging
        logging.exception("ZIP backup restore failed: %s", filename)

        raise HTTPException(
            status_code=500,
            detail=(
                "تعذرت استعادة النسخة الاحتياطية. "
                "تحقق من سجل الخادم لمعرفة التفاصيل."
            ),
        ) from exc

    finally:
        if temp_path and os.path.isfile(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass


# ---------------- Theme ----------------

def _validate_theme(theme: ThemeIn) -> dict:
    base = default_theme()
    colors = {k: theme.colors.get(k, v) for k, v in base['colors'].items()}
    if not all(re.fullmatch(HEX_RE, str(c)) for c in colors.values()):
        raise HTTPException(status_code=400, detail='قيم الألوان يجب أن تكون بصيغة HEX مثل #0066FF')
    speed = theme.animations.get('speed', 'normal')
    if speed not in ('slow', 'normal', 'fast'):
        raise HTTPException(status_code=400, detail='سرعة الحركة غير صحيحة')
    backgrounds = {}
    for k in base['backgrounds']:
        if k == 'overlay':
            try:
                backgrounds[k] = max(0, min(95, int(theme.backgrounds.get(k, 70))))
            except (TypeError, ValueError) as exc:
                raise HTTPException(status_code=400, detail='نسبة تعتيم الخلفية غير صحيحة') from exc
            continue
        url = str(theme.backgrounds.get(k, '') or '').strip()
        if url and not (url.startswith('/api/files/') or re.match(r'^https?://', url)):
            raise HTTPException(status_code=400, detail='رابط صورة الخلفية غير صالح')
        backgrounds[k] = url
    return {
        'colors': {k: v.upper() for k, v in colors.items()},
        'animations': {'enabled': bool(theme.animations.get('enabled', True)), 'speed': speed},
        'decorations': {'grid': bool(theme.decorations.get('grid', True)), 'glow': bool(theme.decorations.get('glow', True))},
        'backgrounds': backgrounds,
    }


@manage_router.put('/theme')
async def update_theme(theme: ThemeIn, user: dict = Depends(get_current_admin)):
    clean = _validate_theme(theme)
    await db.settings.update_one({}, {'$set': {'theme': clean, 'updated_at': now_iso()}}, upsert=True)
    await log_activity('update', 'theme', 'المظهر والألوان', user)
    return clean


@manage_router.post('/theme/reset')
async def reset_theme(user: dict = Depends(get_current_admin)):
    theme = default_theme()
    await db.settings.update_one({}, {'$set': {'theme': theme, 'updated_at': now_iso()}}, upsert=True)
    await log_activity('reset', 'theme', 'الألوان والمظهر الافتراضي', user)
    return theme


# ---------------- Default content ----------------

@manage_router.post('/defaults/texts')
async def reset_texts(user: dict = Depends(get_current_admin)):
    base = default_settings()
    updates = {k: base[k] for k in TEXT_KEYS}
    updates.update({'en': SETTINGS_EN, 'pages': default_pages(), 'copyright_text': '', 'copyright_text_en': '',
                    'updated_at': now_iso()})
    await db.settings.update_one({}, {'$set': updates}, upsert=True)
    await log_activity('reset', 'settings', 'النصوص الافتراضية', user)
    return doc_to_model(await db.settings.find_one({}))


@manage_router.post('/defaults/demo-content')
async def reset_demo(user: dict = Depends(get_current_admin)):
    count = await reset_demo_content()
    await log_activity('reset', 'content', 'المحتوى الافتراضي', user)
    return {'restored': count}

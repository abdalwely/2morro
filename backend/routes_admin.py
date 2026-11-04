import asyncio
import os
import re
import uuid
from datetime import datetime, timedelta, timezone

import jwt
from bson import ObjectId
from pymongo import ReturnDocument
from fastapi import APIRouter, Depends, File, HTTPException, Request, Response, UploadFile

from db import db, doc_to_model, new_id, now_iso, log_activity, unique_slug
from models import ServiceIn, Service, ProjectIn, Project, DeliveryModelIn, DeliveryModel, SettingsIn, PhaseIn
from defaults import TEXT_KEYS, default_pages
from security import (
    clear_auth_cookies,
    create_access_token,
    create_refresh_token,
    get_staff,
    hash_password,
    set_auth_cookies,
    set_access_cookie,
    verify_password
)
import storage

admin_router = APIRouter(prefix='/api')

ALLOWED_IMAGE_TYPES = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
}
MAX_UPLOAD_SIZE = 5 * 1024 * 1024


def _entity_meta(entity: str):
    return {
        'services': (ServiceIn, Service, 'الخدمة'),
        'projects': (ProjectIn, Project, 'المشروع'),
        'delivery_models': (DeliveryModelIn, DeliveryModel, 'نموذج التنفيذ'),
    }[entity]


# ---------------- Auth ----------------

MAX_LOGIN_ATTEMPTS = 5
LOCK_MINUTES = 15


async def _check_lockout(identifier: str):
    attempts = await db.login_attempts.find_one({'identifier': identifier})
    locked_until = (attempts or {}).get('locked_until')
    if not locked_until:
        return
    if now_iso() < locked_until:
        raise HTTPException(status_code=429, detail='تم إيقاف المحاولات مؤقتًا لأسباب أمنية، حاول مجددًا بعد 15 دقيقة')
    await db.login_attempts.delete_one({'identifier': identifier})


async def _register_failure(identifier: str):
    attempts = await db.login_attempts.find_one_and_update(
        {'identifier': identifier},
        {'$inc': {'count': 1}, '$set': {'updated_at': now_iso()}},
        upsert=True, return_document=ReturnDocument.AFTER,
    )
    if attempts.get('count', 0) >= MAX_LOGIN_ATTEMPTS:
        locked_until = (datetime.now(timezone.utc) + timedelta(minutes=LOCK_MINUTES)).isoformat()
        await db.login_attempts.update_one({'identifier': identifier}, {'$set': {'locked_until': locked_until}})

@admin_router.post('/auth/login')
async def login(request: Request, response: Response, body: dict):
    email = (body.get('email') or '').strip().lower()
    password = body.get('password') or ''
    if not email or not password:
        raise HTTPException(status_code=400, detail='يرجى إدخال البريد الإلكتروني وكلمة المرور')

    identifier = f"email:{email}"
    await _check_lockout(identifier)
    user = await db.users.find_one({'email': email})
    if not user or not verify_password(password, user.get('password_hash', '')):
        await _register_failure(identifier)
        raise HTTPException(status_code=401, detail='بيانات الدخول غير صحيحة')
    if user.get('active') is False:
        raise HTTPException(status_code=403, detail='تم إيقاف هذا الحساب، تواصل مع مدير الموقع')

    await db.login_attempts.delete_one({'identifier': identifier})
    user_id = str(user['_id'])
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    safe_user = {'id': user_id, 'email': user['email'], 'name': user.get('name', ''), 'role': user.get('role', 'editor')}
    return {'user': safe_user, 'access_token': access}


@admin_router.post('/auth/logout')
async def logout(response: Response):
    clear_auth_cookies(response)
    return {'message': 'تم تسجيل الخروج بنجاح'}


@admin_router.get('/auth/me')
async def me(user: dict = Depends(get_staff)):
    return user


@admin_router.post('/auth/refresh')
async def refresh(request: Request, response: Response):
    token = request.cookies.get('refresh_token')
    if not token:
        raise HTTPException(status_code=401, detail='لا توجد جلسة صالحة')
    try:
        payload = jwt.decode(token, os.environ['JWT_SECRET'], algorithms=['HS256'])
        if payload.get('type') != 'refresh':
            raise jwt.InvalidTokenError()
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail='انتهت صلاحية الجلسة')
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail='جلسة غير صالحة')
    user = await db.users.find_one({'_id': ObjectId(payload['sub'])}) if ObjectId.is_valid(payload.get('sub', '')) else None
    if not user or user.get('active') is False:
        raise HTTPException(status_code=401, detail='جلسة غير صالحة')
    access = create_access_token(payload['sub'], payload.get('email', ''))
    set_access_cookie(response, access)
    return {'access_token': access}


# ---------------- Stats & activity ----------------

@admin_router.get('/admin/stats')
async def stats(user: dict = Depends(get_staff)):
    async def counts(col):
        total = await db[col].count_documents({})
        published = await db[col].count_documents({'published': True})
        demo = await db[col].count_documents({'is_demo': True})
        return {'total': total, 'published': published, 'drafts': total - published, 'demo': demo}

    activity = await db.activity.find().sort('created_at', -1).to_list(10)
    last_backup = await db.activity.find_one({'entity': 'backup', 'action': 'export'}, sort=[('created_at', -1)])
    return {
        'services': await counts('services'),
        'projects': await counts('projects'),
        'delivery_models': await counts('delivery_models'),
        'users': {
            'total': await db.users.count_documents({}),
            'admins': await db.users.count_documents({'role': 'admin'}),
            'editors': await db.users.count_documents({'role': 'editor'}),
            'inactive': await db.users.count_documents({'active': False}),
        },
        'files': await db.files.count_documents({'is_deleted': False}),
        'last_backup': last_backup['created_at'] if last_backup else None,
        'activity': [doc_to_model(a) for a in activity],
    }


@admin_router.get('/admin/activity')
async def activity(user: dict = Depends(get_staff)):
    items = await db.activity.find().sort('created_at', -1).to_list(50)
    return [doc_to_model(i) for i in items]


# ---------------- Settings ----------------

EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')


def _bad(detail: str):
    raise HTTPException(status_code=400, detail=detail)


def _validate_email(email: str):
    if email and not EMAIL_RE.match(email):
        _bad('صيغة البريد الإلكتروني غير صحيحة')


def _validate_whatsapp(number: str):
    if number and not re.fullmatch(r'\d{8,15}', number):
        _bad('رقم واتساب يجب أن يكون أرقامًا فقط بالصيغة الدولية (8-15 رقمًا) دون + أو مسافات')


def _validate_social(social: dict):
    for key, url in social.items():
        if url and not re.match(r'^https?://', url.strip()):
            _bad(f'رابط {key} يجب أن يبدأ بـ http:// أو https://')


def _validate_logo(logo: str):
    if logo and not (logo.startswith('/api/files/') or re.match(r'^https?://', logo)):
        _bad('رابط الشعار غير صالح')


def _validate_contact(updates: dict):
    _validate_email((updates.get('email') or '').strip())
    _validate_whatsapp((updates.get('whatsapp_number') or '').strip())
    _validate_social(updates.get('social') or {})
    _validate_logo((updates.get('logo_url') or '').strip())

def _clean_strs(d: dict, allowed=None) -> dict:
    out = {}
    for k, v in (d or {}).items():
        if allowed is not None and k not in allowed:
            continue
        if isinstance(v, str):
            out[k] = v[:5000]
        elif isinstance(v, list):
            out[k] = [str(x)[:500] for x in v if isinstance(x, (str, int, float))][:50]
    return out


def _clean_translations(updates: dict):
    if 'en' in updates:
        updates['en'] = _clean_strs(updates['en'], set(TEXT_KEYS))
    if 'pages' in updates:
        pages = default_pages()
        for key, val in (updates['pages'] or {}).items():
            if key in pages and isinstance(val, dict):
                pages[key].update(_clean_strs(val, set(pages[key])))
        updates['pages'] = pages


@admin_router.get('/admin/settings')
async def get_settings_admin(user: dict = Depends(get_staff)):
    doc = await db.settings.find_one({})
    return doc_to_model(doc)


@admin_router.put('/admin/settings')
async def update_settings(data: SettingsIn, user: dict = Depends(get_staff)):
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    _validate_contact(updates)
    _clean_translations(updates)
    if not updates:
        raise HTTPException(status_code=400, detail='لا توجد بيانات لتحديثها')
    updates['updated_at'] = now_iso()
    await db.settings.update_one({}, {'$set': updates}, upsert=True)
    await log_activity('update', 'settings', 'بيانات الشركة', user)
    doc = await db.settings.find_one({})
    return doc_to_model(doc)


# NOTE: literal routes must be defined before parameterized /admin/{entity} routes.

# ---------------- Uploads ----------------

async def _put_file(path: str, data: bytes, content_type: str) -> dict:
    try:
        return await asyncio.to_thread(storage.put_object, path, data, content_type)
    except Exception as exc:
        raise HTTPException(status_code=500, detail='تعذر رفع الصورة، يرجى المحاولة لاحقًا') from exc


async def _get_file(path: str):
    try:
        return await asyncio.to_thread(storage.get_object, path)
    except Exception as exc:
        raise HTTPException(status_code=404, detail='الملف غير موجود') from exc

@admin_router.post('/admin/upload')
async def upload(file: UploadFile = File(...), user: dict = Depends(get_staff)):
    ext = (file.filename.split('.')[-1].lower() if file.filename and '.' in file.filename else '')
    content_type = file.content_type or ''
    if content_type not in ALLOWED_IMAGE_TYPES or ALLOWED_IMAGE_TYPES[content_type] != ext:
        raise HTTPException(status_code=400, detail='صيغة الملف غير مدعومة، الصيغ المدعومة: JPG وPNG وWEBP وGIF')
    data = await file.read()
    if len(data) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail='حجم الملف يتجاوز الحد الأقصى (5 ميجابايت)')
    path = f"{storage.APP_NAME}/uploads/{user['id']}/{uuid.uuid4()}.{ext}"
    result = await _put_file(path, data, content_type)
    await db.files.insert_one({
        'storage_path': result.get('path', path),
        'original_filename': file.filename,
        'content_type': content_type,
        'size': result.get('size', len(data)),
        'is_deleted': False,
        'created_at': now_iso(),
    })
    return {'url': f"/api/files/{result.get('path', path)}", 'path': result.get('path', path)}


@admin_router.get('/files/{path:path}')
async def serve_file(path: str):
    data, content_type = await _get_file(path)
    record = await db.files.find_one({'storage_path': path})
    if record:
        content_type = record.get('content_type', content_type)
    return Response(content=data, media_type=content_type,
                    headers={'Cache-Control': 'public, max-age=31536000, immutable'})


# ---------------- Generic CRUD ----------------

EN_FIELDS = {'name', 'short_desc', 'detailed_desc', 'category', 'features', 'goals', 'outputs', 'duration'}


def _clean_en(en) -> dict:
    out = _clean_strs(en if isinstance(en, dict) else {}, EN_FIELDS)
    phases = (en or {}).get('phases') if isinstance(en, dict) else None
    if isinstance(phases, list):
        out['phases'] = [{'title': str(p.get('title', ''))[:160], 'desc': str(p.get('desc', ''))[:1000]}
                         for p in phases if isinstance(p, dict)][:30]
    return out

@admin_router.get('/admin/{entity}')
async def list_all(entity: str, user: dict = Depends(get_staff)):
    if entity not in ('services', 'projects', 'delivery_models'):
        raise HTTPException(status_code=404, detail='غير موجود')
    items = await db[entity].find().sort([('order', 1), ('created_at', 1)]).to_list(500)
    return [doc_to_model(i) for i in items]


@admin_router.get('/admin/{entity}/{item_id}')
async def get_one(entity: str, item_id: str, user: dict = Depends(get_staff)):
    if entity not in ('services', 'projects', 'delivery_models'):
        raise HTTPException(status_code=404, detail='غير موجود')
    doc = await db[entity].find_one({'_id': item_id})
    if not doc:
        raise HTTPException(status_code=404, detail='العنصر غير موجود')
    return doc_to_model(doc)


@admin_router.post('/admin/{entity}')
async def create_item(entity: str, data: dict, user: dict = Depends(get_staff)):
    if entity not in ('services', 'projects', 'delivery_models'):
        raise HTTPException(status_code=404, detail='غير موجود')
    in_model, full_model, label = _entity_meta(entity)
    try:
        validated = in_model(**data)
    except Exception:
        raise HTTPException(status_code=400, detail='يرجى تعبئة الحقول المطلوبة بشكل صحيح (الاسم والوصف المختصر)')

    item_id = new_id()
    doc = validated.model_dump()
    doc['en'] = _clean_en(doc.get('en'))
    doc['_id'] = item_id
    doc['slug'] = await unique_slug(entity, doc['name'], item_id)
    doc['is_demo'] = False
    doc['created_at'] = now_iso()
    doc['updated_at'] = now_iso()
    await db[entity].insert_one(doc)
    await log_activity('create', entity, doc['name'], user)
    return doc_to_model(doc)


@admin_router.put('/admin/{entity}/{item_id}')
async def update_item(entity: str, item_id: str, data: dict, user: dict = Depends(get_staff)):
    if entity not in ('services', 'projects', 'delivery_models'):
        raise HTTPException(status_code=404, detail='غير موجود')
    in_model, full_model, label = _entity_meta(entity)
    existing = await db[entity].find_one({'_id': item_id})
    if not existing:
        raise HTTPException(status_code=404, detail='العنصر غير موجود')

    merged = {k: v for k, v in existing.items() if k in in_model.model_fields}
    merged.update({k: v for k, v in data.items() if k in in_model.model_fields})
    try:
        validated = in_model(**merged)
    except Exception:
        raise HTTPException(status_code=400, detail='يرجى تعبئة الحقول المطلوبة بشكل صحيح (الاسم والوصف المختصر)')

    updates = validated.model_dump()
    updates['en'] = _clean_en(updates.get('en'))
    if existing.get('name') != updates['name']:
        updates['slug'] = await unique_slug(entity, updates['name'], item_id)
    updates['updated_at'] = now_iso()
    await db[entity].update_one({'_id': item_id}, {'$set': updates})
    await log_activity('update', entity, updates['name'], user)
    doc = await db[entity].find_one({'_id': item_id})
    return doc_to_model(doc)


@admin_router.delete('/admin/{entity}/{item_id}')
async def delete_item(entity: str, item_id: str, user: dict = Depends(get_staff)):
    if entity not in ('services', 'projects', 'delivery_models'):
        raise HTTPException(status_code=404, detail='غير موجود')
    doc = await db[entity].find_one({'_id': item_id})
    if not doc:
        raise HTTPException(status_code=404, detail='العنصر غير موجود')
    await db[entity].delete_one({'_id': item_id})
    await log_activity('delete', entity, doc.get('name', ''), user)
    return {'message': 'تم الحذف بنجاح'}


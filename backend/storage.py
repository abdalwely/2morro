# import os

# import requests

# STORAGE_BASE = (os.environ.get('INTEGRATION_PROXY_URL') or '').strip() or 'https://integrations.emergentagent.com'
# STORAGE_URL = STORAGE_BASE.rstrip('/') + '/objstore/api/v1/storage'
# EMERGENT_KEY = os.environ.get('EMERGENT_LLM_KEY')
# APP_NAME = '2morro-solutions'

# storage_key = None


# def init_storage(force: bool = False) -> str:
#     global storage_key
#     if storage_key and not force:
#         return storage_key
#     resp = requests.post(f'{STORAGE_URL}/init', json={'emergent_key': EMERGENT_KEY}, timeout=30)
#     resp.raise_for_status()
#     storage_key = resp.json()['storage_key']
#     return storage_key


# def put_object(path: str, data: bytes, content_type: str) -> dict:
#     key = init_storage()
#     resp = requests.put(
#         f'{STORAGE_URL}/objects/{path}',
#         headers={'X-Storage-Key': key, 'Content-Type': content_type},
#         data=data,
#         timeout=120,
#     )
#     if resp.status_code == 404:
#         key = init_storage(force=True)
#         resp = requests.put(
#             f'{STORAGE_URL}/objects/{path}',
#             headers={'X-Storage-Key': key, 'Content-Type': content_type},
#             data=data,
#             timeout=120,
#         )
#     resp.raise_for_status()
#     return resp.json()


# def get_object(path: str):
#     key = init_storage()
#     resp = requests.get(f'{STORAGE_URL}/objects/{path}', headers={'X-Storage-Key': key}, timeout=60)
#     if resp.status_code == 404:
#         key = init_storage(force=True)
#         resp = requests.get(f'{STORAGE_URL}/objects/{path}', headers={'X-Storage-Key': key}, timeout=60)
#     resp.raise_for_status()
#     return resp.content, resp.headers.get('Content-Type', 'application/octet-stream')

import os
from urllib.parse import quote

import requests


# ============================================================
# Supabase Storage Configuration
# ============================================================
#
# DEVELOPMENT:
# Add the following variables to backend/.env:
#
# SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
# SUPABASE_STORAGE_BUCKET=2morro-solutions
#
# Explanation:
#
# 1. SUPABASE_URL:
#    رابط مشروعك في Supabase.
#    تجده من:
#    Supabase Dashboard > Project Settings > API
#
# 2. SUPABASE_SERVICE_ROLE_KEY:
#    مفتاح الوصول السري للخادم.
#    تجده من:
#    Supabase Dashboard > Project Settings > API Keys
#
#    استخدم مفتاح service_role (Legacy) إذا كان متاحاً.
#    لا تضع هذا المفتاح في Frontend أو GitHub.
#
# 3. SUPABASE_STORAGE_BUCKET:
#    اسم حاوية التخزين التي تنشئها من:
#    Supabase Dashboard > Storage > New Bucket
#
#    مثال:
#    2morro-solutions
#
#    يفضّل جعل الحاوية Private لأن الوصول إلى الملفات
#    يتم من خلال Backend.
#
# FUTURE PRODUCTION:
# عند نقل المشروع إلى الاستضافة:
# - أنشئ أو استخدم مشروع Supabase المخصص للإنتاج.
# - أنشئ حاوية التخزين المطلوبة في ذلك المشروع.
# - ضع رابط المشروع ومفتاحه واسم الحاوية في متغيرات
#   البيئة الخاصة بخادم الإنتاج.
# - لا تضع المفاتيح السرية داخل ملفات الكود.
# - لا تستخدم مفاتيح بيئة التطوير في الإنتاج.
#
# ============================================================


SUPABASE_URL = (os.environ.get("SUPABASE_URL") or "").strip().rstrip("/")

SUPABASE_SERVICE_ROLE_KEY = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or ""
).strip()

SUPABASE_STORAGE_BUCKET = (
    os.environ.get("SUPABASE_STORAGE_BUCKET") or ""
).strip()

STORAGE_URL = f"{SUPABASE_URL}/storage/v1"


def _validate_configuration():
    """Ensure that all required Supabase settings are configured."""

    missing = []

    if not SUPABASE_URL:
        missing.append("SUPABASE_URL")

    if not SUPABASE_SERVICE_ROLE_KEY:
        missing.append("SUPABASE_SERVICE_ROLE_KEY")

    if not SUPABASE_STORAGE_BUCKET:
        missing.append("SUPABASE_STORAGE_BUCKET")

    if missing:
        raise RuntimeError(
            "Missing Supabase Storage configuration: "
            + ", ".join(missing)
        )


def _get_headers(content_type: str = None) -> dict:
    """Build authenticated Supabase Storage request headers."""

    _validate_configuration()

    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    }

    if content_type:
        headers["Content-Type"] = content_type

    return headers


def _get_object_url(path: str) -> str:
    """Build a safely encoded object URL."""

    if not path or not path.strip():
        raise ValueError("Storage object path cannot be empty.")

    bucket = quote(SUPABASE_STORAGE_BUCKET, safe="")
    object_path = quote(path.lstrip("/"), safe="/")

    return f"{STORAGE_URL}/object/{bucket}/{object_path}"


def put_object(path: str, data: bytes, content_type: str) -> dict:
    """
    Upload an object to Supabase Storage.

    Existing objects with the same path will be overwritten.
    """

    headers = _get_headers(content_type)

    # Allow overwriting an existing object.
    headers["x-upsert"] = "true"

    resp = requests.post(
        _get_object_url(path),
        headers=headers,
        data=data,
        timeout=120,
    )

    resp.raise_for_status()

    return resp.json()


def get_object(path: str):
    """
    Download an object from Supabase Storage.

    Returns:
        tuple: (file_content, content_type)
    """

    headers = _get_headers()

    resp = requests.get(
        _get_object_url(path),
        headers=headers,
        timeout=60,
    )

    resp.raise_for_status()

    return (
        resp.content,
        resp.headers.get("Content-Type", "application/octet-stream"),
    )

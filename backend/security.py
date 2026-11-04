import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from bson import ObjectId
from fastapi import HTTPException, Request

from db import db

JWT_ALGORITHM = 'HS256'

def get_cookie_settings():
    secure = os.getenv('COOKIE_SECURE', 'true').lower() == 'true'
    samesite = os.getenv(
        'COOKIE_SAMESITE',
        'none' if secure else 'lax'
    ).lower()

    if samesite not in ('lax', 'strict', 'none'):
        raise ValueError('Invalid COOKIE_SAMESITE value')

    if samesite == 'none' and not secure:
        raise ValueError('SameSite=None requires Secure=True')

    return secure, samesite


def set_access_cookie(response, access_token: str):
    secure, samesite = get_cookie_settings()

    response.set_cookie(
        key='access_token',
        value=access_token,
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=60 * 60 * 12,
        path='/'
    )


def get_jwt_secret() -> str:
    return os.environ['JWT_SECRET']


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except ValueError:
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        'sub': user_id,
        'email': email,
        'exp': datetime.now(timezone.utc) + timedelta(minutes=60 * 12),
        'type': 'access',
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        'sub': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(days=7),
        'type': 'refresh',
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response, access_token: str, refresh_token: str):
    secure, samesite = get_cookie_settings()

    response.set_cookie(
        key='access_token',
        value=access_token,
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=60 * 60 * 12,
        path='/'
    )

    response.set_cookie(
        key='refresh_token',
        value=refresh_token,
        httponly=True,
        secure=secure,
        samesite=samesite,
        max_age=604800,
        path='/'
    )


def clear_auth_cookies(response):
    response.delete_cookie('access_token', path='/')
    response.delete_cookie('refresh_token', path='/')


def _decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            get_jwt_secret(),
            algorithms=[JWT_ALGORITHM]
        )
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=401,
            detail='انتهت صلاحية الجلسة، يرجى تسجيل الدخول من جديد'
        ) from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(
            status_code=401,
            detail='جلسة غير صالحة، يرجى تسجيل الدخول من جديد'
        ) from exc

    if payload.get('type') != 'access' or not ObjectId.is_valid(payload.get('sub', '')):
        raise HTTPException(
            status_code=401,
            detail='جلسة غير صالحة، يرجى تسجيل الدخول من جديد'
        )

    return payload


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get('access_token')
    if not token:
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail='غير مصرح لك بالوصول، يرجى تسجيل الدخول')
    payload = _decode_access_token(token)
    user = await db.users.find_one({'_id': ObjectId(payload['sub'])})
    if not user:
        raise HTTPException(status_code=401, detail='الحساب غير موجود')
    if user.get('active') is False:
        raise HTTPException(status_code=401, detail='تم إيقاف هذا الحساب، تواصل مع مدير الموقع')
    user['id'] = str(user.pop('_id'))
    user.pop('password_hash', None)
    return user


async def get_staff(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get('role') not in ('admin', 'editor'):
        raise HTTPException(status_code=403, detail='ليست لديك صلاحية الوصول إلى لوحة التحكم')
    return user


async def get_current_admin(request: Request) -> dict:
    user = await get_staff(request)
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail='هذه العملية متاحة لمدير الموقع فقط')
    return user

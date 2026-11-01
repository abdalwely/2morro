import re
from pathlib import Path
from urllib.parse import quote
from xml.sax.saxutils import escape

from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import FileResponse

from db import db, doc_to_model
from seed import default_settings

public_router = APIRouter(prefix='/api')


@public_router.get('/health')
async def health():
    return {'status': 'ok'}


@public_router.get('/')
async def root():
    return {'message': '2Morro Technically Solutions API'}


@public_router.get('/settings')
async def get_settings():
    doc = await db.settings.find_one({})
    if not doc:
        doc = default_settings()
        await db.settings.insert_one(doc)
    return doc_to_model(doc)


@public_router.get('/services')
async def list_services():
    items = await db.services.find({'published': True}).sort([('order', 1), ('created_at', 1)]).to_list(300)
    return [doc_to_model(i) for i in items]


@public_router.get('/services/{slug}')
async def get_service(slug: str):
    doc = await db.services.find_one({'slug': slug, 'published': True})
    if not doc:
        doc = await db.services.find_one({'_id': slug, 'published': True})
    if not doc:
        raise HTTPException(status_code=404, detail='الخدمة المطلوبة غير موجودة')
    return doc_to_model(doc)


@public_router.get('/projects')
async def list_projects():
    items = await db.projects.find({'published': True}).sort([('order', 1), ('created_at', 1)]).to_list(300)
    return [doc_to_model(i) for i in items]


@public_router.get('/projects/{slug}')
async def get_project(slug: str):
    doc = await db.projects.find_one({'slug': slug, 'published': True})
    if not doc:
        doc = await db.projects.find_one({'_id': slug, 'published': True})
    if not doc:
        raise HTTPException(status_code=404, detail='المشروع المطلوب غير موجود')
    return doc_to_model(doc)


@public_router.get('/delivery-models')
async def list_models():
    items = await db.delivery_models.find({'published': True}).sort([('order', 1), ('created_at', 1)]).to_list(300)
    return [doc_to_model(i) for i in items]


@public_router.get('/sitemap.xml')
async def sitemap(request: Request):
    host = request.headers.get('x-forwarded-host') or request.headers.get('host', '')
    base = f"https://{host.split(',')[0].strip()}"
    paths = ['/', '/about', '/services', '/projects', '/models', '/contact']
    for col, prefix in (('services', '/services/'), ('projects', '/projects/')):
        async for d in db[col].find({'published': True}, {'slug': 1}):
            paths.append(prefix + quote(d['slug']))
    urls = ''.join(f'<url><loc>{escape(base + p)}</loc></url>' for p in paths)
    xml = f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>'
    return Response(content=xml, media_type='application/xml')


DOWNLOADS_DIR = Path(__file__).resolve().parent / 'downloads'


@public_router.get('/download/{token}/{filename}')
async def download_source(token: str, filename: str):
    if not re.fullmatch(r'[A-Za-z0-9_-]{20,}', token) or not re.fullmatch(r'[A-Za-z0-9._-]+\.zip', filename):
        raise HTTPException(status_code=404, detail='الملف غير موجود')
    path = DOWNLOADS_DIR / token / filename
    if not path.is_file():
        raise HTTPException(status_code=404, detail='الملف غير موجود')
    return FileResponse(path, media_type='application/zip', filename=filename)

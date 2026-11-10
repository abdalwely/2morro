import re
from pathlib import Path
from urllib.parse import quote
from xml.sax.saxutils import escape

from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import FileResponse

from db import db, doc_to_model
from seed import default_settings

public_router = APIRouter(prefix='/api')


async def _with_relations(doc: dict, mapping: dict) -> dict:
    result = doc_to_model(doc)
    relations = {}
    for field, collection in mapping.items():
        value = doc.get(field)
        ids = value if isinstance(value, list) else ([value] if value else [])
        if ids:
            related = await db[collection].find({'_id': {'$in': ids}, 'published': True}).to_list(200)
            by_id = {str(item['_id']): doc_to_model(item) for item in related}
            relations[field] = [by_id[x] for x in ids if x in by_id]
        else:
            relations[field] = []
    result['relations'] = relations
    return result


async def _with_relations_many(docs: list, mapping: dict) -> list:
    related_maps = {}
    for field, collection in mapping.items():
        ids = []
        for doc in docs:
            value = doc.get(field)
            ids.extend(value if isinstance(value, list) else ([value] if value else []))
        unique_ids = list(dict.fromkeys(x for x in ids if isinstance(x, str) and x))
        if unique_ids:
            related = await db[collection].find({'_id': {'$in': unique_ids}, 'published': True}).to_list(1000)
            related_maps[field] = {str(item['_id']): doc_to_model(item) for item in related}
        else:
            related_maps[field] = {}
    results = []
    for doc in docs:
        item = doc_to_model(doc)
        item['relations'] = {}
        for field in mapping:
            value = doc.get(field)
            ids = value if isinstance(value, list) else ([value] if value else [])
            by_id = related_maps[field]
            item['relations'][field] = [by_id[x] for x in ids if isinstance(x, str) and x in by_id]
        results.append(item)
    return results


@public_router.get('/health')
async def health():
    return {'status': 'ok'}


@public_router.get('/')
async def root():
    return {'message': '2Morro Technology Solutions API'}


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
    return await _with_relations_many(items, {'domain_id': 'domains', 'technology_ids': 'technologies'})


@public_router.get('/services/{slug}')
async def get_service(slug: str):
    doc = await db.services.find_one({'slug': slug, 'published': True})
    if not doc:
        doc = await db.services.find_one({'_id': slug, 'published': True})
    if not doc:
        raise HTTPException(status_code=404, detail='الخدمة المطلوبة غير موجودة')
    return await _with_relations(doc, {'domain_id': 'domains', 'technology_ids': 'technologies'})


@public_router.get('/projects')
async def list_projects():
    items = await db.projects.find({'published': True}).sort([('order', 1), ('created_at', 1)]).to_list(300)
    return await _with_relations_many(items, {'service_ids': 'services', 'solution_ids': 'solutions', 'sector_ids': 'sectors', 'technology_ids': 'technologies', 'delivery_model_ids': 'delivery_models', 'category_id': 'project_categories'})


@public_router.get('/projects/{slug}')
async def get_project(slug: str):
    doc = await db.projects.find_one({'slug': slug, 'published': True})
    if not doc:
        doc = await db.projects.find_one({'_id': slug, 'published': True})
    if not doc:
        raise HTTPException(status_code=404, detail='المشروع المطلوب غير موجود')
    return await _with_relations(doc, {'service_ids': 'services', 'solution_ids': 'solutions', 'sector_ids': 'sectors', 'technology_ids': 'technologies', 'delivery_model_ids': 'delivery_models', 'category_id': 'project_categories'})


@public_router.get('/delivery-models')
async def list_models():
    items = await db.delivery_models.find({'published': True}).sort([('order', 1), ('created_at', 1)]).to_list(300)
    return await _with_relations_many(items, {'service_ids': 'services'})


@public_router.get('/sitemap.xml')
async def sitemap(request: Request):
    host = request.headers.get('x-forwarded-host') or request.headers.get('host', '')
    base = f"https://{host.split(',')[0].strip()}"
    paths = ['/', '/about', '/services', '/solutions', '/domains', '/sectors', '/projects', '/models', '/methodology', '/technology', '/knowledge', '/privacy', '/terms', '/contact']
    for col, prefix in (('services', '/services/'), ('projects', '/projects/'), ('solutions', '/solutions/'), ('domains', '/domains/'), ('sectors', '/sectors/'), ('articles', '/knowledge/')):
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


# Structured content endpoints added for the expanded company information architecture.
async def _published_collection(collection: str, limit: int = 300):
    items = await db[collection].find({'published': True}).sort([('order', 1), ('created_at', 1)]).to_list(limit)
    relation_map = {
        'solutions': {'service_ids': 'services', 'sector_ids': 'sectors', 'technology_ids': 'technologies'},
        'articles': {'category_id': 'article_categories'},
    }
    return await _with_relations_many(items, relation_map[collection]) if collection in relation_map else [doc_to_model(item) for item in items]


async def _published_item(collection: str, slug: str, label: str):
    doc = await db[collection].find_one({'slug': slug, 'published': True})
    if not doc:
        raise HTTPException(status_code=404, detail=f'{label} غير موجود')
    relation_map = {
        'solutions': {'service_ids': 'services', 'sector_ids': 'sectors', 'technology_ids': 'technologies'},
        'articles': {'category_id': 'article_categories'},
    }
    if collection in relation_map:
        return await _with_relations(doc, relation_map[collection])
    result = doc_to_model(doc)
    item_id = str(doc['_id'])
    if collection == 'domains':
        related = await db.services.find({'domain_id': item_id, 'published': True}).sort([('order', 1)]).to_list(300)
        result['relations'] = {'services': [doc_to_model(item) for item in related]}
    elif collection == 'sectors':
        solutions = await db.solutions.find({'sector_ids': item_id, 'published': True}).sort([('order', 1)]).to_list(300)
        projects = await db.projects.find({'sector_ids': item_id, 'published': True}).sort([('order', 1)]).to_list(300)
        result['relations'] = {'solutions': [doc_to_model(item) for item in solutions], 'projects': [doc_to_model(item) for item in projects]}
    return result


@public_router.get('/domains')
async def list_domains():
    return await _published_collection('domains')


@public_router.get('/domains/{slug}')
async def get_domain(slug: str):
    return await _published_item('domains', slug, 'المجال')


@public_router.get('/solutions')
async def list_solutions():
    return await _published_collection('solutions')


@public_router.get('/solutions/{slug}')
async def get_solution(slug: str):
    return await _published_item('solutions', slug, 'الحل')


@public_router.get('/sectors')
async def list_sectors():
    return await _published_collection('sectors')


@public_router.get('/sectors/{slug}')
async def get_sector(slug: str):
    return await _published_item('sectors', slug, 'القطاع')


@public_router.get('/project-categories')
async def list_project_categories():
    return await _published_collection('project_categories')


@public_router.get('/technologies')
async def list_technologies():
    return await _published_collection('technologies')


@public_router.get('/methodology')
async def list_methodology_phases():
    return await _published_collection('methodology_phases', 100)


@public_router.get('/articles')
async def list_articles():
    return await _published_collection('articles')


@public_router.get('/articles/{slug}')
async def get_article(slug: str):
    return await _published_item('articles', slug, 'المقال')

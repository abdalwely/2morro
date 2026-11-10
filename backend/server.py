import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, PlainTextResponse
from starlette.middleware.cors import CORSMiddleware

load_dotenv(Path(__file__).parent / '.env')

import db as database
from routes_public import public_router
from routes_admin import admin_router
from routes_manage import manage_router
from seed import run_seed
import storage

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await run_seed()
        logger.info('Seed completed')
    except Exception:
        # Keep local development available for diagnosis, but retain the full
        # traceback in the server console. Never log environment secrets.
        logger.exception('Seed failed during application startup')
    try:
        storage.init_storage()
        logger.info('Storage initialized')
    except Exception as e:
        logger.error(f'Storage init failed: {e}')
    yield
    database.client.close()


app = FastAPI(title='2Morro Technology Solutions', lifespan=lifespan)

@app.get('/robots.txt', response_class=PlainTextResponse)
async def robots_txt(request: Request):
    base_url = str(request.base_url).rstrip('/')

    content = (
        "User-agent: *\n"
        "Allow: /\n"
        "Disallow: /admin\n"
        f"Sitemap: {base_url}/api/sitemap.xml\n"
    )

    return PlainTextResponse(content=content)

# DEVELOPMENT: backend/.env should list the exact local frontend origins.
# FUTURE PRODUCTION: add the deployed frontend origin through the environment;
# do not use '*' together with allow_credentials=True.
origins = [o.strip() for o in os.environ.get('CORS_ORIGINS', '').split(',') if o.strip()]
FIELD_LABELS = {'name': 'الاسم', 'email': 'البريد الإلكتروني', 'password': 'كلمة المرور (8 أحرف على الأقل)', 'role': 'الصلاحية'}


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    fields = [FIELD_LABELS.get(str(e.get('loc', [''])[-1]), str(e.get('loc', [''])[-1])) for e in exc.errors()]
    return JSONResponse(status_code=400, content={'detail': 'يرجى التحقق من الحقول: ' + '، '.join(dict.fromkeys(fields))})


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(public_router)
app.include_router(manage_router)
app.include_router(admin_router)

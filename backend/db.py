import os
import re
import uuid
from pathlib import Path
from datetime import datetime, timezone

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path(__file__).parent / '.env')

client = AsyncIOMotorClient(os.environ['MONGO_URL'])
db = client[os.environ['DB_NAME']]


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def new_id():
    return str(uuid.uuid4())


def doc_to_model(doc):
    """Map a raw Mongo document to a JSON-safe dict (_id -> id)."""
    if doc is None:
        return None
    d = dict(doc)
    _id = d.pop('_id', None)
    if _id is not None:
        d['id'] = str(_id)
    return d


def slugify(name: str, seed: str = '') -> str:
    base = re.sub(r'\s+', '-', (name or '').strip())
    base = re.sub(r'[^\w\u0600-\u06FF-]', '', base).strip('-')
    base = base[:70].strip('-')
    suffix = (seed or new_id())[:6]
    return f"{base}-{suffix}" if base else f"item-{suffix}"


async def unique_slug(collection: str, name: str, exclude_id: str = '') -> str:
    for _ in range(5):
        s = slugify(name, new_id())
        query = {'slug': s}
        if exclude_id:
            query['_id'] = {'$ne': exclude_id}
        if not await db[collection].find_one(query):
            return s
    return f"item-{new_id()[:8]}"


async def log_activity(action: str, entity: str, name: str, user: dict | None = None):
    await db.activity.insert_one({
        'action': action,
        'entity': entity,
        'name': name,
        'user_name': (user or {}).get('name') or (user or {}).get('email', ''),
        'created_at': now_iso(),
    })

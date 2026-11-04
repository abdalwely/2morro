# Regression tests for 2Morro Technically Solutions API (public, auth, admin CRUD, upload, settings)
import os
import uuid
from pathlib import Path

from dotenv import load_dotenv
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
load_dotenv(Path(__file__).resolve().parents[1] / '.env')
ADMIN_EMAIL = os.environ['ADMIN_EMAIL']
ADMIN_PASSWORD = os.environ['ADMIN_PASSWORD']


@pytest.fixture(scope='module')
def token():
    r = requests.post(f'{BASE_URL}/api/auth/login', json={'email': ADMIN_EMAIL, 'password': ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f'login failed {r.status_code} {r.text}')
    return r.json()['access_token']


@pytest.fixture(scope='module')
def auth(token):
    s = requests.Session()
    s.headers.update({'Authorization': f'Bearer {token}'})
    return s


# ---- Public endpoints ----
class TestPublic:
    def test_health(self):
        r = requests.get(f'{BASE_URL}/api/health')
        assert r.status_code == 200 and r.json()['status'] == 'ok'

    def test_settings(self):
        r = requests.get(f'{BASE_URL}/api/settings')
        assert r.status_code == 200
        d = r.json()
        assert '_id' not in d
        assert d['company_name']
        assert 'email' in d and 'whatsapp_number' in d

    @pytest.mark.parametrize('path,count', [('services', 22), ('projects', 9), ('delivery-models', 15)])
    def test_lists_published_only(self, path, count):
        r = requests.get(f'{BASE_URL}/api/{path}')
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= count, f'{path}: {len(items)}'
        assert all(i['published'] is True for i in items)
        assert all('_id' not in i for i in items)

    def test_service_detail(self):
        items = requests.get(f'{BASE_URL}/api/services').json()
        r = requests.get(f"{BASE_URL}/api/services/{items[0]['slug']}")
        assert r.status_code == 200 and r.json()['id'] == items[0]['id']

    def test_project_detail(self):
        items = requests.get(f'{BASE_URL}/api/projects').json()
        r = requests.get(f"{BASE_URL}/api/projects/{items[0]['slug']}")
        assert r.status_code == 200 and r.json()['id'] == items[0]['id']

    def test_unknown_slugs_404(self):
        assert requests.get(f'{BASE_URL}/api/services/no-such-slug-xyz').status_code == 404
        assert requests.get(f'{BASE_URL}/api/projects/no-such-slug-xyz').status_code == 404


# ---- Auth ----
class TestAuth:
    def test_login_sets_cookies(self):
        r = requests.post(f'{BASE_URL}/api/auth/login', json={'email': ADMIN_EMAIL, 'password': ADMIN_PASSWORD})
        assert r.status_code == 200
        d = r.json()
        assert d['user']['email'] == ADMIN_EMAIL and d['user']['role'] == 'admin'
        assert 'password_hash' not in d['user']
        sc = r.headers.get('set-cookie', '')
        assert 'access_token=' in sc and 'HttpOnly' in sc

    def test_wrong_password_401(self):
        test_email = f"TEST_nobody_{uuid.uuid4().hex}@x.com"

        r = requests.post(
            f'{BASE_URL}/api/auth/login',
            json={'email': test_email, 'password': 'bad'}
        )

        assert r.status_code == 401

    def test_me_bearer(self, auth):
        r = auth.get(f'{BASE_URL}/api/auth/me')
        assert r.status_code == 200 and r.json()['email'] == ADMIN_EMAIL
        assert 'password_hash' not in r.json()

    def test_me_cookie_and_logout(self):
        s = requests.Session()
        s.post(f'{BASE_URL}/api/auth/login', json={'email': ADMIN_EMAIL, 'password': ADMIN_PASSWORD})
        assert s.get(f'{BASE_URL}/api/auth/me').status_code == 200
        assert s.post(f'{BASE_URL}/api/auth/logout').status_code == 200
        assert s.get(f'{BASE_URL}/api/auth/me').status_code == 401

    def test_me_no_token(self):
        assert requests.get(f'{BASE_URL}/api/auth/me').status_code == 401


# ---- Admin security ----
class TestAdminSecurity:
    @pytest.mark.parametrize('method,path', [
        ('get', 'stats'), ('get', 'activity'), ('get', 'settings'), ('put', 'settings'),
        ('get', 'services'), ('post', 'services'), ('put', 'services/x'), ('delete', 'services/x'),
        ('get', 'projects'), ('post', 'projects'), ('delete', 'projects/x'),
        ('get', 'delivery_models'), ('post', 'delivery_models'), ('delete', 'delivery_models/x'),
        ('post', 'upload'),
    ])
    def test_requires_auth(self, method, path):
        r = getattr(requests, method)(f'{BASE_URL}/api/admin/{path}', json={})
        assert r.status_code == 401, f'{method} {path} -> {r.status_code}'

    def test_invalid_token(self):
        r = requests.get(f'{BASE_URL}/api/admin/stats', headers={'Authorization': 'Bearer garbage'})
        assert r.status_code == 401

    def test_stats(self, auth):
        r = auth.get(f'{BASE_URL}/api/admin/stats')
        assert r.status_code == 200
        d = r.json()
        assert d['services']['total'] >= 22 and 'activity' in d


# ---- Admin CRUD + draft filter ----
ENTITIES = [
    ('services', 'services', {'name': 'TEST_خدمة', 'short_desc': 'وصف اختباري'}),
    ('projects', 'projects', {'name': 'TEST_مشروع', 'short_desc': 'وصف اختباري', 'gallery_urls': ['https://x/a.png']}),
    ('delivery_models', 'delivery-models', {'name': 'TEST_نموذج', 'short_desc': 'وصف اختباري', 'phases': [{'title': 'مرحلة', 'desc': 'd'}]}),
]


class TestCrud:
    @pytest.mark.parametrize('entity,public,payload', ENTITIES)
    def test_draft_publish_update_delete(self, auth, entity, public, payload):
        r = auth.post(f'{BASE_URL}/api/admin/{entity}', json={**payload, 'published': False})
        assert r.status_code == 200, r.text
        item = r.json()
        iid, slug = item['id'], item['slug']
        try:
            assert item['published'] is False and item['is_demo'] is False
            # draft hidden publicly
            pub = requests.get(f'{BASE_URL}/api/{public}').json()
            assert iid not in [p['id'] for p in pub]
            if public != 'delivery-models':
                assert requests.get(f'{BASE_URL}/api/{public}/{slug}').status_code == 404
                assert requests.get(f'{BASE_URL}/api/{public}/{iid}').status_code == 404
            # admin GET
            g = auth.get(f'{BASE_URL}/api/admin/{entity}/{iid}')
            assert g.status_code == 200 and g.json()['name'] == payload['name']
            # publish
            u = auth.put(f'{BASE_URL}/api/admin/{entity}/{iid}', json={**payload, 'published': True, 'short_desc': 'محدث'})
            assert u.status_code == 200 and u.json()['published'] is True and u.json()['short_desc'] == 'محدث'
            pub = requests.get(f'{BASE_URL}/api/{public}').json()
            assert iid in [p['id'] for p in pub]
            if public != 'delivery-models':
                assert requests.get(f'{BASE_URL}/api/{public}/{slug}').status_code == 200
        finally:
            d = auth.delete(f'{BASE_URL}/api/admin/{entity}/{iid}')
            assert d.status_code == 200
        assert auth.get(f'{BASE_URL}/api/admin/{entity}/{iid}').status_code == 404

    def test_validation_400(self, auth):
        r = auth.post(f'{BASE_URL}/api/admin/services', json={'name': ''})
        assert r.status_code == 400

    def test_unknown_entity_404(self, auth):
        assert auth.get(f'{BASE_URL}/api/admin/not_an_entity').status_code == 404


# ---- Upload ----
PNG = bytes.fromhex('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082')


class TestUpload:
    def test_valid_png(self, auth):
        r = auth.post(f'{BASE_URL}/api/admin/upload', files={'file': ('TEST_a.png', PNG, 'image/png')})
        assert r.status_code == 200, r.text
        url = r.json()['url']
        assert url.startswith('/api/files/')
        f = requests.get(f'{BASE_URL}{url}')
        assert f.status_code == 200 and f.headers['content-type'].startswith('image/png')
        assert f.content == PNG

    def test_txt_rejected(self, auth):
        r = auth.post(f'{BASE_URL}/api/admin/upload', files={'file': ('a.txt', b'hello', 'text/plain')})
        assert r.status_code == 400

    def test_spoofed_ext_rejected(self, auth):
        r = auth.post(f'{BASE_URL}/api/admin/upload', files={'file': ('a.txt', PNG, 'image/png')})
        assert r.status_code == 400

    def test_too_big_rejected(self, auth):
        big = PNG + b'0' * (5 * 1024 * 1024 + 10)
        r = auth.post(f'{BASE_URL}/api/admin/upload', files={'file': ('big.png', big, 'image/png')})
        assert r.status_code == 400


# ---- Settings ----
class TestSettings:
    def test_update_and_restore(self, auth):
        orig = auth.get(f'{BASE_URL}/api/admin/settings').json()
        try:
            r = auth.put(f'{BASE_URL}/api/admin/settings', json={'email': 'TEST_info@example.com', 'whatsapp_number': '966500000000'})
            assert r.status_code == 200
            pub = requests.get(f'{BASE_URL}/api/settings').json()
            assert pub['email'] == 'TEST_info@example.com' and pub['whatsapp_number'] == '966500000000'
        finally:
            auth.put(f'{BASE_URL}/api/admin/settings', json={'email': orig.get('email', ''), 'whatsapp_number': orig.get('whatsapp_number', '')})
        pub = requests.get(f'{BASE_URL}/api/settings').json()
        assert pub['email'] == '' and pub['whatsapp_number'] == ''

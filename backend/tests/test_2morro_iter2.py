# Iteration 2 regression: lockout, partial PUT merge, settings validation, sitemap/robots, role check
import os
from pathlib import Path

from dotenv import load_dotenv
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
load_dotenv(Path(__file__).resolve().parents[1] / '.env')
ADMIN_EMAIL = os.environ['ADMIN_EMAIL']
ADMIN_PASSWORD = os.environ['ADMIN_PASSWORD']


@pytest.fixture(scope='module')
def auth():
    r = requests.post(f'{BASE_URL}/api/auth/login', json={'email': ADMIN_EMAIL, 'password': ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f'login failed {r.status_code}')
    s = requests.Session()
    s.headers.update({'Authorization': f"Bearer {r.json()['access_token']}"})
    return s


# ---- Brute-force lockout ----
class TestLockout:
    def test_429_on_6th_attempt(self):
        email = f'locktest_{uuid.uuid4().hex[:6]}@x.com'
        codes = [requests.post(f'{BASE_URL}/api/auth/login', json={'email': email, 'password': 'bad'}).status_code
                 for _ in range(6)]
        assert codes[:5] == [401] * 5, codes
        assert codes[5] == 429, codes

    def test_lockout_bypass_via_xff_spoof(self):
        # informational: spoofed X-Forwarded-For shouldn't reset the counter
        email = f'locktest_{uuid.uuid4().hex[:6]}@x.com'
        for _ in range(5):
            requests.post(f'{BASE_URL}/api/auth/login', json={'email': email, 'password': 'bad'})
        r = requests.post(f'{BASE_URL}/api/auth/login', json={'email': email, 'password': 'bad'},
                          headers={'X-Forwarded-For': f'1.2.3.{uuid.uuid4().int % 250}'})
        print('spoofed status', r.status_code)
        assert r.status_code == 429, f'lockout bypassed with spoofed XFF: {r.status_code}'


# ---- Partial PUT merge ----
class TestPartialUpdate:
    def test_partial_put_preserves_fields(self, auth):
        payload = {'name': 'TEST_partial svc', 'short_desc': 'TEST short', 'detailed_desc': 'TEST long desc',
                   'category': 'TEST_cat', 'published': False}
        c = auth.post(f'{BASE_URL}/api/admin/services', json=payload)
        assert c.status_code == 200, c.text
        item = c.json()
        assert '_id' not in item
        iid = item['id']
        try:
            u = auth.put(f'{BASE_URL}/api/admin/services/{iid}', json={'short_desc': 'TEST changed'})
            assert u.status_code == 200, u.text
            g = auth.get(f'{BASE_URL}/api/admin/services/{iid}').json()
            assert g['short_desc'] == 'TEST changed'
            assert g['name'] == 'TEST_partial svc'
            assert g['detailed_desc'] == 'TEST long desc'
            assert g['category'] == 'TEST_cat'
            assert g['published'] is False
        finally:
            auth.delete(f'{BASE_URL}/api/admin/services/{iid}')
        assert auth.get(f'{BASE_URL}/api/admin/services/{iid}').status_code == 404


# ---- Settings validation ----
class TestSettingsValidation:
    @pytest.mark.parametrize('body', [
        {'email': 'not-an-email'},
        {'whatsapp_number': '+966500000000'},
        {'whatsapp_number': '966 500 000 000'},
        {'social': {'linkedin': 'javascript:alert(1)'}},
    ])
    def test_invalid_rejected(self, auth, body):
        before = auth.get(f'{BASE_URL}/api/admin/settings').json()
        r = auth.put(f'{BASE_URL}/api/admin/settings', json=body)
        assert r.status_code == 400, r.text
        assert any('\u0600' <= ch <= '\u06FF' for ch in r.json()['detail'])
        after = auth.get(f'{BASE_URL}/api/admin/settings').json()
        assert after.get('email') == before.get('email')
        assert after.get('whatsapp_number') == before.get('whatsapp_number')

    def test_valid_save_and_restore(self, auth):
        r = auth.put(f'{BASE_URL}/api/admin/settings', json={'email': 'test@2morro.com', 'whatsapp_number': '966500000000'})
        assert r.status_code == 200, r.text
        assert r.json()['email'] == 'test@2morro.com'
        pub = requests.get(f'{BASE_URL}/api/settings').json()
        assert pub['whatsapp_number'] == '966500000000'
        r2 = auth.put(f'{BASE_URL}/api/admin/settings', json={'email': '', 'whatsapp_number': ''})
        assert r2.status_code == 200
        assert r2.json()['email'] == '' and r2.json()['whatsapp_number'] == ''


# ---- SEO ----
class TestSeo:
    def test_sitemap(self):
        r = requests.get(f'{BASE_URL}/api/sitemap.xml')
        assert r.status_code == 200
        assert 'xml' in r.headers['content-type']
        t = r.text
        for p in ['/about<', '/services<', '/projects<', '/models<', '/contact<']:
            assert p in t, p
        assert '/services/' in t and '/projects/' in t
        svc = requests.get(f'{BASE_URL}/api/services').json()
        assert t.count('/services/') == len(svc)
        assert '<loc>https://' in t

    def test_robots(self):
        r = requests.get(f'{BASE_URL}/robots.txt')
        assert r.status_code == 200
        assert '/api/sitemap.xml' in r.text
        assert 'Disallow: /admin' in r.text

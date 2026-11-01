# Iteration 3: users mgmt, roles (editor), backup/restore, theme, defaults, stats, settings en/pages/copyright
import io
import json
import os
import uuid
from pathlib import Path

import pytest
import requests
from dotenv import load_dotenv

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
load_dotenv(Path(__file__).resolve().parents[1] / '.env')
ADMIN_EMAIL = os.environ['ADMIN_EMAIL']
ADMIN_PASSWORD = os.environ['ADMIN_PASSWORD']
EDITOR_EMAIL = 'editor.test@2morro.com'
EDITOR_PASSWORD = os.environ['EDITOR_TEST_PASSWORD']


def _session(email, password):
    r = requests.post(f'{BASE_URL}/api/auth/login', json={'email': email, 'password': password})
    if r.status_code != 200:
        pytest.skip(f'login failed for {email}: {r.status_code} {r.text}')
    s = requests.Session()
    s.headers.update({'Authorization': f"Bearer {r.json()['access_token']}"})
    s.user = r.json()['user']
    return s


@pytest.fixture(scope='module')
def admin():
    return _session(ADMIN_EMAIL, ADMIN_PASSWORD)


@pytest.fixture(scope='module')
def editor():
    return _session(EDITOR_EMAIL, EDITOR_PASSWORD)


# ---- Users management ----
class TestUsers:
    created = []

    def test_list_users(self, admin):
        r = admin.get(f'{BASE_URL}/api/admin/users')
        assert r.status_code == 200
        emails = [u['email'] for u in r.json()]
        assert ADMIN_EMAIL in emails and EDITOR_EMAIL in emails
        assert all('password_hash' not in u and '_id' not in u for u in r.json())

    def test_create_validation(self, admin):
        r = admin.post(f'{BASE_URL}/api/admin/users', json={'name': 'TEST x', 'email': 'TEST_a@x.com', 'password': 'short', 'role': 'editor'})
        assert r.status_code in (400, 422)
        r = admin.post(f'{BASE_URL}/api/admin/users', json={'name': 'TEST x', 'email': 'bad-email', 'password': 'longpassword', 'role': 'editor'})
        assert r.status_code in (400, 422)
        r = admin.post(f'{BASE_URL}/api/admin/users', json={'name': 'TEST x', 'email': 'TEST_b@x.com', 'password': 'longpassword', 'role': 'owner'})
        assert r.status_code in (400, 422)
        r = admin.post(f'{BASE_URL}/api/admin/users', json={'name': 'TEST dup', 'email': ADMIN_EMAIL.upper(), 'password': 'longpassword', 'role': 'editor'})
        assert r.status_code == 400

    def test_create_update_deactivate_delete(self, admin):
        email = f'test_{uuid.uuid4().hex[:6]}@example.com'
        r = admin.post(f'{BASE_URL}/api/admin/users', json={'name': 'TEST User', 'email': email, 'password': 'TestPass#123', 'role': 'editor'})
        assert r.status_code == 200, r.text
        u = r.json()
        assert u['email'] == email and u['role'] == 'editor' and u['active'] is True
        uid = u['id']
        try:
            # login works, token valid
            lr = requests.post(f'{BASE_URL}/api/auth/login', json={'email': email, 'password': 'TestPass#123'})
            assert lr.status_code == 200
            tok = lr.json()['access_token']
            # update name + password
            r = admin.put(f'{BASE_URL}/api/admin/users/{uid}', json={'name': 'TEST Renamed', 'password': 'NewPass#1234'})
            assert r.status_code == 200 and r.json()['name'] == 'TEST Renamed'
            assert requests.post(f'{BASE_URL}/api/auth/login', json={'email': email, 'password': 'NewPass#1234'}).status_code == 200
            # deactivate
            r = admin.put(f'{BASE_URL}/api/admin/users/{uid}', json={'active': False})
            assert r.status_code == 200 and r.json()['active'] is False
            assert requests.post(f'{BASE_URL}/api/auth/login', json={'email': email, 'password': 'NewPass#1234'}).status_code == 403
            assert requests.get(f'{BASE_URL}/api/auth/me', headers={'Authorization': f'Bearer {tok}'}).status_code == 401
            # stats inactive
            st = admin.get(f'{BASE_URL}/api/admin/stats').json()
            assert st['users']['inactive'] >= 1
        finally:
            r = admin.delete(f'{BASE_URL}/api/admin/users/{uid}')
            assert r.status_code == 200
        ids = [x['id'] for x in admin.get(f'{BASE_URL}/api/admin/users').json()]
        assert uid not in ids

    def test_self_protection(self, admin):
        me = admin.user['id']
        assert admin.delete(f'{BASE_URL}/api/admin/users/{me}').status_code == 400
        assert admin.put(f'{BASE_URL}/api/admin/users/{me}', json={'role': 'editor'}).status_code == 400
        assert admin.put(f'{BASE_URL}/api/admin/users/{me}', json={'active': False}).status_code == 400
        assert admin.delete(f'{BASE_URL}/api/admin/users/notanid').status_code == 404

    def test_second_admin_demote_ok(self, admin):
        email = f'test_adm_{uuid.uuid4().hex[:6]}@example.com'
        r = admin.post(f'{BASE_URL}/api/admin/users', json={'name': 'TEST Admin2', 'email': email, 'password': 'TestPass#123', 'role': 'admin'})
        uid = r.json()['id']
        try:
            r = admin.put(f'{BASE_URL}/api/admin/users/{uid}', json={'role': 'editor'})
            assert r.status_code == 200 and r.json()['role'] == 'editor'
        finally:
            admin.delete(f'{BASE_URL}/api/admin/users/{uid}')


# ---- Editor role restrictions ----
class TestEditorRole:
    @pytest.mark.parametrize('method,path', [
        ('get', '/api/admin/users'), ('get', '/api/admin/backup?parts=content'),
        ('put', '/api/admin/theme'), ('post', '/api/admin/theme/reset'),
        ('post', '/api/admin/defaults/texts'), ('post', '/api/admin/defaults/demo-content'),
    ])
    def test_forbidden(self, editor, method, path):
        kw = {'json': {'colors': {}, 'animations': {}, 'decorations': {}, 'backgrounds': {}}} if method == 'put' else {}
        r = getattr(editor, method)(f'{BASE_URL}{path}', **kw)
        assert r.status_code == 403, f'{path} -> {r.status_code}'

    def test_editor_can_crud_content(self, editor):
        r = editor.post(f'{BASE_URL}/api/admin/services', json={'name': 'TEST_ editor svc', 'short_desc': 'TEST desc', 'published': False,
                                                                 'en': {'name': 'TEST EN title'}})
        assert r.status_code == 200, r.text
        sid = r.json()['id']
        assert r.json().get('en', {}).get('name') == 'TEST EN title'
        assert editor.delete(f'{BASE_URL}/api/admin/services/{sid}').status_code == 200

    def test_editor_stats_and_settings(self, editor):
        assert editor.get(f'{BASE_URL}/api/admin/stats').status_code == 200
        cur = editor.get(f'{BASE_URL}/api/admin/settings').json()
        r = editor.put(f'{BASE_URL}/api/admin/settings', json={'tagline': cur.get('tagline', '')})
        assert r.status_code == 200


# ---- Backup / restore ----
class TestBackup:
    def test_export_parts(self, admin):
        r = admin.get(f'{BASE_URL}/api/admin/backup', params={'parts': 'content'})
        assert r.status_code == 200
        assert 'attachment' in r.headers.get('content-disposition', '')
        data = r.json()
        assert data['app'] == '2morro-site'
        assert set(data['collections']) == {'services', 'projects', 'delivery_models', 'files'}
        assert len(data['collections']['services']) == admin.get(f'{BASE_URL}/api/admin/stats').json()['services']['total']

    def test_export_users_only_and_date_filter(self, admin):
        r = admin.get(f'{BASE_URL}/api/admin/backup', params={'parts': 'users'})
        assert set(r.json()['collections']) == {'users'}
        r = admin.get(f'{BASE_URL}/api/admin/backup', params={'parts': 'content', 'date_from': '2000-01-01', 'date_to': '2000-01-02'})
        assert r.status_code == 200
        assert all(len(v) == 0 for v in r.json()['collections'].values())
        assert admin.get(f'{BASE_URL}/api/admin/backup', params={'parts': 'bogus'}).status_code == 400
        assert admin.get(f'{BASE_URL}/api/admin/backup', params={'parts': 'content', 'date_from': '01-01-2020'}).status_code == 400

    def test_last_backup_in_stats(self, admin):
        st = admin.get(f'{BASE_URL}/api/admin/stats').json()
        assert st['last_backup']

    def test_restore_invalid(self, admin):
        r = admin.post(f'{BASE_URL}/api/admin/backup/restore', files={'file': ('x.json', b'not json', 'application/json')}, data={'mode': 'merge'})
        assert r.status_code == 400
        r = admin.post(f'{BASE_URL}/api/admin/backup/restore', files={'file': ('x.json', json.dumps({'a': 1}).encode(), 'application/json')}, data={'mode': 'merge'})
        assert r.status_code == 400
        r = admin.post(f'{BASE_URL}/api/admin/backup/restore', files={'file': ('x.json', b'{}', 'application/json')}, data={'mode': 'wipe'})
        assert r.status_code == 400

    def test_restore_merge_and_replace_content(self, admin):
        before = admin.get(f'{BASE_URL}/api/admin/stats').json()
        raw = admin.get(f'{BASE_URL}/api/admin/backup', params={'parts': 'content,settings'}).content
        r = admin.post(f'{BASE_URL}/api/admin/backup/restore', files={'file': ('b.json', raw, 'application/json')},
                       data={'mode': 'merge', 'parts': 'content'})
        assert r.status_code == 200, r.text
        assert 'settings' not in r.json()['restored']
        assert r.json()['restored']['services'] == before['services']['total']
        r = admin.post(f'{BASE_URL}/api/admin/backup/restore', files={'file': ('b.json', raw, 'application/json')},
                       data={'mode': 'replace', 'parts': 'content,settings'})
        assert r.status_code == 200, r.text
        after = admin.get(f'{BASE_URL}/api/admin/stats').json()
        for k in ('services', 'projects', 'delivery_models'):
            assert after[k]['total'] == before[k]['total']
            assert after[k]['published'] == before[k]['published']

    def test_restore_users_replace_keeps_admin(self, admin):
        raw = admin.get(f'{BASE_URL}/api/admin/backup', params={'parts': 'users'}).content
        r = admin.post(f'{BASE_URL}/api/admin/backup/restore', files={'file': ('u.json', raw, 'application/json')},
                       data={'mode': 'replace', 'parts': 'users'})
        assert r.status_code == 200, r.text
        assert admin.get(f'{BASE_URL}/api/auth/me').status_code == 200
        emails = [u['email'] for u in admin.get(f'{BASE_URL}/api/admin/users').json()]
        assert ADMIN_EMAIL in emails and EDITOR_EMAIL in emails


# ---- Theme ----
class TestTheme:
    def test_update_and_public(self, admin):
        payload = {'colors': {'primary': '#ff0000', 'accent': '#00E5FF', 'dark': '#070D1B', 'surface': '#F8FAFC', 'page': '#F7F9FC'},
                   'animations': {'enabled': False, 'speed': 'fast'}, 'decorations': {'grid': False, 'glow': True},
                   'backgrounds': {'home': '', 'overlay': 50}}
        try:
            r = admin.put(f'{BASE_URL}/api/admin/theme', json=payload)
            assert r.status_code == 200, r.text
            assert r.json()['colors']['primary'] == '#FF0000'
            pub = requests.get(f'{BASE_URL}/api/settings').json()
            assert pub['theme']['colors']['primary'] == '#FF0000'
            assert pub['theme']['animations']['enabled'] is False
            assert pub['theme']['decorations']['grid'] is False
            assert pub['theme']['backgrounds']['overlay'] == 50
        finally:
            r = admin.post(f'{BASE_URL}/api/admin/theme/reset')
            assert r.status_code == 200 and r.json()['colors']['primary'] == '#0066FF'
        assert requests.get(f'{BASE_URL}/api/settings').json()['theme']['colors']['primary'] == '#0066FF'

    @pytest.mark.parametrize('bad', [
        {'colors': {'primary': 'red'}},
        {'animations': {'speed': 'warp'}},
        {'backgrounds': {'home': 'javascript:alert(1)'}},
        {'backgrounds': {'overlay': 'abc'}},
    ])
    def test_invalid(self, admin, bad):
        payload = {'colors': {}, 'animations': {}, 'decorations': {}, 'backgrounds': {}}
        payload.update(bad)
        assert admin.put(f'{BASE_URL}/api/admin/theme', json=payload).status_code == 400


# ---- Settings en/pages/copyright + defaults ----
class TestSettingsExtras:
    def test_en_pages_copyright(self, admin):
        try:
            r = admin.put(f'{BASE_URL}/api/admin/settings', json={
                'copyright_text': 'TEST حقوق', 'copyright_text_en': 'TEST rights',
                'en': {'hero_title': 'TEST Hero EN', 'evil_key': 'x'},
                'pages': {'about': {'title_en': 'TEST About EN', 'bogus': 'y'}, 'nope': {'title': 'z'}}})
            assert r.status_code == 200, r.text
            pub = requests.get(f'{BASE_URL}/api/settings').json()
            assert pub['copyright_text'] == 'TEST حقوق' and pub['copyright_text_en'] == 'TEST rights'
            assert pub['en']['hero_title'] == 'TEST Hero EN' and 'evil_key' not in pub['en']
            assert pub['pages']['about']['title_en'] == 'TEST About EN'
            assert 'bogus' not in pub['pages']['about'] and 'nope' not in pub['pages']
            assert pub['pages']['services']['badge']  # defaults kept
        finally:
            r = admin.post(f'{BASE_URL}/api/admin/defaults/texts')
            assert r.status_code == 200
        pub = requests.get(f'{BASE_URL}/api/settings').json()
        assert pub['copyright_text'] == '' and pub['en']['hero_title'] != 'TEST Hero EN'
        assert pub['pages']['about']['title_en'] == 'A technology team with a clear methodology and a real passion for quality'

    def test_reset_demo_content(self, admin):
        r = admin.post(f'{BASE_URL}/api/admin/defaults/demo-content')
        assert r.status_code == 200, r.text
        st = admin.get(f'{BASE_URL}/api/admin/stats').json()
        assert st['services']['published'] == 22 and st['projects']['published'] == 9 and st['delivery_models']['published'] == 15


# ---- Stats correctness ----
class TestStats:
    def test_stats_match(self, admin):
        st = admin.get(f'{BASE_URL}/api/admin/stats').json()
        for ent, col in (('services', 'services'), ('projects', 'projects'), ('delivery_models', 'delivery_models')):
            items = admin.get(f'{BASE_URL}/api/admin/{ent}').json()
            assert st[col]['total'] == len(items)
            assert st[col]['published'] == sum(1 for i in items if i.get('published'))
            assert st[col]['drafts'] == st[col]['total'] - st[col]['published']
        users = admin.get(f'{BASE_URL}/api/admin/users').json()
        assert st['users']['total'] == len(users)
        assert st['users']['admins'] == sum(1 for u in users if u['role'] == 'admin')
        assert isinstance(st['files'], int)
        assert len(st['activity']) > 0

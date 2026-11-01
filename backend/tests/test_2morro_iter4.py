# Iteration 4 retest: restore duplicate-email fix, duplicate/empty email 400, replace+date-range 400, Arabic validation
import json
import os
from pathlib import Path

import pytest
import requests
from bson import ObjectId, json_util
from dotenv import load_dotenv

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
load_dotenv(Path(__file__).resolve().parents[1] / '.env')
ADMIN_EMAIL = os.environ['ADMIN_EMAIL']
ADMIN_PASSWORD = os.environ['ADMIN_PASSWORD']
EDITOR_EMAIL = 'editor.test@2morro.com'
EDITOR_PASSWORD = os.environ['EDITOR_TEST_PASSWORD']


@pytest.fixture(scope='module')
def admin():
    r = requests.post(f'{BASE_URL}/api/auth/login', json={'email': ADMIN_EMAIL, 'password': ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    s = requests.Session()
    s.headers.update({'Authorization': f"Bearer {r.json()['access_token']}"})
    return s


def _users_backup(admin):
    r = admin.get(f'{BASE_URL}/api/admin/backup', params={'parts': 'users'})
    assert r.status_code == 200
    return json_util.loads(r.content.decode())


def _restore(admin, payload, mode='merge', parts='users'):
    raw = json_util.dumps(payload).encode()
    return admin.post(f'{BASE_URL}/api/admin/backup/restore', files={'file': ('b.json', raw, 'application/json')},
                      data={'mode': mode, 'parts': parts})


def _editor(admin):
    return next(u for u in admin.get(f'{BASE_URL}/api/admin/users').json() if u['email'] == EDITOR_EMAIL)


# ---- Restore fixes ----
class TestRestoreFix:
    def test_merge_same_email_different_id_updates_existing(self, admin):
        payload = _users_backup(admin)
        orig = _editor(admin)
        users = payload['collections']['users']
        ed = next(u for u in users if u['email'] == EDITOR_EMAIL)
        ed['_id'] = ObjectId()
        ed['name'] = 'TEST Restored Editor'
        payload['collections']['users'] = [ed]
        try:
            r = _restore(admin, payload)
            assert r.status_code == 200, r.text
            assert r.json()['restored']['users'] == 1
            cur = _editor(admin)
            assert cur['id'] == orig['id']  # existing user updated, not duplicated
            assert cur['name'] == 'TEST Restored Editor'
            emails = [u['email'] for u in admin.get(f'{BASE_URL}/api/admin/users').json()]
            assert emails.count(EDITOR_EMAIL) == 1
            assert requests.post(f'{BASE_URL}/api/auth/login', json={'email': EDITOR_EMAIL, 'password': EDITOR_PASSWORD}).status_code == 200
        finally:
            admin.put(f"{BASE_URL}/api/admin/users/{orig['id']}", json={'name': orig['name']})

    def test_admin_in_backup_never_touched(self, admin):
        payload = _users_backup(admin)
        ad = next(u for u in payload['collections']['users'] if u['email'] == ADMIN_EMAIL)
        ad['_id'] = ObjectId()
        ad['name'] = 'TEST HACKED'
        ad['role'] = 'editor'
        ad['active'] = False
        ad['password_hash'] = '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvali'
        payload['collections']['users'] = [ad]
        r = _restore(admin, payload)
        assert r.status_code == 200, r.text
        me = admin.get(f'{BASE_URL}/api/auth/me').json()
        assert me['role'] == 'admin' and me['name'] != 'TEST HACKED'
        assert requests.post(f'{BASE_URL}/api/auth/login', json={'email': ADMIN_EMAIL, 'password': ADMIN_PASSWORD}).status_code == 200

    @pytest.mark.parametrize('kind', ['dup', 'empty'])
    def test_bad_emails_400_before_delete(self, admin, kind):
        payload = _users_backup(admin)
        before = len(admin.get(f'{BASE_URL}/api/admin/users').json())
        ed = next(u for u in payload['collections']['users'] if u['email'] == EDITOR_EMAIL)
        extra = dict(ed, _id=ObjectId())
        if kind == 'dup':
            extra['email'] = EDITOR_EMAIL.upper()
        else:
            extra['email'] = '  '
        payload['collections']['users'].append(extra)
        r = _restore(admin, payload, mode='replace')
        assert r.status_code == 400
        assert 'بريد' in r.json()['detail']
        assert len(admin.get(f'{BASE_URL}/api/admin/users').json()) == before

    def test_replace_with_date_range_rejected(self, admin):
        r = admin.get(f'{BASE_URL}/api/admin/backup', params={'parts': 'content', 'date_from': '2020-01-01', 'date_to': '2030-01-01'})
        before = admin.get(f'{BASE_URL}/api/admin/stats').json()
        rr = admin.post(f'{BASE_URL}/api/admin/backup/restore', files={'file': ('b.json', r.content, 'application/json')},
                        data={'mode': 'replace', 'parts': 'content'})
        assert rr.status_code == 400
        assert 'الدمج' in rr.json()['detail']
        after = admin.get(f'{BASE_URL}/api/admin/stats').json()
        assert after['services']['total'] == before['services']['total']
        # merge of the same file is allowed
        rr = admin.post(f'{BASE_URL}/api/admin/backup/restore', files={'file': ('b.json', r.content, 'application/json')},
                        data={'mode': 'merge', 'parts': 'content'})
        assert rr.status_code == 200, rr.text

    def test_published_counts_intact(self, admin):
        st = admin.get(f'{BASE_URL}/api/admin/stats').json()
        assert st['services']['published'] == 22 and st['projects']['published'] == 9 and st['delivery_models']['published'] == 15


# ---- Arabic validation handler ----
class TestArabicValidation:
    @pytest.mark.parametrize('body', [
        {'name': 'A', 'email': 'TEST_v1@example.com', 'password': 'LongPass#123', 'role': 'editor'},
        {'name': 'TEST ok', 'email': 'TEST_v2@example.com', 'password': 'short', 'role': 'editor'},
        {'name': 'TEST ok', 'email': 'bad', 'password': 'LongPass#123', 'role': 'editor'},
    ])
    def test_user_validation_arabic(self, admin, body):
        r = admin.post(f'{BASE_URL}/api/admin/users', json=body)
        assert r.status_code == 400, r.text
        d = r.json()['detail']
        assert isinstance(d, str) and d.startswith('يرجى التحقق من الحقول')

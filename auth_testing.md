# Auth testing notes (2Morro)
- Credentials: /app/memory/test_credentials.md (admin from backend/.env ADMIN_EMAIL/ADMIN_PASSWORD, editor test account).
- Login: POST /api/auth/login -> {user, access_token} + httpOnly cookies access_token/refresh_token.
- GET /api/auth/me works for admin and editor; inactive users get 401/403.
- Roles: admin = everything; editor = content CRUD, settings texts, upload, stats. Editor gets 403 on /api/admin/users*, /api/admin/backup*, /api/admin/theme*, /api/admin/defaults/*.
- Lockout: 5 failed attempts per email -> 429 for 15 min (use fake emails when testing).
- Safety rules: cannot delete yourself, cannot demote/deactivate yourself, must keep at least one active admin.

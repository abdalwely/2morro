"""Isolated structural/security tests for the full ZIP backup validator.

These tests stub MongoDB/Supabase imports and never connect to either service.
"""
import importlib.util
import json
import stat
import sys
import types
import warnings
import zipfile
from pathlib import Path

import pytest


@pytest.fixture(scope="module")
def backup_module():
    bson = types.ModuleType("bson")
    json_util = types.ModuleType("bson.json_util")
    json_util.loads = lambda value: json.loads(
        value.decode("utf-8") if isinstance(value, (bytes, bytearray)) else value
    )
    json_util.dumps = lambda value, **kwargs: json.dumps(value, **kwargs)

    class FakeObjectId:
        def __init__(self, value=None):
            self.value = value or "0123456789abcdef01234567"

        @staticmethod
        def is_valid(value):
            return isinstance(value, str) and len(value) == 24

    bson.ObjectId = FakeObjectId
    bson.json_util = json_util

    db_module = types.ModuleType("db")
    db_module.db = types.SimpleNamespace(name="twomorro")
    db_module.now_iso = lambda: "2026-11-04T12:00:00+00:00"

    storage_module = types.ModuleType("storage")
    storage_module.SUPABASE_UPLOADS_BUCKET = "morro-uploads"

    replacements = {
        "bson": bson,
        "bson.json_util": json_util,
        "db": db_module,
        "storage": storage_module,
    }
    previous = {key: sys.modules.get(key) for key in replacements}
    sys.modules.update(replacements)

    source = Path(__file__).resolve().parents[1] / "backup_zip.py"
    spec = importlib.util.spec_from_file_location("backup_zip_validation_target", source)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    yield module

    for key, old_value in previous.items():
        if old_value is None:
            sys.modules.pop(key, None)
        else:
            sys.modules[key] = old_value


def make_archive(path, *, collections=None, files=None, extra_entries=None, mutate_manifest=None):
    collections = {"users": 0} if collections is None else collections
    files = [] if files is None else files
    manifest = {
        "app": "2morro-site",
        "format_version": 1,
        "created_at": "2026-11-04T12:00:00+00:00",
        "database": {"name": "twomorro", "collections": collections},
        "storage": {
            "bucket": "morro-uploads",
            "file_count": len(files),
            "total_size": sum(item["size"] for item in files),
            "files": files,
        },
    }
    if mutate_manifest:
        mutate_manifest(manifest)

    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("database/users.json", "[]") if "users" in collections else None
        for name, count in collections.items():
            if name != "users":
                archive.writestr(f"database/{name}.json", "[]")
        for item in files:
            archive.writestr(item["archive_path"], b"x" * item["size"])
        for name, value in (extra_entries or {}).items():
            archive.writestr(name, value)
        archive.writestr("manifest.json", json.dumps(manifest))


def test_valid_minimal_archive_is_accepted(tmp_path, backup_module):
    path = tmp_path / "valid.zip"
    make_archive(path)
    result = backup_module.validate_backup_zip(str(path))
    assert result["valid"] is True
    assert result["collection_counts"] == {"users": 0}
    assert result["file_count"] == 0


def test_archive_without_users_collection_is_rejected(tmp_path, backup_module):
    path = tmp_path / "no-users.zip"
    make_archive(path, collections={"services": 0})
    with pytest.raises(ValueError, match="users"):
        backup_module.validate_backup_zip(str(path))


def test_archive_for_another_database_is_rejected(tmp_path, backup_module):
    path = tmp_path / "other-db.zip"
    make_archive(path, mutate_manifest=lambda m: m["database"].update(name="other"))
    with pytest.raises(ValueError, match="different database"):
        backup_module.validate_backup_zip(str(path))


def test_manifest_storage_path_traversal_is_rejected(tmp_path, backup_module):
    path = tmp_path / "traversal.zip"
    entry = {
        "path": "../outside.txt",
        "archive_path": "files/../outside.txt",
        "size": 1,
        "sha256": "0" * 64,
        "content_type": "text/plain",
        "metadata": {},
    }
    make_archive(path, files=[entry])
    with pytest.raises(ValueError, match="unsafe entry path|Unsafe storage path"):
        backup_module.validate_backup_zip(str(path))


def test_unexpected_zip_entry_is_rejected(tmp_path, backup_module):
    path = tmp_path / "unexpected.zip"
    make_archive(path, extra_entries={"other.txt": b"unexpected"})
    with pytest.raises(ValueError, match="invalid entry path"):
        backup_module.validate_backup_zip(str(path))


def test_symlink_entry_is_rejected(tmp_path, backup_module):
    path = tmp_path / "symlink.zip"
    with zipfile.ZipFile(path, "w") as archive:
        info = zipfile.ZipInfo("database/users.json")
        info.create_system = 3
        info.external_attr = (stat.S_IFLNK | 0o777) << 16
        archive.writestr(info, "target")
        archive.writestr("manifest.json", json.dumps({"app": "2morro-site"}))
    with pytest.raises(ValueError, match="non-regular"):
        backup_module.validate_backup_zip(str(path))


def test_duplicate_zip_entry_is_rejected(tmp_path, backup_module):
    path = tmp_path / "duplicate.zip"
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        with zipfile.ZipFile(path, "w") as archive:
            archive.writestr("database/users.json", "[]")
            archive.writestr("database/users.json", "[]")
            archive.writestr("manifest.json", "{}")
    with pytest.raises(ValueError, match="duplicate"):
        backup_module.validate_backup_zip(str(path))


def test_storage_file_hash_is_verified(tmp_path, backup_module):
    import hashlib

    path = tmp_path / "file-valid.zip"
    payload = b"x"
    entry = {
        "path": "2morro-solutions/uploads/test.png",
        "archive_path": "files/2morro-solutions/uploads/test.png",
        "size": len(payload),
        "sha256": hashlib.sha256(payload).hexdigest(),
        "content_type": "image/png",
        "metadata": {},
    }
    make_archive(path, files=[entry])
    result = backup_module.validate_backup_zip(str(path))
    assert result["file_count"] == 1
    assert result["total_file_size"] == 1


def test_storage_file_hash_mismatch_is_rejected(tmp_path, backup_module):
    path = tmp_path / "file-bad-hash.zip"
    entry = {
        "path": "2morro-solutions/uploads/test.png",
        "archive_path": "files/2morro-solutions/uploads/test.png",
        "size": 1,
        "sha256": "0" * 64,
        "content_type": "image/png",
        "metadata": {},
    }
    make_archive(path, files=[entry])
    with pytest.raises(ValueError, match="SHA-256"):
        backup_module.validate_backup_zip(str(path))

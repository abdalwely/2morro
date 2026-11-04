import io
import stat
from pathlib import Path
from bson import ObjectId
import asyncio
import hashlib
import json
import os
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import PurePosixPath

from bson import json_util

from db import db, now_iso
import storage


APP_NAME = "2morro-site"
BACKUP_FORMAT_VERSION = 1

LIST_PAGE_SIZE = 1000
MAX_FILES = int(os.getenv("ZIP_BACKUP_MAX_FILES", "5000"))
MAX_TOTAL_FILE_SIZE = int(
    os.getenv("ZIP_BACKUP_MAX_FILE_SIZE", str(1024 * 1024 * 1024))
)
MAX_ARCHIVE_SIZE = int(
    os.getenv("ZIP_BACKUP_MAX_ARCHIVE_SIZE", str(1024 * 1024 * 1024))
)


MAX_TOTAL_DATABASE_SIZE = int(
    os.getenv("ZIP_BACKUP_MAX_DATABASE_SIZE", str(512 * 1024 * 1024))
)

MAX_COLLECTION_SIZE = int(
    os.getenv("ZIP_BACKUP_MAX_COLLECTION_SIZE", str(128 * 1024 * 1024))
)
MAX_COLLECTIONS = int(os.getenv("ZIP_BACKUP_MAX_COLLECTIONS", "256"))
MAX_MANIFEST_SIZE = int(os.getenv("ZIP_BACKUP_MAX_MANIFEST_SIZE", str(5 * 1024 * 1024)))
MAX_COMPRESSION_RATIO = float(os.getenv("ZIP_BACKUP_MAX_COMPRESSION_RATIO", "200"))


def _safe_storage_path(path: str) -> str:
    if not isinstance(path, str) or not path:
        raise ValueError("Invalid storage path.")

    normalized = path.replace("\\", "/")
    pure = PurePosixPath(normalized)

    if (
        normalized != normalized.strip()
        or normalized.startswith("/")
        or "\x00" in normalized
        or any(part in ("", ".", "..") for part in normalized.split("/"))
        or pure.is_absolute()
        or any("\x00" in part or ":" in part for part in normalized.split("/"))
    ):
        raise ValueError("Unsafe storage path.")

    return normalized


def _check_archive_size(archive) -> None:
    """Fail early when the ZIP's current on-disk size exceeds its limit."""
    fp = getattr(archive, "fp", None)
    if fp is not None and fp.tell() > MAX_ARCHIVE_SIZE:
        raise RuntimeError("Generated ZIP exceeds the configured archive size limit.")


def _sha256_file(path: str) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as source:
        while True:
            chunk = source.read(1024 * 1024)
            if not chunk:
                break
            digest.update(chunk)
    return digest.hexdigest()


def _validate_zip_info(info: zipfile.ZipInfo) -> None:
    name = info.filename
    if not isinstance(name, str) or not name or "\\" in name or "\x00" in name:
        raise ValueError("ZIP contains an unsafe entry name.")
    pure = PurePosixPath(name)
    if pure.is_absolute() or any(part in ("", ".", "..") for part in name.split("/")):
        raise ValueError("ZIP contains an unsafe entry path.")
    if info.flag_bits & 0x1:
        raise ValueError("Encrypted ZIP entries are not supported.")
    if info.compress_type not in (zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED):
        raise ValueError("ZIP uses an unsupported compression method.")
    mode = (info.external_attr >> 16) & 0xFFFF
    file_type = stat.S_IFMT(mode)
    if stat.S_ISLNK(mode) or file_type not in (0, stat.S_IFREG):
        raise ValueError("ZIP contains a non-regular file entry.")
    if info.file_size > 0:
        if info.compress_size <= 0:
            raise ValueError("ZIP entry has an invalid compressed size.")
        if info.file_size >= 1024 * 1024 and info.file_size / info.compress_size > MAX_COMPRESSION_RATIO:
            raise ValueError("ZIP entry compression ratio exceeds the allowed limit.")


def _validate_collection_name(name: str) -> str:
    if (
        not isinstance(name, str)
        or not name
        or name.startswith("system.")
        or "/" in name
        or "\\" in name
        or "\x00" in name
        or name in (".", "..")
    ):
        raise ValueError("Invalid MongoDB collection name.")

    return name

async def _list_level(prefix: str) -> list:
    """Fetch all pages for one Supabase Storage prefix."""
    result = []
    offset = 0

    while True:
        page = await asyncio.to_thread(
            storage.list_upload_objects,
            prefix,
            LIST_PAGE_SIZE,
            offset,
        )

        result.extend(page)

        if len(page) < LIST_PAGE_SIZE:
            break

        offset += len(page)

    return result


async def _walk_uploads(prefix: str = ""):
    """Recursively yield every file in the uploads bucket."""
    items = await _list_level(prefix)

    for item in items:
        name = item.get("name")

        if not isinstance(name, str) or not name or "/" in name or "\\" in name:
            raise ValueError("Supabase returned an invalid object name.")

        path = _safe_storage_path(
            f"{prefix}/{name}" if prefix else name
        )

        if item.get("id"):
            yield path, item
        else:
            async for entry in _walk_uploads(path):
                yield entry



async def _write_collection(
    archive,
    collection_name: str,
    database_total_size: int = 0,
) -> tuple[int, int]:
    """Write BSON-preserving Extended JSON as a JSON array with size limits."""
    count = 0
    collection_size = 0
    cursor = db[collection_name].find({})

    def add_size(size: int):
        nonlocal collection_size

        new_collection_size = collection_size + size
        new_database_size = database_total_size + size

        if new_collection_size > MAX_COLLECTION_SIZE:
            raise RuntimeError(
                f"Collection exceeds the configured size limit: {collection_name}"
            )

        if new_database_size > MAX_TOTAL_DATABASE_SIZE:
            raise RuntimeError(
                "Database backup exceeds the configured total size limit."
            )

        collection_size = new_collection_size

    with archive.open(
        f"database/{collection_name}.json",
        "w",
    ) as raw_file:
        import io

        text_file = io.TextIOWrapper(
            raw_file,
            encoding="utf-8",
            write_through=True,
        )

        try:
            add_size(1)  # Opening bracket: [

            text_file.write("[")
            _check_archive_size(archive)

            async for document in cursor:
                serialized = json_util.dumps(
                    document,
                    ensure_ascii=False,
                )

                if count:
                    add_size(1)  # Comma separator
                    text_file.write(",")

                add_size(len(serialized.encode("utf-8")))
                text_file.write(serialized)
                _check_archive_size(archive)

                count += 1

            add_size(1)  # Closing bracket: ]

            text_file.write("]")
            text_file.flush()
            _check_archive_size(archive)

        finally:
            text_file.detach()

    return count, collection_size


async def create_full_backup() -> tuple[str, dict]:
    """
    Create a complete ZIP backup.

    Returns:
        (temporary_zip_path, backup_summary)
    """
    temp = tempfile.NamedTemporaryFile(
        prefix="2morro-backup-",
        suffix=".zip",
        delete=False,
    )
    temp_path = temp.name
    temp.close()

    collection_counts = {}
    file_entries = []
    seen_paths = set()
    total_file_size = 0

    try:
        with zipfile.ZipFile(
            temp_path,
            mode="w",
            compression=zipfile.ZIP_DEFLATED,
            compresslevel=6,
            allowZip64=True,
        ) as archive:

            # Export every MongoDB collection dynamically.
            collection_names = sorted(
                name
                for name in await db.list_collection_names()
                if not name.startswith("system.")
            )

            if not collection_names:
                raise RuntimeError("No MongoDB collections were found.")
            if "users" not in collection_names:
                raise RuntimeError("The users collection is required for a restorable full backup.")
            if len(collection_names) > MAX_COLLECTIONS:
                raise RuntimeError("Database exceeds the configured collection-count limit.")

            database_total_size = 0

            for collection_name in collection_names:
                _validate_collection_name(collection_name)

                count, collection_size = await _write_collection(
                    archive,
                    collection_name,
                    database_total_size,
                )

                database_total_size += collection_size
                collection_counts[collection_name] = count

            # Export every actual object in the uploads bucket.
            async for path, item in _walk_uploads():
                if path in seen_paths:
                    raise RuntimeError(
                        f"Duplicate Supabase object path: {path}"
                    )

                seen_paths.add(path)

                if len(seen_paths) > MAX_FILES:
                    raise RuntimeError("Uploads bucket exceeds the file-count limit.")

                remaining_size = MAX_TOTAL_FILE_SIZE - total_file_size
                with tempfile.TemporaryDirectory(prefix="2morro-backup-file-") as file_temp:
                    local_file = os.path.join(file_temp, "object.bin")
                    download_info = await asyncio.to_thread(
                        storage.download_upload_to_file,
                        path,
                        local_file,
                        remaining_size,
                    )
                    file_size = download_info["size"]
                    total_file_size += file_size
                    if total_file_size > MAX_TOTAL_FILE_SIZE:
                        raise RuntimeError("Uploads bucket exceeds the configured total size limit.")

                    archive_name = f"files/{path}"
                    metadata = item.get("metadata") or {}
                    if not isinstance(metadata, dict):
                        raise RuntimeError(f"Supabase returned invalid metadata for: {path}")
                    archive.write(local_file, arcname=archive_name)
                    _check_archive_size(archive)
                    file_entries.append({
                        "path": path,
                        "archive_path": archive_name,
                        "size": file_size,
                        "sha256": _sha256_file(local_file),
                        "content_type": download_info.get("content_type") or "application/octet-stream",
                        "metadata": metadata,
                    })

            manifest = {
                "app": APP_NAME,
                "format_version": BACKUP_FORMAT_VERSION,
                "created_at": now_iso(),
                "database": {
                    "name": db.name,
                    "collections": collection_counts,
                },
                "storage": {
                    "bucket": storage.SUPABASE_UPLOADS_BUCKET,
                    "file_count": len(file_entries),
                    "total_size": total_file_size,
                    "files": file_entries,
                },
            }

            manifest_bytes = json.dumps(
                manifest,
                ensure_ascii=False,
                indent=2,
            ).encode("utf-8")
            if len(manifest_bytes) > MAX_MANIFEST_SIZE:
                raise RuntimeError("Generated backup manifest exceeds the configured size limit.")
            archive.writestr("manifest.json", manifest_bytes)
            _check_archive_size(archive)

        archive_size = os.path.getsize(temp_path)

        if archive_size > MAX_ARCHIVE_SIZE:
            raise RuntimeError("Generated ZIP exceeds the configured archive size limit.")

        summary = {
            "path": temp_path,
            "archive_size": archive_size,
            "collection_count": len(collection_counts),
            "collection_counts": collection_counts,
            "file_count": len(file_entries),
            "total_file_size": total_file_size,
            "created_at": manifest["created_at"],
        }

        return temp_path, summary

    except Exception:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise



def validate_backup_zip(path: str) -> dict:
    """
    Validate archive structure, manifest, database documents,
    file paths, sizes and hashes.
    Does not modify MongoDB or Supabase.
    """
    if not os.path.isfile(path):
        raise ValueError("Backup file does not exist.")

    archive_size = os.path.getsize(path)

    if archive_size > MAX_ARCHIVE_SIZE:
        raise ValueError("Backup archive exceeds the configured size limit.")

    with zipfile.ZipFile(path, "r") as archive:
        infos = archive.infolist()
        names = [info.filename for info in infos]

        # Reject excessive ZIP entries.
        if len(infos) > MAX_FILES + MAX_COLLECTIONS + 1:
            raise ValueError("ZIP contains too many entries.")

        # Reject duplicate ZIP entries.
        if len(names) != len(set(names)):
            raise ValueError("ZIP contains duplicate entries.")

        if "manifest.json" not in names:
            raise ValueError("ZIP manifest is missing.")

        # Check uncompressed sizes before extracting any entry.
        database_preflight_size = 0
        files_preflight_size = 0

        for info in infos:
            _validate_zip_info(info)
            if info.is_dir():
                raise ValueError("ZIP directory entries are not allowed.")

            entry_name = info.filename

            if entry_name == "manifest.json":
                if info.file_size > 5 * 1024 * 1024:
                    raise ValueError("ZIP manifest exceeds the size limit.")

            elif entry_name.startswith("database/"):
                collection_file = entry_name[len("database/"):]
                if "/" in collection_file or not collection_file.endswith(".json"):
                    raise ValueError("ZIP contains an invalid database entry path.")
                _validate_collection_name(collection_file[:-5])
                if info.file_size > MAX_COLLECTION_SIZE:
                    raise ValueError("ZIP collection exceeds the size limit.")

                database_preflight_size += info.file_size

            elif entry_name.startswith("files/"):
                _safe_storage_path(entry_name[len("files/"):])
                files_preflight_size += info.file_size

            else:
                raise ValueError("ZIP contains an invalid entry path.")

        if database_preflight_size > MAX_TOTAL_DATABASE_SIZE:
            raise ValueError("ZIP database data exceeds the size limit.")

        if files_preflight_size > MAX_TOTAL_FILE_SIZE:
            raise ValueError("ZIP storage files exceed the size limit.")

        # Verify ZIP CRC only after checking uncompressed size limits.
        bad_entry = archive.testzip()

        if bad_entry:
            raise ValueError(f"ZIP CRC verification failed: {bad_entry}")

        # Read and validate manifest.
        try:
            manifest = json.loads(
                archive.read("manifest.json").decode("utf-8")
            )
        except Exception as exc:
            raise ValueError("Invalid manifest JSON.") from exc

        if not isinstance(manifest, dict):
            raise ValueError("Invalid backup manifest.")
        if manifest.get("app") != APP_NAME or type(manifest.get("format_version")) is not int or manifest.get("format_version") != BACKUP_FORMAT_VERSION:
            raise ValueError("Unsupported backup format.")
        created_at = manifest.get("created_at")
        if not isinstance(created_at, str) or not created_at.strip():
            raise ValueError("Backup creation timestamp is missing or invalid.")

        database_info = manifest.get("database")
        storage_info = manifest.get("storage")

        if not isinstance(database_info, dict):
            raise ValueError("Invalid database manifest.")

        if not isinstance(storage_info, dict):
            raise ValueError("Invalid storage manifest.")

        collections = database_info.get("collections")
        files = storage_info.get("files")

        if not isinstance(collections, dict) or not isinstance(files, list):
            raise ValueError("Invalid manifest contents.")
        if "users" not in collections:
            raise ValueError("Backup is missing the required users collection; restore was refused.")
        if len(collections) > MAX_COLLECTIONS:
            raise ValueError("Backup contains too many database collections.")
        database_name = database_info.get("name")
        if not isinstance(database_name, str) or not database_name.strip():
            raise ValueError("Backup database name is missing or invalid.")
        if getattr(db, "name", None) and database_name != db.name:
            raise ValueError("Backup belongs to a different database.")
        storage_bucket = storage_info.get("bucket")
        if not isinstance(storage_bucket, str) or not storage_bucket.strip():
            raise ValueError("Backup storage bucket is missing or invalid.")
        configured_bucket = getattr(storage, "SUPABASE_UPLOADS_BUCKET", "")
        if configured_bucket and storage_bucket != configured_bucket:
            raise ValueError("Backup belongs to a different uploads bucket.")

        # Build the expected ZIP entry list.
        expected_entries = {"manifest.json"}

        for collection_name, count in collections.items():
            try:
                _validate_collection_name(collection_name)
            except ValueError as exc:
                raise ValueError("Invalid collection entry.") from exc

            if (
                not isinstance(count, int)
                or isinstance(count, bool)
                or count < 0
            ):
                raise ValueError("Invalid collection entry.")

            expected_entries.add(f"database/{collection_name}.json")

        # Validate database JSON files and BSON documents.
        database_total_size = 0

        for collection_name, expected_count in collections.items():
            entry_name = f"database/{collection_name}.json"

            try:
                info = archive.getinfo(entry_name)
            except KeyError as exc:
                raise ValueError(
                    f"Missing collection file: {collection_name}"
                ) from exc

            if info.file_size > MAX_COLLECTION_SIZE:
                raise ValueError(
                    f"Collection file exceeds the size limit: {collection_name}"
                )

            database_total_size += info.file_size

            if database_total_size > MAX_TOTAL_DATABASE_SIZE:
                raise ValueError(
                    "Backup database data exceeds the configured size limit."
                )

            try:
                documents = json_util.loads(archive.read(entry_name))
            except Exception as exc:
                raise ValueError(
                    f"Invalid database JSON: {collection_name}"
                ) from exc

            if not isinstance(documents, list):
                raise ValueError(
                    f"Collection data must be a JSON array: {collection_name}"
                )

            if len(documents) != expected_count:
                raise ValueError(
                    f"Document count mismatch in collection: {collection_name}"
                )

            if not all(isinstance(document, dict) for document in documents):
                raise ValueError(
                    f"Invalid document found in collection: {collection_name}"
                )

        # Validate storage files and their hashes.
        seen_paths = set()
        total_size = 0

        if len(files) > MAX_FILES:
            raise ValueError("Backup exceeds the file-count limit.")

        for entry in files:
            if not isinstance(entry, dict):
                raise ValueError("Invalid file manifest entry.")

            storage_path = _safe_storage_path(entry.get("path"))
            archive_path = f"files/{storage_path}"

            if entry.get("archive_path") != archive_path:
                raise ValueError("Invalid archive file path.")
            content_type = entry.get("content_type")
            metadata = entry.get("metadata", {})
            if not isinstance(content_type, str) or not content_type.strip() or len(content_type) > 255:
                raise ValueError("Invalid storage content type.")
            if not isinstance(metadata, dict):
                raise ValueError("Invalid storage metadata.")

            if storage_path in seen_paths:
                raise ValueError("Duplicate storage path in manifest.")

            seen_paths.add(storage_path)
            expected_entries.add(archive_path)

            size = entry.get("size")
            digest = entry.get("sha256")

            if (
                not isinstance(size, int)
                or isinstance(size, bool)
                or size < 0
            ):
                raise ValueError("Invalid file size.")

            if (
                not isinstance(digest, str)
                or len(digest) != 64
                or any(c not in "0123456789abcdef" for c in digest)
            ):
                raise ValueError("Invalid file SHA-256.")

            try:
                info = archive.getinfo(archive_path)
            except KeyError as exc:
                raise ValueError(
                    f"Missing storage file: {storage_path}"
                ) from exc

            if info.file_size != size:
                raise ValueError("File size does not match the manifest.")

            file_hash = hashlib.sha256()

            with archive.open(archive_path, "r") as backup_file:
                while True:
                    chunk = backup_file.read(1024 * 1024)

                    if not chunk:
                        break

                    file_hash.update(chunk)

            if file_hash.hexdigest() != digest:
                raise ValueError("File SHA-256 verification failed.")

            total_size += size

            if total_size > MAX_TOTAL_FILE_SIZE:
                raise ValueError(
                    "Backup exceeds the total file size limit."
                )

        # Reject missing or unexpected ZIP entries.
        if set(names) != expected_entries:
            raise ValueError("ZIP contains missing or unexpected entries.")

        # Verify storage summary.
        if type(storage_info.get("file_count")) is not int or storage_info.get("file_count") != len(files):
            raise ValueError("Manifest file count mismatch.")

        if type(storage_info.get("total_size")) is not int or storage_info.get("total_size") != total_size:
            raise ValueError("Manifest total size mismatch.")

        return {
            "valid": True,
            "created_at": manifest.get("created_at"),
            "collection_count": len(collections),
            "collection_counts": collections,
            "file_count": len(files),
            "total_file_size": total_size,
            "database_total_size": database_total_size,
            "archive_size": archive_size,
        }
# ---------------------------------------------------------------------
# Full ZIP restore
# ---------------------------------------------------------------------

RESTORE_BATCH_SIZE = 500


async def _get_upload_paths() -> list[str]:
    """Return all current object paths in the uploads bucket."""
    paths = []

    async for path, _item in _walk_uploads():
        paths.append(path)

    return paths


def _read_manifest(archive: zipfile.ZipFile) -> dict:
    try:
        manifest = json.loads(
            archive.read("manifest.json").decode("utf-8")
        )
    except Exception as exc:
        raise ValueError("Invalid backup manifest.") from exc

    if not isinstance(manifest, dict):
        raise ValueError("Invalid backup manifest.")

    return manifest


async def _read_collection_documents(
    archive: zipfile.ZipFile,
    collection_name: str,
) -> list:
    entry_name = f"database/{collection_name}.json"

    try:
        raw = archive.read(entry_name)
        documents = json_util.loads(raw)
    except Exception as exc:
        raise ValueError(
            f"Could not read collection: {collection_name}"
        ) from exc

    if not isinstance(documents, list):
        raise ValueError(
            f"Invalid collection data: {collection_name}"
        )

    if not all(isinstance(doc, dict) for doc in documents):
        raise ValueError(
            f"Invalid document in collection: {collection_name}"
        )

    return documents


async def _replace_collection_documents(
    collection_name: str,
    documents: list,
    current_admin_document: dict,
) -> int:
    """
    Replace one collection while preserving the current administrator.

    Existing indexes are retained because delete_many() is used instead
    of dropping the collection.
    """
    collection = db[collection_name]

    if collection_name == "login_attempts":
        await collection.delete_many({})
        return 0

    if collection_name == "users":
        if not current_admin_document:
            raise RuntimeError(
                "Current administrator could not be preserved."
            )

        current_admin_id = current_admin_document["_id"]
        current_admin_email = (
            str(current_admin_document.get("email", ""))
            .strip()
            .lower()
        )

        filtered_documents = []

        for document in documents:
            document_id = document.get("_id")
            document_email = (
                str(document.get("email", ""))
                .strip()
                .lower()
            )

            if document_id == current_admin_id:
                continue

            if (
                current_admin_email
                and document_email == current_admin_email
            ):
                continue

            filtered_documents.append(document)

        # The authenticated administrator must remain an administrator.
        preserved_admin = dict(current_admin_document)
        preserved_admin["role"] = "admin"
        preserved_admin["active"] = True

        filtered_documents.append(preserved_admin)
        documents = filtered_documents

    await collection.delete_many({})

    restored_count = 0

    for start in range(0, len(documents), RESTORE_BATCH_SIZE):
        batch = documents[start:start + RESTORE_BATCH_SIZE]

        if not batch:
            continue

        # Duplicate IDs or unique-index conflicts cause the restore to fail.
        # The outer rollback handler will attempt to restore the snapshot.
        await collection.insert_many(batch, ordered=True)

        restored_count += len(batch)

    return restored_count


async def _restore_database(
    archive: zipfile.ZipFile,
    manifest: dict,
    current_admin_document: dict,
) -> dict:
    database_info = manifest.get("database") or {}
    collections = database_info.get("collections")

    if not isinstance(collections, dict):
        raise ValueError("Invalid database collection manifest.")

    # Validate every collection name and required safety collection before ANY deletion.
    if "users" not in collections:
        raise ValueError("Backup is missing the required users collection.")
    if len(collections) > MAX_COLLECTIONS:
        raise ValueError("Backup contains too many database collections.")
    for collection_name in collections:
        _validate_collection_name(collection_name)

    backup_collection_names = set(collections.keys())

    existing_collection_names = {
        name
        for name in await db.list_collection_names()
        if not name.startswith("system.")
    }

    restored = {}

    # Empty collections that currently exist but are not in the backup.
    # This makes the restore a full replacement rather than a merge.
    for collection_name in existing_collection_names - backup_collection_names:
        if collection_name == "login_attempts":
            await db[collection_name].delete_many({})
        else:
            await db[collection_name].delete_many({})

    # Always clear stale login attempts, even if the backup does not
    # contain this collection.
    if "login_attempts" not in backup_collection_names:
        await db.login_attempts.delete_many({})

    for collection_name in sorted(backup_collection_names):
        documents = await _read_collection_documents(
            archive,
            collection_name,
        )

        if collection_name == "login_attempts":
            await db.login_attempts.delete_many({})
            restored[collection_name] = 0
            continue

        restored[collection_name] = (
            await _replace_collection_documents(
                collection_name,
                documents,
                current_admin_document,
            )
        )

    return restored


async def _restore_upload_files(
    archive: zipfile.ZipFile,
    manifest: dict,
) -> dict:
    storage_info = manifest.get("storage") or {}
    file_entries = storage_info.get("files")

    if not isinstance(file_entries, list):
        raise ValueError("Invalid storage file manifest.")

    current_paths = set(await _get_upload_paths())
    backup_paths = {
        _safe_storage_path(entry["path"])
        for entry in file_entries
    }

    uploaded_count = 0
    uploaded_bytes = 0

    with tempfile.TemporaryDirectory(
        prefix="2morro-restore-"
    ) as temp_directory:
        temp_root = Path(temp_directory).resolve()

        for entry in file_entries:
            storage_path = _safe_storage_path(entry["path"])
            archive_path = f"files/{storage_path}"

            destination = (temp_root / storage_path).resolve()

            # Prevent path traversal during extraction.
            if (
                destination != temp_root
                and temp_root not in destination.parents
            ):
                raise ValueError("Unsafe restore destination path.")

            destination.parent.mkdir(
                parents=True,
                exist_ok=True,
            )

            digest = hashlib.sha256()
            written_size = 0

            with archive.open(archive_path, "r") as source:
                with open(destination, "wb") as output:
                    while True:
                        chunk = source.read(1024 * 1024)

                        if not chunk:
                            break

                        written_size += len(chunk)
                        digest.update(chunk)
                        output.write(chunk)

            if written_size != entry["size"]:
                raise ValueError(
                    f"Restored file size mismatch: {storage_path}"
                )

            if digest.hexdigest() != entry["sha256"]:
                raise ValueError(
                    f"Restored file hash mismatch: {storage_path}"
                )

            content_type = (
                entry.get("content_type")
                or "application/octet-stream"
            )

            await asyncio.to_thread(
                storage.put_object_file,
                storage_path,
                str(destination),
                content_type,
            )

            uploaded_count += 1
            uploaded_bytes += written_size

    # Remove old objects that are not part of the restored backup.
    paths_to_delete = sorted(current_paths - backup_paths)

    if paths_to_delete:
        await asyncio.to_thread(
            storage.delete_upload_objects,
            paths_to_delete,
        )

    return {
        "file_count": uploaded_count,
        "total_file_size": uploaded_bytes,
        "deleted_old_files": len(paths_to_delete),
    }


async def _restore_full_backup_without_rollback(
    path: str,
    current_admin_document: dict,
) -> dict:
    """
    Restore a previously validated ZIP without creating another snapshot.

    This internal function is also used by the rollback procedure.
    """
    validation = validate_backup_zip(path)

    with zipfile.ZipFile(path, "r") as archive:
        manifest = _read_manifest(archive)

        restored_collections = await _restore_database(
            archive,
            manifest,
            current_admin_document,
        )

        restored_files = await _restore_upload_files(
            archive,
            manifest,
        )

    return {
        "validation": validation,
        "restored_collections": restored_collections,
        "restored_files": restored_files,
    }


async def _restore_full_backup_locked(
    path: str,
    current_admin: dict,
) -> dict:
    """
    Restore a complete ZIP backup.

    A temporary snapshot is created before changing data. If restoration
    fails, the snapshot is used for a best-effort rollback.

    This is not an atomic transaction across MongoDB and Supabase Storage.
    """
    if not isinstance(current_admin, dict):
        raise ValueError("Invalid administrator context.")

    admin_id = current_admin.get("id")

    if not ObjectId.is_valid(admin_id or ""):
        raise ValueError("Invalid administrator ID.")

    # Re-fetch the original MongoDB document. The security dependency
    # intentionally removes password_hash from its returned user object.
    current_admin_document = await db.users.find_one({
        "_id": ObjectId(admin_id),
        "role": "admin",
        "active": {"$ne": False},
    })

    if not current_admin_document:
        raise RuntimeError(
            "The current administrator no longer exists or is inactive."
        )

    # Validate the incoming backup before creating a snapshot or modifying
    # any database or storage content.
    validate_backup_zip(path)

    # Snapshot creation must finish before the first destructive operation.
    # If it fails, abort without attempting a fictitious rollback.
    snapshot_path, snapshot_summary = await create_full_backup()

    try:
        result = await _restore_full_backup_without_rollback(
            path,
            current_admin_document,
        )

        return {
            "success": True,
            "created_at": result["validation"]["created_at"],
            "restored_collections": result["restored_collections"],
            "restored_files": result["restored_files"],
            "snapshot_size": snapshot_summary["archive_size"],
        }

    except Exception as restore_error:
        rollback_error = None

        try:
            await _restore_full_backup_without_rollback(
                snapshot_path,
                current_admin_document,
            )
        except Exception as exc:
            rollback_error = exc

        if rollback_error:
            raise RuntimeError(
                "Restore failed and rollback also failed. "
                f"Restore error: {restore_error}. "
                f"Rollback error: {rollback_error}."
            ) from restore_error

        raise RuntimeError(
            "Restore failed. A rollback from the temporary snapshot was completed. "
            "This is best-effort recovery, not an atomic cross-service transaction."
        ) from restore_error

    finally:
        if snapshot_path and os.path.isfile(snapshot_path):
            try:
                os.remove(snapshot_path)
            except OSError:
                pass


# Prevent concurrent full restores within this application process.
# Multi-worker deployments should additionally use a distributed lock.
_RESTORE_LOCK = asyncio.Lock()


async def restore_full_backup(path: str, current_admin: dict) -> dict:
    async with _RESTORE_LOCK:
        return await _restore_full_backup_locked(path, current_admin)

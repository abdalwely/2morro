import os
from urllib.parse import quote

import requests


APP_NAME = "2morro-solutions"

SUPABASE_URL = (os.environ.get("SUPABASE_URL") or "").strip().rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = (
    os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or ""
).strip()

SUPABASE_UPLOADS_BUCKET = (
    os.environ.get("SUPABASE_UPLOADS_BUCKET") or ""
).strip()

SUPABASE_BACKUPS_BUCKET = (
    os.environ.get("SUPABASE_BACKUPS_BUCKET") or ""
).strip()

DELETE_BATCH_SIZE = 100


def _validate_common():
    if not SUPABASE_URL:
        raise RuntimeError("SUPABASE_URL is not configured.")

    if not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is not configured.")


def init_storage(force: bool = False) -> str:
    _validate_common()

    if not SUPABASE_UPLOADS_BUCKET:
        raise RuntimeError("SUPABASE_UPLOADS_BUCKET is not configured.")

    return SUPABASE_UPLOADS_BUCKET


def init_backup_storage() -> str:
    _validate_common()

    if not SUPABASE_BACKUPS_BUCKET:
        raise RuntimeError("SUPABASE_BACKUPS_BUCKET is not configured.")

    return SUPABASE_BACKUPS_BUCKET


def _headers(content_type: str = None) -> dict:
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    }

    if content_type:
        headers["Content-Type"] = content_type

    return headers


def _safe_path(path: str) -> str:
    if not isinstance(path, str):
        raise ValueError("Storage path must be a string.")

    path = path.strip().replace("\\", "/")

    if (
        not path
        or path.startswith("/")
        or "\x00" in path
        or ":" in path.split("/")[0]
        or any(part in ("", ".", "..") for part in path.split("/"))
    ):
        raise ValueError("Invalid storage path.")

    return path


def _object_url(path: str, bucket: str = None) -> str:
    bucket = bucket or init_storage()
    safe_path = _safe_path(path)

    return (
        f"{SUPABASE_URL}/storage/v1/object/"
        f"{quote(bucket, safe='')}/{quote(safe_path, safe='/')}"
    )


# ---------------------------------------------------------------------
# Existing uploads operations
# ---------------------------------------------------------------------

def put_object(path: str, data: bytes, content_type: str) -> dict:
    safe_path = _safe_path(path)
    url = _object_url(safe_path)
    headers = _headers(content_type)
    headers["x-upsert"] = "true"

    response = requests.post(
        url,
        headers=headers,
        data=data,
        timeout=120,
    )
    response.raise_for_status()

    return {"path": safe_path, "size": len(data)}


def put_object_file(
    path: str,
    file_path: str,
    content_type: str = "application/octet-stream",
) -> dict:
    """Upload a local file to the uploads bucket using streaming I/O."""
    safe_path = _safe_path(path)

    if not os.path.isfile(file_path):
        raise FileNotFoundError("Upload source file does not exist.")

    file_size = os.path.getsize(file_path)
    headers = _headers(content_type)
    headers["x-upsert"] = "true"

    with open(file_path, "rb") as source:
        response = requests.post(
            _object_url(safe_path),
            headers=headers,
            data=source,
            timeout=(30, 300),
        )
        response.raise_for_status()

    return {"path": safe_path, "size": file_size}


def get_object(path: str):
    safe_path = _safe_path(path)

    response = requests.get(
        _object_url(safe_path),
        headers=_headers(),
        timeout=120,
    )
    response.raise_for_status()

    return (
        response.content,
        response.headers.get(
            "Content-Type",
            "application/octet-stream",
        ),
    )


def download_upload_to_file(
    path: str,
    destination: str,
    max_size: int = None,
) -> dict:
    """Download an uploads object to disk in chunks."""
    safe_path = _safe_path(path)
    total_size = 0

    with requests.get(
        _object_url(safe_path),
        headers=_headers(),
        stream=True,
        timeout=(30, 300),
    ) as response:
        response.raise_for_status()

        content_type = response.headers.get(
            "Content-Type",
            "application/octet-stream",
        )

        content_length = response.headers.get("Content-Length")

        if content_length and max_size is not None:
            if int(content_length) > max_size:
                raise ValueError("Storage object exceeds the allowed size.")

        with open(destination, "wb") as output:
            for chunk in response.iter_content(
                chunk_size=1024 * 1024
            ):
                if not chunk:
                    continue

                total_size += len(chunk)

                if max_size is not None and total_size > max_size:
                    raise ValueError(
                        "Storage object exceeds the allowed size."
                    )

                output.write(chunk)

    return {
        "path": safe_path,
        "size": total_size,
        "content_type": content_type,
    }


def delete_upload_objects(paths: list[str]) -> None:
    """Delete uploads objects in bounded batches."""
    bucket = init_storage()

    if not isinstance(paths, list):
        raise ValueError("Paths must be a list.")

    safe_paths = list(dict.fromkeys(_safe_path(path) for path in paths))

    for start in range(0, len(safe_paths), DELETE_BATCH_SIZE):
        batch = safe_paths[start:start + DELETE_BATCH_SIZE]

        response = requests.delete(
            f"{SUPABASE_URL}/storage/v1/object/{quote(bucket, safe='')}",
            headers=_headers("application/json"),
            json={"prefixes": batch},
            timeout=120,
        )
        response.raise_for_status()


# ---------------------------------------------------------------------
# Private backups bucket
# ---------------------------------------------------------------------

def put_backup_object(path: str, data: bytes) -> dict:
    bucket = init_backup_storage()
    safe_path = _safe_path(path)
    url = _object_url(safe_path, bucket=bucket)
    headers = _headers("application/zip")
    headers["x-upsert"] = "false"

    response = requests.post(
        url,
        headers=headers,
        data=data,
        timeout=300,
    )
    response.raise_for_status()

    return {"path": safe_path, "size": len(data)}


def put_backup_file(path: str, file_path: str) -> dict:
    """Upload a ZIP backup directly from disk."""
    bucket = init_backup_storage()
    safe_path = _safe_path(path)

    if not os.path.isfile(file_path):
        raise FileNotFoundError("Backup file does not exist.")

    file_size = os.path.getsize(file_path)
    url = _object_url(safe_path, bucket=bucket)
    headers = _headers("application/zip")
    headers["x-upsert"] = "false"

    with open(file_path, "rb") as backup_file:
        response = requests.post(
            url,
            headers=headers,
            data=backup_file,
            timeout=(30, 600),
        )
        response.raise_for_status()

    return {"path": safe_path, "size": file_size}


def get_backup_object(path: str):
    bucket = init_backup_storage()
    safe_path = _safe_path(path)

    response = requests.get(
        _object_url(safe_path, bucket=bucket),
        headers=_headers(),
        timeout=300,
    )
    response.raise_for_status()

    return (
        response.content,
        response.headers.get("Content-Type", "application/zip"),
    )


def download_backup_to_file(
    path: str,
    destination: str,
    max_size: int = None,
) -> dict:
    """Download a ZIP backup to disk in chunks."""
    bucket = init_backup_storage()
    safe_path = _safe_path(path)
    url = _object_url(safe_path, bucket=bucket)
    total_size = 0

    with requests.get(
        url,
        headers=_headers(),
        stream=True,
        timeout=(30, 600),
    ) as response:
        response.raise_for_status()

        content_type = response.headers.get(
            "Content-Type",
            "application/zip",
        )

        content_length = response.headers.get("Content-Length")

        if content_length and max_size is not None:
            if int(content_length) > max_size:
                raise ValueError("Backup exceeds the allowed size.")

        with open(destination, "wb") as output_file:
            for chunk in response.iter_content(
                chunk_size=1024 * 1024
            ):
                if not chunk:
                    continue

                total_size += len(chunk)

                if max_size is not None and total_size > max_size:
                    raise ValueError("Backup exceeds the allowed size.")

                output_file.write(chunk)

    return {
        "path": safe_path,
        "size": total_size,
        "content_type": content_type,
    }


def list_backup_objects(prefix="", limit=100, offset=0) -> list:
    bucket = init_backup_storage()

    if limit < 1 or limit > 1000:
        raise ValueError("Invalid backup list limit.")

    if offset < 0:
        raise ValueError("Invalid backup list offset.")

    response = requests.post(
        f"{SUPABASE_URL}/storage/v1/object/list/{quote(bucket, safe='')}",
        headers=_headers("application/json"),
        json={
            "prefix": prefix,
            "limit": limit,
            "offset": offset,
            "sortBy": {
                "column": "created_at",
                "order": "desc",
            },
        },
        timeout=60,
    )
    response.raise_for_status()

    result = response.json()

    if not isinstance(result, list):
        raise RuntimeError("Unexpected Supabase Storage list response.")

    return result


def delete_backup_object(path: str) -> None:
    bucket = init_backup_storage()
    safe_path = _safe_path(path)

    response = requests.delete(
        f"{SUPABASE_URL}/storage/v1/object/{quote(bucket, safe='')}",
        headers=_headers("application/json"),
        json={"prefixes": [safe_path]},
        timeout=60,
    )
    response.raise_for_status()


def list_upload_objects(prefix="", limit=1000, offset=0) -> list:
    bucket = init_storage()

    if limit < 1 or limit > 1000:
        raise ValueError("Invalid uploads list limit.")

    if offset < 0:
        raise ValueError("Invalid uploads list offset.")

    safe_prefix = prefix.strip().strip("/")

    response = requests.post(
        f"{SUPABASE_URL}/storage/v1/object/list/{quote(bucket, safe='')}",
        headers=_headers("application/json"),
        json={
            "prefix": safe_prefix,
            "limit": limit,
            "offset": offset,
            "sortBy": {
                "column": "name",
                "order": "asc",
            },
        },
        timeout=60,
    )
    response.raise_for_status()

    result = response.json()

    if not isinstance(result, list):
        raise RuntimeError("Unexpected Supabase Storage list response.")

    return result

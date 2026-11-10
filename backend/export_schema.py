
import json
import os
from datetime import datetime
from collections.abc import Mapping

from bson import (
    ObjectId,
    Decimal128,
    Binary,
    Timestamp,
    Regex,
    DBRef,
    MinKey,
    MaxKey,
)
from pymongo import MongoClient


# Database configuration
MONGO_URI = os.getenv(
    "MONGODB_URI",
    "mongodb://localhost:27017"
)

DATABASE_NAME = "twomorro"

OUTPUT_DIR = r"D:\MongoDB-Schema"
OUTPUT_FILE = os.path.join(
    OUTPUT_DIR,
    "twomorro_schema.json"
)


def get_bson_type(value):
    """Return the BSON/Python type without exposing its value."""

    if value is None:
        return "Null"
    if isinstance(value, bool):
        return "Boolean"
    if isinstance(value, str):
        return "String"
    if isinstance(value, int):
        return "Number (Integer)"
    if isinstance(value, float):
        return "Number (Double)"
    if isinstance(value, datetime):
        return "Date"
    if isinstance(value, ObjectId):
        return "ObjectId"
    if isinstance(value, Decimal128):
        return "Decimal128"
    if isinstance(value, Binary):
        return "Binary"
    if isinstance(value, Timestamp):
        return "Timestamp"
    if isinstance(value, Regex):
        return "Regex"
    if isinstance(value, DBRef):
        return "DBRef"
    if isinstance(value, MinKey):
        return "MinKey"
    if isinstance(value, MaxKey):
        return "MaxKey"
    if isinstance(value, Mapping):
        return "Object"
    if isinstance(value, list):
        return "Array"
    if isinstance(value, bytes):
        return "Binary"

    return type(value).__name__


def analyze_document(document, schema, seen_fields):
    """Collect field names and types only."""

    def inspect(value, path):
        if not path:
            return

        if path not in schema:
            schema[path] = {
                "types": set(),
                "documents_count": 0,
                "occurrences": 0,
            }

        field = schema[path]
        field["types"].add(get_bson_type(value))
        field["occurrences"] += 1

        seen_fields.add(path)

        if isinstance(value, Mapping):
            for key, nested_value in value.items():
                inspect(nested_value, f"{path}.{key}")

        elif isinstance(value, list):
            for item in value:
                inspect(item, f"{path}[]")

    for key, value in document.items():
        inspect(value, key)


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("Connecting to MongoDB...")

    client = MongoClient(
        MONGO_URI,
        serverSelectionTimeoutMS=5000
    )

    client.admin.command("ping")

    db = client[DATABASE_NAME]

    print(f"Connected to database: {DATABASE_NAME}")

    collections_info = list(db.list_collections())

    result = {
        "database": DATABASE_NAME,
        "extraction_type": "Schema Only",
        "contains_document_values": False,
        "collections_count": len(collections_info),
        "collections": {},
    }

    for info in collections_info:
        name = info["name"]
        collection_type = info.get("type", "collection")

        print(f"Analyzing: {name}")

        collection = db[name]
        schema = {}
        documents_count = 0

        for document in collection.find({}).batch_size(500):
            documents_count += 1
            seen_fields = set()

            analyze_document(
                document,
                schema,
                seen_fields
            )

            for field_name in seen_fields:
                schema[field_name]["documents_count"] += 1

        fields = {}

        for field_name, details in sorted(schema.items()):
            fields[field_name] = {
                "types": sorted(details["types"]),
                "documents_count": details["documents_count"],
                "occurrences": details["occurrences"],
            }

        result["collections"][name] = {
            "type": collection_type,
            "documents_count": documents_count,
            "fields_count": len(fields),
            "fields": fields,
        }

        print(
            f"Completed: {name} "
            f"({documents_count} documents, "
            f"{len(fields)} fields)"
        )

    with open(
        OUTPUT_FILE,
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            result,
            file,
            ensure_ascii=False,
            indent=4
        )

    client.close()

    print("\nSchema extraction completed!")
    print(f"Output: {OUTPUT_FILE}")
    print("No document values were exported.")


if __name__ == "__main__":
    main()

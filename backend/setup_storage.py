"""Create the configured private document bucket, leaving existing buckets intact."""
import sys

from storage3.exceptions import StorageApiError

from app.core.config import settings
from app.services.storage_service import StorageService


def main():
    try:
        storage = StorageService.get_client().storage
        try:
            bucket = storage.get_bucket(settings.SUPABASE_BUCKET)
        except StorageApiError as exc:
            if str(exc.status) != "404":
                raise
            storage.create_bucket(settings.SUPABASE_BUCKET, options={
                "public": False,
                "file_size_limit": 10 * 1024 * 1024,
                "allowed_mime_types": [
                    "application/pdf", "image/jpeg", "image/png",
                    "image/tiff", "image/bmp",
                ],
            })
            bucket = storage.get_bucket(settings.SUPABASE_BUCKET)
        public = bucket.get("public", False) if isinstance(bucket, dict) else bucket.public
        if public:
            print("Existing bucket is public. Review its contents and make it private before deployment.")
            return 1
        print("Document storage: private bucket ready.")
        return 0
    except Exception as exc:
        print(f"Storage setup failed: {type(exc).__name__}; status: {getattr(exc, 'status', 'unknown')}")
        return 1


if __name__ == "__main__":
    sys.exit(main())

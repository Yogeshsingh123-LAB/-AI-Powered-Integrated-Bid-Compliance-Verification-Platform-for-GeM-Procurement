"""Upload a synthetic PDF, verify retrieval, and delete only that test object."""
import sys
from uuid import uuid4

import httpx
import pymupdf

from app.core.config import settings
from app.services.storage_service import StorageService


def main():
    path = f"deployment-checks/{uuid4().hex}.pdf"
    uploaded = False
    failed = False
    bucket = None
    try:
        bucket = StorageService.get_client().storage.from_(settings.SUPABASE_BUCKET)
        with pymupdf.open() as document:
            document.new_page().insert_text((72, 72), "Synthetic deployment storage check")
            payload = document.tobytes()
        bucket.upload(path, payload, file_options={"content-type": "application/pdf"})
        uploaded = True
        if bucket.download(path) != payload:
            raise RuntimeError("Downloaded bytes differ")
        signed = bucket.create_signed_url(path, 60)
        url = signed.get("signedURL") or signed.get("signed_url")
        response = httpx.get(url, timeout=20)
        if response.status_code != 200 or response.content != payload:
            raise RuntimeError("Signed URL retrieval failed")
        print("Storage PDF upload, download, and signed URL: OK")
    except Exception as exc:
        print(f"Storage round-trip failed: {type(exc).__name__}")
        failed = True
    finally:
        if uploaded:
            try:
                bucket.remove([path])
                print("Synthetic test PDF cleanup: OK")
            except Exception:
                print(f"Cleanup failed; remove only this test object: {path}")
                failed = True
    return int(failed)


if __name__ == "__main__":
    sys.exit(main())

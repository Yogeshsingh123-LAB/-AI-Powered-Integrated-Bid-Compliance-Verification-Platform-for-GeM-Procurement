"""Upload a synthetic PDF, verify retrieval, and delete only that test object."""
import sys
from uuid import uuid4

import pymupdf

from app.services.storage_service import StorageService


def main():
    path = f"deployment-checks/{uuid4().hex}.pdf"
    uploaded = False
    failed = False
    try:
        with pymupdf.open() as document:
            document.new_page().insert_text((72, 72), "Synthetic deployment storage check")
            payload = document.tobytes()
        StorageService.upload_file(payload, path, "application/pdf")
        uploaded = True
        if StorageService.download_file(path) != payload:
            raise RuntimeError("Downloaded bytes differ")
        signed_url = StorageService.get_signed_url(path, 60)
        if not signed_url:
            raise RuntimeError("Signed URL generation returned empty result")
        print(f"Storage PDF upload, download, and URL generation: OK ({signed_url[:30]}...)")
    except Exception as exc:
        print(f"Storage round-trip failed: {type(exc).__name__}: {exc}")
        failed = True
    finally:
        if uploaded:
            try:
                StorageService.delete_file(path)
                print("Synthetic test PDF cleanup: OK")
            except Exception as e:
                print(f"Cleanup failed; remove only this test object: {path} ({e})")
                failed = True
    return int(failed)


if __name__ == "__main__":
    sys.exit(main())


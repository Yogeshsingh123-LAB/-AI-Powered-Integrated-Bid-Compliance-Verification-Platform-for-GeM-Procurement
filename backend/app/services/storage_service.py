import os
import logging
from typing import Dict, Any, Optional
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

class StorageService:
    _client: Optional[Client] = None

    @classmethod
    def get_client(cls) -> Client:
        if cls._client is None:
            # Check if settings are placeholder or missing
            url = settings.SUPABASE_URL
            key = settings.SUPABASE_SECRET_KEY
            if not url or "your-project-id" in url or not key or "sb_secret_" not in key:
                logger.warning("Supabase URL or Key is not configured correctly. Using mock storage client.")
                return None
            cls._client = create_client(url, key)
        return cls._client

    @classmethod
    def upload_file(cls, file_data: bytes, storage_path: str, mime_type: str) -> str:
        client = cls.get_client()
        bucket = settings.SUPABASE_BUCKET
        
        if client is None:
            logger.warning(f"MOCK UPLOAD: File simulated upload to path: {storage_path}")
            return storage_path

        try:
            # Upload using storage client
            # supabase-py upload can take bytes directly
            client.storage.from_(bucket).upload(
                path=storage_path,
                file=file_data,
                file_options={"content-type": mime_type, "x-upsert": "true"}
            )
            logger.info(f"Successfully uploaded file to Supabase: {storage_path}")
            return storage_path
        except Exception as e:
            logger.exception(f"Failed to upload file to Supabase: {e}")
            raise

    @classmethod
    def get_signed_url(cls, storage_path: str, expires_in: int = 300) -> str:
        client = cls.get_client()
        bucket = settings.SUPABASE_BUCKET

        if client is None:
            mock_url = f"https://mock-supabase.co/storage/v1/object/sign/{bucket}/{storage_path}?token=mock_signed_token"
            logger.warning(f"MOCK SIGNED URL: Generated mock URL for: {storage_path}")
            return mock_url

        try:
            response = client.storage.from_(bucket).create_signed_url(
                path=storage_path,
                expires_in=expires_in
            )
            # Response is typically a dictionary containing {'signedURL': '...'} or {'signed_url': '...'}
            if isinstance(response, dict):
                signed_url = response.get("signedURL") or response.get("signed_url")
                if signed_url:
                    return signed_url
            elif hasattr(response, "get"):
                signed_url = response.get("signedURL") or response.get("signed_url")
                if signed_url:
                    return signed_url
            
            # If it's a model/object representation
            if hasattr(response, "signed_url"):
                return response.signed_url
            
            return str(response)
        except Exception as e:
            logger.exception(f"Failed to generate signed URL for path {storage_path}: {e}")
            raise

    @classmethod
    def download_file(cls, storage_path: str) -> bytes:
        client = cls.get_client()
        bucket = settings.SUPABASE_BUCKET

        if client is None:
            logger.warning(f"MOCK DOWNLOAD: Downloading mock file for: {storage_path}")
            # Try to read local test files as fallbacks for development/tests
            for filename in ["digital_test.pdf", "scanned_test.pdf"]:
                if os.path.exists(filename):
                    try:
                        with open(filename, "rb") as f:
                            return f.read()
                    except Exception:
                        pass
            return b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n"

        try:
            return client.storage.from_(bucket).download(storage_path)
        except Exception as e:
            logger.exception(f"Failed to download file from Supabase: {e}")
            raise

    @classmethod
    def delete_file(cls, storage_path: str) -> bool:
        client = cls.get_client()
        bucket = settings.SUPABASE_BUCKET

        if client is None:
            logger.warning(f"MOCK DELETE: Deleted simulated file: {storage_path}")
            return True

        try:
            # remove expects a list of paths
            client.storage.from_(bucket).remove([storage_path])
            logger.info(f"Successfully deleted file from Supabase: {storage_path}")
            return True
        except Exception as e:
            logger.exception(f"Failed to delete file from Supabase: {e}")
            raise


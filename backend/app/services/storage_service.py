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
            url = settings.SUPABASE_URL
            key = settings.SUPABASE_SECRET_KEY or settings.SUPABASE_KEY
            
            if not url or "your-project-id" in url or not key:
                logger.error("Supabase URL or Key is not configured correctly in environment variables.")
                raise RuntimeError(
                    "Supabase Storage credentials missing or unconfigured. "
                    "Please set valid SUPABASE_URL and SUPABASE_SECRET_KEY in backend/.env"
                )
            
            try:
                cls._client = create_client(url, key)
            except Exception as err:
                logger.error(f"Failed to initialize Supabase Storage client: {err}")
                raise RuntimeError(f"Could not connect to Supabase Storage client: {err}") from err
                
        return cls._client

    @classmethod
    def upload_file(cls, file_data: bytes, storage_path: str, mime_type: str) -> str:
        client = cls.get_client()
        bucket = settings.SUPABASE_BUCKET or "bid-documents"

        try:
            client.storage.from_(bucket).upload(
                path=storage_path,
                file=file_data,
                file_options={"content-type": mime_type, "x-upsert": "true"}
            )
            logger.info(f"Successfully uploaded file to Supabase Cloud Storage: {storage_path}")
            return storage_path
        except Exception as e:
            logger.exception(f"Failed to upload file to Supabase Storage: {e}")
            raise RuntimeError(f"Cloud Storage Upload Error: {e}") from e

    @classmethod
    def get_signed_url(cls, storage_path: str, expires_in: int = 300) -> str:
        client = cls.get_client()
        bucket = settings.SUPABASE_BUCKET or "bid-documents"

        try:
            response = client.storage.from_(bucket).create_signed_url(
                path=storage_path,
                expires_in=expires_in
            )
            if isinstance(response, dict):
                signed_url = response.get("signedURL") or response.get("signed_url")
                if signed_url:
                    return signed_url
            elif hasattr(response, "get"):
                signed_url = response.get("signedURL") or response.get("signed_url")
                if signed_url:
                    return signed_url
            
            if hasattr(response, "signed_url"):
                return response.signed_url
            
            return str(response)
        except Exception as e:
            logger.exception(f"Failed to generate signed URL for path {storage_path}: {e}")
            raise RuntimeError(f"Cloud Storage Signed URL Error: {e}") from e

    @classmethod
    def download_file(cls, storage_path: str) -> bytes:
        client = cls.get_client()
        bucket = settings.SUPABASE_BUCKET or "bid-documents"

        try:
            return client.storage.from_(bucket).download(storage_path)
        except Exception as e:
            logger.exception(f"Failed to download file from Supabase Storage: {e}")
            raise RuntimeError(f"Cloud Storage Download Error: {e}") from e

    @classmethod
    def delete_file(cls, storage_path: str) -> bool:
        client = cls.get_client()
        bucket = settings.SUPABASE_BUCKET or "bid-documents"

        try:
            client.storage.from_(bucket).remove([storage_path])
            logger.info(f"Successfully deleted file from Supabase Storage: {storage_path}")
            return True
        except Exception as e:
            logger.exception(f"Failed to delete file from Supabase Storage: {e}")
            raise RuntimeError(f"Cloud Storage Delete Error: {e}") from e

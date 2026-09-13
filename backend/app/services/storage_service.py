import os
import logging
from typing import Dict, Any, Optional
from supabase import create_client, Client
from app.core.config import settings

logger = logging.getLogger(__name__)

class StorageService:
    _client: Optional[Client] = None

    @classmethod
    def is_supabase_configured(cls) -> bool:
        url = getattr(settings, "SUPABASE_URL", "")
        key = getattr(settings, "SUPABASE_SECRET_KEY", "") or getattr(settings, "SUPABASE_KEY", "")
        if not url or "your-project-id" in url or not key:
            return False
        return True

    @classmethod
    def get_client(cls) -> Client:
        if cls._client is None:
            if not cls.is_supabase_configured():
                raise RuntimeError(
                    "Supabase Storage credentials missing or unconfigured."
                )
            url = settings.SUPABASE_URL
            key = getattr(settings, "SUPABASE_SECRET_KEY", "") or getattr(settings, "SUPABASE_KEY", "")
            try:
                cls._client = create_client(url, key)
            except Exception as err:
                logger.error(f"Failed to initialize Supabase Storage client: {err}")
                raise RuntimeError(f"Could not connect to Supabase Storage client: {err}") from err
                
        return cls._client

    @classmethod
    def get_local_path(cls, storage_path: str) -> str:
        upload_dir = getattr(settings, "safe_upload_dir", None) or os.path.join(tempfile.gettempdir(), "bidverify_uploads")
        clean_path = storage_path.lstrip("/\\")
        full_path = os.path.abspath(os.path.join(upload_dir, clean_path))
        return full_path

    @classmethod
    def upload_file(cls, file_data: bytes, storage_path: str, mime_type: str) -> str:
        is_production = settings.ENVIRONMENT.lower() in ("production", "prod", "staging") or bool(
            os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME") or os.environ.get("RENDER") or os.environ.get("RAILWAY_ENVIRONMENT")
        )

        if cls.is_supabase_configured():
            try:
                client = cls.get_client()
                bucket = getattr(settings, "SUPABASE_BUCKET", "bid-documents") or "bid-documents"
                client.storage.from_(bucket).upload(
                    path=storage_path,
                    file=file_data,
                    file_options={"content-type": mime_type, "x-upsert": "true"}
                )
                logger.info(f"Successfully uploaded file to Supabase Cloud Storage: {storage_path}")
                return storage_path
            except Exception as e:
                logger.error(f"Cloud Storage upload failed: {e}")
                if is_production:
                    raise RuntimeError(f"Failed to upload document to production Supabase Storage: {e}") from e

        if is_production:
            raise RuntimeError("Supabase Cloud Storage must be configured in production. Local storage is prohibited.")

        full_path = cls.get_local_path(storage_path)
        try:
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, "wb") as f:
                f.write(file_data)
        except OSError as e:
            logger.error(f"Failed to save file to local temporary storage: {e}")
            raise RuntimeError(f"Local storage write failed: {e}") from e
        logger.info(f"Successfully saved file to Local Storage: {full_path}")
        return storage_path

    @classmethod
    def download_file(cls, storage_path: str) -> bytes:
        if cls.is_supabase_configured():
            try:
                client = cls.get_client()
                bucket = getattr(settings, "SUPABASE_BUCKET", "bid-documents") or "bid-documents"
                return client.storage.from_(bucket).download(storage_path)
            except Exception as e:
                logger.warning(f"Cloud Storage download failed, fallback to local storage: {e}")
        
        full_path = cls.get_local_path(storage_path)
        if not os.path.exists(full_path):
            raise RuntimeError(f"File not found in local storage: {storage_path}")
        with open(full_path, "rb") as f:
            return f.read()

    @classmethod
    def get_signed_url(cls, storage_path: str, expires_in: int = 300) -> str:
        if cls.is_supabase_configured():
            try:
                client = cls.get_client()
                bucket = getattr(settings, "SUPABASE_BUCKET", "bid-documents") or "bid-documents"
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
                logger.warning(f"Cloud Storage signed URL failed, fallback to local URL: {e}")
        
        return f"/api/documents/file?path={storage_path}"

    @classmethod
    def delete_file(cls, storage_path: str) -> bool:
        if cls.is_supabase_configured():
            try:
                client = cls.get_client()
                bucket = getattr(settings, "SUPABASE_BUCKET", "bid-documents") or "bid-documents"
                client.storage.from_(bucket).remove([storage_path])
                logger.info(f"Successfully deleted file from Supabase Storage: {storage_path}")
                return True
            except Exception as e:
                logger.warning(f"Cloud Storage delete failed, fallback to local storage: {e}")
        
        full_path = cls.get_local_path(storage_path)
        if os.path.exists(full_path):
            os.remove(full_path)
            logger.info(f"Successfully deleted file from Local Storage: {full_path}")
        return True


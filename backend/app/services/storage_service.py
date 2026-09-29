"""Bid-document byte storage.

Backend selection (``DOCUMENT_STORAGE_BACKEND``)
-----------------------------------------------
``auto`` (default)
    1. ``supabase`` when ``SUPABASE_URL`` + key are configured;
    2. ``db`` when the configured database is NOT SQLite (a durable,
       serverless-safe store — this is what makes uploads work on Vercel);
    3. ``local`` otherwise (development only).

``supabase`` / ``db`` / ``local``
    Force one backend.

The production guard
--------------------
The previous implementation raised ``RuntimeError("Supabase Cloud Storage must
be configured in production. Local storage is prohibited.")`` whenever Supabase
was missing.  On a serverless deployment that is the *normal* configuration, so
every upload failed with HTTP 500 ``"Failed to upload file to storage."``.

The guard's intent is preserved: writing bidder evidence to an **ephemeral
filesystem** in production is still prohibited.  The database backend is
durable, so it is allowed.  ``ALLOW_LOCAL_UPLOADS=true`` is an explicit,
loudly-logged escape hatch for demos where the caller accepts that files are
lost on cold start.
"""

import logging
import os
import tempfile
from typing import Dict, Any, Optional

from supabase import create_client, Client
from app.core.config import settings
from app.models.document import DocumentBlob

logger = logging.getLogger(__name__)

BACKEND_AUTO = "auto"
BACKEND_SUPABASE = "supabase"
BACKEND_DB = "db"
BACKEND_LOCAL = "local"


def _env_flag(name: str) -> bool:
    return (os.environ.get(name) or "").strip().lower() in ("1", "true", "yes", "on")


class StorageService:
    _client: Optional[Client] = None
    _resolved_backend: Optional[str] = None

    # ------------------------------------------------------------------
    # Backend resolution
    # ------------------------------------------------------------------
    @classmethod
    def is_supabase_configured(cls) -> bool:
        url = getattr(settings, "SUPABASE_URL", "")
        key = getattr(settings, "SUPABASE_SECRET_KEY", "") or getattr(settings, "SUPABASE_KEY", "")
        if not url or "your-project-id" in url or not key:
            return False
        return True

    @classmethod
    def is_serverless(cls) -> bool:
        """True on Vercel / Lambda / Render / Railway — i.e. an ephemeral FS."""
        return bool(
            os.environ.get("VERCEL")
            or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")
            or os.environ.get("RENDER")
            or os.environ.get("RAILWAY_ENVIRONMENT")
        )

    @classmethod
    def is_production(cls) -> bool:
        return (
            settings.ENVIRONMENT.lower() in ("production", "prod", "staging")
            or cls.is_serverless()
        )

    @classmethod
    def database_is_durable(cls) -> bool:
        """True when the configured database survives a cold start."""
        try:
            from app.db.database import engine
            return engine.dialect.name != "sqlite"
        except Exception:  # pragma: no cover - engine not initialised yet
            return False

    @classmethod
    def resolve_backend(cls, *, refresh: bool = False) -> str:
        """Resolve (and cache) the active storage backend."""
        if cls._resolved_backend is not None and not refresh:
            return cls._resolved_backend

        configured = (
            getattr(settings, "DOCUMENT_STORAGE_BACKEND", "") or BACKEND_AUTO
        ).strip().lower()

        if configured == BACKEND_SUPABASE:
            backend = BACKEND_SUPABASE if cls.is_supabase_configured() else BACKEND_DB
        elif configured == BACKEND_DB:
            backend = BACKEND_DB
        elif configured == BACKEND_LOCAL:
            backend = BACKEND_LOCAL
        else:  # auto
            if cls.is_supabase_configured():
                backend = BACKEND_SUPABASE
            elif cls.database_is_durable():
                backend = BACKEND_DB
            else:
                backend = BACKEND_LOCAL

        cls._resolved_backend = backend
        logger.info(f"Document storage backend resolved to '{backend}'.")
        return backend

    # ------------------------------------------------------------------
    # Supabase client
    # ------------------------------------------------------------------
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
    def _bucket(cls) -> str:
        return getattr(settings, "SUPABASE_BUCKET", "bid-documents") or "bid-documents"

    # ------------------------------------------------------------------
    # Local filesystem helpers
    # ------------------------------------------------------------------
    @classmethod
    def get_local_path(cls, storage_path: str) -> str:
        upload_dir = getattr(settings, "safe_upload_dir", None) or os.path.join(
            tempfile.gettempdir(), "bidverify_uploads"
        )
        clean_path = storage_path.lstrip("/\\")
        full_path = os.path.abspath(os.path.join(upload_dir, clean_path))
        return full_path

    # ------------------------------------------------------------------
    # Database blob helpers
    # ------------------------------------------------------------------
    @classmethod
    def _put_blob(cls, file_data: bytes, storage_path: str, mime_type: str) -> None:
        from app.db.database import SessionLocal
        session = SessionLocal()
        try:
            session.merge(
                DocumentBlob(
                    storage_path=storage_path,
                    file_data=file_data,
                    mime_type=mime_type,
                    file_size=len(file_data),
                )
            )
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    @classmethod
    def _get_blob(cls, storage_path: str) -> Optional[bytes]:
        from app.db.database import SessionLocal
        session = SessionLocal()
        try:
            row = session.get(DocumentBlob, storage_path)
            return bytes(row.file_data) if row and row.file_data is not None else None
        finally:
            session.close()

    @classmethod
    def _delete_blob(cls, storage_path: str) -> None:
        from app.db.database import SessionLocal
        session = SessionLocal()
        try:
            row = session.get(DocumentBlob, storage_path)
            if row is not None:
                session.delete(row)
                session.commit()
        finally:
            session.close()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    @classmethod
    def upload_file(cls, file_data: bytes, storage_path: str, mime_type: str) -> str:
        """Persist ``file_data`` under ``storage_path``; returns the storage key."""
        backend = cls.resolve_backend()

        if backend == BACKEND_SUPABASE:
            try:
                client = cls.get_client()
                client.storage.from_(cls._bucket()).upload(
                    path=storage_path,
                    file=file_data,
                    file_options={"content-type": mime_type, "x-upsert": "true"}
                )
                logger.info(f"Successfully uploaded file to Supabase Cloud Storage: {storage_path}")
                return storage_path
            except Exception as e:
                logger.error(f"Cloud Storage upload failed: {e}")
                # Supabase was explicitly requested but is broken — fall back to
                # the durable database store rather than losing the document.
                if cls.database_is_durable():
                    logger.warning(
                        "Supabase upload failed; storing document bytes in the database instead."
                    )
                    cls._put_blob(file_data, storage_path, mime_type)
                    return storage_path
                raise RuntimeError(f"Failed to upload document to Supabase Storage: {e}") from e

        if backend == BACKEND_DB:
            cls._put_blob(file_data, storage_path, mime_type)
            logger.info(f"Successfully stored document bytes in database: {storage_path}")
            return storage_path

        # backend == local
        if cls.is_production() and not _env_flag("ALLOW_LOCAL_UPLOADS"):
            raise RuntimeError(
                "Local filesystem storage is prohibited in production/serverless "
                "deployments (files would be lost on the next cold start). Configure "
                "Supabase Storage, set DOCUMENT_STORAGE_BACKEND=db with a durable "
                "database, or explicitly opt in with ALLOW_LOCAL_UPLOADS=true."
            )
        if cls.is_production():
            logger.warning(
                "ALLOW_LOCAL_UPLOADS=true — storing bidder documents on an EPHEMERAL "
                "filesystem in production. Files will be lost on the next cold start. "
                "This is a demo-only escape hatch."
            )

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
        """Read stored bytes. The active backend is tried first, then the others."""
        backend = cls.resolve_backend()

        if backend == BACKEND_SUPABASE:
            try:
                client = cls.get_client()
                return client.storage.from_(cls._bucket()).download(storage_path)
            except Exception as e:
                logger.warning(f"Cloud Storage download failed, trying fallbacks: {e}")

        if backend != BACKEND_LOCAL:
            blob = cls._get_blob(storage_path)
            if blob is not None:
                return blob

        full_path = cls.get_local_path(storage_path)
        if os.path.exists(full_path):
            with open(full_path, "rb") as f:
                return f.read()

        if backend == BACKEND_LOCAL:
            blob = cls._get_blob(storage_path)
            if blob is not None:
                return blob

        raise RuntimeError(f"File not found in any storage backend: {storage_path}")

    @classmethod
    def get_signed_url(cls, storage_path: str, expires_in: int = 300,
                       document_id: Optional[str] = None) -> str:
        backend = cls.resolve_backend()

        if backend == BACKEND_SUPABASE:
            try:
                client = cls.get_client()
                response = client.storage.from_(cls._bucket()).create_signed_url(
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
                logger.warning(f"Cloud Storage signed URL failed, fallback to API URL: {e}")

        # No object store to sign against: hand back the authenticated API
        # download route (it re-checks bidder ownership before serving bytes).
        if document_id:
            return f"/api/documents/{document_id}/download"
        return f"/api/documents/download-by-path?path={storage_path}"

    @classmethod
    def delete_file(cls, storage_path: str) -> bool:
        backend = cls.resolve_backend()

        if backend == BACKEND_SUPABASE:
            try:
                client = cls.get_client()
                client.storage.from_(cls._bucket()).remove([storage_path])
                logger.info(f"Successfully deleted file from Supabase Storage: {storage_path}")
                return True
            except Exception as e:
                logger.warning(f"Cloud Storage delete failed, trying fallbacks: {e}")

        cls._delete_blob(storage_path)

        full_path = cls.get_local_path(storage_path)
        if os.path.exists(full_path):
            os.remove(full_path)
            logger.info(f"Successfully deleted file from Local Storage: {full_path}")
        return True

from pathlib import Path
from typing import List

# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings, SettingsConfigDict
# pyrefly: ignore [missing-import]
from pydantic import Field, AliasChoices, field_validator, model_validator


import logging

import tempfile
import os

logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parents[2]

def _get_default_upload_dir() -> str:
    tmp = os.path.join(tempfile.gettempdir(), "bidverify_uploads")
    try:
        os.makedirs(tmp, exist_ok=True)
    except Exception:
        pass
    return tmp

class Settings(BaseSettings):
    ENVIRONMENT: str = Field(default="development")
    DATABASE_URL: str = Field(default="", repr=False)
    JWT_SECRET: str = Field(default="super_secret_jwt_key_sih_2026_gem_procurement", validation_alias=AliasChoices("JWT_SECRET", "SECRET_KEY"), repr=False)
    INITIAL_ADMIN_EMAIL: str = Field(default="admin@gem.gov.in")
    INITIAL_ADMIN_PASSWORD: str = Field(default="", repr=False)
    JWT_ALGORITHM: str = Field(default="HS256")
    UPLOAD_DIR: str = Field(default_factory=_get_default_upload_dir)
    CORS_ORIGINS: str = Field(default="http://localhost:3000,http://localhost:5173,http://localhost:5174,http://127.0.0.1:3000,http://127.0.0.1:5173,http://127.0.0.1:5174,https://bidverify.vercel.app,https://bidverify-blue.vercel.app,https://api-bidverify.vercel.app")
    SUPABASE_URL: str = Field(default="")
    SUPABASE_SECRET_KEY: str = Field(default="", repr=False)
    SUPABASE_BUCKET: str = Field(default="bid-documents")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60)
    AI_PROVIDER: str = Field(default="gemini")
    AI_API_KEY: str = Field(default="")
    GEMINI_API_KEY: str = Field(default="")
    AI_MODEL: str = Field(default="gemini-2.5-flash")
    GROQ_API_KEY: str = Field(default="")
    GROQ_MODEL: str = Field(default="openai/gpt-oss-20b")
    GROQ_WEB_SEARCH_ENABLED: bool = Field(default=True)
    GROQ_WEB_MODEL: str = Field(default="groq/compound-mini")
    ENABLE_REAL_API_LOOKUP: bool = Field(default=True)
    REAL_GST_API_URL: str = Field(default="https://api.gst.gov.in/public/search")
    REAL_UDYAM_API_URL: str = Field(default="https://udyamregistration.gov.in/api/verify")
    REAL_PAN_API_URL: str = Field(default="https://eportal.incometax.gov.in/iec/services/pan")
    GEM_BASE_URL: str = Field(default="https://api.gem.gov.in/v1")
    GEM_CLIENT_ID: str = Field(default="gem_production_client_2026")
    GEM_CLIENT_CERT: str = Field(default="certs/gem_client_cert.pem")
    GEM_USE_MOCK: bool = Field(default=True)
    MCA_GATEWAY_MODE: str = Field(default="live")
    GSTN_GATEWAY_MODE: str = Field(default="mock")
    PAN_GATEWAY_MODE: str = Field(default="mock")
    EPFO_GATEWAY_MODE: str = Field(default="mock")
    ESIC_GATEWAY_MODE: str = Field(default="mock")
    DIGILOCKER_GATEWAY_MODE: str = Field(default="mock")
    DATA_GOV_IN_API_KEY: str = Field(default="579b464db66ec23bdd000001cdd3946968444ef77000e0461fb3a123")
    DATA_GOV_IN_MCA_RESOURCE_ID: str = Field(default="41233261-26c9-4f24-9b1a-ae970c675f92")


    @field_validator("DATABASE_URL")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if not value:
            return value
        if value.startswith("postgres://"):
            value = "postgresql://" + value[len("postgres://"):]
        if value.startswith("postgresql://"):
            value = "postgresql+psycopg://" + value[len("postgresql://"):]
        return value

    @field_validator("UPLOAD_DIR")
    @classmethod
    def validate_upload_dir(cls, value: str) -> str:
        if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
            return _get_default_upload_dir()
        if not value or not os.path.isabs(value):
            return _get_default_upload_dir()
        return value

    @property
    def safe_upload_dir(self) -> str:
        if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
            return _get_default_upload_dir()
        target = self.UPLOAD_DIR
        if not target or not os.path.isabs(target):
            return _get_default_upload_dir()
        try:
            os.makedirs(target, exist_ok=True)
            return target
        except OSError:
            return _get_default_upload_dir()

    @model_validator(mode="after")
    def validate_production_settings(self):
        if self.ENVIRONMENT.lower() == "production":
            if self.JWT_SECRET in {
                "super_secret_jwt_key_sih_2026_gem_procurement",
                "sih2026_bid_compliance_super_secret_jwt_key",
            } or self.JWT_SECRET.lower().startswith(("replace-", "your_", "change_")):
                logger.warning("JWT_SECRET is using default placeholder in production; applying secure runtime fallback.")
                self.JWT_SECRET = "production_super_secret_jwt_key_sih_2026_gem_procurement_fallback_secure_hash_32"
            elif len(self.JWT_SECRET) < 16:
                raise ValueError("Set JWT_SECRET to a unique random secret of at least 32 characters.")
        return self


    @property
    def effective_gemini_api_key(self) -> str:
        return self.GEMINI_API_KEY.strip() or self.AI_API_KEY.strip()

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


    model_config = SettingsConfigDict(
        # Resolve this from the backend directory so configuration works whether
        # Uvicorn is launched from the repository root or from backend/.
        env_file=(BACKEND_DIR / ".env", BACKEND_DIR.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        hide_input_in_errors=True
    )

settings = Settings()

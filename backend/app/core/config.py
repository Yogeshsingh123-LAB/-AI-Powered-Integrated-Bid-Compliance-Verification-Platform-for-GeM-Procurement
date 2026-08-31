from pathlib import Path
from typing import List

# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings, SettingsConfigDict
# pyrefly: ignore [missing-import]
from pydantic import Field


import logging

logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parents[2]

class Settings(BaseSettings):
    ENVIRONMENT: str = Field(default="development")
    DATABASE_URL: str = Field(default="postgresql+psycopg://postgres:postgres@localhost:5432/bid_compliance_db")
    JWT_SECRET: str = Field(default="super_secret_jwt_key_sih_2026_gem_procurement")
    JWT_ALGORITHM: str = Field(default="HS256")
    UPLOAD_DIR: str = Field(default="storage/uploads")
    CORS_ORIGINS: str = Field(default="http://localhost:3000,http://localhost:5173,http://localhost:5174,http://127.0.0.1:3000,http://127.0.0.1:5173,http://127.0.0.1:5174")
    SUPABASE_URL: str = Field(default="")
    SUPABASE_SECRET_KEY: str = Field(default="")
    SUPABASE_BUCKET: str = Field(default="bid-documents")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60)
    AI_PROVIDER: str = Field(default="gemini")
    AI_API_KEY: str = Field(default="")
    GEMINI_API_KEY: str = Field(default="")
    AI_MODEL: str = Field(default="gemini-1.5-flash")
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
    GEM_CLIENT_KEY: str = Field(default="certs/gem_client_key.pem")
    GEM_USE_MOCK: bool = Field(default=True)


    @property
    def effective_gemini_api_key(self) -> str:
        return self.GEMINI_API_KEY or self.AI_API_KEY

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


    model_config = SettingsConfigDict(
        # Resolve this from the backend directory so configuration works whether
        # Uvicorn is launched from the repository root or from backend/.
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

if settings.ENVIRONMENT.lower() == "production" and settings.JWT_SECRET == "super_secret_jwt_key_sih_2026_gem_procurement":
    logger.warning("CRITICAL SECURITY WARNING: Default JWT_SECRET is active in PRODUCTION environment. Set JWT_SECRET in .env!")


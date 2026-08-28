from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


BACKEND_DIR = Path(__file__).resolve().parents[2]

class Settings(BaseSettings):
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
    AI_MODEL: str = Field(default="gemini-1.5-flash")
    GROQ_API_KEY: str = Field(default="")
    GROQ_MODEL: str = Field(default="openai/gpt-oss-20b")
    GROQ_WEB_SEARCH_ENABLED: bool = Field(default=True)
    GROQ_WEB_MODEL: str = Field(default="groq/compound-mini")


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

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    DATABASE_URL: str = Field(default="postgresql+psycopg://postgres:postgres@localhost:5432/bid_compliance_db")
    JWT_SECRET: str = Field(default="super_secret_jwt_key_sih_2026_gem_procurement")
    JWT_ALGORITHM: str = Field(default="HS256")
    UPLOAD_DIR: str = Field(default="storage/uploads")
    CORS_ORIGINS: str = Field(default="http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173")
    SUPABASE_URL: str = Field(default="")
    SUPABASE_SECRET_KEY: str = Field(default="")
    SUPABASE_BUCKET: str = Field(default="bid-documents")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60)
    AI_PROVIDER: str = Field(default="gemini")
    AI_API_KEY: str = Field(default="")
    AI_MODEL: str = Field(default="gemini-1.5-flash")


    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

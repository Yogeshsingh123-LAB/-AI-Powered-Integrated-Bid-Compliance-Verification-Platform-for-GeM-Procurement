from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    DATABASE_URL: str = Field(default="postgresql://postgres:postgres@localhost:5432/gem_bid_compliance")
    JWT_SECRET: str = Field(default="super_secret_jwt_key_sih_2026_gem_procurement")
    JWT_ALGORITHM: str = Field(default="HS256")
    UPLOAD_DIR: str = Field(default="./uploads")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

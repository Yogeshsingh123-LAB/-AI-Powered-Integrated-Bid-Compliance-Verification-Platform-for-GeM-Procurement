import hashlib
import logging
import os
import secrets
import tempfile
from pathlib import Path
from typing import List

# pyrefly: ignore [missing-import]
from pydantic_settings import BaseSettings, SettingsConfigDict
# pyrefly: ignore [missing-import]
from pydantic import Field, AliasChoices, field_validator, model_validator

logger = logging.getLogger(__name__)

BACKEND_DIR = Path(__file__).resolve().parents[2]


def _is_cloud_runtime() -> bool:
    """Detect serverless / PaaS runtimes where local storage is ephemeral."""
    return bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME") or os.environ.get("RENDER") or os.environ.get("RAILWAY_ENVIRONMENT"))


def _get_default_upload_dir() -> str:
    tmp = os.path.join(tempfile.gettempdir(), "bidverify_uploads")
    try:
        os.makedirs(tmp, exist_ok=True)
    except Exception:
        pass
    return tmp


# Secrets that must never appear in production. Previously-committed values are
# listed so that stale deployments fail closed even if the old .env is reused.
_KNOWN_LEAKED_JWT_SECRETS = {
    "super_secret_jwt_key_sih_2026_gem_procurement",
    "sih2026_bid_compliance_super_secret_jwt_key",
    "production_super_secret_jwt_key_sih_2026_gem_procurement_fallback_secure_hash_32",
}

# SECURITY: blocklist of previously leaked data.gov.in API keys, stored as
# SHA-256 digests so the revoked secrets themselves never appear in source.
_KNOWN_LEAKED_DATA_GOV_KEY_SHA256 = {
    "225190901f2fbd13f2b96e25b2cdfded92e565e9c953bad607b58cdf0b04ccd5",
}


def is_leaked_data_gov_key(key: str) -> bool:
    """True if the configured data.gov.in key matches a known leaked key."""
    key = (key or "").strip()
    if not key:
        return False
    return hashlib.sha256(key.encode("utf-8")).hexdigest() in _KNOWN_LEAKED_DATA_GOV_KEY_SHA256


class Settings(BaseSettings):
    ENVIRONMENT: str = Field(default="development")
    DATABASE_URL: str = Field(default="", repr=False)
    # SECURITY: no default JWT secret. In production the app refuses to start
    # without a unique secret of at least 32 characters. In development a
    # random per-process secret is generated when none is provided so local
    # runs keep working; tokens are then never portable across processes.
    JWT_SECRET: str = Field(default="", validation_alias=AliasChoices("JWT_SECRET", "SECRET_KEY"), repr=False)
    JWT_ISSUER: str = Field(default="bidzee")
    JWT_AUDIENCE: str = Field(default="bidzee-api")
    INITIAL_ADMIN_EMAIL: str = Field(default="")
    # SECURITY: the initial admin password is never hardcoded. In production it
    # must be supplied through the environment when bootstrapping the first
    # admin account, and the account is forced to change it on first login.
    INITIAL_ADMIN_PASSWORD: str = Field(default="", repr=False)
    # When True (development only) the platform seeds clearly-labelled demo
    # accounts for local evaluation. Ignored in production / cloud runtimes.
    SEED_DEMO_ACCOUNTS: bool = Field(default=False)
    ALLOW_SEED_ENDPOINT: bool = Field(default=False)
    JWT_ALGORITHM: str = Field(default="HS256")
    UPLOAD_DIR: str = Field(default_factory=_get_default_upload_dir)
    MAX_UPLOAD_MB: int = Field(default=10)
    MAX_UPLOAD_PAGES: int = Field(default=300)
    MAX_FILENAME_LENGTH: int = Field(default=200)
    CLAMAV_SOCKET: str = Field(default="")  # e.g. "localhost:3310"; empty disables malware scan
    # Durable document processing: on serverless runtimes (Vercel) inline
    # BackgroundTasks are terminated at the function time limit, so uploads are
    # left queued (status UPLOADED) for the durable worker (backend/worker.py)
    # running on a long-lived platform (Render/Railway/Docker). Set true ONLY
    # when the API process itself is long-lived and no worker is deployed.
    INLINE_PROCESSING: bool = Field(default=True)
    WORKER_POLL_SECONDS: int = Field(default=5)
    WORKER_MAX_ATTEMPTS: int = Field(default=3)
    WORKER_STUCK_MINUTES: int = Field(default=20)
    CORS_ORIGINS: str = Field(default="http://localhost:3000,http://localhost:5173,http://localhost:5174,http://127.0.0.1:3000,http://127.0.0.1:5173,http://127.0.0.1:5174")
    # Explicit exact origins only. No wildcard / regex origins are accepted.
    SESSION_COOKIE_NAME: str = Field(default="gem_token")
    SESSION_COOKIE_SECURE: bool = Field(default=True)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60)
    SUPABASE_URL: str = Field(default="")
    SUPABASE_SECRET_KEY: str = Field(default="", repr=False)
    SUPABASE_BUCKET: str = Field(default="bid-documents")
    AI_PROVIDER: str = Field(default="groq")
    AI_API_KEY: str = Field(default="", repr=False)
    GEMINI_API_KEY: str = Field(default="", repr=False)
    AI_MODEL: str = Field(default="gemini-2.5-flash")
    # SECURITY: API keys must come from the environment / secret store. The
    # previously committed Groq and data.gov.in keys have been revoked and must
    # be rotated; no defaults exist in code.
    GROQ_API_KEY: str = Field(default="", repr=False)
    GROQ_MODEL: str = Field(default="openai/gpt-oss-20b")
    GROQ_WEB_SEARCH_ENABLED: bool = Field(default=True)
    GROQ_WEB_MODEL: str = Field(default="groq/compound-mini")
    ENABLE_REAL_API_LOOKUP: bool = Field(default=True)
    REAL_GST_API_URL: str = Field(default="https://api.gst.gov.in/public/search")
    REAL_UDYAM_API_URL: str = Field(default="https://udyamregistration.gov.in/api/verify")
    REAL_PAN_API_URL: str = Field(default="https://eportal.incometax.gov.in/iec/services/pan")
    GEM_BASE_URL: str = Field(default="https://api.gem.gov.in/v1")
    GEM_CLIENT_ID: str = Field(default="")
    GEM_CLIENT_CERT: str = Field(default="certs/gem_client_cert.pem")
    GEM_USE_MOCK: bool = Field(default=True)
    MCA_GATEWAY_MODE: str = Field(default="live")
    GSTN_GATEWAY_MODE: str = Field(default="mock")
    PAN_GATEWAY_MODE: str = Field(default="mock")
    EPFO_GATEWAY_MODE: str = Field(default="mock")
    ESIC_GATEWAY_MODE: str = Field(default="mock")
    DIGILOCKER_GATEWAY_MODE: str = Field(default="mock")
    DATA_GOV_IN_API_KEY: str = Field(default="", repr=False)
    DATA_GOV_IN_MCA_RESOURCE_ID: str = Field(default="41233261-26c9-4f24-9b1a-ae970c675f92")

    # --- Login rate limiting / lockout (backend-enforced, no client captcha) ---
    LOGIN_MAX_FAILURES_PER_EMAIL: int = Field(default=5)
    LOGIN_LOCKOUT_MINUTES: int = Field(default=15)
    LOGIN_MAX_ATTEMPTS_PER_IP: int = Field(default=30)
    LOGIN_WINDOW_SECONDS: int = Field(default=900)

    # --- Centralized risk thresholds (single source of truth for the API) ---
    # README bands: LOW 90-100, MEDIUM 75-89, HIGH 50-74, CRITICAL 0-49.
    RISK_LOW_MIN: float = Field(default=90.0)
    RISK_MEDIUM_MIN: float = Field(default=75.0)
    RISK_HIGH_MIN: float = Field(default=50.0)

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
        if _is_cloud_runtime():
            return _get_default_upload_dir()
        if not value or not os.path.isabs(value):
            return _get_default_upload_dir()
        return value

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() in ("production", "prod")

    @property
    def is_cloud(self) -> bool:
        return _is_cloud_runtime()

    @property
    def is_demo_only(self) -> bool:
        """Demo account seeding is only permitted in isolated development."""
        return (not self.is_production) and (not self.is_cloud)

    @property
    def safe_upload_dir(self) -> str:
        if self.is_cloud:
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
        # data.gov.in key committed in an earlier release is revoked.
        if is_leaked_data_gov_key(self.DATA_GOV_IN_API_KEY):
            raise ValueError(
                "DATA_GOV_IN_API_KEY matches a previously committed (revoked) key. "
                "Request a fresh key at https://api.data.gov.in and set it via environment."
            )
        if not self.is_production:
            if not self.JWT_SECRET:
                # Development only: random per-process secret (never a shared default).
                self.JWT_SECRET = "dev-insecure-" + secrets.token_hex(32)
                logger.warning(
                    "JWT_SECRET not set in %s environment; a random per-process secret was generated. "
                    "Tokens will not survive restarts. Set JWT_SECRET explicitly for stable sessions.",
                    self.ENVIRONMENT,
                )
            return self
        # --- Production: fail closed on missing / weak / known-leaked secrets ---
        if not self.JWT_SECRET or self.JWT_SECRET in _KNOWN_LEAKED_JWT_SECRETS:
            raise ValueError(
                "JWT_SECRET must be set to a unique secret of at least 32 characters in production. "
                "Refusing to start with a missing or previously-leaked secret."
            )
        if len(self.JWT_SECRET) < 32:
            raise ValueError("JWT_SECRET must be at least 32 characters in production.")
        # The dev seed endpoint is never mounted in production (see main.create_app).
        return self

    @property
    def effective_gemini_api_key(self) -> str:
        return self.GEMINI_API_KEY.strip() or self.AI_API_KEY.strip()

    @property
    def cors_origins_list(self) -> List[str]:
        origins: List[str] = []
        for origin in self.CORS_ORIGINS.split(","):
            origin = origin.strip()
            if not origin:
                continue
            if "*" in origin or origin.startswith("."):
                raise ValueError(f"Wildcard origins are not allowed in CORS_ORIGINS: {origin}")
            origins.append(origin)
        return origins

    @property
    def max_upload_bytes(self) -> int:
        return self.MAX_UPLOAD_MB * 1024 * 1024

    @property
    def risk_thresholds(self) -> dict:
        """Canonical risk bands returned to clients so the UI never re-derives them."""
        return {
            "LOW": {"min": self.RISK_LOW_MIN, "max": 100.0},
            "MEDIUM": {"min": self.RISK_MEDIUM_MIN, "max": self.RISK_LOW_MIN},
            "HIGH": {"min": self.RISK_HIGH_MIN, "max": self.RISK_MEDIUM_MIN},
            "CRITICAL": {"min": 0.0, "max": self.RISK_HIGH_MIN},
        }


    model_config = SettingsConfigDict(
        # Resolve this from the backend directory so configuration works whether
        # Uvicorn is launched from the repository root or from backend/.
        env_file=(BACKEND_DIR / ".env", BACKEND_DIR.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        hide_input_in_errors=True
    )

settings = Settings()

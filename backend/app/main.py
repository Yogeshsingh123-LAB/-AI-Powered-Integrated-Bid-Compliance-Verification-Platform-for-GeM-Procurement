import logging
import uuid as _uuid
from contextlib import asynccontextmanager

# pyrefly: ignore [missing-import]
from fastapi import FastAPI, Depends, HTTPException, Request
# pyrefly: ignore [missing-import]
from fastapi.responses import JSONResponse
# pyrefly: ignore [missing-import]
from fastapi.exceptions import RequestValidationError
# pyrefly: ignore [missing-import]
from starlette.exceptions import HTTPException as StarletteHTTPException
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.auth import router as auth_router
from app.api.auth import seed_router
from app.api.users import router as users_router
from app.api.documents import router as documents_router
from app.api.chat import router as chat_router
from app.api.chat_support import router as chat_support_router
from app.api.analysis import router as analysis_router
from app.api.audit import router as audit_router
from app.api.digilocker import router as digilocker_router
from app.api.tender_rules import router as tender_rules_router
from app.api.cartel import router as cartel_router
from app.api.override import router as override_router
from app.api.websocket_monitoring import router as ws_monitoring_router
from app.api.multilingual import router as multilingual_router
from app.api.blockchain_audit import router as blockchain_audit_router
from app.api.mobile_officer import router as mobile_officer_router
from app.api.benchmark import router as benchmark_router
from app.api.sync import router as sync_router
from app.api.notifications import router as notifications_router
from app.api.tenders import router as tenders_router
from app.api.bids import router as bids_router
from app.mock_apis import gst_router, pan_router, udyam_router, blacklist_router, aadhaar_router
from app.mock_apis.verification_gateway_router import router as verification_gateway_router
from app.services.auth_service import get_current_user, require_role

logger = logging.getLogger("app.main")


def create_app() -> FastAPI:
    """Application factory (single canonical /api namespace).

    Mounting rules:
    - Every router is mounted exactly once under the /api prefix.
      (The previous double-mounting produced duplicate OpenAPI operations and
      confusing access-control assumptions.)
    - The development seed router is NOT mounted in production / cloud
      deployments at all; it is additionally gated by ALLOW_SEED_ENDPOINT.
    """
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        from app.db.database import initialize_database, engine
        # Fail closed: in production, any database initialization problem
        # stops startup instead of degrading to an ephemeral SQLite DB.
        initialize_database()
        logger.info(
            "API started (environment=%s, database=%s)",
            settings.ENVIRONMENT,
            engine.url.render_as_string(hide_password=True),
        )
        try:
            yield
        finally:
            try:
                engine.dispose()
            except Exception:
                pass

    app = FastAPI(
        title="GeM Bid Compliance Verification API",
        description="Backend API for AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement",
        version="1.1.0",
        lifespan=lifespan,
    )

    # CORS: explicit exact-origin allow-list only. No wildcard or regex
    # origins (previously any *.vercel.app deployment could pass the check
    # while credentials were enabled).
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ------------------------------------------------------------------
    # Error handlers: internal details (SQL errors, paths, provider
    # messages) are logged server-side only. Clients receive a generic
    # message plus an error ID for support correlation.
    # ------------------------------------------------------------------
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        # HTTPException details are intentional user-facing messages.
        return JSONResponse(
            status_code=exc.status_code,
            content={"success": False, "detail": exc.detail},
            headers=getattr(exc, "headers", None),
        )

    @app.exception_handler(StarletteHTTPException)
    async def starlette_http_exception_handler(request: Request, exc: StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"success": False, "detail": str(exc.detail)},
            headers=getattr(exc, "headers", None),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        # Return only the offending field names, never the raw values.
        fields = []
        for err in exc.errors():
            loc = [str(p) for p in err.get("loc", []) if p not in ("body", "query", "path")]
            if loc:
                fields.append(".".join(loc))
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "detail": "Request validation failed." + (f" Fields: {', '.join(sorted(set(fields)))}" if fields else ""),
            },
        )

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        error_id = _uuid.uuid4().hex
        logger.error("Unhandled server error [%s]: %s", error_id, exc, exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "detail": "An unexpected server error occurred. Please try again. If the problem persists, contact support.",
                "error_id": error_id,
            },
        )

    # ------------------------------------------------------------------
    # Routers — each mounted exactly once under the canonical /api prefix.
    # ------------------------------------------------------------------
    app.include_router(auth_router, prefix="/api")

    if not settings.is_production and not settings.is_cloud:
        # Development-only seed route. Excluded entirely from production and
        # cloud builds (and disabled unless ALLOW_SEED_ENDPOINT=true).
        app.include_router(seed_router, prefix="/api")

    app.include_router(users_router, prefix="/api")
    app.include_router(tenders_router, prefix="/api")
    app.include_router(bids_router, prefix="/api")
    app.include_router(documents_router, prefix="/api", dependencies=[Depends(get_current_user)])
    app.include_router(chat_router, prefix="/api", dependencies=[Depends(get_current_user)])
    app.include_router(chat_support_router, prefix="/api", dependencies=[Depends(get_current_user)])
    app.include_router(analysis_router, prefix="/api", dependencies=[Depends(get_current_user)])
    app.include_router(audit_router, prefix="/api", dependencies=[Depends(require_role("OFFICER", "ADMIN"))])
    # digilocker keeps its /api/v1 public path (router prefix is /digilocker)
    app.include_router(digilocker_router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
    app.include_router(tender_rules_router, prefix="/api", dependencies=[Depends(require_role("OFFICER", "ADMIN"))])
    app.include_router(cartel_router, prefix="/api", dependencies=[Depends(require_role("OFFICER", "ADMIN"))])
    app.include_router(override_router, prefix="/api", dependencies=[Depends(require_role("OFFICER", "ADMIN"))])
    app.include_router(ws_monitoring_router, prefix="/api")
    app.include_router(multilingual_router, prefix="/api", dependencies=[Depends(get_current_user)])
    app.include_router(blockchain_audit_router, prefix="/api", dependencies=[Depends(require_role("OFFICER", "ADMIN"))])
    app.include_router(mobile_officer_router, prefix="/api", dependencies=[Depends(require_role("OFFICER", "ADMIN"))])
    app.include_router(benchmark_router, prefix="/api", dependencies=[Depends(require_role("OFFICER", "ADMIN"))])
    app.include_router(sync_router, prefix="/api", dependencies=[Depends(require_role("OFFICER", "ADMIN"))])
    app.include_router(notifications_router, prefix="/api")

    # Mock verification gateways (simulated government portals).
    app.include_router(gst_router, prefix="/api")
    app.include_router(pan_router, prefix="/api")
    app.include_router(udyam_router, prefix="/api")
    app.include_router(blacklist_router, prefix="/api")
    app.include_router(aadhaar_router, prefix="/api")
    # verification_gateway_router uses an internal /verify prefix and serves
    # the public /api/verify/... paths.
    app.include_router(verification_gateway_router, prefix="/api")

    # ------------------------------------------------------------------
    # Canonical risk thresholds: the UI must never re-derive risk bands.
    # ------------------------------------------------------------------
    @app.get("/api/config/risk-thresholds", tags=["Configuration"])
    def get_risk_thresholds():
        return {"success": True, "thresholds": settings.risk_thresholds}

    @app.get("/")
    def read_root():
        return {
            "message": "Bid Compliance API is running",
            "status": "success"
        }

    @app.get("/health")
    def read_health():
        from fastapi import HTTPException
        from sqlalchemy import text
        from app.db.database import engine
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
        except Exception:
            raise HTTPException(status_code=503, detail="Database unavailable") from None
        return {
            "status": "healthy",
            "environment": settings.ENVIRONMENT,
            "database": "sqlite" if engine.dialect.name == "sqlite" else engine.dialect.name,
        }

    return app


app = create_app()

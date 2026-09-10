# pyrefly: ignore [missing-import]
from fastapi import FastAPI, Depends
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from app.core.config import settings
# pyrefly: ignore [missing-import]
from app.api.auth import router as auth_router
# pyrefly: ignore [missing-import]
from app.api.users import router as users_router
# pyrefly: ignore [missing-import]
from app.api.documents import router as documents_router
# pyrefly: ignore [missing-import]
from app.api.chat import router as chat_router
from app.api.chat_support import router as chat_support_router
# pyrefly: ignore [missing-import]
from app.api.analysis import router as analysis_router
# pyrefly: ignore [missing-import]
from app.api.audit import router as audit_router
# pyrefly: ignore [missing-import]
from app.api.digilocker import router as digilocker_router
# pyrefly: ignore [missing-import]
from app.api.tender_rules import router as tender_rules_router
# pyrefly: ignore [missing-import]
from app.api.cartel import router as cartel_router
# pyrefly: ignore [missing-import]
from app.api.override import router as override_router
# pyrefly: ignore [missing-import]
from app.api.websocket_monitoring import router as ws_monitoring_router
# pyrefly: ignore [missing-import]
from app.api.multilingual import router as multilingual_router
# pyrefly: ignore [missing-import]
from app.api.blockchain_audit import router as blockchain_audit_router
# pyrefly: ignore [missing-import]
from app.api.mobile_officer import router as mobile_officer_router
# pyrefly: ignore [missing-import]
from app.api.benchmark import router as benchmark_router
# pyrefly: ignore [missing-import]
from app.api.sync import router as sync_router
from app.api.notifications import router as notifications_router
from app.mock_apis import gst_router, pan_router, udyam_router, blacklist_router, aadhaar_router


from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.db.database import initialize_database, engine
    initialize_database()
    try:
        yield
    finally:
        engine.dispose()

app = FastAPI(
    title="GeM Bid Compliance Verification API",
    description="Backend API for AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# pyrefly: ignore [missing-import]
from app.api.tenders import router as tenders_router
# pyrefly: ignore [missing-import]
from app.api.bids import router as bids_router

from app.services.auth_service import get_current_user, require_role

# Register routers
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(tenders_router, prefix="/api")
app.include_router(bids_router, prefix="/api")
app.include_router(documents_router, prefix="/api", dependencies=[Depends(get_current_user)])
app.include_router(chat_router, prefix="/api", dependencies=[Depends(get_current_user)])
app.include_router(chat_support_router, prefix="/api", dependencies=[Depends(get_current_user)])
app.include_router(analysis_router, prefix="/api", dependencies=[Depends(get_current_user)])
app.include_router(audit_router, prefix="/api", dependencies=[Depends(require_role("OFFICER", "ADMIN"))])
app.include_router(digilocker_router, prefix="/api/v1", dependencies=[Depends(get_current_user)])
app.include_router(tender_rules_router, prefix="/api", dependencies=[Depends(require_role("OFFICER", "ADMIN"))])
app.include_router(cartel_router, prefix="/api", dependencies=[Depends(require_role("OFFICER", "ADMIN"))])
app.include_router(override_router, prefix="/api", dependencies=[Depends(require_role("OFFICER", "ADMIN"))])
app.include_router(ws_monitoring_router, prefix="/api")
app.include_router(ws_monitoring_router)
app.include_router(multilingual_router, prefix="/api", dependencies=[Depends(get_current_user)])
app.include_router(blockchain_audit_router, prefix="/api", dependencies=[Depends(require_role("OFFICER", "ADMIN"))])
app.include_router(mobile_officer_router, prefix="/api", dependencies=[Depends(require_role("OFFICER", "ADMIN"))])
app.include_router(benchmark_router, prefix="/api", dependencies=[Depends(require_role("OFFICER", "ADMIN"))])
app.include_router(sync_router, prefix="/api", dependencies=[Depends(require_role("OFFICER", "ADMIN"))])
app.include_router(notifications_router, prefix="/api")


app.include_router(gst_router)
app.include_router(pan_router)
app.include_router(udyam_router)
app.include_router(blacklist_router)
app.include_router(aadhaar_router)

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
    return {"status": "healthy"}

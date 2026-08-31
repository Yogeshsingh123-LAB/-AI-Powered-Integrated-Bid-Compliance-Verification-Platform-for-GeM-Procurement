# pyrefly: ignore [missing-import]
from fastapi import FastAPI
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
from app.mock_apis import gst_router, pan_router, udyam_router, blacklist_router, aadhaar_router

app = FastAPI(
    title="GeM Bid Compliance Verification API",
    description="Backend API for AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement",
    version="1.0.0"
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register routers
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(analysis_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(digilocker_router, prefix="/api/v1")
app.include_router(tender_rules_router, prefix="/api")
app.include_router(cartel_router, prefix="/api")
app.include_router(override_router, prefix="/api")
app.include_router(ws_monitoring_router, prefix="/api")
app.include_router(ws_monitoring_router)
app.include_router(multilingual_router, prefix="/api")
app.include_router(blockchain_audit_router, prefix="/api")
app.include_router(mobile_officer_router, prefix="/api")


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
    return {
        "status": "healthy"
    }

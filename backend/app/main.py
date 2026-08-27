from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.documents import router as documents_router

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

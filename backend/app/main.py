from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI(
    title="GeM Bid Compliance Verification API",
    description="Backend API for AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement",
    version="1.0.0"
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local development and testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

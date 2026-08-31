from fastapi import APIRouter, HTTPException, Query, status
from typing import Dict, Any, Optional
from app.services.digilocker_service import DigiLockerService

router = APIRouter(prefix="/digilocker", tags=["DigiLocker Integration"])

@router.get("/authorize-url", response_model=Dict[str, str])
def get_digilocker_authorize_url(state: Optional[str] = Query(None)):
    """Generate DigiLocker OAuth2 authorization URL for bidder consent."""
    return DigiLockerService.generate_authorization_url(state)

@router.get("/callback", response_model=Dict[str, Any])
def digilocker_callback(code: str = Query(...), state: Optional[str] = Query(None)):
    """OAuth2 callback handler for DigiLocker authorization code exchange."""
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authorization code missing in callback."
        )
    return DigiLockerService.exchange_code_for_token(code)

@router.get("/documents", response_model=Dict[str, Any])
def get_digilocker_documents(access_token: str = Query(...)):
    """Fetch verified government-issued documents directly from bidder's DigiLocker vault."""
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="DigiLocker access token required."
        )
    return DigiLockerService.get_issued_documents(access_token)

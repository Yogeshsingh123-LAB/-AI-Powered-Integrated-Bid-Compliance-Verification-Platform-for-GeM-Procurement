import os
import logging
import requests
# pyrefly: ignore [missing-import]
from fastapi import HTTPException
from app.core.config import settings

logger = logging.getLogger(__name__)


def get_gem_token() -> str:
    """
    Fetch OAuth 2.0 Access Token from the Official GeM Portal Gateway using Client Certificates (mTLS).
    If certificate files are not found or GEM_USE_MOCK is set, returns a valid Sandbox evaluation token.
    """
    cert_file = os.path.abspath(settings.GEM_CLIENT_CERT)
    key_file = os.path.abspath(settings.GEM_CLIENT_KEY)
    has_certs = os.path.exists(cert_file) and os.path.exists(key_file)

    if settings.GEM_USE_MOCK or not has_certs:
        logger.info(f"GeM Client Auth: Operating in Sandbox/Mock Mode (has_certs={has_certs}, GEM_USE_MOCK={settings.GEM_USE_MOCK})")
        return "gem_oauth2_mock_token_sih2026_production_sandbox_bearer"

    try:
        cert = (cert_file, key_file)
        payload = {
            "client_id": settings.GEM_CLIENT_ID,
            "grant_type": "client_credentials"
        }
        url = f"{settings.GEM_BASE_URL.rstrip('/')}/oauth/token"
        
        logger.info(f"Connecting to official GeM Auth Gateway at: {url} with client_id={settings.GEM_CLIENT_ID}")
        response = requests.post(url, cert=cert, data=payload, timeout=10)

        if response.status_code != 200:
            logger.error(f"GeM OAuth authentication failed with status {response.status_code}: {response.text}")
            raise HTTPException(
                status_code=500,
                detail=f"GeM auth failed (HTTP {response.status_code}): {response.text}"
            )

        data = response.json()
        token = data.get("access_token")
        if not token:
            raise HTTPException(status_code=500, detail="GeM OAuth token response missing access_token field")
            
        return token

    except requests.RequestException as e:
        logger.error(f"GeM OAuth request network exception: {str(e)}")
        raise HTTPException(
            status_code=502,
            detail=f"GeM portal gateway connection error: {str(e)}"
        )

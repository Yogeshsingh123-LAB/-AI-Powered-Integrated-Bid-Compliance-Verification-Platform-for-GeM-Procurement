import logging
from typing import Dict, Any
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, Depends
from app.services.gem_client import GeMClient

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1", tags=["GeM Portal Synchronization"])


@router.post("/sync-tender/{tender_id}")
async def sync_tender(tender_id: str) -> Dict[str, Any]:
    """
    Synchronize tender RFP parameters and compliance requirements directly from the official GeM portal.
    Authenticates with client certificates (mTLS) and OAuth 2.0.
    """
    try:
        client = GeMClient()
        tender_data = client.fetch_tender(tender_id)
        return {
            "status": "synced",
            "tender_id": tender_id,
            "data": tender_data,
            "auth_type": "OAuth 2.0 Client Certificate (mTLS)"
        }
    except Exception as e:
        logger.error(f"Failed to sync tender '{tender_id}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"GeM tender sync failed: {str(e)}")


@router.get("/sync-tender/{tender_id}")
async def get_synced_tender(tender_id: str) -> Dict[str, Any]:
    """
    GET convenience endpoint to inspect synced GeM tender details.
    """
    return await sync_tender(tender_id)


@router.post("/sync/submit-report/{tender_id}")
async def submit_compliance_report(tender_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Push AI compliance verification scores, XAI quote evidence, and cryptographic Merkle proof to GeM portal.
    """
    try:
        client = GeMClient()
        report = payload.get("report", payload)
        result = client.submit_compliance_report(tender_id, report)
        return {
            "status": "submitted",
            "tender_id": tender_id,
            "result": result
        }
    except Exception as e:
        logger.error(f"Failed to submit compliance report for tender '{tender_id}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"GeM report submission failed: {str(e)}")


@router.get("/sync/bids/{tender_id}")
async def sync_tender_bids(tender_id: str) -> Dict[str, Any]:
    """
    Pull vendor bids for a given tender directly from the GeM portal gateway.
    """
    try:
        client = GeMClient()
        bids_data = client.fetch_tender_bids(tender_id)
        return {
            "status": "success",
            "tender_id": tender_id,
            "bids_data": bids_data
        }
    except Exception as e:
        logger.error(f"Failed to sync bids for tender '{tender_id}': {str(e)}")
        raise HTTPException(status_code=500, detail=f"GeM bid sync failed: {str(e)}")

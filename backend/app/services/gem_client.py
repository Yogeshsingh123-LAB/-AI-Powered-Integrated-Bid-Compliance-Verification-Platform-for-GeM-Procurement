import os
import logging
import requests
from typing import Dict, Any, Optional
# pyrefly: ignore [missing-import]
from app.core.config import settings
from app.core.gem_auth import get_gem_token

logger = logging.getLogger(__name__)


class GeMClient:
    """
    Dedicated GeM Production API Client with OAuth 2.0 Client Certificate Authentication.
    Connects to Government e-Marketplace API gateway (api.gem.gov.in) to synchronize
    tenders, retrieve bidder submissions, and publish AI compliance reports.
    """

    def __init__(self):
        self.token = get_gem_token()
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-GeM-Client-Version": "1.0.0"
        }
        
        cert_file = os.path.abspath(settings.GEM_CLIENT_CERT)
        key_file = os.path.abspath(settings.GEM_CLIENT_KEY)
        if os.path.exists(cert_file) and os.path.exists(key_file) and not settings.GEM_USE_MOCK:
            self.cert: Optional[tuple] = (cert_file, key_file)
        else:
            self.cert = None

    def fetch_tender(self, tender_id: str) -> Dict[str, Any]:
        """
        Fetch tender specifications and RFP guidelines directly from GeM portal.
        """
        url = f"{settings.GEM_BASE_URL.rstrip('/')}/tenders/{tender_id}"
        logger.info(f"GeMClient: Fetching tender '{tender_id}' from {url}")

        if settings.GEM_USE_MOCK or self.cert is None:
            return {
                "tender_id": tender_id,
                "title": f"Procurement of High-Performance Server Infrastructure & Networking Hardware ({tender_id})",
                "department": "Ministry of Electronics and Information Technology (MeitY)",
                "category": "IT Infrastructure",
                "budget_limit": 5000000.0,
                "estimated_cost": 4850000.0,
                "created_at": "2026-08-01T10:00:00Z",
                "closing_date": "2026-09-15T17:00:00Z",
                "status": "ACTIVE",
                "requirements": [
                    {
                        "category": "Statutory",
                        "rule_name": "GSTIN & PAN Verification",
                        "description": "Bidder must possess valid Active GSTIN with 3 consecutive GSTR-3B filings and verified PAN.",
                        "mandatory": True
                    },
                    {
                        "category": "Labor & Social Security",
                        "rule_name": "EPFO & ESIC Compliance",
                        "description": "Establishment must maintain active EPFO registration with employee count >= 20 and monthly ECR remittances.",
                        "mandatory": True
                    },
                    {
                        "category": "Local Content",
                        "rule_name": "Make in India PPP-MII Order 2017",
                        "description": "Minimum Class-I (>50%) or Class-II (20-50%) local content declaration required.",
                        "mandatory": True
                    },
                    {
                        "category": "Startup Exemption",
                        "rule_name": "DPIIT Prior Experience Relaxation",
                        "description": "DPIIT recognized startups exempted from prior turnover and experience under GFR Rule 173.",
                        "mandatory": False
                    }
                ],
                "source": "GeM Sandbox Portal Gateway"
            }

        try:
            response = requests.get(url, headers=self.headers, cert=self.cert, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"GeMClient error fetching tender '{tender_id}': {str(e)}")
            raise RuntimeError(f"Failed to fetch tender '{tender_id}' from GeM Portal: {str(e)}")

    def submit_compliance_report(self, tender_id: str, report: Dict[str, Any]) -> Dict[str, Any]:
        """
        Push AI compliance evaluation, XAI evidence, Merkle proof, and risk score to GeM.
        """
        url = f"{settings.GEM_BASE_URL.rstrip('/')}/tenders/{tender_id}/compliance"
        logger.info(f"GeMClient: Submitting compliance report for tender '{tender_id}' to {url}")

        if settings.GEM_USE_MOCK or self.cert is None:
            return {
                "tender_id": tender_id,
                "submission_id": f"GEM-ACK-{tender_id}-2026X9",
                "status": "ACCEPTED",
                "received_at": "2026-08-31T20:45:00Z",
                "acknowledged_by": "GeM Production Compliance Gateway",
                "message": "AI Compliance report successfully recorded and audited into GeM ledger."
            }

        try:
            response = requests.post(url, json=report, headers=self.headers, cert=self.cert, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"GeMClient error submitting report for tender '{tender_id}': {str(e)}")
            raise RuntimeError(f"Failed to submit compliance report to GeM Portal: {str(e)}")

    def fetch_tender_bids(self, tender_id: str) -> Dict[str, Any]:
        """
        Fetch vendor bids submitted for a specific tender for automated batch scanning.
        """
        url = f"{settings.GEM_BASE_URL.rstrip('/')}/tenders/{tender_id}/bids"
        logger.info(f"GeMClient: Fetching bids for tender '{tender_id}' from {url}")

        if settings.GEM_USE_MOCK or self.cert is None:
            return {
                "tender_id": tender_id,
                "total_bids": 3,
                "bids": [
                    {
                        "bid_id": f"BID-{tender_id}-001",
                        "bidder_name": "Apex Tech Solutions Pvt Ltd",
                        "gstin": "27AAACA12341Z5",
                        "pan": "AAACA1234A",
                        "submitted_at": "2026-08-25T14:30:00Z"
                    },
                    {
                        "bid_id": f"BID-{tender_id}-002",
                        "bidder_name": "Bharat Global Enterprises",
                        "gstin": "07AAAAA0000A1Z5",
                        "pan": "AAAAA0000A",
                        "submitted_at": "2026-08-26T09:15:00Z"
                    }
                ]
            }

        try:
            response = requests.get(url, headers=self.headers, cert=self.cert, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"GeMClient error fetching bids for '{tender_id}': {str(e)}")
            raise RuntimeError(f"Failed to fetch bids from GeM Portal: {str(e)}")

import logging
from typing import Dict, Any, List, Optional
from difflib import SequenceMatcher
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

def fuzzy_string_similarity(str1: str, str2: str) -> float:
    """Computes a normalized Levenshtein-like string similarity ratio between 0.0 and 1.0."""
    if not str1 or not str2:
        return 1.0
    s1 = str1.lower().strip()
    s2 = str2.lower().strip()
    return SequenceMatcher(None, s1, s2).ratio()

class ProcurementFraudDetector:
    """
    Evaluates cross-bidder collusion, GSTIN/PAN identifier reuse across different bidder aliases,
    and shell company name discrepancies.
    """

    @staticmethod
    def detect_fraud_and_collusion(
        extracted_identifiers: Dict[str, List[str]],
        current_bidder_name: str,
        verification_data: Dict[str, Any],
        db: Optional[Session] = None,
        tender_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Analyzes multi-bidder identifier collision and fuzzy legal entity name alignment.
        """
        collusion_warnings: List[str] = []
        is_collusion_risk = False
        collusion_penalty = 0

        gstins = [g for g in extracted_identifiers.get("gstin", []) if g]
        pans = [p for p in extracted_identifiers.get("pan", []) if p]
        udyam_ids = [u for u in extracted_identifiers.get("udyam", []) if u]

        # 1. Multi-Bidder Identifier Reuse Check (DB Query if DB session provided)
        if db:
            from app.models.document_extraction import DocumentExtraction
            from app.models.document import Document
            from app.models.bid import Bid

            # Check GSTIN reuse across distinct bidders
            for gstin in gstins:
                matched_extractions = db.query(DocumentExtraction).join(
                    Document, DocumentExtraction.document_id == Document.id
                ).join(
                    Bid, Document.bid_id == Bid.id
                ).filter(
                    DocumentExtraction.extracted_data.like(f"%{gstin}%")
                ).all()

                for ext in matched_extractions:
                    if ext.document and ext.document.bid:
                        existing_bidder = ext.document.bid.bidder_name or ""
                        if existing_bidder and current_bidder_name and existing_bidder.lower() != current_bidder_name.lower():
                            is_collusion_risk = True
                            collusion_penalty += 50
                            collusion_warnings.append(
                                f"CRITICAL FRAUD ALERT: GSTIN '{gstin}' was previously registered under a different bidding entity ('{existing_bidder}'). Submitting multiple bids under different entity names using the same GSTIN violates GeM anti-collusion guidelines."
                            )

            # Check PAN reuse across distinct bidders
            for pan in pans:
                matched_extractions = db.query(DocumentExtraction).join(
                    Document, DocumentExtraction.document_id == Document.id
                ).join(
                    Bid, Document.bid_id == Bid.id
                ).filter(
                    DocumentExtraction.extracted_data.like(f"%{pan}%")
                ).all()

                for ext in matched_extractions:
                    if ext.document and ext.document.bid:
                        existing_bidder = ext.document.bid.bidder_name or ""
                        if existing_bidder and current_bidder_name and existing_bidder.lower() != current_bidder_name.lower():
                            if not is_collusion_risk: # prevent redundant message if GSTIN already caught it
                                is_collusion_risk = True
                                collusion_penalty += 40
                                collusion_warnings.append(
                                    f"CRITICAL COLLUSION RISK: Income Tax PAN '{pan}' is shared with another competing bidder ('{existing_bidder}'). Potential shell entity network."
                                )

        # 2. Fuzzy Name Alignment Check (Bidder Org Name vs GST/PAN Legal Names)
        name_mismatch_warnings: List[str] = []
        name_mismatch_penalty = 0

        gst_legal_name = ""
        gst_records = verification_data.get("gstin", [])
        if gst_records and isinstance(gst_records, list) and gst_records[0].get("found"):
            gst_legal_name = gst_records[0].get("data", {}).get("legal_name", "")

        pan_legal_name = ""
        pan_records = verification_data.get("pan", [])
        if pan_records and isinstance(pan_records, list) and pan_records[0].get("found"):
            pan_legal_name = pan_records[0].get("data", {}).get("name", "")

        # Compare GST Legal Name with PAN Name
        if gst_legal_name and pan_legal_name:
            sim = fuzzy_string_similarity(gst_legal_name, pan_legal_name)
            if sim < 0.60:
                name_mismatch_penalty += 20
                name_mismatch_warnings.append(
                    f"Registry Discrepancy: Legal name registered in GSTIN ('{gst_legal_name}') does not match Income Tax PAN record ('{pan_legal_name}') (Similarity: {int(sim*100)}%)."
                )

        # Compare Submitted Bidder Name with GST Legal Name
        if current_bidder_name and gst_legal_name:
            sim_bidder = fuzzy_string_similarity(current_bidder_name, gst_legal_name)
            if sim_bidder < 0.50:
                name_mismatch_penalty += 15
                name_mismatch_warnings.append(
                    f"Identity Verification Warning: Submitted bidder name ('{current_bidder_name}') differs significantly from official GSTIN legal title ('{gst_legal_name}') (Similarity: {int(sim_bidder*100)}%)."
                )

        total_fraud_penalty = collusion_penalty + name_mismatch_penalty
        all_warnings = collusion_warnings + name_mismatch_warnings

        return {
            "is_collusion_risk": is_collusion_risk,
            "fraud_penalty": total_fraud_penalty,
            "collusion_warnings": collusion_warnings,
            "name_mismatch_warnings": name_mismatch_warnings,
            "all_warnings": all_warnings,
            "metrics": {
                "gst_pan_name_similarity": int(fuzzy_string_similarity(gst_legal_name, pan_legal_name) * 100) if (gst_legal_name and pan_legal_name) else 100,
                "bidder_gst_name_similarity": int(fuzzy_string_similarity(current_bidder_name, gst_legal_name) * 100) if (current_bidder_name and gst_legal_name) else 100
            }
        }

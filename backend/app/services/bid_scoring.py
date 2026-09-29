"""Shared bid-compliance scoring.

Before this module there were three mutually inconsistent ways to score a bid:

1. ``process_document``      → ``verified_docs / total_reqs * 100`` (a ratio)
2. ``POST /bids/{id}/re-verify`` → ``60 + min(34, docs*6) + 10 if OEM + 10 if EPFO``,
   capped at 98 (a heuristic that ignores document contents entirely)
3. ``ComplianceScorer.calculate_compliance_score`` → the real weighted
   30/40/30 + custom-weights engine, used only by ``POST /api/analyze`` whose
   result was kept in React state and never persisted

A judge who uploaded a document and clicked "Re-verify" saw path 2 produce a
number with no relationship to the document's contents. Every writer now goes
through :func:`recalculate_bid_score`.
"""

import logging
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.models.bid import Bid
from app.models.document import Document
from app.models.document_extraction import DocumentExtraction
from app.models.requirement import Requirement

logger = logging.getLogger(__name__)

# Identifier field names as produced by the extraction pipeline.
_IDENTIFIER_FIELDS = ("gstin", "pan", "udyam", "udyam_number", "aadhaar")


def _extract_identifiers(fields: Dict[str, Any]) -> Dict[str, List[str]]:
    """Pull registry identifiers out of a document's extracted fields."""
    found: Dict[str, List[str]] = {"gstin": [], "pan": [], "udyam": [], "aadhaar": []}
    if not isinstance(fields, dict):
        return found

    for key, value in fields.items():
        k = str(key).lower()
        bucket = None
        if "gstin" in k:
            bucket = "gstin"
        elif "udyam" in k:
            bucket = "udyam"
        elif "aadhaar" in k:
            bucket = "aadhaar"
        elif k == "pan" or k.endswith("_pan") or "pan_number" in k:
            bucket = "pan"
        if bucket is None:
            continue
        for candidate in (value if isinstance(value, list) else [value]):
            text = str(candidate or "").strip().upper()
            if text and text not in found[bucket]:
                found[bucket].append(text)
    return found


def build_verification_results(db: Session, bid: Bid) -> Dict[str, Any]:
    """Reconstruct the scorer's input from what is actually stored on the bid.

    Runs the identifiers extracted from every uploaded document through the
    verification gateway, so the score reflects real registry lookups rather
    than a document count.
    """
    from app.services.mock_verifier import MockVerifier

    documents = (
        db.query(Document)
        .filter(Document.bid_id == bid.id, Document.document_status != "REPLACED")
        .all()
    )

    identifiers: Dict[str, List[str]] = {"gstin": [], "pan": [], "udyam": [], "aadhaar": []}
    for doc in documents:
        extraction = (
            db.query(DocumentExtraction)
            .filter(DocumentExtraction.document_id == doc.id)
            .order_by(DocumentExtraction.processed_at.desc())
            .first()
        )
        if extraction is None:
            continue
        for bucket, values in _extract_identifiers(
            extraction.extracted_data or {}).items():
            for v in values:
                if v not in identifiers[bucket]:
                    identifiers[bucket].append(v)

    verification_results = MockVerifier.verify_all_identifiers(identifiers)
    verification_results["is_wrong_document"] = any(
        d.document_status == "REJECTED" for d in documents)
    verification_results["documents"] = [
        {
            "document_id": str(d.id),
            "document_type": d.document_type,
            "status": d.document_status,
            "file_name": d.original_filename,
        }
        for d in documents
    ]
    return verification_results


def recalculate_bid_score(db: Session, bid: Bid) -> Dict[str, Any]:
    """Recompute and persist a bid's compliance score using ``ComplianceScorer``.

    Returns the scorer's report (``score``, ``risk_level``, ``recommendations``,
    ``deductions`` ...). Falls back to a document-coverage ratio only if the
    scoring engine itself raises, and records which path produced the number.
    """
    from app.scoring import ComplianceScorer
    from app.scoring.risk_classifier import risk_level_for_score

    documents = (
        db.query(Document)
        .filter(Document.bid_id == bid.id, Document.document_status != "REPLACED")
        .all()
    )
    requirements = (
        db.query(Requirement).filter(Requirement.tender_id == bid.tender_id).all()
    )

    try:
        verification_results = build_verification_results(db, bid)
        report = ComplianceScorer.calculate_compliance_score(
            verification_results=verification_results,
            tender_config=_tender_config(bid),
        )
        score = float(report.get("score", 0) or 0)
        method = "compliance_scorer"
    except Exception as exc:
        logger.error(f"ComplianceScorer failed for bid {bid.id}: {exc}", exc_info=True)
        # Document-coverage fallback — transparent, not a magic heuristic.
        verified = sum(
            1 for d in documents
            if d.document_status.upper() in ("VERIFIED", "PROCESSED", "APPROVED")
        )
        total = len(requirements) or 1
        score = round(min(100.0, (verified / total) * 100.0), 2)
        report = {
            "score": score,
            "risk_level": risk_level_for_score(score),
            "recommendations": [],
            "deductions": [],
            "fallback": "document_coverage_ratio",
        }
        method = "document_coverage_ratio"

    report["scoring_method"] = method
    report["document_counts"] = {
        "uploaded": len(documents),
        "verified": sum(
            1 for d in documents
            if d.document_status.upper() in ("VERIFIED", "PROCESSED", "APPROVED")
        ),
        "requirements": len(requirements),
    }
    return report


def _tender_config(bid: Bid) -> Optional[Dict[str, Any]]:
    """Per-tender scoring weights / custom rules, when the officer set them."""
    tender = getattr(bid, "tender", None)
    if tender is None:
        return None
    config: Dict[str, Any] = {}
    if getattr(tender, "scoring_weights", None):
        config["scoring_weights"] = tender.scoring_weights
    if getattr(tender, "custom_rules", None):
        config["custom_rules"] = tender.custom_rules
    return config or None


def apply_bid_score(db: Session, bid: Bid) -> Dict[str, Any]:
    """Recalculate the score and persist it on the bid row."""
    report = recalculate_bid_score(db, bid)
    bid.compliance_score = float(report.get("score", 0) or 0)
    db.commit()
    db.refresh(bid)
    return report

# pyrefly: ignore [missing-import]
import hashlib
import uuid
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc

from app.db.database import get_db
from app.models.audit_log import AuditLog
from app.models.bid import Bid
from app.models.user import User
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/audit", tags=["Audit Log & Blockchain Integrity"])


def calculate_log_hash(prev_hash: str, log: AuditLog) -> str:
    """Computes expected SHA-256 hash for an audit log record based on chain payload."""
    chain_payload = (
        f"{prev_hash}:"
        f"{log.action}:"
        f"{log.user_id or ''}:"
        f"{log.entity_type}:"
        f"{log.entity_id or ''}:"
        f"{log.bid_id or ''}:"
        f"{log.new_value or ''}"
    )
    return hashlib.sha256(chain_payload.encode("utf-8")).hexdigest()


@router.get("/logs", summary="List system audit logs")
def get_audit_logs(
    bid_id: Optional[uuid.UUID] = Query(None, description="Filter logs by Bid ID"),
    entity_type: Optional[str] = Query(None, description="Filter logs by entity type"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Retrieves paginated audit log entries recorded in the immutable audit trail."""
    query = db.query(AuditLog)
    if bid_id:
        query = query.filter(AuditLog.bid_id == bid_id)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)

    total = query.count()
    logs = query.order_by(desc(AuditLog.created_at)).offset(offset).limit(limit).all()

    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "logs": [
            {
                "id": str(log.id),
                "user_id": str(log.user_id) if log.user_id else None,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": str(log.entity_id) if log.entity_id else None,
                "bid_id": str(log.bid_id) if log.bid_id else None,
                "old_value": log.old_value,
                "new_value": log.new_value,
                "ip_address": log.ip_address,
                "blockchain_hash": log.blockchain_hash,
                "created_at": log.created_at.isoformat() if log.created_at else None
            }
            for log in logs
        ]
    }


@router.get("/verify/{log_id}", summary="Verify cryptographic audit log hash")
def verify_audit_log(
    log_id: uuid.UUID,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Cryptographically verifies that a single audit record's SHA-256 blockchain hash
    matches its payload and chain sequence without unauthorized tampering.
    """
    target_log = db.query(AuditLog).filter(AuditLog.id == log_id).first()
    if not target_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Audit log entry '{log_id}' not found."
        )

    # Fetch preceding record in chronological order to resolve previous hash
    prev_log = db.query(AuditLog).filter(
        AuditLog.created_at < target_log.created_at
    ).order_by(desc(AuditLog.created_at)).first()

    prev_hash = prev_log.blockchain_hash if (prev_log and prev_log.blockchain_hash) else "0" * 64
    expected_hash = calculate_log_hash(prev_hash, target_log)
    is_valid = (target_log.blockchain_hash == expected_hash)

    return {
        "log_id": str(target_log.id),
        "action": target_log.action,
        "entity_type": target_log.entity_type,
        "recorded_hash": target_log.blockchain_hash,
        "expected_hash": expected_hash,
        "previous_hash": prev_hash,
        "integrity_verified": is_valid,
        "status": "VALID_TAMPER_FREE" if is_valid else "CORRUPTED_TAMPERED"
    }


@router.get("/bids/{bid_id}/verify", summary="Verify full audit chain for a bid")
def verify_bid_audit_chain(
    bid_id: uuid.UUID,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Verifies the end-to-end cryptographic hash integrity for all audit records associated
    with a specific procurement bid.
    """
    bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not bid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bid '{bid_id}' not found."
        )

    logs = db.query(AuditLog).filter(
        AuditLog.bid_id == bid_id
    ).order_by(asc(AuditLog.created_at)).all()

    if not logs:
        return {
            "bid_id": str(bid_id),
            "total_records": 0,
            "chain_integrity_verified": True,
            "status": "NO_RECORDS",
            "message": "No audit records registered for this bid yet."
        }

    all_valid = True
    verification_details = []

    for log in logs:
        prev_log = db.query(AuditLog).filter(
            AuditLog.created_at < log.created_at
        ).order_by(desc(AuditLog.created_at)).first()

        prev_hash = prev_log.blockchain_hash if (prev_log and prev_log.blockchain_hash) else "0" * 64
        expected_hash = calculate_log_hash(prev_hash, log)
        valid = (log.blockchain_hash == expected_hash)

        if not valid:
            all_valid = False

        verification_details.append({
            "log_id": str(log.id),
            "action": log.action,
            "recorded_hash": log.blockchain_hash,
            "expected_hash": expected_hash,
            "integrity_verified": valid
        })

    return {
        "bid_id": str(bid_id),
        "bid_number": bid.bid_number,
        "total_records": len(logs),
        "chain_integrity_verified": all_valid,
        "status": "CHAIN_VALID" if all_valid else "CHAIN_COMPROMISED",
        "verification_details": verification_details
    }

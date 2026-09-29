# pyrefly: ignore [missing-import]
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
from app.services.audit_chain import (
    GENESIS_HASH,
    expected_hash_for_record,
    verify_record,
)

router = APIRouter(prefix="/audit", tags=["Audit Log & Blockchain Integrity"])


# ----------------------------------------------------------------------
# Chain helpers
#
# The previous implementation resolved a record's ``prev_hash`` with
# "the most recent row created before this one" (``created_at < target``).
# That is wrong twice over:
#   1. the real chain is ordered by ``sequence`` (the writer assigns the
#      predecessor by sequence, not by wall-clock time), and
#   2. it issued one extra query per record — O(n^2) on a full-chain verify.
# Predecessors are now resolved once, against the global sequence order.
# ----------------------------------------------------------------------
def _resolve_predecessors(db: Session, records: List[AuditLog]) -> Dict[str, str]:
    """Return ``{record_id: prev_hash}`` for ``records`` using the global chain.

    A record whose predecessor cannot be located falls back to the genesis
    hash, which is what the writer uses for the very first chain entry.
    """
    predecessors: Dict[str, str] = {}
    seq_records = [r for r in records if getattr(r, "sequence", None) is not None]

    if seq_records:
        lo = min(int(r.sequence) for r in seq_records) - 1
        hi = max(int(r.sequence) for r in seq_records)
        # One indexed range scan instead of a query per record.
        window = db.query(AuditLog).filter(
            AuditLog.sequence >= lo, AuditLog.sequence <= hi
        ).all()
        by_seq: Dict[int, AuditLog] = {}
        for row in window:
            if row.sequence is None:
                continue
            # Keep the newest row if a duplicate sequence ever appears.
            existing = by_seq.get(int(row.sequence))
            if existing is None or (row.created_at, row.id) > (existing.created_at, existing.id):
                by_seq[int(row.sequence)] = row

        for record in seq_records:
            prev_row = by_seq.get(int(record.sequence) - 1)
            predecessors[str(record.id)] = (
                prev_row.blockchain_hash
                if (prev_row and prev_row.blockchain_hash)
                else GENESIS_HASH
            )

    # Legacy rows (sequence is NULL) keep the timestamp-based lookup.
    for record in records:
        if str(record.id) in predecessors:
            continue
        prev_log = db.query(AuditLog).filter(
            AuditLog.created_at < record.created_at
        ).order_by(desc(AuditLog.created_at)).first()
        predecessors[str(record.id)] = (
            prev_log.blockchain_hash
            if (prev_log and prev_log.blockchain_hash)
            else GENESIS_HASH
        )

    return predecessors


def _verification_entry(record: AuditLog, prev_hash: str) -> Dict[str, Any]:
    result = verify_record(record, prev_hash)
    return {
        "log_id": str(record.id),
        "action": record.action,
        "recorded_hash": record.blockchain_hash,
        "expected_hash": result["expected_hash"],
        "integrity_verified": result["integrity_verified"],
        "payload_version": result["payload_version"],
        "legacy_record": result["legacy_record"],
    }


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

    The expected hash is recomputed with the *same* canonical serialiser the
    writer used (``services/audit_chain.py``), and the predecessor is resolved
    against the global sequence order.
    """
    target_log = db.query(AuditLog).filter(AuditLog.id == log_id).first()
    if not target_log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Audit log entry '{log_id}' not found."
        )

    predecessors = _resolve_predecessors(db, [target_log])
    prev_hash = predecessors[str(target_log.id)]
    expected_hash = expected_hash_for_record(target_log, prev_hash)
    is_valid = (target_log.blockchain_hash == expected_hash)

    if not is_valid:
        # Recognise rows written by the old (broken) v1 formula so a deploy
        # does not retroactively invalidate the pre-existing audit trail.
        result = verify_record(target_log, prev_hash)
        is_valid = result["integrity_verified"]
        if is_valid:
            expected_hash = result["expected_hash"]

    return {
        "log_id": str(target_log.id),
        "action": target_log.action,
        "entity_type": target_log.entity_type,
        "sequence": target_log.sequence,
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
    ).order_by(asc(AuditLog.sequence).nullslast(), asc(AuditLog.created_at), asc(AuditLog.id)).all()

    if not logs:
        return {
            "bid_id": str(bid_id),
            "total_records": 0,
            "chain_integrity_verified": True,
            "status": "NO_RECORDS",
            "message": "No audit records registered for this bid yet."
        }

    predecessors = _resolve_predecessors(db, logs)
    all_valid = True
    verification_details = []

    for log in logs:
        prev_hash = predecessors[str(log.id)]
        entry = _verification_entry(log, prev_hash)
        if not entry["integrity_verified"]:
            all_valid = False
        verification_details.append(entry)

    return {
        "bid_id": str(bid_id),
        "bid_number": str(bid.id),
        "total_records": len(logs),
        "chain_integrity_verified": all_valid,
        "status": "CHAIN_VALID" if all_valid else "CHAIN_COMPROMISED",
        "genesis_hash": GENESIS_HASH,
        "verification_details": verification_details
    }

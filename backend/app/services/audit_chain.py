"""Canonical serialisation for the tamper-evident audit hash chain.

SECURITY / CORRECTNESS
----------------------
There must be exactly **one** definition of the audit-chain payload and **one**
definition of the block hash.  Before this module existed, the writer and the
verifier each built their own string:

    # writer — services/auth_service.create_audit_record
    canonical = json.dumps(canonical_payload, sort_keys=True, ensure_ascii=True, default=str)
    block_hash = sha256(f"{prev_hash}:{canonical}")

    # verifier — api/audit.calculate_log_hash
    chain_payload = f"{prev_hash}:{action}:{user_id}:{entity_type}:{entity_id}:{bid_id}:{new_value}"
    return sha256(chain_payload)

Two different strings means the two digests can *never* agree, so
``GET /api/audit/verify/{id}`` answered ``integrity_verified: false`` and
``GET /api/audit/bids/{id}/verify`` answered ``CHAIN_COMPROMISED`` on perfectly
clean, untampered data.

Every writer and every verifier now imports this module.  Do not re-implement
the formula anywhere else.
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Dict, Optional

#: Hash of the non-existent "block -1" — the chain head of an empty table.
GENESIS_HASH = "0" * 64

#: Bumped whenever the canonical payload shape changes.  Verifiers accept
#: records written by older versions (see ``legacy_payload``) so a deploy does
#: not retroactively invalidate the existing audit trail.
PAYLOAD_VERSION = 2


def _utc_iso(value: Optional[datetime]) -> Optional[str]:
    """Serialise a timestamp to a canonical UTC ISO-8601 string.

    The ``audit_logs.created_at`` column is a naive ``DateTime`` (``TIMESTAMP
    WITHOUT TIME ZONE`` on PostgreSQL) but the writer stores UTC instants.  A
    naive value is therefore interpreted as UTC, and an aware value is
    converted — so the writer and the verifier always agree no matter which
    timezone the database driver hands back.
    """
    if value is None:
        return None
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc).isoformat()


def _uuid_str(value: Any) -> Optional[str]:
    if not value:
        return None
    return str(value)


def canonical_payload(
    *,
    sequence: Optional[int],
    created_at: Optional[datetime],
    action: str,
    user_id: Any = None,
    entity_type: str = "User",
    entity_id: Any = None,
    bid_id: Any = None,
    old_value: Optional[str] = None,
    new_value: Optional[str] = None,
    ip_address: Optional[str] = None,
    prev_hash: str = GENESIS_HASH,
) -> Dict[str, Any]:
    """Build the canonical (JSON-serialisable) payload of one audit block.

    Accepts either raw values or an ORM object's attribute values; UUIDs are
    stringified with ``str()`` so ``uuid.UUID`` and ``str`` hash identically.
    """
    return {
        "version": PAYLOAD_VERSION,
        "seq": sequence,
        "ts": _utc_iso(created_at),
        "action": action,
        "user_id": _uuid_str(user_id),
        "entity_type": entity_type,
        "entity_id": _uuid_str(entity_id),
        "bid_id": _uuid_str(bid_id),
        "old_value": old_value,
        "new_value": new_value,
        "ip_address": ip_address,
        "prev_hash": prev_hash,
    }


def serialize_payload(payload: Dict[str, Any]) -> str:
    """Deterministic JSON serialisation — identical dicts always hash alike."""
    return json.dumps(payload, sort_keys=True, ensure_ascii=True, default=str)


def compute_block_hash(prev_hash: str, payload: Dict[str, Any]) -> str:
    """SHA-256 over ``prev_hash`` + canonical payload."""
    return hashlib.sha256(f"{prev_hash}:{serialize_payload(payload)}".encode("utf-8")).hexdigest()


def payload_from_record(record: Any, prev_hash: str = GENESIS_HASH) -> Dict[str, Any]:
    """Canonical payload for a stored ``AuditLog`` row (read path)."""
    return canonical_payload(
        sequence=getattr(record, "sequence", None),
        created_at=getattr(record, "created_at", None),
        action=getattr(record, "action", "") or "",
        user_id=getattr(record, "user_id", None),
        entity_type=getattr(record, "entity_type", "") or "",
        entity_id=getattr(record, "entity_id", None),
        bid_id=getattr(record, "bid_id", None),
        old_value=getattr(record, "old_value", None),
        new_value=getattr(record, "new_value", None),
        ip_address=getattr(record, "ip_address", None),
        prev_hash=prev_hash,
    )


def expected_hash_for_record(record: Any, prev_hash: str = GENESIS_HASH) -> str:
    """Recompute the expected block hash of a stored record."""
    return compute_block_hash(prev_hash, payload_from_record(record, prev_hash))


# ---------------------------------------------------------------------------
# Backwards compatibility with records written by the broken v1 verifier
# ---------------------------------------------------------------------------

def legacy_expected_hash(record: Any, prev_hash: str = GENESIS_HASH) -> str:
    """The *v1* formula that ``api/audit.calculate_log_hash`` used to verify.

    Kept read-only so audit rows written before this module was introduced can
    still be recognised as intact instead of being reported as tampered.
    """
    chain_payload = (
        f"{prev_hash}:"
        f"{record.action}:"
        f"{record.user_id or ''}:"
        f"{record.entity_type}:"
        f"{record.entity_id or ''}:"
        f"{record.bid_id or ''}:"
        f"{record.new_value or ''}"
    )
    return hashlib.sha256(chain_payload.encode("utf-8")).hexdigest()


def verify_record(record: Any, prev_hash: str = GENESIS_HASH) -> Dict[str, Any]:
    """Verify one stored audit record against ``prev_hash``.

    Returns a dict with ``integrity_verified``, ``expected_hash`` and
    ``payload_version`` (1 = legacy formula, 2 = current formula).
    """
    recorded = getattr(record, "blockchain_hash", None)
    expected = expected_hash_for_record(record, prev_hash)
    if recorded == expected:
        return {
            "integrity_verified": True,
            "expected_hash": expected,
            "payload_version": PAYLOAD_VERSION,
            "legacy_record": False,
        }

    # Fall back to the v1 formula before declaring tampering.
    legacy = legacy_expected_hash(record, prev_hash)
    if recorded == legacy:
        return {
            "integrity_verified": True,
            "expected_hash": legacy,
            "payload_version": 1,
            "legacy_record": True,
        }

    return {
        "integrity_verified": False,
        "expected_hash": expected,
        "payload_version": PAYLOAD_VERSION,
        "legacy_record": False,
    }

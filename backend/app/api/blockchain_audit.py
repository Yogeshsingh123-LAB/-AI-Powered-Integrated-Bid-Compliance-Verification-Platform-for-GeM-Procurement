import hashlib
import uuid
from typing import Dict, List, Any, Optional
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.audit_log import AuditLog
from app.services.blockchain_audit_service import blockchain_ledger, MerkleTree

router = APIRouter(prefix="/v1/blockchain", tags=["Blockchain & Merkle Audit Trail Engine"])

class VerifyProofRequest(BaseModel):
    target_hash: str = Field(..., min_length=10, json_schema_extra={"example": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"})
    proof: List[Dict[str, str]] = Field(..., json_schema_extra={"example": [{"sibling_hash": "a1b2c3...", "direction": "right"}]})
    merkle_root: str = Field(..., json_schema_extra={"example": "f85c1e..."})

@router.get("/chain", response_model=Dict[str, Any])
def get_blockchain_ledger():
    """Lists generated blockchain ledger blocks, SHA-256 block hashes, and Merkle roots."""
    return {
        "channel": "gemchannel",
        "total_blocks": len(blockchain_ledger.blocks),
        "chain_validity": blockchain_ledger.validate_chain_integrity(),
        "blocks": blockchain_ledger.blocks
    }

@router.get("/merkle-tree/{bid_id}", response_model=Dict[str, Any])
def get_bid_merkle_tree(bid_id: str, db: Session = Depends(get_db)):
    """Constructs Merkle tree representation for a specific bid's verification audit logs."""
    try:
        bid_uuid = uuid.UUID(bid_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid bid_id UUID format: '{bid_id}'"
        )

    logs = db.query(AuditLog).filter(AuditLog.bid_id == bid_uuid).all()
    record_hashes = [log.blockchain_hash for log in logs if log.blockchain_hash]

    if not record_hashes:
        # Provide sample Merkle tree if no DB logs created yet
        record_hashes = [
            hashlib.sha256(f"DOC_UPLOAD:{bid_id}".encode('utf-8')).hexdigest(),
            hashlib.sha256(f"GSTIN_VERIFY:{bid_id}".encode('utf-8')).hexdigest(),
            hashlib.sha256(f"PAN_VERIFY:{bid_id}".encode('utf-8')).hexdigest(),
            hashlib.sha256(f"COMPLIANCE_SCORE_85:{bid_id}".encode('utf-8')).hexdigest()
        ]

    tree = MerkleTree(record_hashes)
    root_hash = tree.get_root_hash()

    target_sample = record_hashes[0]
    sample_proof = MerkleTree.generate_merkle_proof(record_hashes, target_sample)

    return {
        "bid_id": bid_id,
        "merkle_root": root_hash,
        "leaf_count": len(record_hashes),
        "leaf_hashes": record_hashes,
        "sample_proof_verification": {
            "target_hash": target_sample,
            "proof": sample_proof,
            "is_valid": MerkleTree.verify_merkle_proof(target_sample, sample_proof, root_hash)
        }
    }

@router.post("/verify-proof", response_model=Dict[str, Any])
def verify_record_merkle_proof(payload: VerifyProofRequest):
    """Cryptographically verifies a record's authenticity against expected Merkle Root."""
    is_valid = MerkleTree.verify_merkle_proof(
        target_hash=payload.target_hash,
        proof=payload.proof,
        expected_root_hash=payload.merkle_root
    )

    return {
        "target_hash": payload.target_hash,
        "merkle_root": payload.merkle_root,
        "is_authentic": is_valid,
        "status": "AUTHENTIC: RECORD VERIFIED AGAINST BLOCKCHAIN MERKLE ROOT" if is_valid else "TAMPERED: INVALID PROOF PATH"
    }

@router.get("/integrity-check", response_model=Dict[str, Any])
def system_blockchain_integrity_check():
    """Executes full system blockchain validation check across all blocks."""
    return blockchain_ledger.validate_chain_integrity()

@router.get("/hyperledger-export/{block_index}", response_model=Dict[str, Any])
def export_hyperledger_payload(block_index: int):
    """Exports block payload formatted for Hyperledger Fabric chaincode invocation."""
    payload = blockchain_ledger.export_hyperledger_fabric_payload(block_index)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Block index '{block_index}' not found."
        )
    return payload

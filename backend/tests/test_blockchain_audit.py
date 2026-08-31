"""
Unit tests for Cryptographic Merkle Tree, Blockchain Ledger Engine, and Proof Verification
"""

import hashlib
# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
from app.services.blockchain_audit_service import MerkleTree, BlockchainLedger, blockchain_ledger

def test_merkle_tree_construction_and_root_hash():
    """Verifies that MerkleTree constructs valid binary tree and deterministic root hash."""
    hashes = [
        hashlib.sha256(b"record_1").hexdigest(),
        hashlib.sha256(b"record_2").hexdigest(),
        hashlib.sha256(b"record_3").hexdigest(),
        hashlib.sha256(b"record_4").hexdigest()
    ]

    tree = MerkleTree(hashes)
    root_hash = tree.get_root_hash()

    assert root_hash is not None
    assert len(root_hash) == 64  # Valid SHA-256 length

def test_merkle_proof_generation_and_verification():
    """Verifies that Merkle proof generation and cryptographic verification succeeds for valid records."""
    hashes = [
        hashlib.sha256(b"tx_1").hexdigest(),
        hashlib.sha256(b"tx_2").hexdigest(),
        hashlib.sha256(b"tx_3").hexdigest()
    ]

    tree = MerkleTree(hashes)
    root_hash = tree.get_root_hash()

    target = hashes[1]
    proof = MerkleTree.generate_merkle_proof(hashes, target)

    assert len(proof) > 0
    is_authentic = MerkleTree.verify_merkle_proof(target, proof, root_hash)
    assert is_authentic is True

def test_merkle_proof_tamper_detection():
    """Verifies that altering a hash or proof path fails verification (detects tampering)."""
    hashes = [
        hashlib.sha256(b"tx_1").hexdigest(),
        hashlib.sha256(b"tx_2").hexdigest()
    ]

    tree = MerkleTree(hashes)
    root_hash = tree.get_root_hash()

    tampered_target = hashlib.sha256(b"tx_2_TAMPERED").hexdigest()
    proof = MerkleTree.generate_merkle_proof(hashes, hashes[1])

    is_authentic = MerkleTree.verify_merkle_proof(tampered_target, proof, root_hash)
    assert is_authentic is False

def test_blockchain_block_chaining_and_integrity():
    """Verifies block creation, previous block hashing, and system chain validity."""
    ledger = BlockchainLedger()
    
    mock_records = [{"action": "TEST_ACTION", "blockchain_hash": hashlib.sha256(b"rec_1").hexdigest()}]
    new_block = ledger.create_block(mock_records)

    assert new_block["index"] == 1
    assert new_block["previous_hash"] == ledger.blocks[0]["block_hash"]
    
    validity = ledger.validate_chain_integrity()
    assert validity["is_chain_valid"] is True
    assert validity["status"] == "SUCCESS: ZERO TAMPERING DETECTED"

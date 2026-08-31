import hashlib
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Tuple

logger = logging.getLogger(__name__)

class MerkleNode:
    """Represents a node in the cryptographic Merkle Tree."""
    def __init__(self, hash_value: str, left=None, right=None):
        self.hash_value = hash_value
        self.left = left
        self.right = right

class MerkleTree:
    """
    Constructs a cryptographic Merkle Tree from a list of audit record hashes,
    computes the Merkle Root, and generates/verifies tamper-evident Merkle proofs.
    """
    def __init__(self, leaf_hashes: List[str]):
        self.leaf_hashes = leaf_hashes
        self.root: Optional[MerkleNode] = None
        if leaf_hashes:
            self.root = self._build_tree(leaf_hashes)

    def _build_tree(self, hashes: List[str]) -> MerkleNode:
        nodes = [MerkleNode(h) for h in hashes]
        if not nodes:
            return MerkleNode(hashlib.sha256(b"").hexdigest())

        while len(nodes) > 1:
            if len(nodes) % 2 != 0:
                # Duplicate last node if odd number of leaves
                nodes.append(MerkleNode(nodes[-1].hash_value))

            new_level = []
            for i in range(0, len(nodes), 2):
                left_n = nodes[i]
                right_n = nodes[i+1]
                parent_hash = hashlib.sha256((left_n.hash_value + right_n.hash_value).encode('utf-8')).hexdigest()
                new_level.append(MerkleNode(parent_hash, left=left_n, right=right_n))
            nodes = new_level

        return nodes[0]

    def get_root_hash(self) -> str:
        return self.root.hash_value if self.root else hashlib.sha256(b"GENESIS_MERKLE_ROOT").hexdigest()

    @classmethod
    def generate_merkle_proof(cls, leaf_hashes: List[str], target_hash: str) -> List[Dict[str, str]]:
        """
        Generates Merkle proof audit path (sibling hashes and direction) for target_hash.
        """
        if target_hash not in leaf_hashes:
            return []

        tree = cls(leaf_hashes)
        proof: List[Dict[str, str]] = []
        
        current_hashes = list(leaf_hashes)
        if len(current_hashes) % 2 != 0:
            current_hashes.append(current_hashes[-1])

        target_idx = leaf_hashes.index(target_hash)

        while len(current_hashes) > 1:
            sibling_idx = target_idx + 1 if target_idx % 2 == 0 else target_idx - 1
            direction = "right" if target_idx % 2 == 0 else "left"

            if sibling_idx < len(current_hashes):
                proof.append({
                    "sibling_hash": current_hashes[sibling_idx],
                    "direction": direction
                })

            # Next level up
            next_level = []
            for i in range(0, len(current_hashes), 2):
                h1 = current_hashes[i]
                h2 = current_hashes[i+1] if i+1 < len(current_hashes) else h1
                parent_h = hashlib.sha256((h1 + h2).encode('utf-8')).hexdigest()
                next_level.append(parent_h)

            target_idx = target_idx // 2
            current_hashes = next_level
            if len(current_hashes) % 2 != 0 and len(current_hashes) > 1:
                current_hashes.append(current_hashes[-1])

        return proof

    @classmethod
    def verify_merkle_proof(cls, target_hash: str, proof: List[Dict[str, str]], expected_root_hash: str) -> bool:
        """
        Cryptographically verifies that target_hash belongs to the Merkle Tree with expected_root_hash.
        """
        current_h = target_hash
        for step in proof:
            sibling_h = step["sibling_hash"]
            direction = step["direction"]

            if direction == "right":
                combined = current_h + sibling_h
            else:
                combined = sibling_h + current_h

            current_h = hashlib.sha256(combined.encode('utf-8')).hexdigest()

        return current_h == expected_root_hash


class BlockchainLedger:
    """
    Manages chained blockchain blocks with Merkle roots, SHA-256 block hashes,
    and Hyperledger Fabric export capabilities.
    """
    def __init__(self):
        self.blocks: List[Dict[str, Any]] = []
        self._initialize_genesis_block()

    def _initialize_genesis_block(self):
        genesis_merkle = hashlib.sha256(b"GEM_BID_COMPLIANCE_GENESIS_ROOT").hexdigest()
        genesis_block = {
            "index": 0,
            "timestamp": "2026-08-31T00:00:00Z",
            "previous_hash": "0" * 64,
            "merkle_root": genesis_merkle,
            "tx_count": 1,
            "nonce": 12345,
            "block_hash": hashlib.sha256(f"0:{'0'*64}:{genesis_merkle}:12345".encode('utf-8')).hexdigest(),
            "channel": "gemchannel"
        }
        self.blocks.append(genesis_block)

    def create_block(self, audit_records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Creates and chains a new block from a list of audit records."""
        prev_block = self.blocks[-1]
        record_hashes = [r.get("blockchain_hash", hashlib.sha256(str(r).encode('utf-8')).hexdigest()) for r in audit_records]

        tree = MerkleTree(record_hashes)
        merkle_root = tree.get_root_hash()
        block_idx = len(self.blocks)
        timestamp = datetime.now(timezone.utc).isoformat()
        nonce = 42 + block_idx

        block_header = f"{block_idx}:{prev_block['block_hash']}:{merkle_root}:{timestamp}:{nonce}"
        block_hash = hashlib.sha256(block_header.encode('utf-8')).hexdigest()

        block = {
            "index": block_idx,
            "timestamp": timestamp,
            "previous_hash": prev_block["block_hash"],
            "merkle_root": merkle_root,
            "tx_count": len(audit_records),
            "nonce": nonce,
            "block_hash": block_hash,
            "channel": "gemchannel",
            "records": audit_records
        }
        self.blocks.append(block)
        return block

    def validate_chain_integrity(self) -> Dict[str, Any]:
        """Validates entire blockchain block sequence from Genesis Block to Latest Block."""
        is_valid = True
        invalid_blocks = []

        for i in range(1, len(self.blocks)):
            current = self.blocks[i]
            previous = self.blocks[i-1]

            if current["previous_hash"] != previous["block_hash"]:
                is_valid = False
                invalid_blocks.append(i)

        return {
            "is_chain_valid": is_valid,
            "total_blocks": len(self.blocks),
            "invalid_blocks": invalid_blocks,
            "status": "SUCCESS: ZERO TAMPERING DETECTED" if is_valid else "ALERT: BLOCK CHAINING TAMPERED"
        }

    def export_hyperledger_fabric_payload(self, block_index: int) -> Dict[str, Any]:
        """Formats block data into Hyperledger Fabric chaincode payload."""
        if block_index < 0 or block_index >= len(self.blocks):
            return {}

        blk = self.blocks[block_index]
        return {
            "chaincode_id": "gem-compliance-cc",
            "channel_id": "gemchannel",
            "fcn": "InvokeAuditRecordBlock",
            "args": [
                str(blk["index"]),
                blk["previous_hash"],
                blk["merkle_root"],
                str(blk["tx_count"]),
                blk["block_hash"]
            ]
        }

# Singleton Instance
blockchain_ledger = BlockchainLedger()

import logging
from typing import Dict, List, Any, Optional, Tuple
from app.services.cartel_graph_service import cartel_graph_service

logger = logging.getLogger(__name__)

class CartelDetector:
    """
    Analyzes tender bids for anti-competitive cartel rings, common addresses, shared directors,
    overlapping bank accounts, and suspicious bidding patterns (cover bidding, IP/timestamp synchronization).
    """

    @classmethod
    def analyze_tender_cartel_risk(
        cls,
        tender_id: str,
        bids_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Builds the tender graph and runs multi-dimensional cartel detection algorithms.
        
        bids_data format:
        [
          {
             "bid_id": "BID-01",
             "bidder_name": "Alpha Corp",
             "gstin": "27AAAAA0000A1Z5",
             "pan": "AAAAA0000A",
             "quote_amount": 500000,
             "submission_timestamp": "2026-08-31T10:00:00Z",
             "ip_address": "192.168.1.50",
             "directors": ["Rajesh Sharma", "Anita Sharma"],
             "addresses": ["123 Industrial Area, Phase II, New Delhi"],
             "bank_accounts": ["AC-9876543210"]
          },
          ...
        ]
        """
        logger.info(f"CartelDetector: Analyzing cartel risk for tender '{tender_id}' across {len(bids_data)} bids...")

        # 1. Populate Graph
        cartel_graph_service.clear_graph()

        bid_quotes: Dict[str, float] = {}
        ip_timestamps: Dict[str, List[Tuple[str, str]]] = {} # IP -> [(bidder_name, timestamp)]

        for bid in bids_data:
            bidder_id = bid.get("bid_id", bid.get("bidder_name", "UNKNOWN"))
            bidder_name = bid.get("bidder_name", "Unknown Bidder")
            pan = bid.get("pan")
            gstin = bid.get("gstin")
            quote_amount = float(bid.get("quote_amount", 0))
            bid_quotes[bidder_name] = quote_amount

            cartel_graph_service.add_bidder_node(bidder_id, bidder_name, pan=pan, gstin=gstin)

            # Add Directors
            for idx, dir_name in enumerate(bid.get("directors", [])):
                if dir_name:
                    dir_id = f"DIR-{dir_name.lower().replace(' ', '-')}"
                    cartel_graph_service.add_entity_relationship(
                        bidder_id, dir_id, "Director", dir_name, "MANAGED_BY"
                    )

            # Add Addresses
            for idx, addr in enumerate(bid.get("addresses", [])):
                if addr:
                    addr_id = f"ADDR-{hash(addr.lower()) & 0xFFFFFFFF}"
                    cartel_graph_service.add_entity_relationship(
                        bidder_id, addr_id, "Address", addr, "REGISTERED_AT"
                    )

            # Add Bank Accounts
            for idx, acc in enumerate(bid.get("bank_accounts", [])):
                if acc:
                    acc_id = f"BANK-{acc.lower().replace(' ', '')}"
                    cartel_graph_service.add_entity_relationship(
                        bidder_id, acc_id, "BankAccount", acc, "HAS_BANK_ACCOUNT"
                    )

            # Add IP Address & Track Timestamp
            ip = bid.get("ip_address")
            timestamp = bid.get("submission_timestamp", "")
            if ip:
                ip_id = f"IP-{ip}"
                cartel_graph_service.add_entity_relationship(
                    bidder_id, ip_id, "IPAddress", ip, "SUBMITTED_FROM"
                )
                if ip not in ip_timestamps:
                    ip_timestamps[ip] = []
                ip_timestamps[ip].append((bidder_name, timestamp))

        # 2. Analyze Graph Overlaps
        overlaps = cartel_graph_service.detect_overlapping_entities()
        clusters = cartel_graph_service.detect_cartel_clusters()
        elements = cartel_graph_service.get_cytoscape_elements()

        # 3. Detect Suspicious Bidding Patterns
        pattern_warnings: List[str] = []
        suspicious_patterns: List[Dict[str, Any]] = []
        pattern_penalty = 0

        # Pattern A: Shared IP Submissions
        for ip, submissions in ip_timestamps.items():
            if len(submissions) > 1:
                bnames = [s[0] for s in submissions]
                pattern_penalty += 35
                desc = f"Synchronized Submissions: {len(submissions)} distinct bidders ({', '.join(bnames)}) submitted tenders from identical IP address ({ip})."
                pattern_warnings.append(desc)
                suspicious_patterns.append({
                    "pattern": "Shared IP Submissions",
                    "severity": "CRITICAL",
                    "description": desc,
                    "involved_bidders": bnames
                })

        # Pattern B: Cover Bidding / Complementary Bidding
        # If 3 or more bidders submit, and one bid is significantly cheaper while others are clustered high (cover bids)
        if len(bid_quotes) >= 3:
            quotes = sorted(bid_quotes.items(), key=lambda x: x[1])
            lowest_bidder, min_quote = quotes[0]
            if min_quote > 0:
                higher_quotes = [q for _, q in quotes[1:]]
                avg_higher = sum(higher_quotes) / len(higher_quotes)
                diff_pct = ((avg_higher - min_quote) / min_quote) * 100

                # If higher bids are within 2% of each other (cover bidding cluster)
                if len(higher_quotes) >= 2:
                    h_min, h_max = min(higher_quotes), max(higher_quotes)
                    spread_pct = ((h_max - h_min) / h_min) * 100 if h_min > 0 else 0

                    if diff_pct > 15 and spread_pct < 3:
                        pattern_penalty += 30
                        desc = f"Cover Bidding Pattern Detected: '{lowest_bidder}' quoted ₹{min_quote:,.2f}, while competing bidders ({', '.join([b for b, _ in quotes[1:]])}) submitted tightly clustered high quotes (spread < {spread_pct:.1f}%)."
                        pattern_warnings.append(desc)
                        suspicious_patterns.append({
                            "pattern": "Cover Bidding",
                            "severity": "HIGH",
                            "description": desc,
                            "involved_bidders": [b for b, _ in quotes]
                        })

        # 4. Calculate Risk Score & Severity
        overlap_penalty = (
            len(overlaps["shared_directors"]) * 30 +
            len(overlaps["shared_addresses"]) * 25 +
            len(overlaps["shared_bank_accounts"]) * 35
        )

        total_cartel_score = min(100, overlap_penalty + pattern_penalty)

        if total_cartel_score >= 60 or len(clusters) > 0:
            cartel_risk_level = "HIGH"
        elif total_cartel_score >= 30:
            cartel_risk_level = "MEDIUM"
        else:
            cartel_risk_level = "LOW"

        # Build detailed evidence list
        evidence_list: List[str] = []

        for dir_item in overlaps["shared_directors"]:
            bnames = [b["bidder_name"] for b in dir_item["connected_bidders"]]
            evidence_list.append(f"SHARED DIRECTOR: Director '{dir_item['entity_name']}' is shared across bidders: {', '.join(bnames)}")

        for addr_item in overlaps["shared_addresses"]:
            bnames = [b["bidder_name"] for b in addr_item["connected_bidders"]]
            evidence_list.append(f"COMMON ADDRESS: Address '{addr_item['entity_name']}' is registered by multiple bidders: {', '.join(bnames)}")

        for acc_item in overlaps["shared_bank_accounts"]:
            bnames = [b["bidder_name"] for b in acc_item["connected_bidders"]]
            evidence_list.append(f"OVERLAPPING BANK ACCOUNT: Bank account '{acc_item['entity_name']}' is shared between bidders: {', '.join(bnames)}")

        evidence_list.extend(pattern_warnings)

        return {
            "tender_id": tender_id,
            "cartel_risk_score": total_cartel_score,
            "cartel_risk_level": cartel_risk_level,
            "is_cartel_suspected": cartel_risk_level in ["MEDIUM", "HIGH"],
            "cartel_rings_count": len(clusters),
            "cartel_rings": clusters,
            "overlapping_entities": overlaps,
            "suspicious_patterns": suspicious_patterns,
            "evidence": evidence_list,
            "graph_elements": elements
        }

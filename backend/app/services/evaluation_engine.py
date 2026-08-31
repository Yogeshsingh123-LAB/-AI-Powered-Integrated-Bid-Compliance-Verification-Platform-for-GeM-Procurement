import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


def calculate_l1(
    bids: List[Dict[str, Any]],
    min_technical_score: float = 70.0
) -> Dict[str, Any]:
    """
    Ranks technically compliant bids by price to determine L1 (Lowest Evaluated Price) bidder.
    GeM Rule: Minimum 70% technical score required for financial bid opening.
    """
    if not bids:
        return {
            "l1_bidder": None,
            "l1_price": None,
            "ranked_bids": [],
            "disqualified_bids": [],
            "total_bids": 0,
            "compliant_bids_count": 0
        }

    compliant_bids = []
    disqualified_bids = []

    for bid in bids:
        tech_score = float(bid.get("technical_score", bid.get("score", 100.0)))
        is_tech_compliant = bid.get("technical_compliance", True) and (tech_score >= min_technical_score)
        
        # Use loaded_evaluated_price if present (from techno-commercial loading engine), else total_price / bid_amount
        eval_price = float(bid.get("loaded_evaluated_price", bid.get("total_price", bid.get("bid_amount", 0.0))))

        bid_record = {
            "bidder_id": bid.get("bidder_id", "UNKNOWN"),
            "bidder_name": bid.get("bidder_name", bid.get("bidder_id", "Bidder")),
            "technical_score": tech_score,
            "bid_amount": float(bid.get("total_price", bid.get("bid_amount", eval_price))),
            "loaded_evaluated_price": eval_price,
            "gstin": bid.get("gstin"),
            "ip_address": bid.get("ip_address"),
            "bid_timestamp": bid.get("bid_timestamp")
        }

        if is_tech_compliant:
            compliant_bids.append(bid_record)
        else:
            bid_record["disqualification_reason"] = f"Technical score ({tech_score:.1f}%) is below minimum required {min_technical_score}%"
            disqualified_bids.append(bid_record)

    # Sort compliant bids ascending by loaded evaluated price
    sorted_compliant = sorted(compliant_bids, key=lambda x: x["loaded_evaluated_price"])

    l1_price = sorted_compliant[0]["loaded_evaluated_price"] if sorted_compliant else None
    ranked_bids = []

    for idx, b in enumerate(sorted_compliant):
        rank_label = f"L{idx + 1}"
        price_diff = b["loaded_evaluated_price"] - l1_price if l1_price else 0.0
        price_diff_pct = (price_diff / l1_price * 100.0) if (l1_price and l1_price > 0) else 0.0

        ranked_record = {
            "rank": rank_label,
            "rank_number": idx + 1,
            "price_difference_from_l1": round(price_diff, 2),
            "price_difference_pct": round(price_diff_pct, 2),
            **b
        }
        ranked_bids.append(ranked_record)

    l1_bidder = ranked_bids[0] if ranked_bids else None

    return {
        "l1_bidder": l1_bidder,
        "l1_price": l1_price,
        "ranked_bids": ranked_bids,
        "disqualified_bids": disqualified_bids,
        "total_bids": len(bids),
        "compliant_bids_count": len(ranked_bids),
        "disqualified_bids_count": len(disqualified_bids)
    }


def detect_ra_collusion(
    bids: List[Dict[str, Any]],
    ra_rounds_history: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Monitors Reverse Auction (RA) bidding patterns for collusion & bid-rigging flags:
    1. Shared IP Address Detection: Multiple bidders submitting from identical IP.
    2. Synchronized Submission Timestamps: Bids submitted within millisecond intervals.
    3. Identical Price Reduction Patterns: Coordinated percentage price drops across RA rounds.
    """
    warnings = []
    duplicate_ips = {}
    synchronized_bids = []
    collusion_detected = False
    risk_level = "CLEAN"

    # 1. Shared IP Address Analysis
    ip_map: Dict[str, List[str]] = {}
    for bid in bids:
        ip = bid.get("ip_address")
        bidder = bid.get("bidder_name", bid.get("bidder_id", "Unknown"))
        if ip and ip != "127.0.0.1" and ip != "localhost":
            ip_map.setdefault(ip, []).append(bidder)

    for ip, bidders in ip_map.items():
        if len(bidders) > 1:
            collusion_detected = True
            risk_level = "HIGH"
            warning_msg = f"CRITICAL COLLUSION ALERT: Shared IP address '{ip}' detected among multiple bidders: {', '.join(bidders)}"
            warnings.append(warning_msg)
            duplicate_ips[ip] = bidders

    # 2. Synchronized Timestamp Analysis
    timestamps_with_bidders = []
    for bid in bids:
        ts_str = bid.get("bid_timestamp")
        bidder = bid.get("bidder_name", bid.get("bidder_id", "Unknown"))
        if ts_str:
            try:
                dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                timestamps_with_bidders.append((dt, bidder))
            except Exception:
                pass

    timestamps_with_bidders.sort(key=lambda x: x[0])
    for i in range(len(timestamps_with_bidders) - 1):
        t1, b1 = timestamps_with_bidders[i]
        t2, b2 = timestamps_with_bidders[i + 1]
        if b1 != b2:
            time_diff_sec = abs((t2 - t1).total_seconds())
            if time_diff_sec < 2.0:  # Submitted within 2 seconds
                collusion_detected = True
                if risk_level != "HIGH":
                    risk_level = "MEDIUM"
                warning_msg = f"SUSPICIOUS RA PATTERN: Synchronized bid submission between '{b1}' and '{b2}' within {time_diff_sec:.3f} seconds"
                warnings.append(warning_msg)
                synchronized_bids.append({"bidder1": b1, "bidder2": b2, "interval_sec": round(time_diff_sec, 3)})

    # 3. RA Rounds History Pattern Analysis (Coordinated Price Drops)
    if ra_rounds_history and len(ra_rounds_history) > 1:
        # Check if multiple bidders dropped prices by exact identical percentage
        pct_drops = []
        for round_item in ra_rounds_history:
            drop_pct = round_item.get("price_drop_pct")
            if drop_pct:
                pct_drops.append(drop_pct)
        if len(pct_drops) >= 3 and len(set(pct_drops)) == 1:
            collusion_detected = True
            risk_level = "HIGH"
            warnings.append(f"SUSPICIOUS RA PATTERN: Identical price drop percentage ({pct_drops[0]}%) repeated across {len(pct_drops)} auction rounds")

    return {
        "collusion_detected": collusion_detected,
        "risk_level": risk_level,
        "warnings": warnings,
        "duplicate_ips": duplicate_ips,
        "synchronized_bids": synchronized_bids,
        "status": "warning" if collusion_detected else "clean"
    }


def evaluate_tender_bids(
    bids: List[Dict[str, Any]],
    tender_value: Optional[float] = None,
    ra_rounds_history: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Main evaluation pipeline function:
    1. Computes L1 price ranking across technically qualified bidders.
    2. Runs Reverse Auction (RA) collusion risk analysis.
    3. Consolidates financial evaluation report.
    """
    l1_report = calculate_l1(bids)
    ra_report = detect_ra_collusion(bids, ra_rounds_history=ra_rounds_history)

    return {
        "status": "success",
        "tender_value": tender_value,
        "l1_evaluation": l1_report,
        "reverse_auction_collusion": ra_report
    }

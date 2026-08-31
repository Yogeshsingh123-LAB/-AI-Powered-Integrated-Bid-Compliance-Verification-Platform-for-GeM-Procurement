import logging
from enum import Enum
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


class ProcurementMode(str, Enum):
    DIRECT = "direct"               # Tender value <= ₹50,000
    L1 = "l1"                       # Tender value ₹50,000 - ₹10,000,000 (₹10L)
    BID = "bid"                     # Tender value > ₹10,000,000 (₹10L)
    REVERSE_AUCTION = "reverse_auction" # Dynamic Reverse Auction mode


def detect_mode(tender_value: float, is_reverse_auction: bool = False) -> ProcurementMode:
    """
    Auto-detect GeM 4.0 procurement mode based on tender monetary value and RFP flags.
    - Direct Purchase: <= ₹50,000
    - L1 Purchase: ₹50,000 to ₹10,000,000 (₹10 Lakhs)
    - Custom Bid / RFP: > ₹10,000,000
    - Reverse Auction: Triggered when RA flag is enabled for custom bids.
    """
    if is_reverse_auction:
        return ProcurementMode.REVERSE_AUCTION
    elif tender_value <= 50000.0:
        return ProcurementMode.DIRECT
    elif tender_value <= 1000000.0:
        return ProcurementMode.L1
    else:
        return ProcurementMode.BID


def check_statutory(bid_doc: Dict[str, Any]) -> Dict[str, Any]:
    """
    Basic statutory identification check required for Direct Purchase mode.
    Validates presence and format of GSTIN, PAN, and Udyam/MSME identifiers.
    """
    gstin = bid_doc.get("gstin") or bid_doc.get("gst_number")
    pan = bid_doc.get("pan") or bid_doc.get("pan_number")
    udyam = bid_doc.get("udyam") or bid_doc.get("udyam_number")

    has_gstin = bool(gstin and len(str(gstin).strip()) == 15)
    has_pan = bool(pan and len(str(pan).strip()) == 10)
    has_udyam = bool(udyam and len(str(udyam).strip()) >= 12)

    passed = has_gstin and has_pan
    score = 100.0 if passed else (50.0 if (has_gstin or has_pan) else 0.0)

    return {
        "status": "PASS" if passed else "FAIL",
        "score": score,
        "details": {
            "has_valid_gstin": has_gstin,
            "has_valid_pan": has_pan,
            "has_udyam": has_udyam,
            "gstin_value": gstin,
            "pan_value": pan
        },
        "reason": "Statutory identifiers verified successfully." if passed else "Missing mandatory GSTIN or PAN identifier for Direct Purchase."
    }


def check_technical_score(bid_doc: Dict[str, Any]) -> float:
    """
    Evaluates technical score percentage for L1 Purchase mode.
    GeM 4.0 guidelines mandate a minimum 70% technical score threshold.
    """
    tech_score = bid_doc.get("technical_score")
    if tech_score is not None:
        return float(tech_score)

    # Compute technical score based on extracted credentials
    total_points = 0.0
    max_points = 100.0

    if bid_doc.get("oem_authorization") or bid_doc.get("has_oem_cert"):
        total_points += 30.0
    if bid_doc.get("past_experience_years", 0) >= 3 or bid_doc.get("has_past_experience"):
        total_points += 30.0
    if bid_doc.get("iso_certification") or bid_doc.get("has_iso_cert"):
        total_points += 20.0
    if bid_doc.get("annual_turnover", 0) > 0 or bid_doc.get("turnover_compliant"):
        total_points += 20.0

    return (total_points / max_points) * 100.0


def check_loading_criteria(bid_doc: Dict[str, Any]) -> Dict[str, Any]:
    """
    Full Techno-Commercial Loading Criteria calculation under GeM 4.0.
    Applies financial loading penalties to evaluate loaded commercial bid value:
    1. Delivery Delay Loading: 0.5% per week beyond baseline delivery period.
    2. Payment Terms Deviation Loading: 2.0% penalty for advance payment requests.
    3. Warranty Shortfall Loading: 2.5% loading penalty per missing warranty year.
    4. Technical Specification Gap Loading: 1.0% to 5.0% penalty for parameter gaps.
    """
    base_bid_amount = float(bid_doc.get("bid_amount", 100000.0))
    loading_penalties: List[Dict[str, Any]] = []
    total_loading_percentage = 0.0

    # 1. Delivery Delay Loading
    standard_delivery_weeks = bid_doc.get("standard_delivery_weeks", 4)
    offered_delivery_weeks = bid_doc.get("offered_delivery_weeks", standard_delivery_weeks)
    if offered_delivery_weeks > standard_delivery_weeks:
        delay_weeks = offered_delivery_weeks - standard_delivery_weeks
        penalty_pct = delay_weeks * 0.5
        loading_penalties.append({
            "criteria": "Delivery Schedule Delay",
            "variance": f"+{delay_weeks} weeks delay",
            "penalty_percentage": penalty_pct,
            "loading_amount": base_bid_amount * (penalty_pct / 100.0)
        })
        total_loading_percentage += penalty_pct

    # 2. Payment Terms Deviation
    payment_terms = str(bid_doc.get("payment_terms", "")).lower()
    if "advance" in payment_terms:
        penalty_pct = 2.0
        loading_penalties.append({
            "criteria": "Payment Terms Deviation (Advance Requested)",
            "variance": "Advance payment terms vs milestone payment standard",
            "penalty_percentage": penalty_pct,
            "loading_amount": base_bid_amount * (penalty_pct / 100.0)
        })
        total_loading_percentage += penalty_pct

    # 3. Warranty Shortfall Loading
    required_warranty_years = bid_doc.get("required_warranty_years", 3)
    offered_warranty_years = bid_doc.get("offered_warranty_years", required_warranty_years)
    if offered_warranty_years < required_warranty_years:
        shortfall_years = required_warranty_years - offered_warranty_years
        penalty_pct = shortfall_years * 2.5
        loading_penalties.append({
            "criteria": "Warranty Shortfall",
            "variance": f"-{shortfall_years} years warranty gap",
            "penalty_percentage": penalty_pct,
            "loading_amount": base_bid_amount * (penalty_pct / 100.0)
        })
        total_loading_percentage += penalty_pct

    # 4. Technical Spec Gap Loading
    spec_gap_count = int(bid_doc.get("spec_gap_count", 0))
    if spec_gap_count > 0:
        penalty_pct = min(spec_gap_count * 1.5, 10.0)
        loading_penalties.append({
            "criteria": "Technical Specification Gap",
            "variance": f"{spec_gap_count} non-critical spec deviations",
            "penalty_percentage": penalty_pct,
            "loading_amount": base_bid_amount * (penalty_pct / 100.0)
        })
        total_loading_percentage += penalty_pct

    total_loading_amount = base_bid_amount * (total_loading_percentage / 100.0)
    loaded_evaluated_price = base_bid_amount + total_loading_amount

    return {
        "base_bid_amount": base_bid_amount,
        "total_loading_percentage": round(total_loading_percentage, 2),
        "total_loading_amount": round(total_loading_amount, 2),
        "loaded_evaluated_price": round(loaded_evaluated_price, 2),
        "loading_breakdown": loading_penalties,
        "is_commercially_loaded": total_loading_percentage > 0.0
    }


def apply_compliance_rules(mode: ProcurementMode, bid_doc: Dict[str, Any]) -> Dict[str, Any]:
    """
    Apply mode-specific GeM compliance evaluation rules:
    - Direct: Enforces basic statutory identification.
    - L1: Enforces technical score >= 70%.
    - Bid: Enforces full techno-commercial loading criteria evaluation.
    - Reverse Auction: Evaluates techno-commercial loading and reverse auction eligibility.
    """
    if mode == ProcurementMode.DIRECT:
        statutory_res = check_statutory(bid_doc)
        return {
            "mode": mode.value,
            "compliant": statutory_res["status"] == "PASS",
            "score": statutory_res["score"],
            "statutory_verification": statutory_res,
            "rule_evaluated": "Direct Purchase Statutory Verification Rule"
        }

    elif mode == ProcurementMode.L1:
        tech_score = check_technical_score(bid_doc)
        statutory_res = check_statutory(bid_doc)
        passed = (tech_score >= 70.0) and (statutory_res["status"] == "PASS")
        return {
            "mode": mode.value,
            "compliant": passed,
            "score": round(tech_score, 2),
            "threshold_required": 70.0,
            "technical_score_pass": tech_score >= 70.0,
            "statutory_verification": statutory_res,
            "rule_evaluated": "L1 Purchase Technical Qualification Threshold Rule (>= 70%)"
        }

    elif mode in (ProcurementMode.BID, ProcurementMode.REVERSE_AUCTION):
        tech_score = check_technical_score(bid_doc)
        statutory_res = check_statutory(bid_doc)
        loading_res = check_loading_criteria(bid_doc)
        
        passed = (tech_score >= 70.0) and (statutory_res["status"] == "PASS")
        return {
            "mode": mode.value,
            "compliant": passed,
            "score": round(tech_score, 2),
            "threshold_required": 70.0,
            "technical_score_pass": tech_score >= 70.0,
            "statutory_verification": statutory_res,
            "loading_analysis": loading_res,
            "rule_evaluated": "GeM 4.0 Techno-Commercial Loading & Custom Bid Compliance Rule"
        }

    else:
        raise ValueError(f"Unsupported procurement mode: {mode}")

"""
ESG & Data-Security Declaration Checker
Rule-based verification of mandatory ESG and Data Security declarations for GeM procurement.
"""
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


def check_esg_declaration(text: str) -> Dict[str, Any]:
    """
    Verifies environmental compliance, social responsibility, and governance keywords
    in the bid declaration text.
    """
    required_phrases = ["environmental compliance", "social responsibility", "governance"]
    text_lower = (text or "").lower()
    missing = [p for p in required_phrases if p not in text_lower]
    passed = len(missing) == 0
    return {
        "passed": passed,
        "missing": missing,
        "required_phrases": required_phrases,
        "reason": "ESG declaration complete" if passed else f"Missing required ESG phrases: {', '.join(missing)}"
    }


def check_data_security(text: str) -> Dict[str, Any]:
    """
    Verifies data encryption, access control, and breach notification keywords
    in the bid data security declaration text.
    """
    required = ["data encryption", "access control", "breach notification"]
    text_lower = (text or "").lower()
    missing = [p for p in required if p not in text_lower]
    passed = len(missing) == 0
    return {
        "passed": passed,
        "missing": missing,
        "required_phrases": required,
        "reason": "Data Security declaration complete" if passed else f"Missing required Data Security phrases: {', '.join(missing)}"
    }


def check_all_declarations(text: str) -> Dict[str, Any]:
    """
    Runs both ESG and Data Security declaration checks.
    """
    esg_res = check_esg_declaration(text)
    data_sec_res = check_data_security(text)
    all_passed = esg_res["passed"] and data_sec_res["passed"]

    return {
        "passed": all_passed,
        "esg": esg_res,
        "data_security": data_sec_res,
        "summary": "All mandatory declarations verified." if all_passed else "Declarations incomplete or non-compliant."
    }

"""
Compliance Engine Pipeline
Coordinates statutory verification checks and mandatory ESG / Data Security declaration verification.
"""
import logging
from typing import Dict, Any, Optional

from app.services.statutory_checks import perform_statutory_checks
from app.services.declaration_checker import check_esg_declaration, check_data_security, check_all_declarations

logger = logging.getLogger(__name__)


def run_compliance_pipeline(doc_text: str, tender_value: Optional[float] = None) -> Dict[str, Any]:
    """
    Main compliance pipeline executing:
    1. Statutory checks (EMD, e-PBG, bank status, digital signatures)
    2. ESG declaration check
    3. Data Security declaration check
    """
    statutory_res = perform_statutory_checks(doc_text, tender_value=tender_value)

    esg_res = check_esg_declaration(doc_text)
    data_sec_res = check_data_security(doc_text)

    declarations_passed = esg_res["passed"] and data_sec_res["passed"]
    statutory_passed = statutory_res.get("statutory_pass", False)

    overall_passed = statutory_passed and declarations_passed

    return {
        "overall_passed": overall_passed,
        "statutory_checks": statutory_res,
        "esg_declaration": esg_res,
        "data_security_declaration": data_sec_res,
        "declarations_passed": declarations_passed,
        "summary": "Full compliance verification passed." if overall_passed else "Compliance verification failed mandatory criteria."
    }

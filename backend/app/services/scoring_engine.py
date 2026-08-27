import logging
from typing import Dict, List, Any
from app.scoring import ComplianceScorer

logger = logging.getLogger(__name__)

class ScoringEngine:
    """
    Wrapper for backward compatibility, delegating compliance scoring to app.scoring.ComplianceScorer.
    """
    @staticmethod
    def calculate_compliance_score(verification_results: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
        return ComplianceScorer.calculate_compliance_score(verification_results)

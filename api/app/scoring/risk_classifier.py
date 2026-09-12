import logging

logger = logging.getLogger(__name__)

class RiskClassifier:
    """
    Classifies the final risk level (LOW, MEDIUM, or HIGH) based on the calculated compliance score,
    blacklisting status, registry active status, and name alignment check.
    """
    
    @staticmethod
    def classify_risk(score: float, has_status_issue: bool, has_name_mismatch: bool, is_blacklisted: bool) -> str:
        """Determines the risk classification for the bidding vendor."""
        logger.info(
            f"RiskClassifier: Classifying risk. Score={score}, StatusIssue={has_status_issue}, "
            f"NameMismatch={has_name_mismatch}, Blacklisted={is_blacklisted}"
        )
        
        if is_blacklisted:
            return "HIGH"
            
        if has_status_issue:
            # Active status issues (Inactive / Suspended registrations) automatically flag HIGH risk
            return "HIGH"
            
        if score >= 85 and not has_name_mismatch:
            return "LOW"
        elif score >= 50:
            return "MEDIUM"
        else:
            return "HIGH"

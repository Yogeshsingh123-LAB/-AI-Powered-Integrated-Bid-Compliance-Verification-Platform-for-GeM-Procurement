import logging

logger = logging.getLogger(__name__)

def risk_level_for_score(score: float) -> str:
    """
    CENTRALIZED score-to-risk mapping (single source of truth).

    Bands come from app.core.config settings so the API and any future clients
    always agree:
        LOW: score >= RISK_LOW_MIN (default 90)
        MEDIUM: score >= RISK_MEDIUM_MIN (default 75)
        HIGH: score >= RISK_HIGH_MIN (default 50)
        CRITICAL: below that

    Every endpoint and service that displays a risk level MUST call this
    function instead of hardcoding thresholds.
    """
    from app.core.config import settings
    value = float(score or 0.0)
    if value >= settings.RISK_LOW_MIN:
        return "LOW"
    if value >= settings.RISK_MEDIUM_MIN:
        return "MEDIUM"
    if value >= settings.RISK_HIGH_MIN:
        return "HIGH"
    return "CRITICAL"


class RiskClassifier:
    """
    Classifies the final risk level based on the calculated compliance score,
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

        base = risk_level_for_score(score)
        if base == "CRITICAL":
            return "HIGH"
        if has_name_mismatch and base == "LOW":
            return "MEDIUM"
        return base

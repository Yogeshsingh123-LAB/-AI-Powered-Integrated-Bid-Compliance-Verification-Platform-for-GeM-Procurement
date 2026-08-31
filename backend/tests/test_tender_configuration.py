"""
Unit tests for Tender Configuration Engine & Custom Rule Scorer
"""

# pyrefly: ignore [missing-import]
import pytest
from app.scoring.compliance_scorer import ComplianceScorer

def test_evaluate_custom_rules_met():
    """Verifies that matching custom rules evaluate to 100% score."""
    custom_rules = [
        {
            "rule_id": "CR-01",
            "name": "Minimum Financial Turnover",
            "field": "turnover",
            "operator": ">=",
            "value": 50,
            "weight": 20
        }
    ]
    semantic_eval = {"summary": "Bidder presents 75 Lakhs annual turnover experience."}
    verification_results = {"gstin": [{"verified": True}]}

    score, deductions = ComplianceScorer.evaluate_custom_rules(custom_rules, semantic_eval, verification_results)
    assert score == 100
    assert len(deductions) == 0

def test_evaluate_custom_rules_unmet():
    """Verifies that unmet custom rules generate specific score deductions."""
    custom_rules = [
        {
            "rule_id": "CR-02",
            "name": "OEM Authorization Letter",
            "field": "oem_authorization",
            "operator": "==",
            "value": "Required",
            "weight": 25
        }
    ]
    semantic_eval = {"summary": "No OEM authorization text located."}
    verification_results = {}

    score, deductions = ComplianceScorer.evaluate_custom_rules(custom_rules, semantic_eval, verification_results)
    assert score == 0
    assert len(deductions) == 1
    assert "Custom Rule Unmet" in deductions[0]

def test_custom_weighted_scoring_calculation():
    """Verifies dynamic buyer-configured scoring weight calculations."""
    verification_results = {
        "gstin": [{"verified": True}],
        "pan": [{"verified": True}],
        "udyam": [{"verified": True}],
        "aadhaar": []
    }
    semantic_eval = {"summary": "Compliant bid with turnover experience and OEM authorization."}
    tender_config = {
        "scoring_weights": {
            "completeness": 25,
            "verification": 35,
            "integrity": 20,
            "custom_rules": 20
        },
        "custom_rules": [
            {"rule_id": "CR-01", "name": "Min Turnover", "field": "turnover", "operator": ">=", "value": 50, "weight": 20}
        ]
    }

    report = ComplianceScorer.calculate_compliance_score(
        verification_results=verification_results,
        semantic_analysis=semantic_eval,
        tender_config=tender_config
    )

    assert "score" in report
    assert report["score"] >= 70

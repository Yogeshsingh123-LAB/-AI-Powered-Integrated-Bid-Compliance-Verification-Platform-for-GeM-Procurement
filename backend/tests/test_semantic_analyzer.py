# pyrefly: ignore [missing-import]
import pytest
from app.ai_engine.semantic_analyzer import SemanticRFPComparator, DEFAULT_GEM_RFP_CLAUSES
from app.scoring.compliance_scorer import ComplianceScorer


def test_semantic_rfp_comparator_full_match():
    sample_text = """
    TECHGOV SOLUTIONS PVT LTD
    GSTIN: 27AAPCS1234M1Z5 | PAN: AAPCS1234M
    We are a registered MSE Manufacturer under Udyam Registration UDYAM-MH-12-0012345 with 8 years of annual turnover experience in government IT procurement.
    We hereby attach our OEM authorization certificate and confirm we are not blacklisted or debarred by any government department.
    We confirm compliance with Land Border Sharing restrictions under GFR Rule 144(xi) and provide EMD / Bank Guarantee payment exemption proof under MSE manufacturer status.
    """

    result = SemanticRFPComparator.evaluate_bid_against_rfp(sample_text)

    assert result["semantic_score"] >= 80
    assert result["met_clauses"] >= 4
    assert len(result["clause_details"]) == len(DEFAULT_GEM_RFP_CLAUSES)
    for clause in result["clause_details"]:
        assert "status" in clause
        assert "evidence_snippet" in clause


def test_semantic_rfp_comparator_partial_match():
    sample_text = "Only GSTIN 27AAPCS1234M1Z5 provided."
    result = SemanticRFPComparator.evaluate_bid_against_rfp(sample_text)

    assert result["semantic_score"] < 70
    assert result["met_clauses"] < len(DEFAULT_GEM_RFP_CLAUSES)


def test_semantic_rfp_comparator_empty():
    result = SemanticRFPComparator.evaluate_bid_against_rfp("")
    assert result["semantic_score"] == 0
    assert result["met_clauses"] == 0


def test_compliance_scorer_with_semantic_analysis():
    verification_results = {
        "gstin": [{"verified": True}],
        "pan": [{"verified": True}],
        "udyam": [{"verified": True}],
        "aadhaar": []
    }
    semantic_eval = SemanticRFPComparator.evaluate_bid_against_rfp("GSTIN PAN Udyam turnover experience OEM non-blacklisted declaration.")
    
    score_report = ComplianceScorer.calculate_compliance_score(
        verification_results=verification_results,
        semantic_analysis=semantic_eval
    )

    assert "semantic_analysis" in score_report
    assert "semantic_rfp_alignment" in score_report["breakdown"]

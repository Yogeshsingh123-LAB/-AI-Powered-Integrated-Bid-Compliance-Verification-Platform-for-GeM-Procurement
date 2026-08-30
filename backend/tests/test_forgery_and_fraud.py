import pytest
from app.ai_engine.forgery_detector import ForgeryDetector
from app.scoring.fraud_detector import ProcurementFraudDetector
from app.scoring import ComplianceScorer

def test_forgery_detector_invalid_bytes():
    res = ForgeryDetector.analyze_pdf_bytes(b"")
    assert res["authentic"] is False
    assert res["risk_level"] == "CRITICAL"

def test_fraud_detector_fuzzy_matching():
    extracted = {"gstin": ["27AAPCS1234M1Z5"], "pan": ["AAPCS1234M"], "udyam": []}
    verification = {
        "gstin": [{"found": True, "data": {"legal_name": "Acme Tech Solutions Private Limited"}}],
        "pan": [{"found": True, "data": {"name": "Acme Tech Solutions Private Limited"}}]
    }
    
    # Test compliant match
    res = ProcurementFraudDetector.detect_fraud_and_collusion(
        extracted_identifiers=extracted,
        current_bidder_name="Acme Tech Solutions Private Limited",
        verification_data=verification
    )
    assert res["is_collusion_risk"] is False
    assert res["fraud_penalty"] == 0

def test_fraud_detector_name_mismatch():
    extracted = {"gstin": ["27AAPCS1234M1Z5"], "pan": ["AAACV9876K"], "udyam": []}
    verification = {
        "gstin": [{"found": True, "data": {"legal_name": "Acme Tech Solutions Private Limited"}}],
        "pan": [{"found": True, "data": {"name": "Vanguard Director Unknown Name"}}]
    }
    
    res = ProcurementFraudDetector.detect_fraud_and_collusion(
        extracted_identifiers=extracted,
        current_bidder_name="Shell Company Traders",
        verification_data=verification
    )
    assert res["fraud_penalty"] > 0
    assert len(res["name_mismatch_warnings"]) > 0

def test_compliance_scorer_with_forgery_and_fraud():
    verification = {
        "gstin": [{"verified": True, "data": {"gstin": "27AAPCS1234M1Z5", "status": "Active", "legal_name": "Acme Tech"}}],
        "pan": [{"verified": True, "data": {"pan": "AAPCS1234M", "status": "Active", "name": "Acme Tech"}}],
        "udyam": []
    }
    forgery_analysis = {
        "authentic": False,
        "forgery_score": 50,
        "anomalies": ["Post-issuance modification detected"]
    }
    fraud_analysis = {
        "is_collusion_risk": False,
        "fraud_penalty": 15,
        "all_warnings": ["Identity Verification Warning: Submitted bidder name differs from GST title"]
    }
    
    score_res = ComplianceScorer.calculate_compliance_score(
        verification_results=verification,
        forgery_analysis=forgery_analysis,
        fraud_analysis=fraud_analysis
    )
    assert score_res["score"] < 100
    assert any("FORGERY DETECTED" in rec for rec in score_res["recommendations"])

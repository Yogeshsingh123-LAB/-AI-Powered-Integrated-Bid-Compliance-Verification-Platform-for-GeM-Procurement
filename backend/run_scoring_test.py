import sys
import os
import logging
import json

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def run_tests():
    logger.info("Starting verification tests for app.scoring...")
    
    try:
        from app.scoring import ComplianceScorer, RiskClassifier, RecommendationEngine
        from app.services.scoring_engine import ScoringEngine
        logger.info("Successfully imported all scoring module components and services!")
    except Exception as e:
        logger.error(f"Failed to import scoring components: {e}")
        sys.exit(1)

    # 1. Mock active and perfect results (Low Risk)
    perfect_verification = {
        "gstin": [{"verified": True, "found": True, "data": {"gstin": "27AAPCS1234M1Z5", "status": "Active", "compliance_record": "Excellent", "legal_name": "Acme Tech Solutions Private Limited"}}],
        "pan": [{"verified": True, "found": True, "data": {"pan": "AAPCS1234M", "status": "Active", "name": "Acme Tech Solutions Private Limited"}}],
        "udyam": [{"verified": True, "found": True, "data": {"udyam_number": "UDYAM-MH-12-0012345", "status": "Active", "enterprise_name": "Acme Tech Solutions Private Limited"}}]
    }
    
    # 2. Mock risky results (High Risk - name mismatch + suspended GSTIN + blacklisted)
    risky_verification = {
        "gstin": [{"verified": True, "found": True, "data": {"gstin": "22AAAAA1111A1Z1", "status": "Suspended", "compliance_record": "Poor", "legal_name": "Global Traders Inc", "blacklisted": True}}],
        "pan": [{"verified": True, "found": True, "data": {"pan": "AAAAA1111A", "status": "Active", "name": "Global Traders Inc"}}],
        "udyam": [{"verified": True, "found": True, "data": {"udyam_number": "UDYAM-DL-01-0098765", "status": "Active", "enterprise_name": "Different Name LLC"}}]
    }

    # 3. Test perfect case scoring
    logger.info("Testing perfect case compliance scoring...")
    perfect_res = ComplianceScorer.calculate_compliance_score(perfect_verification)
    logger.info(f"Perfect Case Report:\n{json.dumps(perfect_res, indent=2)}")
    
    assert perfect_res["score"] == 100, f"Expected 100, got {perfect_res['score']}"
    assert perfect_res["risk_level"] == "LOW"
    assert len(perfect_res["deductions"]) == 0
    assert "compliant" in perfect_res["recommendations"][0].lower()

    # 4. Test risky case scoring
    logger.info("Testing risky case compliance scoring...")
    risky_res = ComplianceScorer.calculate_compliance_score(risky_verification)
    logger.info(f"Risky Case Report:\n{json.dumps(risky_res, indent=2)}")
    
    # Baseline score calculation: 
    # Completeness = 30, Verification = 40 (all verified). Baseline integrity = 30.
    # Deductions:
    # - Blacklisted: Integrity = 0 (-30)
    # - GSTIN status Suspended: -10
    # - GSTIN compliance Poor: -10
    # - Name mismatch: -10
    # Total integrity score clamped to 0. Total score = 70.
    assert risky_res["score"] == 70, f"Expected 70, got {risky_res['score']}"
    assert risky_res["risk_level"] == "HIGH"
    assert len(risky_res["deductions"]) > 0
    
    # Verify that blacklisting, status, and name mismatch recommendations exist
    recommendations_str = " ".join(risky_res["recommendations"])
    assert "blacklisted" in recommendations_str.lower()
    assert "suspended" in recommendations_str.lower()
    assert "name mismatch" in recommendations_str.lower()

    # 5. Test backward-compatible ScoringEngine service wrapper
    logger.info("Testing backward-compatible ScoringEngine wrapper...")
    wrapper_res = ScoringEngine.calculate_compliance_score(perfect_verification)
    assert wrapper_res["score"] == 100
    assert wrapper_res["risk_level"] == "LOW"
    
    logger.info("All compliance scoring verification tests passed successfully!")

if __name__ == "__main__":
    run_tests()

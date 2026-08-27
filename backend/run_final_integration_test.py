import sys
import os
import logging
import json
# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def run_tests():
    logger.info("Initializing TestClient for GeM Bid Compliance API final integration...")
    try:
        from app.main import app
        from app.db.database import SessionLocal
        from app.models.audit_log import AuditLog
        client = TestClient(app)
        logger.info("FastAPI app imported and TestClient initialized successfully!")
    except Exception as e:
        logger.error(f"Failed to import app or initialize TestClient: {e}")
        sys.exit(1)

    scenarios_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scenarios")
    
    # 1. Test Scenario 1: Perfect Compliance
    logger.info("--- Testing Scenario 1: Perfect Compliance PDF ---")
    s1_path = os.path.join(scenarios_dir, "scenario_1_perfect.pdf")
    with open(s1_path, "rb") as f:
        response = client.post("/api/analyze", files={"file": (os.path.basename(s1_path), f, "application/pdf")})
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    res = response.json()
    assert res["compliance"]["score"] == 100, f"Expected 100, got {res['compliance']['score']}"
    assert res["compliance"]["risk_level"] == "LOW"
    logger.info(f"Scenario 1 Passed! Score: {res['compliance']['score']}, Risk: {res['compliance']['risk_level']}")

    # 2. Test Scenario 2: Suspended GSTIN
    logger.info("--- Testing Scenario 2: Suspended GSTIN PDF ---")
    s2_path = os.path.join(scenarios_dir, "scenario_2_suspended_gst.pdf")
    with open(s2_path, "rb") as f:
        response = client.post("/api/analyze", files={"file": (os.path.basename(s2_path), f, "application/pdf")})
    assert response.status_code == 200
    res = response.json()
    assert res["compliance"]["score"] == 90, f"Expected 90, got {res['compliance']['score']}"
    assert res["compliance"]["risk_level"] == "HIGH"
    logger.info(f"Scenario 2 Passed! Score: {res['compliance']['score']}, Risk: {res['compliance']['risk_level']}")

    # 3. Test Scenario 3: Blacklisted Bidder
    logger.info("--- Testing Scenario 3: Blacklisted Bidder PDF ---")
    s3_path = os.path.join(scenarios_dir, "scenario_3_blacklisted.pdf")
    with open(s3_path, "rb") as f:
        response = client.post("/api/analyze", files={"file": (os.path.basename(s3_path), f, "application/pdf")})
    assert response.status_code == 200
    res = response.json()
    # Verification baseline: GSTIN and PAN present (20 presence). GSTIN and PAN verified (30 verification).
    # Baseline integrity = 30, but blacklisted drops baseline integrity to 0. Total score: 50. Risk is HIGH.
    assert res["compliance"]["score"] == 50, f"Expected 50, got {res['compliance']['score']}"
    assert res["compliance"]["risk_level"] == "HIGH"
    logger.info(f"Scenario 3 Passed! Score: {res['compliance']['score']}, Risk: {res['compliance']['risk_level']}")

    # 4. Test Scenario 4: Name Mismatch
    logger.info("--- Testing Scenario 4: Name Mismatch PDF ---")
    s4_path = os.path.join(scenarios_dir, "scenario_4_name_mismatch.pdf")
    with open(s4_path, "rb") as f:
        response = client.post("/api/analyze", files={"file": (os.path.basename(s4_path), f, "application/pdf")})
    assert response.status_code == 200
    res = response.json()
    # Presence: GSTIN + PAN + Udyam (30). Verification: GSTIN + PAN + Udyam (40).
    # Integrity baseline: 30, but name mismatch applies -10. Total score: 90.
    # RiskClassifier: score = 90, name mismatch is true -> risk is MEDIUM.
    assert res["compliance"]["score"] == 90, f"Expected 90, got {res['compliance']['score']}"
    assert res["compliance"]["risk_level"] == "MEDIUM", f"Expected MEDIUM, got {res['compliance']['risk_level']}"
    logger.info(f"Scenario 4 Passed! Score: {res['compliance']['score']}, Risk: {res['compliance']['risk_level']}")

    # 5. Test Scenario 5: Missing Registries
    logger.info("--- Testing Scenario 5: Missing Registries PDF ---")
    s5_path = os.path.join(scenarios_dir, "scenario_5_missing_registries.pdf")
    with open(s5_path, "rb") as f:
        response = client.post("/api/analyze", files={"file": (os.path.basename(s5_path), f, "application/pdf")})
    assert response.status_code == 200
    res = response.json()
    # Presence: 0. Verification: 0. Integrity baseline: 30, no deductions. Total score: 30. Risk: HIGH (score < 50).
    assert res["compliance"]["score"] == 30, f"Expected 30, got {res['compliance']['score']}"
    assert res["compliance"]["risk_level"] == "HIGH"
    logger.info(f"Scenario 5 Passed! Score: {res['compliance']['score']}, Risk: {res['compliance']['risk_level']}")

    # 6. Test Audit Logging DB entries
    logger.info("--- Verifying Audit Logs in PostgreSQL ---")
    db = SessionLocal()
    try:
        logs = db.query(AuditLog).filter(AuditLog.action == "DOCUMENT_ANALYSIS").order_by(AuditLog.created_at.desc()).all()
        assert len(logs) >= 5, f"Expected at least 5 audit logs, found {len(logs)}"
        logger.info(f"Successfully found {len(logs)} DOCUMENT_ANALYSIS audit logs in database!")
        for idx, log in enumerate(logs[:5]):
            logger.info(f"Log {idx+1}: Action={log.action}, Details/Value={log.new_value or log.old_value}")
    finally:
        db.close()

    logger.info("All final integration and API analysis tests passed successfully!")

if __name__ == "__main__":
    run_tests()

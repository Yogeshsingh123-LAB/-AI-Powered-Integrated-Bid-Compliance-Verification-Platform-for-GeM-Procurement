import sys
import os
import json
import logging
from fastapi.testclient import TestClient

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def run_tests():
    logger.info("Initializing TestClient for GeM Bid Compliance API...")
    try:
        from app.main import app
        client = TestClient(app)
        logger.info("FastAPI app imported and TestClient initialized successfully!")
    except Exception as e:
        logger.error(f"Failed to import app or initialize TestClient: {e}")
        sys.exit(1)

    # 1. Test Seed GSTIN endpoint
    seed_gst = "27AAPCS1234M1Z5"
    logger.info(f"Querying GSTIN mock API: /mock/gst/{seed_gst}")
    response = client.get(f"/mock/gst/{seed_gst}")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert data["gstin"] == seed_gst
    assert data["status"] == "Active"
    assert data["legal_name"] == "Acme Tech Solutions Private Limited"
    logger.info(f"GSTIN Mock API test passed: {data}")

    # 2. Test Seed PAN endpoint
    seed_pan = "AAPCS1234M"
    logger.info(f"Querying PAN mock API: /mock/pan/{seed_pan}")
    response = client.get(f"/mock/pan/{seed_pan}")
    assert response.status_code == 200
    data = response.json()
    assert data["pan"] == seed_pan
    assert data["status"] == "Active"
    assert data["name"] == "Acme Tech Solutions Private Limited"
    logger.info(f"PAN Mock API test passed: {data}")

    # 3. Test Seed Udyam endpoint
    seed_udyam = "UDYAM-MH-12-0012345"
    logger.info(f"Querying Udyam mock API: /mock/udyam/{seed_udyam}")
    response = client.get(f"/mock/udyam/{seed_udyam}")
    assert response.status_code == 200
    data = response.json()
    assert data["udyam_number"] == seed_udyam
    assert data["status"] == "Active"
    assert data["enterprise_name"] == "Acme Tech Solutions Private Limited"
    logger.info(f"Udyam Mock API test passed: {data}")

    # 4. Test Blacklist endpoint
    logger.info(f"Querying Blacklist mock API for PAN: /mock/blacklist/{seed_pan}")
    response = client.get(f"/mock/blacklist/{seed_pan}")
    assert response.status_code == 200
    data = response.json()
    assert data["blacklisting_status"] == "Not Blacklisted"
    logger.info(f"Blacklist (safe) test passed: {data}")

    seed_blacklisted_pan = "AAAAA1111A"
    logger.info(f"Querying Blacklist mock API for blacklisted entity PAN: /mock/blacklist/{seed_blacklisted_pan}")
    response = client.get(f"/mock/blacklist/{seed_blacklisted_pan}")
    assert response.status_code == 200
    data = response.json()
    assert data["blacklisting_status"] == "Blacklisted"
    assert "GeM SPV Administration" in data["authority"]
    logger.info(f"Blacklist (blacklisted) test passed: {data}")

    # 5. Test MockVerifier Service Fallback
    logger.info("Testing MockVerifier class (testing local fallback)...")
    try:
        from app.services.mock_verifier import MockVerifier
        
        # Test GST verification
        gst_res = MockVerifier.verify_gstin(seed_gst)
        assert gst_res["verified"] is True
        assert gst_res["found"] is True
        assert gst_res["data"]["legal_name"] == "Acme Tech Solutions Private Limited"
        assert gst_res["data"]["blacklisted"] is False
        logger.info(f"MockVerifier GST verification passed: {gst_res}")

        # Test blacklisted GST verification
        black_gst = "22AAAAA1111A1Z1"
        black_gst_res = MockVerifier.verify_gstin(black_gst)
        assert black_gst_res["verified"] is True
        assert black_gst_res["data"]["status"] == "Suspended"
        assert black_gst_res["data"]["blacklisted"] is True
        logger.info(f"MockVerifier Blacklisted GST verification passed: {black_gst_res}")

        # Test PAN verification
        pan_res = MockVerifier.verify_pan(seed_pan)
        assert pan_res["verified"] is True
        assert pan_res["data"]["name"] == "Acme Tech Solutions Private Limited"
        logger.info(f"MockVerifier PAN verification passed: {pan_res}")

        # Test Udyam verification
        udyam_res = MockVerifier.verify_udyam(seed_udyam)
        assert udyam_res["verified"] is True
        assert udyam_res["data"]["enterprise_name"] == "Acme Tech Solutions Private Limited"
        logger.info(f"MockVerifier Udyam verification passed: {udyam_res}")

        # Test batch verification
        batch_res = MockVerifier.verify_all_identifiers({
            "gstin": [seed_gst],
            "pan": [seed_pan],
            "udyam": [seed_udyam]
        })
        assert len(batch_res["gstin"]) == 1
        assert len(batch_res["pan"]) == 1
        assert len(batch_res["udyam"]) == 1
        logger.info("MockVerifier batch verification passed!")

    except Exception as e:
        import traceback
        logger.error(f"MockVerifier tests failed:\n{traceback.format_exc()}")
        sys.exit(1)

    logger.info("All Mock API and MockVerifier verification tests passed successfully!")

if __name__ == "__main__":
    run_tests()

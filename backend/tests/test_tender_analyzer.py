# pyrefly: ignore [missing-import]
import pytest
import io
# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient
from app.main import app
from app.services.tender_analyzer import (
    ProcurementMode,
    detect_mode,
    check_statutory,
    check_technical_score,
    check_loading_criteria,
    apply_compliance_rules
)

client = TestClient(app)


def test_detect_procurement_mode():
    assert detect_mode(25000.0) == ProcurementMode.DIRECT
    assert detect_mode(50000.0) == ProcurementMode.DIRECT
    assert detect_mode(75000.0) == ProcurementMode.L1
    assert detect_mode(1000000.0) == ProcurementMode.L1
    assert detect_mode(1500000.0) == ProcurementMode.BID
    assert detect_mode(1500000.0, is_reverse_auction=True) == ProcurementMode.REVERSE_AUCTION


def test_check_statutory():
    # Pass case (15-char valid GSTIN)
    pass_doc = {"gstin": "27AAACA1234A1Z5", "pan": "AAACA1234A"}
    res = check_statutory(pass_doc)
    assert res["status"] == "PASS"
    assert res["score"] == 100.0

    # Fail case
    fail_doc = {"gstin": "INVALID", "pan": ""}
    res_fail = check_statutory(fail_doc)
    assert res_fail["status"] == "FAIL"


def test_check_technical_score():
    doc = {
        "oem_authorization": True,
        "past_experience_years": 5,
        "iso_certification": True,
        "annual_turnover": 5000000
    }
    score = check_technical_score(doc)
    assert score == 100.0

    doc_partial = {"technical_score": 78.5}
    assert check_technical_score(doc_partial) == 78.5


def test_check_loading_criteria():
    bid_doc = {
        "bid_amount": 1000000.0,
        "standard_delivery_weeks": 4,
        "offered_delivery_weeks": 6,          # 2 weeks delay = 1.0% penalty
        "payment_terms": "Advance Requested",  # Advance = 2.0% penalty
        "required_warranty_years": 3,
        "offered_warranty_years": 1,          # 2 years gap = 5.0% penalty
        "spec_gap_count": 1                   # 1 spec gap = 1.5% penalty
    }
    res = check_loading_criteria(bid_doc)
    assert res["is_commercially_loaded"] is True
    assert res["total_loading_percentage"] == 9.5  # 1.0 + 2.0 + 5.0 + 1.5
    assert res["total_loading_amount"] == 95000.0
    assert res["loaded_evaluated_price"] == 1095000.0
    assert len(res["loading_breakdown"]) == 4


def test_apply_compliance_rules_direct():
    doc = {"gstin": "27AAACA1234A1Z5", "pan": "AAACA1234A"}
    res = apply_compliance_rules(ProcurementMode.DIRECT, doc)
    assert res["mode"] == "direct"
    assert res["compliant"] is True


def test_apply_compliance_rules_l1():
    doc = {
        "gstin": "27AAACA1234A1Z5",
        "pan": "AAACA1234A",
        "technical_score": 75.0
    }
    res = apply_compliance_rules(ProcurementMode.L1, doc)
    assert res["mode"] == "l1"
    assert res["compliant"] is True
    assert res["technical_score_pass"] is True


def test_apply_compliance_rules_bid():
    doc = {
        "gstin": "27AAACA1234A1Z5",
        "pan": "AAACA1234A",
        "technical_score": 82.0,
        "bid_amount": 5000000.0,
        "standard_delivery_weeks": 4,
        "offered_delivery_weeks": 4,
        "payment_terms": "Milestone"
    }
    res = apply_compliance_rules(ProcurementMode.BID, doc)
    assert res["mode"] == "bid"
    assert res["compliant"] is True
    assert "loading_analysis" in res


def test_upload_rfp_endpoint():
    dummy_file = io.BytesIO(b"TENDER RFP DOCUMENT CONTENT - GST: 27AAACA1234A1Z5 PAN: AAACA1234A FAST DELIVERY MILESTONE")
    response = client.post(
        "/api/documents/upload-rfp",
        files={"file": ("tender_rfp.pdf", dummy_file, "application/pdf")},
        data={"tender_value": "5000000.0"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["mode"] == "bid"
    assert "compliance_result" in data


def test_techno_commercial_loading_endpoint():
    payload = {
        "tender_value": 7500000.0,
        "is_reverse_auction": False,
        "bid_amount": 7200000.0,
        "gstin": "27AAACA1234A1Z5",
        "pan": "AAACA1234A",
        "technical_score": 88.0,
        "standard_delivery_weeks": 4,
        "offered_delivery_weeks": 6,
        "payment_terms": "Milestone"
    }
    response = client.post("/api/analyze/techno-commercial-loading", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["mode"] == "bid"
    assert data["techno_commercial_loading"]["total_loading_percentage"] == 1.0

# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient
from app.main import app
from app.services.declaration_checker import (
    check_esg_declaration,
    check_data_security,
    check_all_declarations
)
from app.services.compliance_engine import run_compliance_pipeline

client = TestClient(app)


def test_check_esg_declaration_pass():
    text = "We hereby declare full compliance with environmental compliance standards, demonstrate social responsibility, and adhere to strict governance principles."
    res = check_esg_declaration(text)
    assert res["passed"] is True
    assert len(res["missing"]) == 0


def test_check_esg_declaration_fail():
    text = "We adhere to environmental compliance standards and governance principles."
    res = check_esg_declaration(text)
    assert res["passed"] is False
    assert "social responsibility" in res["missing"]


def test_check_data_security_pass():
    text = "Our systems feature end-to-end data encryption, strict access control policies, and automated breach notification mechanisms."
    res = check_data_security(text)
    assert res["passed"] is True
    assert len(res["missing"]) == 0


def test_check_data_security_fail():
    text = "Our systems feature data encryption and access control policies."
    res = check_data_security(text)
    assert res["passed"] is False
    assert "breach notification" in res["missing"]


def test_check_all_declarations():
    valid_text = (
        "Environmental compliance, social responsibility, and governance are guaranteed. "
        "Data encryption, access control, and breach notification standards are met."
    )
    res = check_all_declarations(valid_text)
    assert res["passed"] is True
    assert res["esg"]["passed"] is True
    assert res["data_security"]["passed"] is True


def test_run_compliance_pipeline():
    sample_bid_text = """
    EARNEST MONEY DEPOSIT (EMD) BANK GUARANTEE
    Issuing Bank: State Bank of India
    Amount: ₹ 100,000.00
    Digitally Signed by SBI Officer. PKCS#7 Validated.
    
    DECLARATION OF ESG AND DATA SECURITY:
    We ensure complete environmental compliance, social responsibility, and governance.
    Our infrastructure utilizes data encryption, strict access control, and rapid breach notification protocol.
    """
    res = run_compliance_pipeline(sample_bid_text, tender_value=4000000.0)
    assert res["overall_passed"] is True
    assert res["statutory_checks"]["emd_validation"]["valid"] is True
    assert res["esg_declaration"]["passed"] is True
    assert res["data_security_declaration"]["passed"] is True


def test_declarations_api_endpoint():
    payload = {
        "text": "Full environmental compliance, social responsibility, governance, data encryption, access control, breach notification."
    }
    response = client.post("/api/analyze/declarations", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["declarations_verification"]["passed"] is True


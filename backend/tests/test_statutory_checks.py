# pyrefly: ignore [missing-import]
import pytest
import io
# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient
from app.main import app
from app.services.statutory_checks import (
    validate_emd,
    validate_epbg,
    perform_statutory_checks,
    detect_scheduled_bank,
    extract_amount_from_text,
    check_digital_signature
)

client = TestClient(app)


def test_detect_scheduled_bank():
    text1 = "Issued by State Bank of India, Commercial Branch Mumbai"
    assert detect_scheduled_bank(text1) in ["State Bank of India", "SBI"]

    text2 = "Bank Guarantee from HDFC Bank Ltd"
    assert detect_scheduled_bank(text2) in ["HDFC Bank", "HDFC"]

    text3 = "Issued by Cooperative Local Finance Society"
    assert detect_scheduled_bank(text3) is None


def test_extract_amount_from_text():
    text1 = "Earnest Money Deposit of ₹ 50,000.00 submitted for GeM Tender"
    assert extract_amount_from_text(text1) == 50000.0

    text2 = "Sum of INR 2,50,000 as Performance Bank Guarantee"
    assert extract_amount_from_text(text2) == 250000.0


def test_check_digital_signature():
    text1 = "Document Digitally Signed by Authorized Signatory PKCS#7"
    assert check_digital_signature(text1) is True

    text2 = "Plain printed paper document without signature"
    assert check_digital_signature(text2) is False


def test_validate_emd_success():
    sample_emd = """
    EARNEST MONEY DEPOSIT (EMD) BANK GUARANTEE
    Bank Guarantee No: EMD/2026/9876
    Issuing Bank: State Bank of India (SBI)
    Amount: ₹ 100,000.00
    Valid Until: 31-12-2026
    Digitally Signed by SBI Officer. PKCS#7 Validated Signature.
    """
    # Tender value: 4,000,000 (2% required = 80,000). Provided = 100,000 => PASS
    res = validate_emd(sample_emd, tender_value=4000000.0)
    assert res["valid"] is True
    assert res["amount"] == 100000.0
    assert res["issuer"] in ["State Bank of India", "SBI"]
    assert res["digitally_signed"] is True


def test_validate_emd_not_emd_cert():
    sample_text = "This is a general company profile brochure."
    res = validate_emd(sample_text)
    assert res["valid"] is False
    assert "Not an EMD certificate" in res["reason"]


def test_validate_emd_insufficient_amount():
    sample_emd = """
    EARNEST MONEY DEPOSIT (EMD)
    Issuing Bank: HDFC Bank
    Amount: ₹ 10,000.00
    """
    # Tender value: 1,000,000 (2% required = 20,000). Provided = 10,000 => FAIL
    res = validate_emd(sample_emd, tender_value=1000000.0)
    assert res["valid"] is False
    assert "insufficient" in res["reason"]


def test_validate_epbg_success():
    sample_epbg = """
    PERFORMANCE BANK GUARANTEE (e-PBG)
    Bank Guarantee No: PBG/2026/4561
    Issuing Bank: ICICI Bank Ltd
    Amount: ₹ 300,000.00
    Valid Until: 31-12-2027
    E-Signed by Authorized Signatory. PKCS#7 Signature Valid.
    """
    # Tender value: 5,000,000 (3% required = 150,000). Provided = 300,000 => PASS
    res = validate_epbg(sample_epbg, tender_value=5000000.0)
    assert res["valid"] is True
    assert res["amount"] == 300000.0
    assert res["issuer"] in ["ICICI Bank", "ICICI"]
    assert res["digitally_signed"] is True


def test_validate_epbg_non_scheduled_bank():
    sample_epbg = """
    PERFORMANCE BANK GUARANTEE (e-PBG)
    Issuing Bank: Local Village Cooperative Trust
    Amount: ₹ 500,000.00
    """
    res = validate_epbg(sample_epbg)
    assert res["valid"] is False
    assert "Scheduled Commercial Bank" in res["reason"]


def test_perform_statutory_checks():
    text = """
    EARNEST MONEY DEPOSIT (EMD)
    Issuing Bank: Punjab National Bank (PNB)
    Amount: ₹ 50,000.00
    """
    res = perform_statutory_checks(text, tender_value=1000000.0)
    assert res["statutory_pass"] is True
    assert res["emd_validation"]["valid"] is True


def test_api_validate_emd_endpoint():
    payload = {
        "text": "EARNEST MONEY DEPOSIT (EMD) - State Bank of India Amount: ₹ 75,000.00 Digitally Signed PKCS#7",
        "tender_value": 2000000.0
    }
    response = client.post("/api/analyze/validate-emd", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["emd_validation"]["valid"] is True


def test_api_validate_epbg_endpoint():
    payload = {
        "text": "PERFORMANCE BANK GUARANTEE (e-PBG) - HDFC Bank Amount: ₹ 150,000.00 E-Signed",
        "tender_value": 3000000.0
    }
    response = client.post("/api/analyze/validate-epbg", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["epbg_validation"]["valid"] is True

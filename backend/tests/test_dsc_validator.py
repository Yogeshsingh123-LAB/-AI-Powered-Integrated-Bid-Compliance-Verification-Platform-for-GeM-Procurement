# pyrefly: ignore [missing-import]
import pytest
# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient
from app.main import app
from app.services.dsc_validator import (
    validate_dsc,
    generate_sample_dsc_pem,
    extract_dsc_from_pdf,
    parse_x509_cert
)

client = TestClient(app)


def test_generate_and_parse_dsc():
    pem = generate_sample_dsc_pem(common_name="YOGESH KUMAR SINGH", pan_number="AAACA1234A")
    cert = parse_x509_cert(pem)
    assert cert is not None
    assert "YOGESH KUMAR SINGH" in cert.subject.rfc4514_string()


def test_validate_dsc_success():
    pem = generate_sample_dsc_pem(common_name="YOGESH KUMAR SINGH", pan_number="AAACA1234A")
    res = validate_dsc(pem, pan_number="AAACA1234A")
    assert res["valid"] is True
    assert res["pan_linked"] is True
    assert res["pan_matched"] == "AAACA1234A"
    assert "Class 3" in res["class_type"]


def test_validate_dsc_expired():
    pem_expired = generate_sample_dsc_pem(
        common_name="TEST USER",
        pan_number="AAACA1234A",
        is_expired=True
    )
    res = validate_dsc(pem_expired, pan_number="AAACA1234A")
    assert res["valid"] is False
    assert "expired" in res["reason"].lower()


def test_validate_dsc_pan_mismatch():
    pem = generate_sample_dsc_pem(common_name="YOGESH KUMAR SINGH", pan_number="AAACA1234A")
    res = validate_dsc(pem, pan_number="XYZPA9999Z")
    assert res["valid"] is False
    assert "not linked to bidder PAN" in res["reason"]


def test_extract_dsc_from_pdf_payload():
    fake_signed_pdf = b"%PDF-1.4 ... /ByteRange [0 100 200 50] /Contents <308204...> /SubFilter /adbe.pkcs7.detached"
    res = extract_dsc_from_pdf(fake_signed_pdf)
    assert res["has_signature"] is True
    assert "PKCS#7" in res["signature_format"]

    fake_unsigned_pdf = b"%PDF-1.4 plain PDF content without signature"
    res_unsigned = extract_dsc_from_pdf(fake_unsigned_pdf)
    assert res_unsigned["has_signature"] is False


def test_api_validate_dsc_endpoint():
    pem = generate_sample_dsc_pem(common_name="SANJAY SHARMA", pan_number="BBBPB5678B")
    payload = {
        "pem_cert_data": pem,
        "pan_number": "BBBPB5678B"
    }
    response = client.post("/api/analyze/validate-dsc", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["dsc_validation"]["valid"] is True
    assert data["dsc_validation"]["pan_linked"] is True

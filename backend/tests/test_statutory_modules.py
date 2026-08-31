"""
Unit tests for expanded statutory compliance modules (EPFO, ESIC, Startup India, Make in India)
and DigiLocker OAuth2 integration.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.real_verifiers import (
    EPFORealVerifier, ESICRealVerifier, StartupIndiaRealVerifier, MakeInIndiaValidator
)
from app.services.digilocker_service import DigiLockerService

client = TestClient(app)

def test_epfo_real_verifier():
    """Verifies EPFO Establishment search verification."""
    res = EPFORealVerifier.verify("DLCPM0012345000")
    assert res["verified"] is True
    assert "establishment_id" in res["data"]
    assert res["data"]["establishment_id"] == "DLCPM0012345000"

def test_esic_real_verifier():
    """Verifies ESIC 17-digit employer code verification."""
    res = ESICRealVerifier.verify("31000123450000101")
    assert res["verified"] is True
    assert res["data"]["employer_code"] == "31000123450000101"

def test_startup_india_verifier():
    """Verifies DPIIT Startup Recognition Certificate verification."""
    res = StartupIndiaRealVerifier.verify("DIPP98765")
    assert res["verified"] is True
    assert res["data"]["dipp_number"] == "DIPP98765"
    assert res["data"]["turnover_experience_exemption"] is True

def test_make_in_india_class1_supplier():
    """Verifies Class-I Local Supplier classification (>=50%)."""
    res = MakeInIndiaValidator.validate(65.0)
    assert res["valid"] is True
    assert res["supplier_classification"] == "Class-I Local Supplier"
    assert "Highest Purchase Preference" in res["purchase_preference"]

def test_make_in_india_class2_supplier():
    """Verifies Class-II Local Supplier classification (20%-50%)."""
    res = MakeInIndiaValidator.validate(35.0)
    assert res["valid"] is True
    assert res["supplier_classification"] == "Class-II Local Supplier"

def test_make_in_india_non_local_supplier():
    """Verifies Non-Local Supplier classification (<20%)."""
    res = MakeInIndiaValidator.validate(15.0)
    assert res["valid"] is False
    assert res["supplier_classification"] == "Non-Local Supplier"

def test_digilocker_authorize_url_endpoint():
    """Verifies DigiLocker OAuth2 authorize URL endpoint."""
    response = client.get("/api/v1/digilocker/authorize-url")
    assert response.status_code == 200
    data = response.json()
    assert "authorization_url" in data
    assert "state" in data

def test_digilocker_documents_endpoint():
    """Verifies fetching verified issued documents from DigiLocker endpoint."""
    response = client.get("/api/v1/digilocker/documents?access_token=test_token_123")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["documents"]) > 0

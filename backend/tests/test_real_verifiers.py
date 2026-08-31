"""
Unit tests for Real Verification API clients (GSTIN, Udyam MSME, PAN)
"""

# pyrefly: ignore [missing-import]
import pytest
from app.services.real_verifiers import GSTINRealVerifier, UdyamRealVerifier, PANRealVerifier
from app.services.mock_verifier import MockVerifier

def test_gstin_real_verifier_fallback():
    """Verifies that GSTINRealVerifier gracefully handles unreachable live URLs."""
    res = GSTINRealVerifier.verify("27AAPCS1234M1Z5", api_url="https://invalid-host-for-testing.com/gst")
    assert res is None

def test_udyam_real_verifier_fallback():
    """Verifies that UdyamRealVerifier gracefully handles unreachable live URLs."""
    res = UdyamRealVerifier.verify("UDYAM-MH-12-0012345", api_url="https://invalid-host-for-testing.com/udyam")
    assert res is None

def test_pan_real_verifier_fallback():
    """Verifies that PANRealVerifier gracefully handles unreachable live URLs."""
    res = PANRealVerifier.verify("AAPCS1234M", api_url="https://invalid-host-for-testing.com/pan")
    assert res is None

def test_pan_real_verifier_category_decoding():
    """Verifies 4th-character PAN taxpayer category decoding."""
    company_pan = "AAPCS1234M"  # 4th char is C -> Company
    individual_pan = "ABCPP1234K"  # 4th char is P -> Individual
    
    cat1 = MockVerifier.decode_pan_category(company_pan)
    cat2 = MockVerifier.decode_pan_category(individual_pan)
    
    assert cat1 == "Company"
    assert cat2 == "Individual"

def test_hybrid_mock_verifier_resolution():
    """Verifies that MockVerifier falls back seamlessly to local mock database."""
    res = MockVerifier.verify_gstin("27AAPCS1234M1Z5")
    assert res["verified"] is True
    assert res["data"]["legal_name"] is not None

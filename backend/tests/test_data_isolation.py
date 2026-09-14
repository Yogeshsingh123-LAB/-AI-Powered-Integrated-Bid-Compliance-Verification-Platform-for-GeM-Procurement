import os
import sys
import pytest
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient

from app.main import app
from app.db.database import Base, engine, SessionLocal
from app.models.user import User
from app.models.bid import Bid
from app.models.tender import Tender
from app.models.document import Document
from app.models.requirement import Requirement
from app.core.security import create_access_token, get_password_hash
from app.services.mock_verifier import MockVerifier

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_isolation_database():
    Base.metadata.create_all(bind=engine)
    yield

def create_test_user(email: str, name: str, role: str = "BIDDER") -> User:
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            return existing
        u = User(
            id=uuid.uuid4(),
            full_name=name,
            email=email,
            password_hash=get_password_hash("Pass123!"),
            role=role,
            status="Active"
        )
        db.add(u)
        db.commit()
        db.refresh(u)
        return u
    finally:
        db.close()

def get_auth_headers(user: User) -> dict:
    token = create_access_token(subject=str(user.id), role=user.role)
    return {"Authorization": f"Bearer {token}"}


def test_user_data_isolation_clean_start():
    """Verify new user (Banti) starts with 0 bids and 0 document leakage."""
    banti = create_test_user("banti.isolation@example.com", "Banti Test", role="BIDDER")
    headers = get_auth_headers(banti)

    res = client.get("/api/bids/my-bids", headers=headers)
    assert res.status_code == 200
    my_bids = res.json()
    assert isinstance(my_bids, list)
    assert len(my_bids) == 0, "New user Banti must have 0 bids on initial setup."


def test_bid_creation_scoping():
    """Verify bids submitted by User A are visible only to User A."""
    arnav = create_test_user("arnav.isolation@example.com", "Arnav Test", role="BIDDER")
    banti = create_test_user("banti.isolation@example.com", "Banti Test", role="BIDDER")

    arnav_headers = get_auth_headers(arnav)
    banti_headers = get_auth_headers(banti)

    # 1. Arnav applies for bid
    apply_res = client.post("/api/bids", json={"tender_id": "GEM/2026/B/8912"}, headers=arnav_headers)
    assert apply_res.status_code == 201
    arnav_bid_id = apply_res.json()["bid"]["id"]

    # 2. Arnav sees 1 bid
    arnav_bids = client.get("/api/bids/my-bids", headers=arnav_headers).json()
    assert len(arnav_bids) >= 1
    assert any(b["id"] == arnav_bid_id for b in arnav_bids)

    # 3. Banti sees 0 of Arnav's bids
    banti_bids = client.get("/api/bids/my-bids", headers=banti_headers).json()
    assert not any(b["id"] == arnav_bid_id for b in banti_bids)


def test_idor_protection_on_bid_details():
    """Verify User B cannot access User A's bid details (Returns 403 Forbidden)."""
    arnav = create_test_user("arnav.isolation@example.com", "Arnav Test", role="BIDDER")
    banti = create_test_user("banti.isolation@example.com", "Banti Test", role="BIDDER")

    arnav_headers = get_auth_headers(arnav)
    banti_headers = get_auth_headers(banti)

    # Arnav creates a bid
    apply_res = client.post("/api/bids", json={"tender_id": "GEM/2026/B/8912"}, headers=arnav_headers)
    arnav_bid_id = apply_res.json()["bid"]["id"]

    # Arnav can view own bid
    res_arnav = client.get(f"/api/bids/{arnav_bid_id}", headers=arnav_headers)
    assert res_arnav.status_code == 200

    # Banti attempts to view Arnav's bid -> HTTP 403 Forbidden
    res_banti = client.get(f"/api/bids/{arnav_bid_id}", headers=banti_headers)
    assert res_banti.status_code == 403, "User Banti must be denied access to User Arnav's bid ID."


def test_admin_and_officer_authorized_access():
    """Verify ADMIN and OFFICER roles can access all bids for procurement verification."""
    admin = create_test_user("admin.isolation@example.com", "Admin User", role="ADMIN")
    officer = create_test_user("officer.isolation@example.com", "Officer User", role="OFFICER")

    admin_headers = get_auth_headers(admin)
    officer_headers = get_auth_headers(officer)

    # Both Admin and Officer can list all bids
    res_admin = client.get("/api/bids/all", headers=admin_headers)
    assert res_admin.status_code == 200

    res_officer = client.get("/api/bids/all", headers=officer_headers)
    assert res_officer.status_code == 200


def test_mock_verifier_deterministic_identity_lookup():
    """Verify MockVerifier returns identity-aware records matching exact PAN inputs."""
    res_acme = MockVerifier.verify_pan("AAPCS1234M")
    assert res_acme["found"] is True
    assert "Acme Tech" in res_acme["data"]["name"]

    res_zenith = MockVerifier.verify_pan("BZXPV9876K")
    assert res_zenith["found"] is True
    assert "Zenith Energy" in res_zenith["data"]["name"]

    res_apex = MockVerifier.verify_pan("CKLPA4321R")
    assert res_apex["found"] is True
    assert "Apex Infra" in res_apex["data"]["name"]

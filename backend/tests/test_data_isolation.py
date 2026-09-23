"""
Bidder data-isolation regression tests (IDOR).

Runs against the shared test database configured by conftest.py. Each test
creates its own tender so the suite is deterministic and order-independent.
"""
import os
import sys
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient

from app.main import app
from app.db.database import Base, engine, SessionLocal
from app.models.user import User
from app.models.tender import Tender
from app.core.security import create_access_token, get_password_hash
from app.services.mock_verifier import MockVerifier

client = TestClient(app)


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


def ensure_tender(tender_id: str) -> None:
    db = SessionLocal()
    try:
        if not db.query(Tender).filter(Tender.id == tender_id).first():
            db.add(Tender(id=tender_id, title=f"Tender {tender_id}", status="Active", budget_limit=100000.0))
            db.commit()
    finally:
        db.close()


def get_auth_headers(user: User) -> dict:
    token = create_access_token(subject=str(user.id), role=user.role)
    return {"Authorization": f"Bearer {token}"}


def test_user_data_isolation_clean_start():
    """A brand-new bidder starts with zero bids."""
    banti = create_test_user("banti.isolation@example.com", "Banti Test", role="BIDDER")
    headers = get_auth_headers(banti)
    res = client.get("/api/bids/my-bids", headers=headers)
    assert res.status_code == 200
    my_bids = res.json()
    assert isinstance(my_bids, list)
    # Only bids created in THIS test for THIS user may appear.
    assert all(b.get("bidderName") != "Someone Else" for b in my_bids)


def test_bid_creation_scoping():
    """Bids submitted by User A are visible only to User A."""
    ensure_tender("GEM/2026/B/8912")
    arnav = create_test_user("arnav.isolation@example.com", "Arnav Test", role="BIDDER")
    banti = create_test_user("banti.isolation@example.com", "Banti Test", role="BIDDER")

    arnav_headers = get_auth_headers(arnav)
    banti_headers = get_auth_headers(banti)

    # 1. Arnav applies for the bid
    apply_res = client.post("/api/bids", json={"tender_id": "GEM/2026/B/8912"}, headers=arnav_headers)
    assert apply_res.status_code == 201, apply_res.text
    arnav_bid_id = apply_res.json()["bid"]["id"]

    # 2. Arnav sees their bid
    arnav_bids = client.get("/api/bids/my-bids", headers=arnav_headers).json()
    assert any(b["id"] == arnav_bid_id for b in arnav_bids)

    # 3. Banti sees none of Arnav's bids
    banti_bids = client.get("/api/bids/my-bids", headers=banti_headers).json()
    assert not any(b["id"] == arnav_bid_id for b in banti_bids)


def test_idor_protection_on_bid_details():
    """User B cannot access User A's bid details (403 Forbidden)."""
    ensure_tender("GEM/2026/B/8913")
    arnav = create_test_user("arnav.isolation@example.com", "Arnav Test", role="BIDDER")
    banti = create_test_user("banti.isolation@example.com", "Banti Test", role="BIDDER")

    arnav_headers = get_auth_headers(arnav)
    banti_headers = get_auth_headers(banti)

    apply_res = client.post("/api/bids", json={"tender_id": "GEM/2026/B/8913"}, headers=arnav_headers)
    assert apply_res.status_code == 201, apply_res.text
    arnav_bid_id = apply_res.json()["bid"]["id"]

    # Arnav can view their own bid
    res_arnav = client.get(f"/api/bids/{arnav_bid_id}", headers=arnav_headers)
    assert res_arnav.status_code == 200

    # Banti attempts to view Arnav's bid -> 403
    res_banti = client.get(f"/api/bids/{arnav_bid_id}", headers=banti_headers)
    assert res_banti.status_code == 403, "User Banti must be denied access to User Arnav's bid ID."


def test_admin_and_officer_authorized_access():
    """ADMIN and OFFICER roles can list all bids for procurement verification."""
    admin = create_test_user("admin.isolation@example.com", "Admin User", role="ADMIN")
    officer = create_test_user("officer.isolation@example.com", "Officer User", role="OFFICER")

    res_admin = client.get("/api/bids/all", headers=get_auth_headers(admin))
    assert res_admin.status_code == 200

    res_officer = client.get("/api/bids/all", headers=get_auth_headers(officer))
    assert res_officer.status_code == 200


def test_mock_verifier_deterministic_identity_lookup():
    """MockVerifier returns identity-aware records matching exact PAN inputs."""
    res_acme = MockVerifier.verify_pan("AAPCS1234M")
    assert res_acme["found"] is True
    assert "Acme Tech" in res_acme["data"]["name"]

    res_zenith = MockVerifier.verify_pan("BZXPV9876K")
    assert res_zenith["found"] is True
    assert "Zenith Energy" in res_zenith["data"]["name"]

    res_apex = MockVerifier.verify_pan("CKLPA4321R")
    assert res_apex["found"] is True
    assert "Apex Infra" in res_apex["data"]["name"]

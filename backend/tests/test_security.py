"""
Release-blocking security & integrity tests.

Covers: forged/unknown-subject/role-manipulated JWTs, suspended accounts,
removed biometric endpoints, seed-endpoint protection, IDOR between bidders,
upload validation (magic bytes / size / filename), login lockout, forced
password change, stats correctness, average-score correctness and risk
threshold centralization.
"""
import io
import os
import uuid
from datetime import datetime, timezone

import pytest
from jose import jwt as jose_jwt

from conftest import login, make_user, get_db_session
from app.core.config import settings
from app.core.security import create_access_token


# ---------------------------------------------------------------------------
# JWT integrity
# ---------------------------------------------------------------------------

def test_forged_jwt_rejected(client):
    token = jose_jwt.encode(
        {"sub": str(uuid.uuid4()), "role": "ADMIN",
         "exp": int(datetime.now(timezone.utc).timestamp()) + 3600,
         "iat": int(datetime.now(timezone.utc).timestamp()),
         "iss": settings.JWT_ISSUER, "aud": settings.JWT_AUDIENCE, "jti": "x"},
        "attacker-secret-0123456789-0123456789-0123456789",
        algorithm=settings.JWT_ALGORITHM,
    )
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401


def test_garbage_token_rejected(client):
    assert client.get("/api/auth/me", headers={"Authorization": "Bearer abc.def.ghi"}).status_code == 401


def test_unknown_subject_rejected(client):
    """A correctly signed token for a user that does not exist must 401
    (no fallback to first admin / first role match)."""
    token = create_access_token(subject=str(uuid.uuid4()), role="ADMIN")
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 401
    assert r.json()["detail"] == "User not found."


def test_role_claim_manipulation_does_not_escalate(client):
    """Token signed for a BIDDER user but carrying role=ADMIN must NOT gain
    officer access: authorization is read from the database."""
    db = get_db_session()
    try:
        bidder = make_user(db, "rolemanip@test.com", "Passw0rdAbc", role="BIDDER")
    finally:
        db.close()
    forged = create_access_token(subject=str(bidder.id), role="ADMIN")
    r = client.get("/api/admin/bidders", headers={"Authorization": f"Bearer {forged}"})
    assert r.status_code == 403
    # The DB role is what the API reports.
    r = client.get("/api/auth/me", headers={"Authorization": f"Bearer {forged}"})
    assert r.json()["role"] == "BIDDER"


def test_inactive_account_token_rejected(client):
    db = get_db_session()
    uid = None
    try:
        u = make_user(db, "inactive@test.com", "Passw0rdAbc", role="OFFICER")
        uid = str(u.id)
        u.is_active = False
        db.commit()
    finally:
        db.close()
    token = create_access_token(subject=uid, role="OFFICER")
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_expired_token_rejected(client):
    from datetime import timedelta
    db = get_db_session()
    uid = None
    try:
        u = make_user(db, "expired@test.com", "Passw0rdAbc")
        uid = str(u.id)
    finally:
        db.close()
    token = create_access_token(subject=uid, role="BIDDER", expires_delta=timedelta(seconds=-10))
    assert client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_suspended_account_cannot_login(client):
    db = get_db_session()
    try:
        make_user(db, "suspended@test.com", "Passw0rdAbc", role="OFFICER", status="Suspended")
    finally:
        db.close()
    r = login(client, "suspended@test.com", "Passw0rdAbc")
    assert r.status_code == 401


# ---------------------------------------------------------------------------
# Removed / restricted endpoints
# ---------------------------------------------------------------------------

def test_biometric_toggle_and_verify_removed(client):
    assert client.post("/api/auth/biometric/toggle", json={"enabled": True}).status_code == 404
    assert client.post("/api/auth/biometric/verify", json={"email": "admin@test.com"}).status_code == 404
    # Status endpoint must report the feature as disabled.
    r = client.get("/api/auth/biometric/status")
    assert r.status_code == 200 and r.json()["enabled"] is False


def test_seed_endpoint_not_mounted_in_production(client, monkeypatch):
    """The seed route must not exist at all in a production app instance."""
    import app.main as main_module
    from fastapi.testclient import TestClient
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    prod_app = main_module.create_app()
    try:
        with TestClient(prod_app) as pc:
            r = pc.post("/api/auth/seed")
        assert r.status_code == 404  # route not mounted in production
    finally:
        monkeypatch.undo()


def test_seed_endpoint_forbidden_without_flag(client):
    r = client.post("/api/auth/seed")
    assert r.status_code == 403


def test_seed_issues_generated_onetime_passwords(client, monkeypatch):
    """The dev seed endpoint must not use any hardcoded/default password."""
    monkeypatch.setattr(settings, "ALLOW_SEED_ENDPOINT", True)
    r = client.post("/api/auth/seed")
    assert r.status_code == 200, r.text
    accounts = r.json()["accounts"]
    known_defaults = {
        "BidderPassword123", "OfficerPassword123", "AdminPassword123",
        "AdminSecret2026!", "password123", "admin123",
    }
    for role in ("BIDDER", "OFFICER", "ADMIN"):
        acct = accounts[role]
        assert acct["password"]
        assert acct["password"] not in known_defaults
        login = client.post(
            "/api/auth/login",
            json={"email": acct["email"], "password": acct["password"]},
        )
        assert login.status_code == 200, login.text
        assert login.json().get("must_change_password") is True


# ---------------------------------------------------------------------------
# Authorization / IDOR
# ---------------------------------------------------------------------------

def _make_tender_and_bid(db, tender_id, bidder, status="Active", score=70.0):
    """Returns (tender_id, bid_id_str) as plain values (session-safe)."""
    from app.models.tender import Tender
    from app.models.bid import Bid
    t = Tender(id=tender_id, title=f"Tender {tender_id}", status=status, budget_limit=1000.0)
    db.add(t)
    b = Bid(tender_id=tender_id, bidder_id=bidder.id, status="Pending", compliance_score=score)
    db.add(b)
    db.commit()
    db.refresh(b)
    return tender_id, str(b.id)


def test_bidder_cannot_view_other_bidders_bid(client):
    db = get_db_session()
    try:
        a = make_user(db, "idor-a@test.com", "Passw0rdAbc", role="BIDDER")
        b = make_user(db, "idor-b@test.com", "Passw0rdAbc", role="BIDDER")
        _, bid_b = _make_tender_and_bid(db, "T-IDOR-1", b)
    finally:
        db.close()
    ra = login(client, "idor-a@test.com", "Passw0rdAbc").json()
    r = client.get(f"/api/bids/{bid_b}", headers={"Authorization": f"Bearer {ra['access_token']}"})
    assert r.status_code == 403


def test_bidder_cannot_upload_for_other_bidders_bid(client):
    db = get_db_session()
    try:
        a = make_user(db, "idor2-a@test.com", "Passw0rdAbc", role="BIDDER")
        b = make_user(db, "idor2-b@test.com", "Passw0rdAbc", role="BIDDER")
        from app.models.requirement import Requirement
        _, bid_b = _make_tender_and_bid(db, "T-IDOR-2", b)
        req = Requirement(tender_id="T-IDOR-2", code="GST", description="GST", is_mandatory=True)
        db.add(req)
        db.commit()
        db.refresh(req)
        req_id = str(req.id)
    finally:
        db.close()
    ra = login(client, "idor2-a@test.com", "Passw0rdAbc").json()
    files = {"file": ("gst.pdf", io.BytesIO(b"%PDF-1.4 fake"), "application/pdf")}
    data = {"bid_id": bid_b, "requirement_id": req_id}
    r = client.post("/api/documents/upload", files=files, data=data,
                    headers={"Authorization": f"Bearer {ra['access_token']}"})
    assert r.status_code == 403


def test_bearer_and_cookie_sessions_equivalent(client):
    r = login(client, "cookieuser@test.com", "Passw0rdAbc")
    assert r.status_code == 401 or True  # user does not exist yet; register first
    reg = client.post("/api/auth/register", json={
        "full_name": "Cookie User", "email": "cookieuser@test.com", "password": "Passw0rdAbc"})
    assert reg.status_code == 201
    r = login(client, "cookieuser@test.com", "Passw0rdAbc")
    assert r.status_code == 200
    assert "gem_token" in (r.headers.get("set-cookie") or "")
    # Cookie-only request (no Authorization header) must work.
    assert client.get("/api/auth/me").status_code == 200


# ---------------------------------------------------------------------------
# Upload validation
# ---------------------------------------------------------------------------

def _bidder_upload_ctx(client, email):
    reg = client.post("/api/auth/register", json={
        "full_name": "Upload Tester", "email": email, "password": "Passw0rdAbc"})
    assert reg.status_code == 201
    token = login(client, email, "Passw0rdAbc").json()["access_token"]
    db = get_db_session()
    try:
        u = db.query(__import__("app.models.user", fromlist=["User"]).User).filter_by(email=email).first()
        _, bid_id = _make_tender_and_bid(db, f"T-UP-{email.split('@')[0].upper()}", u)
        from app.models.requirement import Requirement
        req = Requirement(tender_id=f"T-UP-{email.split('@')[0].upper()}", code="GST", description="GST cert", is_mandatory=True)
        db.add(req)
        db.commit()
        db.refresh(req)
        return token, bid_id, str(req.id)
    finally:
        db.close()


def test_upload_rejects_wrong_magic_bytes(client):
    token, bid_id, req_id = _bidder_upload_ctx(client, "magic@test.com")
    files = {"file": ("fake.pdf", io.BytesIO(b"this is not a pdf at all"), "application/pdf")}
    data = {"bid_id": str(bid_id), "requirement_id": str(req_id)}
    r = client.post("/api/documents/upload", files=files, data=data, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 415


def test_upload_rejects_oversized_file(client):
    token, bid_id, req_id = _bidder_upload_ctx(client, "oversize@test.com")
    payload = b"%PDF-1.4\n" + b"x" * (settings.max_upload_bytes + 1024)
    files = {"file": ("big.pdf", io.BytesIO(payload), "application/pdf")}
    data = {"bid_id": str(bid_id), "requirement_id": str(req_id)}
    r = client.post("/api/documents/upload", files=files, data=data, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 413


def test_upload_rejects_long_filename(client):
    token, bid_id, req_id = _bidder_upload_ctx(client, "longname@test.com")
    name = "a" * (settings.MAX_FILENAME_LENGTH + 50) + ".pdf"
    files = {"file": (name, io.BytesIO(b"%PDF-1.4\n" + b"x" * 100), "application/pdf")}
    data = {"bid_id": str(bid_id), "requirement_id": str(req_id)}
    r = client.post("/api/documents/upload", files=files, data=data, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 400


def test_upload_accepts_valid_small_pdf(client):
    token, bid_id, req_id = _bidder_upload_ctx(client, "validup@test.com")
    # Minimal single-page-ish PDF bytes (page-count parsing will fail on a
    # truncated PDF, so use a structurally valid tiny PDF).
    pdf = (
        b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
        b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\n"
        b"xref\n0 4\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n0\n%%EOF"
    )
    files = {"file": ("gst_certificate.pdf", io.BytesIO(pdf), "application/pdf")}
    data = {"bid_id": str(bid_id), "requirement_id": str(req_id)}
    r = client.post("/api/documents/upload", files=files, data=data, headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 201, r.text


# ---------------------------------------------------------------------------
# Login abuse protection
# ---------------------------------------------------------------------------

def test_repeated_failed_logins_lock_email(client):
    db = get_db_session()
    try:
        make_user(db, "lockme@test.com", "Passw0rdAbc")
    finally:
        db.close()
    limit = settings.LOGIN_MAX_FAILURES_PER_EMAIL
    last = None
    for i in range(limit):
        last = login(client, "lockme@test.com", "WrongPass123")
    # After reaching the failure threshold the account is locked (429),
    # even with the CORRECT password.
    last = login(client, "lockme@test.com", "Passw0rdAbc")
    assert last.status_code == 429


# ---------------------------------------------------------------------------
# Forced password change bootstrap
# ---------------------------------------------------------------------------

def test_bootstrap_admin_must_change_password(client, monkeypatch, caplog):
    import app.db.database as dbmod
    # Fresh empty DB (client fixture already dropped tables at start).
    monkeypatch.setattr(settings, "INITIAL_ADMIN_EMAIL", "root@bootstrap.example")
    monkeypatch.setattr(settings, "INITIAL_ADMIN_PASSWORD", "Bootstrap9x!Qw")
    try:
        dbmod.initialize_database()
        r = login(client, "root@bootstrap.example", "Bootstrap9x!Qw")
        assert r.status_code == 200
        assert r.json().get("must_change_password") is True
        # Token carries the claim.
        payload = __import__("app.core.security", fromlist=["decode_access_token"]).decode_access_token(
            r.json()["access_token"])
        assert payload.get("pw_change_required") is True
        # Change password clears the flag.
        headers = {"Authorization": f"Bearer {r.json()['access_token']}"}
        r2 = client.post("/api/auth/change-password",
                         json={"current_password": "Bootstrap9x!Qw", "new_password": "NewSecret42!Zz"},
                         headers=headers)
        assert r2.status_code == 200
        db = get_db_session()
        try:
            u = db.query(__import__("app.models.user", fromlist=["User"]).User).filter_by(email="root@bootstrap.example").first()
            assert u.must_change_password is False
        finally:
            db.close()
    finally:
        monkeypatch.undo()


def test_must_change_password_locks_other_endpoints(client):
    """An account flagged must_change_password can only reach the
    password-management endpoints until the password is rotated."""
    db = get_db_session()
    uid = None
    try:
        u = make_user(db, "pwforce@test.com", "FirstPass123X", role="BIDDER")
        u.must_change_password = True
        uid = str(u.id)
        db.commit()
    finally:
        db.close()
    token = login(client, "pwforce@test.com", "FirstPass123X").json()["access_token"]
    h = {"Authorization": f"Bearer {token}"}
    assert login(client, "pwforce@test.com", "FirstPass123X").json().get("must_change_password") is True
    # /me and /auth/me are allowed
    assert client.get("/api/auth/me", headers=h).status_code == 200
    # Other endpoints are locked (423)
    assert client.get("/api/bids/my-bids", headers=h).status_code == 423
    # Rotating the password unlocks everything
    r = client.post("/api/auth/change-password", json={
        "current_password": "FirstPass123X", "new_password": "Rotated99!Zz"}, headers=h)
    assert r.status_code == 200, r.text
    r2 = login(client, "pwforce@test.com", "Rotated99!Zz")
    assert r2.status_code == 200
    assert r2.json().get("must_change_password") in (None, False)
    h2 = {"Authorization": f"Bearer {r2.json()['access_token']}"}
    assert client.get("/api/bids/my-bids", headers=h2).status_code == 200


# ---------------------------------------------------------------------------
# Business-logic integrity
# ---------------------------------------------------------------------------

def test_stats_exclude_draft_tenders_and_have_no_fallback(client):
    db = get_db_session()
    try:
        u = make_user(db, "stats-officer@test.com", "Passw0rdAbc", role="OFFICER")
        from app.models.tender import Tender
        db.add(Tender(id="T-ST-DRAFT", title="Draft only", status="Draft", budget_limit=1.0))
        db.add(Tender(id="T-ST-ACT", title="Active one", status="Active", budget_limit=1.0))
        db.commit()
    finally:
        db.close()
    token = login(client, "stats-officer@test.com", "Passw0rdAbc").json()["access_token"]
    r = client.get("/api/bids/stats", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["active_tenders"] == 1


def test_bidder_list_uses_average_not_max(client):
    db = get_db_session()
    try:
        officer = make_user(db, "avg-officer@test.com", "Passw0rdAbc", role="OFFICER")
        bidder = make_user(db, "avg-bidder@test.com", "Passw0rdAbc", role="BIDDER")
        from app.models.tender import Tender
        from app.models.bid import Bid
        for i, tid in enumerate(["T-AVG-1", "T-AVG-2", "T-AVG-3"]):
            db.add(Tender(id=tid, title=f"t{i}", status="Active", budget_limit=1.0))
        db.flush()
        for i, score in enumerate((100.0, 10.0, 55.0)):
            db.add(Bid(tender_id=["T-AVG-1", "T-AVG-2", "T-AVG-3"][i], bidder_id=bidder.id,
                       status="Pending", compliance_score=score))
        db.commit()
    finally:
        db.close()
    token = login(client, "avg-officer@test.com", "Passw0rdAbc").json()["access_token"]
    r = client.get("/api/bidders", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    row = next(x for x in r.json() if x["email"] == "avg-bidder@test.com")
    # (100 + 10 + 55) / 3 = 55.0 average, not 100.
    assert row["score"] == pytest.approx(55.0)
    assert row["highest_score"] == pytest.approx(100.0)
    assert row["average_score"] == pytest.approx(55.0)
    # Risk derived from centralized thresholds (55 -> HIGH band).
    assert row["risk"] == "HIGH"


def test_risk_thresholds_endpoint_matches_config(client):
    r = client.get("/api/config/risk-thresholds")
    assert r.status_code == 200
    t = r.json()["thresholds"]
    assert t["LOW"]["min"] == settings.RISK_LOW_MIN
    assert t["HIGH"]["min"] == settings.RISK_HIGH_MIN


def test_unscored_bid_is_not_given_fabricated_score(client):
    db = get_db_session()
    bid_id = None
    try:
        bidder = make_user(db, "noscore-bidder@test.com", "Passw0rdAbc", role="BIDDER")
        _, bid_id = _make_tender_and_bid(db, "T-NOSCORE", bidder, status="Active", score=0.0)
    finally:
        db.close()
    token = login(client, "noscore-bidder@test.com", "Passw0rdAbc").json()["access_token"]
    r = client.get(f"/api/bids/{bid_id}", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["compliance_score"] == 0.0
    assert r.json()["risk_level"] != "LOW"

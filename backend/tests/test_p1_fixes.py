"""Regression tests for the P1 audit fixes.

  * Defect 5 — the EPFO route 404'd on real establishment IDs (they contain '/').
  * Defect 6 — the MCA21 adapter silently fell back to simulated data while the
    README/UI advertised "Live (data.gov.in)".
  * Defect 7 — bid scoring used a document-count heuristic instead of the real
    ``ComplianceScorer``.
"""

import os
import sys
import uuid

import pytest

_BACKEND = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, _BACKEND)


def test_scorer_tolerates_non_list_entries_in_verification_results():
    """ComplianceScorer reads the scalar `is_wrong_document` flag out of
    verification_results, then iterates the dict's values as lists. Without a
    type guard the blacklisted scan raises TypeError ('bool' object is not
    iterable) and every score calculation silently falls back to a heuristic.
    """
    from app.scoring import ComplianceScorer

    verification_results = {
        "gstin": [{"verified": True, "found": True,
                   "data": {"gstin": "29ABCDE1234F1Z5", "status": "Active",
                            "blacklisted": False}}],
        "pan": [], "udyam": [], "aadhaar": [],
        "is_wrong_document": False,   # scalar — must not break the scan
        "documents": [],              # list — must be tolerated
    }

    report = ComplianceScorer.calculate_compliance_score(
        verification_results=verification_results, tender_config=None)

    assert isinstance(report.get("score"), (int, float)), report
    assert report["score"] > 0
    assert not any("blacklisted" in d for d in report.get("deductions", []))


@pytest.fixture(scope="module")
def client():
    from fastapi.testclient import TestClient
    from app.main import app as fastapi_app
    from app.db.database import Base, engine, SessionLocal
    from app.models.user import User
    from app.core.security import get_password_hash
    import app.models  # noqa: F401

    Base.metadata.drop_all(bind=engine)
    with TestClient(fastapi_app) as c:
        db = SessionLocal()
        for email, password, role in (
            ("officer@example.com", "Off!cerSecure#2026x", "OFFICER"),
            ("bidder@example.com", "Bid!derSecure#2026x", "BIDDER"),
        ):
            db.add(User(full_name=email.split("@")[0].title(), email=email,
                        password_hash=get_password_hash(password), role=role,
                        is_active=True))
        db.commit()
        db.close()
        yield c
    Base.metadata.drop_all(bind=engine)


# ---------------------------------------------------------------------------
# Defect 5 — establishment IDs containing '/'
# ---------------------------------------------------------------------------
@pytest.mark.parametrize("epfo_id", [
    "MH%2FBAN%2F0045123",          # percent-encoded (what the audit probe sends)
    "MH/BAN/0045123/000",          # raw slashes, full code
    "MHBAN0045123000",             # separators stripped
    "BAN%2FMISMATCH%2F01",         # the deliberate mismatch fixture still works
])
def test_epfo_route_accepts_slash_containing_ids(client, epfo_id):
    r = client.get(f"/api/verify/epfo/{epfo_id}")
    assert r.status_code == 200, f"{epfo_id} -> {r.status_code}"
    body = r.json()
    assert body.get("source") == "EPFO-MOCK"
    assert body.get("employer_id")
    # Separators are normalised away, so every spelling resolves to one record.
    assert "/" not in body["employer_id"]


def test_esic_and_blacklist_routes_accept_path_ids(client):
    for path in ("/api/verify/esic/31000451230000101",
                 "/api/verify/blacklist/PAN%2FABCS1234M",
                 "/api/verify/blacklist/27AAPCS1234M1Z5"):
        r = client.get(path)
        assert r.status_code == 200, f"{path} -> {r.status_code}"


# ---------------------------------------------------------------------------
# Defect 6 — honest MCA21 status
# ---------------------------------------------------------------------------
def test_mca_adapter_reports_why_it_is_not_live(client):
    from app.mock_apis.datagov_mca_adapter import DataGovMCAAdapter

    status = DataGovMCAAdapter.configuration_status()
    assert "live_lookup_configured" in status
    assert "reason_not_live" in status
    assert "endpoint" in status

    r = client.get("/api/verify/mca/U72900TN2018PTC123456")
    assert r.status_code == 200
    body = r.json()

    # The response must never claim to be live when it is not.
    if body.get("live_lookup_configured") is False:
        assert body.get("is_live") is False
        assert body.get("reason_not_live"), "a non-live response must explain why"
        assert "Simulated" in str(body.get("source", ""))
    else:
        assert body.get("is_live") is True


def test_gateway_status_endpoint_is_the_single_source_of_truth(client):
    r = client.get("/api/verify/status")
    assert r.status_code == 200
    body = r.json()

    assert body["success"] is True
    assert body["disclosure"], "a disclosure string must be available for the UI"
    registries = body["registries"]
    for key in ("gstn", "pan", "udyam", "mca21", "epfo", "esic",
                "startup_india", "nsic", "debarment", "digilocker"):
        assert key in registries, key
        assert registries[key]["mode"] in ("live", "simulated")

    # live + simulated must partition the whole set
    assert set(body["live_registries"]) | set(body["simulated_registries"]) == set(registries)
    assert not (set(body["live_registries"]) & set(body["simulated_registries"]))


# ---------------------------------------------------------------------------
# Defect 7 — scoring goes through ComplianceScorer
# ---------------------------------------------------------------------------
def test_re_verify_uses_the_compliance_scorer(client):
    """A bid with real verified documents must be scored by the engine, not by
    the old `60 + min(34, docs*6) + 10 if OEM + 10 if EPFO` heuristic."""
    officer_token = _login(client, "officer@example.com", "Off!cerSecure#2026x")
    bidder_token = _login(client, "bidder@example.com", "Bid!derSecure#2026x")

    tender_id = _create_tender(client, officer_token, "P1 Scoring Tender")
    bid_id = _apply(client, bidder_token, tender_id)

    r = client.post(f"/api/bids/{bid_id}/re-verify", headers=_auth(officer_token))
    assert r.status_code == 200, r.text
    body = r.json()

    assert "scoring_method" in body, body
    assert body["new_score"] is not None
    # The breakdown must be exposed so the officer can see *why*.
    breakdown = body.get("score_breakdown") or {}
    assert "document_counts" in breakdown, body
    assert 0 <= body["new_score"] <= 100


def test_scoring_service_reports_its_method():
    """`recalculate_bid_score` must say which engine produced the number."""
    from app.services.bid_scoring import recalculate_bid_score

    class _FakeBid:
        # Must be a real UUID: the ORM compares UUID columns, not strings.
        id = uuid.UUID("550e8400-e29b-11d4-a716-446655440000")
        tender_id = "GEM/2026/001"
        compliance_score = None
        tender = None

    # No documents at all -> the scorer still runs and reports a method.
    from app.db.database import SessionLocal
    db = SessionLocal()
    try:
        report = recalculate_bid_score(db, _FakeBid())
    finally:
        db.close()

    assert "score" in report
    assert report.get("scoring_method") in {"compliance_scorer", "document_coverage_ratio"}
    assert "document_counts" in report


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------
def _auth(token):
    return {"Authorization": f"Bearer {token}"}


def _login(client, email, password):
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def _create_tender(client, officer_token, title):
    r = client.post("/api/tenders", headers=_auth(officer_token), json={
        "title": title,
        "description": "P1 regression tender.",
        "budget_limit": 1000000,
        "status": "Active",
        "requirements": [
            {"code": "GST", "description": "GST certificate.", "is_mandatory": True}
        ],
    })
    assert r.status_code in (200, 201), r.text
    return r.json()["tender"]["id"]


def _apply(client, bidder_token, tender_id):
    r = client.post("/api/bids", headers=_auth(bidder_token),
                    json={"tender_id": tender_id})
    assert r.status_code in (200, 201), r.text
    return r.json()["bid"]["id"]

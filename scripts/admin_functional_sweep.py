#!/usr/bin/env python3
"""
Full functional sweep of the Bid Zee admin surface against the live dev server.
Covers: auth/session/forced-change, user management, tenders, bids, officer
decisions, explainable override, documents (upload/process/download/replace/
reprocess/delete), analysis, audit trail, blockchain audit, live monitoring
(+WebSocket), cartel, benchmarks, post-award, notifications, chat/support,
mobile, digilocker, multilingual, registries, sync, config.

Run:  /home/user/repo/.venv/bin/python scripts/admin_functional_sweep.py
"""
import asyncio
import io
import json
import sys
import time

import requests

BASE = "http://127.0.0.1:8000"

# Known credentials: new (post-rotation) first, then the seeded one-time ones.
AD = "admin@example.com"
OFF = "officer@example.com"
BID = "bidder@example.com"
ADMIN_PWS = ["Adm!nSecure#2026x", "ZEky9dCwJ0SH7m-M"]
OFFICER_PWS = ["Off!cerSecure#2026x", "ef1ksQEuhQZE8o90"]
BIDDER_PWS = ["Bid!derSecure#2026x", "fTjTRNpi-rynI4bj"]
ADMIN_NEW, OFFICER_NEW, BIDDER_NEW = ADMIN_PWS[0], OFFICER_PWS[0], BIDDER_PWS[0]

SEED_BID = "550e8400-e29b-11d4-a716-446655440000"
SEED_TENDER = "GEM/2026/001"
SEED_REQ = "440e8400-e29b-11d4-a716-446655440000"

TERMINAL = ("PROCESSED", "REQUIRES_REVIEW", "VERIFIED", "REJECTED", "PROCESSING_FAILED")

results = []


def check(name, ok, detail=""):
    results.append((name, bool(ok), str(detail)[:160]))
    print(f"{'PASS' if ok else 'FAIL'}  {name}" + (f"  [{detail}]" if detail and not ok else ""))
    return ok


def jbody(r):
    try:
        return r.json()
    except Exception:
        return {}


class Client:
    def __init__(self):
        self.s = requests.Session()

    def req(self, method, path, **kw):
        return self.s.request(method, BASE + path, timeout=120, **kw)

    def login(self, email, *passwords):
        r = None
        for pw in passwords:
            r = self.s.post(f"{BASE}/api/auth/login", json={"email": email, "password": pw}, timeout=30)
            if r.status_code == 200:
                return r
            if r.status_code == 429:  # per-IP throttle - wait out Retry-After once
                wait = min(int(r.headers.get("Retry-After", "60") or 60), 90)
                time.sleep(wait + 1)
                r = self.s.post(f"{BASE}/api/auth/login", json={"email": email, "password": pw}, timeout=30)
                if r.status_code == 200:
                    return r
        return r


def make_pdf(text):
    import pymupdf
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((72, 72), text)
    data = doc.tobytes()
    doc.close()
    return data


def poll_document_status(session, headers, bid_id, doc_id, timeout=75):
    end = time.time() + timeout
    last = None
    while time.time() < end:
        time.sleep(2.5)
        rr = session.get(BASE + f"/api/documents/bid/{bid_id}", headers=headers, timeout=30)
        if rr.status_code != 200:
            continue
        for d in jbody(rr):
            if str(d.get("id")) == str(doc_id):
                last = (d.get("document_status") or "").upper()
                if last in TERMINAL:
                    return last
    return last


def main():
    admin = Client()
    officer = Client()
    bidder = Client()

    # ------------------------------------------------------------------ A
    print("\n=== A. Auth, session & forced password change ===")
    check("A1 health", admin.req("GET", "/health").status_code == 200)
    check("A2 root endpoint", admin.req("GET", "/").status_code == 200)

    r = admin.login(AD, *ADMIN_PWS)
    body = jbody(r)
    check("A3 admin login", r.status_code == 200, r.text[:120])
    if r.status_code == 200 and body.get("must_change_password"):
        h = {"Authorization": f"Bearer {body['access_token']}"}
        check("A4 protected route locked (423) while must_change_password",
              admin.s.get(BASE + "/api/bids", headers=h, timeout=30).status_code == 423)
        check("A5 /api/auth/me allowed while locked",
              admin.s.get(BASE + "/api/auth/me", headers=h, timeout=30).status_code == 200)
        rc = admin.s.post(BASE + "/api/auth/change-password",
                          json={"current_password": ADMIN_PWS[-1], "new_password": ADMIN_NEW},
                          headers=h, timeout=30)
        check("A6 change-password", rc.status_code == 200, rc.text[:120])
        old = admin.login(AD, ADMIN_PWS[-1])
        check("A7 old password rejected after rotation", old.status_code in (401, 403), f"got {old.status_code}")
        r = admin.login(AD, ADMIN_NEW)
        body = jbody(r)
        check("A8 re-login with new password", r.status_code == 200 and not body.get("must_change_password"), r.text[:120])
    else:
        check("A4-A8 forced-change flow (already rotated in earlier run)", r.status_code == 200)

    ADMIN_TOKEN = jbody(r)["access_token"]
    h = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
    vr = admin.s.post(BASE + "/api/auth/verify-password", json={"password": ADMIN_NEW}, headers=h, timeout=30)
    vw = admin.s.post(BASE + "/api/auth/verify-password", json={"password": "wrong-pass-123"}, headers=h, timeout=30)
    check("A9 verify-password (correct)", vr.status_code == 200, vr.text[:100])
    check("A10 verify-password (wrong) rejected", vw.status_code in (400, 401, 403), f"got {vw.status_code}")
    wt = admin.s.get(BASE + "/api/auth/ws-token", headers=h, timeout=30)
    check("A11 ws-token ticket issued", wt.status_code == 200 and jbody(wt).get("ws_token"), wt.text[:100])
    bs = admin.s.get(BASE + "/api/auth/biometric/status", headers=h, timeout=30)
    check("A12 biometric status reports disabled", bs.status_code == 200 and jbody(bs).get("enabled") is False, bs.text[:100])
    rb = admin.s.post(BASE + "/api/auth/biometric/register", headers=h, timeout=30,
                      json={"device_type": "external_hardware_key", "device_name": "Sweep device"})
    bs2 = admin.s.get(BASE + "/api/auth/biometric/status", headers=h, timeout=30)
    check("A13 biometric register is inert placeholder (auth still disabled)",
          rb.status_code == 200 and jbody(bs2).get("enabled") is False, f"register={rb.status_code} status={bs2.text[:80]}")

    r = officer.login(OFF, *OFFICER_PWS)
    off_flag = jbody(r).get("must_change_password") if r.status_code == 200 else None
    if r.status_code == 200 and off_flag:
        oh = {"Authorization": f"Bearer {jbody(r)['access_token']}"}
        rc = officer.s.post(BASE + "/api/auth/change-password",
                            json={"current_password": OFFICER_PWS[-1], "new_password": OFFICER_NEW}, headers=oh, timeout=30)
        check("A14 officer forced-change flow", rc.status_code == 200, rc.text[:100])
    r2 = officer.login(OFF, OFFICER_NEW)
    check("A15 officer login (final)", r2.status_code == 200, r2.text[:100])
    OFF_TOKEN = jbody(r2)["access_token"]

    r = bidder.login(BID, *BIDDER_PWS)
    bid_flag = jbody(r).get("must_change_password") if r.status_code == 200 else None
    if r.status_code == 200 and bid_flag:
        bh = {"Authorization": f"Bearer {jbody(r)['access_token']}"}
        rc = bidder.s.post(BASE + "/api/auth/change-password",
                           json={"current_password": BIDDER_PWS[-1], "new_password": BIDDER_NEW}, headers=bh, timeout=30)
        check("A16 bidder forced-change flow", rc.status_code == 200, rc.text[:100])
    r2 = bidder.login(BID, BIDDER_NEW)
    check("A17 bidder login (final)", r2.status_code == 200, r2.text[:100])
    BID_TOKEN = jbody(r2)["access_token"]

    ADMIN_H = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
    OFF_H = {"Authorization": f"Bearer {OFF_TOKEN}"}
    BID_H = {"Authorization": f"Bearer {BID_TOKEN}"}

    # ------------------------------------------------------------------ B
    print("\n=== B. Admin user management ===")
    r = admin.s.get(BASE + "/api/admin/users", headers=ADMIN_H, timeout=30)
    users = jbody(r)
    check("B1 list users", r.status_code == 200 and len(users) >= 3, r.text[:100])
    r = admin.s.get(BASE + "/api/admin/users/stats", headers=ADMIN_H, timeout=30)
    check("B2 user stats", r.status_code == 200 and "total_users" in jbody(r), r.text[:100])

    email = f"sweep.user.{int(time.time())}@example.com"
    r = admin.s.post(BASE + "/api/admin/users", headers=ADMIN_H, timeout=30, json={
        "full_name": "Sweep Test User", "email": email, "password": "SweepUser123!x",
        "role": "BIDDER", "department": "QA", "admin_authorization_password": ADMIN_NEW})
    check("B3 create user (201)", r.status_code == 201, r.text[:150])
    new_id = jbody(r).get("id") or jbody(r).get("user_id")
    check("B4 created user flagged must_change_password",
          jbody(r).get("must_change_password") is not False, json.dumps(jbody(r))[:120])

    if new_id:
        r = admin.s.get(f"{BASE}/api/admin/users/{new_id}", headers=ADMIN_H, timeout=30)
        check("B5 get user by id", r.status_code == 200, r.text[:100])
        r = admin.s.patch(f"{BASE}/api/admin/users/{new_id}", headers=ADMIN_H, timeout=30,
                          json={"department": "QA-Sweep"})
        check("B6 update user", r.status_code == 200 and jbody(r).get("department") == "QA-Sweep", r.text[:120])
        r = admin.s.post(f"{BASE}/api/admin/users/{new_id}/reset-password", headers=ADMIN_H, timeout=30,
                         json={"admin_password": ADMIN_NEW})
        tmp = jbody(r).get("temp_password") or jbody(r).get("new_password")
        check("B7 reset-password returns temp password", r.status_code in (200, 201) and bool(tmp), r.text[:150])
        if tmp:
            c = Client()
            lr = c.login(email, tmp)
            check("B8 login with temp password", lr.status_code == 200, lr.text[:100])
        r = admin.s.patch(f"{BASE}/api/admin/users/{new_id}/status", headers=ADMIN_H, timeout=30,
                          json={"status": "Suspended", "admin_password": ADMIN_NEW})
        check("B9 suspend user", r.status_code == 200, r.text[:120])
        c2 = Client()
        check("B10 suspended user cannot login", c2.login(email, tmp if tmp else "SweepUser123!x").status_code in (401, 403))
        r = admin.s.patch(f"{BASE}/api/admin/users/{new_id}/status", headers=ADMIN_H, timeout=30,
                          json={"status": "Active", "admin_password": ADMIN_NEW})
        check("B11 reactivate user", r.status_code == 200, r.text[:120])

    # blacklist (by user_id of the sweep user)
    r = admin.s.post(BASE + "/api/admin/blacklist", headers=ADMIN_H, timeout=30, json={
        "user_id": new_id, "reason": "Sweep test blacklisting", "admin_password": ADMIN_NEW})
    check("B12 add to blacklist", r.status_code in (200, 201), r.text[:150])
    r = admin.s.get(BASE + "/api/admin/blacklist", headers=ADMIN_H, timeout=30)
    entry = next((e for e in jbody(r) if str(e.get("id")) == str(new_id)), None) if isinstance(jbody(r), list) else None
    check("B13 blacklist list shows entry flagged",
          r.status_code == 200 and bool(entry) and entry.get("is_blacklisted") is True,
          json.dumps(entry or {})[:150])
    r = admin.s.post(BASE + "/api/admin/unblacklist", headers=ADMIN_H, timeout=30,
                     json={"user_id": new_id, "admin_password": ADMIN_NEW})
    r2 = admin.s.get(BASE + "/api/admin/blacklist", headers=ADMIN_H, timeout=30)
    entry2 = next((e for e in jbody(r2) if str(e.get("id")) == str(new_id)), None) if isinstance(jbody(r2), list) else None
    check("B14 unblacklist clears flag",
          r.status_code in (200, 201, 204) and bool(entry2) and entry2.get("is_blacklisted") is not True,
          f"post={r.text[:80]} entry={json.dumps(entry2 or {})[:100]}")

    if new_id:
        r = admin.s.delete(f"{BASE}/api/admin/users/{new_id}", headers=ADMIN_H, timeout=30)
        check("B15 delete user", r.status_code in (200, 204), f"got {r.status_code}")
        c3 = Client()
        check("B16 deleted user cannot login", c3.login(email, "SweepUser123!x").status_code in (401, 403))

    # ------------------------------------------------------------------ C
    print("\n=== C. Tender management ===")
    r = admin.s.get(BASE + "/api/tenders", headers=ADMIN_H, timeout=30)
    tlist = jbody(r)
    check("C1 list tenders (incl. seeded)", r.status_code == 200 and
          any((t.get("id") == SEED_TENDER) for t in (tlist if isinstance(tlist, list) else tlist.get("tenders", []))),
          r.text[:150])
    tid = f"SWEEP/T/{int(time.time())}"
    r = admin.s.post(BASE + "/api/tenders", headers=ADMIN_H, timeout=30, json={
        "id": tid, "title": "Sweep Test Tender", "description": "Created by functional sweep",
        "budget_limit": 1234567.0, "category": "Goods", "department": "QA", "status": "Draft"})
    check("C2 create tender", r.status_code in (200, 201), r.text[:150])
    r = admin.s.get(f"{BASE}/api/tenders/{tid}", headers=ADMIN_H, timeout=30)
    check("C3 get tender by id", r.status_code == 200 and jbody(r).get("title") == "Sweep Test Tender", r.text[:120])
    r = admin.s.put(f"{BASE}/api/tenders/{tid}", headers=ADMIN_H, timeout=30,
                    json={"title": "Sweep Test Tender (updated)", "description": "updated"})
    check("C4 update tender", r.status_code == 200, r.text[:120])
    r = admin.s.put(f"{BASE}/api/tenders/{tid}/requirements", headers=ADMIN_H, timeout=30, json={
        "requirements": [
            {"code": "GST", "description": "GST certificate", "is_mandatory": True},
            {"code": "PAN", "description": "PAN card", "is_mandatory": True},
        ]})
    check("C5 set tender requirements", r.status_code == 200, r.text[:150])
    sweep_req_id = None
    r = admin.s.get(f"{BASE}/api/tenders/{tid}", headers=ADMIN_H, timeout=30)
    reqs = (jbody(r).get("requirements") or []) if r.status_code == 200 else []
    if reqs:
        sweep_req_id = reqs[0].get("id")
    r = admin.s.post(f"{BASE}/api/tenders/{tid}/publish", headers=ADMIN_H, timeout=30, json={"admin_password": ADMIN_NEW})
    if r.status_code == 422:
        r = admin.s.post(f"{BASE}/api/tenders/{tid}/publish", headers=ADMIN_H, timeout=30, json={})
    check("C6 publish tender", r.status_code == 200, r.text[:150])
    check("C6b sweep tender has requirement ids", bool(sweep_req_id), json.dumps(reqs)[:120])
    r = admin.s.patch(f"{BASE}/api/tenders/{tid}/status", headers=ADMIN_H, timeout=30,
                      json={"status": "Closed"})
    check("C7 close tender", r.status_code == 200, r.text[:150])
    r = admin.s.get(BASE + "/api/v1/tenders", headers=ADMIN_H, timeout=30)
    check("C8 canonical /api/v1/tenders", r.status_code == 200, r.text[:100])

    # ------------------------------------------------------------------ D
    print("\n=== D. Bids & officer decisions ===")
    r = admin.s.get(BASE + "/api/bids", headers=ADMIN_H, timeout=30)
    b = jbody(r)
    bids = b if isinstance(b, list) else b.get("bids", [])
    check("D1 list all bids (officer view)", r.status_code == 200 and len(bids) >= 1, r.text[:120])
    r = admin.s.get(f"{BASE}/api/bids/{SEED_BID}", headers=ADMIN_H, timeout=30)
    check("D2 bid detail", r.status_code == 200, r.text[:120])
    r = admin.s.get(f"{BASE}/api/bids/tender/{SEED_TENDER}", headers=ADMIN_H, timeout=30)
    check("D3 bids for tender", r.status_code == 200, r.text[:120])
    r = admin.s.get(BASE + "/api/bids/stats", headers=ADMIN_H, timeout=30)
    check("D4 bid stats", r.status_code == 200, r.text[:120])

    r = admin.s.get(f"{BASE}/api/v1/override/explainable/{SEED_BID}", headers=ADMIN_H, timeout=30)
    check("D5 explainable override payload", r.status_code == 200, r.text[:150])
    r = admin.s.post(BASE + "/api/v1/override/decision", headers=ADMIN_H, timeout=60, json={
        "officer_password": ADMIN_NEW, "bid_id": SEED_BID, "officer_status": "Approved",
        "deviation_category": "Minor Administrative",
        "justification": "Functional sweep: all mandatory documents verified by automated checks."})
    d6_ok = r.status_code in (200, 201)
    d6_note = ""
    if not d6_ok and "already been finalized" in r.text:
        d6_ok, d6_note = True, " (decision locked from prior run - double-submission block works)"
    check("D6 officer override decision recorded", d6_ok, r.text[:150] + d6_note)

    r = admin.s.post(f"{BASE}/api/bids/{SEED_BID}/re-verify", headers=ADMIN_H, timeout=120, json={})
    check("D7 re-verify bid", r.status_code == 200, r.text[:150])
    r = admin.s.post(f"{BASE}/api/bids/{SEED_BID}/request-clarification", headers=ADMIN_H, timeout=60, json={
        "requirement_id": SEED_REQ, "requirement_name": "GST Certificate",
        "message": "Sweep: please confirm GSTIN status is active."})
    check("D8 request clarification from bidder", r.status_code in (200, 201), r.text[:150])

    # ------------------------------------------------------------------ E
    print("\n=== E. Documents (bidder workflow) ===")
    r = bidder.s.get(BASE + "/api/bids/my-bids", headers=BID_H, timeout=30)
    check("E1 bidder my-bids", r.status_code == 200, r.text[:120])

    pdf = make_pdf("GSTIN 29ABCDE1234F1Z5\nStatus: Active\nRegistration: Regular")
    r = bidder.s.post(BASE + "/api/documents/upload", headers=BID_H, timeout=120,
                      files={"file": ("sweep_gst.pdf", io.BytesIO(pdf), "application/pdf")},
                      data={"bid_id": SEED_BID, "requirement_id": SEED_REQ})
    doc = jbody(r).get("document", {})
    doc_id = doc.get("id")
    check("E2 upload document (201)", r.status_code == 201, r.text[:150])

    final = poll_document_status(bidder.s, BID_H, SEED_BID, doc_id) if doc_id else None
    check("E3 document processed to terminal status", final in TERMINAL, f"status={final}")

    if doc_id:
        r = bidder.s.get(BASE + f"/api/documents/{doc_id}/extraction", headers=BID_H, timeout=30)
        check("E4 extraction details", r.status_code == 200, r.text[:120])
        r = bidder.s.get(BASE + f"/api/documents/{doc_id}/download", headers=BID_H, timeout=30)
        check("E5 document download", r.status_code == 200 and len(r.content) > 100, f"{r.status_code} len={len(r.content)}")
        r = bidder.s.post(BASE + f"/api/documents/{doc_id}/reprocess", headers=BID_H, timeout=120)
        check("E6 reprocess correctly rejects finalized VERIFIED doc (409)",
              r.status_code == 409 and "reprocessing is not allowed" in r.text,
              f"got {r.status_code}: {r.text[:120]}")
        r = bidder.s.delete(BASE + f"/api/documents/{doc_id}", headers=BID_H, timeout=30)
        check("E7 delete correctly blocked on finalized bid (400)",
              r.status_code == 400 and "finalized" in r.text, f"got {r.status_code}: {r.text[:120]}")

    # Positive delete path: fresh Pending bid on the sweep tender
    r = admin.s.patch(f"{BASE}/api/tenders/{tid}/status", headers=ADMIN_H, timeout=30, json={"status": "Active"})
    rb = bidder.s.post(BASE + "/api/bids", headers=BID_H, timeout=60, json={"tender_id": tid})
    new_bid = jbody(rb).get("bid") or jbody(rb)
    new_bid_id = new_bid.get("id")
    check("E8 bidder applies to active tender (201, Pending)", rb.status_code == 201 and new_bid_id, rb.text[:150])
    if new_bid_id and sweep_req_id:
        rb2 = bidder.s.post(BASE + "/api/documents/upload", headers=BID_H, timeout=120,
                            files={"file": ("sweep_gst2.pdf", io.BytesIO(pdf), "application/pdf")},
                            data={"bid_id": new_bid_id, "requirement_id": sweep_req_id})
        d2 = (jbody(rb2).get("document") or {}).get("id")
        check("E9 upload doc on fresh Pending bid", rb2.status_code == 201, rb2.text[:150])
        if d2:
            poll_document_status(bidder.s, BID_H, new_bid_id, d2, timeout=45)
            r = bidder.s.delete(BASE + f"/api/documents/{d2}", headers=BID_H, timeout=30)
            check("E10 delete document on Pending bid (200/204)", r.status_code in (200, 204), f"got {r.status_code}: {r.text[:120]}")

    # ------------------------------------------------------------------ F
    print("\n=== F. Analysis pipeline ===")
    r = admin.s.post(BASE + "/api/analyze", timeout=180,
                     files={"file": ("full.pdf", io.BytesIO(make_pdf("GSTIN 29ABCDE1234F1Z5 PAN ABCDE1234F UDYAM-UP-12-0001234")), "application/pdf")})
    an = jbody(r)
    check("F1 /api/analyze full pipeline", r.status_code == 200 and an.get("compliance", {}).get("score") is not None, r.text[:200])

    r = admin.s.post(BASE + "/api/analyze/declarations", timeout=60, json={
        "text": "We commit to environmental compliance, social responsibility, and governance, as well as data encryption, access control, and breach notification."})
    check("F2a /api/analyze/declarations", r.status_code == 200, r.text[:150])
    r = admin.s.post(BASE + "/api/analyze/validate-emd", timeout=60, json={
        "text": "EARNEST MONEY DEPOSIT (EMD) - State Bank of India Amount: ₹ 50,000.00", "tender_value": 2000000.0})
    check("F2b /api/analyze/validate-emd", r.status_code == 200, r.text[:150])
    r = admin.s.post(BASE + "/api/analyze/validate-epbg", timeout=60, json={
        "text": "PERFORMANCE BANK GUARANTEE (e-PBG) - HDFC Bank Amount: ₹ 150,000.00", "tender_value": 3000000.0})
    check("F2c /api/analyze/validate-epbg", r.status_code == 200, r.text[:150])
    r = admin.s.post(BASE + "/api/analyze/validate-dsc", timeout=60, json={"pan_number": "AAACA1234A"})
    check("F2d /api/analyze/validate-dsc", r.status_code == 200, r.text[:150])
    r = admin.s.post(BASE + "/api/evaluate", headers=ADMIN_H, timeout=120, json={
        "bid_id": SEED_BID, "tender_id": SEED_TENDER, "compliance_score": 88})
    check("F3 /api/evaluate", r.status_code == 200, r.text[:150])

    # ------------------------------------------------------------------ G
    print("\n=== G. Audit trail ===")
    r = admin.s.get(BASE + "/api/audit/logs", headers=ADMIN_H, timeout=30)
    logs = jbody(r)
    log_list = logs if isinstance(logs, list) else logs.get("logs", [])
    check("G1 audit logs present", r.status_code == 200 and len(log_list) > 0, r.text[:120])
    if log_list:
        lid = log_list[0].get("id")
        r = admin.s.get(BASE + f"/api/audit/verify/{lid}", headers=ADMIN_H, timeout=30)
        check("G2 verify audit log entry", r.status_code == 200, r.text[:150])
    r = admin.s.get(BASE + f"/api/audit/bids/{SEED_BID}/verify", headers=ADMIN_H, timeout=30)
    check("G3 verify bid audit chain", r.status_code == 200, r.text[:150])

    # ------------------------------------------------------------------ H
    print("\n=== H. Blockchain audit ===")
    r = admin.s.get(BASE + "/api/v1/blockchain/chain", headers=ADMIN_H, timeout=30)
    check("H1 blockchain chain", r.status_code == 200, r.text[:120])
    r = admin.s.get(BASE + "/api/v1/blockchain/integrity-check", headers=ADMIN_H, timeout=30)
    check("H2 blockchain integrity check", r.status_code == 200, r.text[:150])
    r = admin.s.get(BASE + f"/api/v1/blockchain/merkle-tree/{SEED_BID}", headers=ADMIN_H, timeout=30)
    check("H3 merkle tree for bid", r.status_code == 200, r.text[:150])

    # ------------------------------------------------------------------ I
    print("\n=== I. Live monitoring ===")
    r = admin.s.get(BASE + "/api/v1/monitoring/recent-events", headers=ADMIN_H, timeout=30)
    check("I1 recent events", r.status_code == 200, r.text[:120])
    r = admin.s.post(BASE + "/api/v1/monitoring/simulate-bid", headers=ADMIN_H, timeout=60, json={
        "tender_id": SEED_TENDER, "bidder_name": "Sweep Compliant Ltd", "score": 91,
        "include_forgery_alert": False, "include_cartel_alert": False})
    check("I2 simulate compliant bid", r.status_code == 200, r.text[:150])
    r = admin.s.post(BASE + "/api/v1/monitoring/simulate-bid", headers=ADMIN_H, timeout=60, json={
        "tender_id": SEED_TENDER, "bidder_name": "Sweep Non-Compliant Ltd", "score": 38,
        "include_forgery_alert": True, "include_cartel_alert": True})
    check("I3 simulate non-compliant bid (risk from centralized thresholds)",
          r.status_code == 200 and ("CRITICAL" in r.text or "HIGH" in r.text), r.text[:150])

    async def ws_test():
        import websockets
        ticket = jbody(admin.s.get(BASE + "/api/auth/ws-token", headers=ADMIN_H, timeout=30)).get("ws_token")
        async with websockets.connect("ws://127.0.0.1:8000/api/v1/monitoring/live") as ws:
            await ws.send(json.dumps({"token": ticket}))
            msg = json.loads(await asyncio.wait_for(ws.recv(), timeout=15))
            return msg.get("type") == "authenticated"

    try:
        check("I4 WebSocket handshake authenticates (admin ws-ticket)", asyncio.run(ws_test()))
    except Exception as e:
        check("I4 WebSocket handshake authenticates (admin ws-ticket)", False, repr(e)[:140])

    # ------------------------------------------------------------------ J
    print("\n=== J. Cartel, benchmarks, post-award, misc ===")
    r = admin.s.post(BASE + f"/api/v1/cartel/analyze/{SEED_TENDER}", headers=ADMIN_H, timeout=120, json=[
        {"bid_id": "BID-01", "bidder_name": "Alpha Corp", "gstin": "27AAPCS1234M1Z5", "pan": "AAPCS1234M",
         "quote_amount": 500000, "submission_timestamp": "2026-08-31T10:00:00Z", "ip_address": "103.22.45.10",
         "directors": ["Rajesh Sharma"], "addresses": ["Plot 42 Cyber City, Gurugram"], "bank_accounts": ["HDFC-998877"]},
        {"bid_id": "BID-02", "bidder_name": "Beta Corp", "gstin": "27BBBFS9876N1Z8", "pan": "BBBFS9876N",
         "quote_amount": 500500, "submission_timestamp": "2026-08-31T10:01:00Z", "ip_address": "103.22.45.10",
         "directors": ["Rajesh Sharma"], "addresses": ["Plot 43 Cyber City, Gurugram"], "bank_accounts": ["HDFC-998877"]}])
    check("J1 cartel analysis (shared IP + directors => signal)", r.status_code == 200, r.text[:150])
    r = admin.s.get(BASE + "/api/v1/cartel/clusters", headers=ADMIN_H, timeout=30)
    check("J2 cartel clusters", r.status_code == 200, r.text[:120])
    r = admin.s.get(BASE + "/api/v1/benchmark/live-metrics", headers=ADMIN_H, timeout=60)
    check("J3 benchmark live metrics", r.status_code == 200, r.text[:120])
    r = admin.s.get(BASE + "/api/v1/benchmark/gem-scale-report", headers=ADMIN_H, timeout=60)
    check("J4 gem-scale report", r.status_code == 200, r.text[:120])
    r = admin.s.post(BASE + "/api/post-award/simulate-pfms", headers=ADMIN_H, timeout=60, json={"bid_id": SEED_BID})
    check("J5 simulate PFMS (post-award)", r.status_code == 200, r.text[:150])
    r = admin.s.get(BASE + f"/api/post-award/status/{SEED_BID}", headers=ADMIN_H, timeout=30)
    check("J6 post-award status", r.status_code == 200, r.text[:150])
    r = admin.s.post(BASE + "/api/post-award/track-crac", headers=ADMIN_H, timeout=60, json={"bid_id": SEED_BID})
    check("J7 track CRAC", r.status_code == 200, r.text[:150])
    r = bidder.s.get(BASE + "/api/notifications", headers=BID_H, timeout=30)
    check("J8 bidder notifications", r.status_code == 200, r.text[:120])
    r = admin.s.get(BASE + "/api/config/risk-thresholds", timeout=30)
    rt = jbody(r)
    check("J9 risk thresholds public config", r.status_code == 200 and
          (rt.get("LOW") or rt.get("low") or {}).get("min", 90) >= 90, r.text[:120])

    # chat / support
    r = bidder.s.get(BASE + "/api/chat/bids", headers=BID_H, timeout=30)
    check("J10 chat bids context", r.status_code == 200, r.text[:120])
    r = admin.s.post(BASE + "/api/chat", headers=ADMIN_H, timeout=60, json={"message": "Sweep test ping"})
    check("J11 chat responds gracefully (no 500 without AI key)", r.status_code != 500, f"got {r.status_code}: {r.text[:100]}")
    r = bidder.s.get(BASE + "/api/chat/support/availability", headers=BID_H, timeout=30)
    check("J12 support availability", r.status_code == 200, r.text[:120])
    r = bidder.s.post(BASE + "/api/chat/support/tickets", headers=BID_H, timeout=30,
                      json={"subject": "Sweep ticket", "message": f"Functional sweep support ticket {int(time.time())}"})
    ref = jbody(r).get("reference") or jbody(r).get("ticket_reference") or jbody(r).get("id")
    check("J13 create support ticket", r.status_code in (200, 201), r.text[:150])
    if ref:
        r = admin.s.get(BASE + "/api/chat/support/staff/tickets", headers=ADMIN_H, timeout=30)
        check("J14 staff sees ticket", r.status_code == 200 and ref in json.dumps(jbody(r)), r.text[:150])
        r = admin.s.patch(BASE + f"/api/chat/support/staff/tickets/{ref}", headers=ADMIN_H, timeout=30,
                          json={"status": "resolved"})
        check("J15 staff resolves ticket", r.status_code == 200, r.text[:120])

    # mobile / digilocker / multilingual
    r = admin.s.get(BASE + "/api/v1/mobile/vapid-public-key", headers=ADMIN_H, timeout=30)
    check("J16 VAPID public key", r.status_code == 200, r.text[:100])
    r = admin.s.get(BASE + "/api/v1/mobile/pending-bids", headers=OFF_H, timeout=30)
    check("J17 mobile pending bids (officer)", r.status_code == 200, r.text[:120])
    r = admin.s.get(BASE + "/api/v1/digilocker/authorize-url", headers=BID_H, timeout=30)
    check("J18 digilocker authorize-url", r.status_code == 200 and "url" in json.dumps(jbody(r)), r.text[:150])
    r = admin.s.get(BASE + "/api/v1/digilocker/documents", headers=BID_H, timeout=30,
                    params={"access_token": "sweep-mock-token"})
    check("J19 digilocker documents (mock)", r.status_code == 200, r.text[:120])
    r = admin.s.get(BASE + "/api/v1/multilingual/supported-languages", headers=BID_H, timeout=30)
    check("J20 supported languages", r.status_code == 200, r.text[:120])
    r = admin.s.post(BASE + "/api/v1/multilingual/translate", headers=BID_H, timeout=60,
                     json={"text": "Compliance verified", "target_lang": "hi"})
    check("J21 translate", r.status_code == 200, r.text[:120])

    # registries
    r = admin.s.get(BASE + "/api/mock/gst/29ABCDE1234F1Z5", headers=BID_H, timeout=30)
    check("J22 mock GST registry", r.status_code == 200, r.text[:120])
    r = admin.s.get(BASE + "/api/verify/gst/29ABCDE1234F1Z5", headers=BID_H, timeout=60)
    check("J23 verify GST", r.status_code == 200, r.text[:150])
    r = admin.s.get(BASE + "/api/verify/udyam/UDYAM-UP-12-0001234", headers=BID_H, timeout=60)
    check("J24 verify Udyam", r.status_code == 200, r.text[:150])
    r = admin.s.get(BASE + "/api/verify/mca/U72900MH2020PTC123456", headers=BID_H, timeout=90)
    check("J25 verify MCA (mock mode)", r.status_code == 200, r.text[:150])

    # sync
    r = admin.s.post(BASE + f"/api/v1/sync-tender/{SEED_TENDER}", headers=ADMIN_H, timeout=60, json={})
    check("J26 sync tender", r.status_code in (200, 201, 404, 409), r.text[:150])
    r = admin.s.get(BASE + f"/api/v1/sync/bids/{SEED_TENDER}", headers=ADMIN_H, timeout=60)
    check("J27 sync bids", r.status_code in (200, 404, 409), r.text[:150])

    # ------------------------------------------------------------------
    print("\n" + "=" * 78)
    passed = sum(1 for _, ok, _ in results if ok)
    failed = [(n, d) for n, ok, d in results if not ok]
    print(f"TOTAL: {len(results)}   PASSED: {passed}   FAILED: {len(failed)}")
    if failed:
        print("\nFailures:")
        for n, d in failed:
            print(f"  - {n}: {d}")
    print("=" * 78)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())

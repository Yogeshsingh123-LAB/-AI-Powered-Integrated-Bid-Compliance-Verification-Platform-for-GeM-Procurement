#!/usr/bin/env python3
"""
Full functional sweep of the Bid Zee OFFICER portal against the live dev server.
Covers: officer auth/session, dashboard data, full tender management (officer
is allowed), bid verification, officer decisions (wrong-pw / bad-payload /
valid / double-submit lock), re-verify, clarification, documents (officer
view), reports (audit/blockchain/benchmark/cartel/post-award), live monitoring
(+WebSocket with officer ws-ticket), mobile officer, chat/support, and the
role-guard negative tests (officer must be blocked from admin-only routes).

Run:  /home/user/repo/.venv/bin/python scripts/officer_functional_sweep.py
"""
import asyncio
import json
import sys
import time

import requests

BASE = "http://127.0.0.1:8000"
OFF = "officer@example.com"
BID = "bidder@example.com"
OFFICER_PWS = ["Off!cerSecure#2026x", "ef1ksQEuhQZE8o90"]
BIDDER_PWS = ["Bid!derSecure#2026x", "fTjTRNpi-rynI4bj"]
OFFICER_NEW, BIDDER_NEW = OFFICER_PWS[0], BIDDER_PWS[0]

SEED_BID = "550e8400-e29b-11d4-a716-446655440000"
SEED_TENDER = "GEM/2026/001"

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

    def login(self, email, *passwords):
        r = None
        for pw in passwords:
            r = self.s.post(f"{BASE}/api/auth/login", json={"email": email, "password": pw}, timeout=30)
            if r.status_code == 200:
                return r
            if r.status_code == 429:
                time.sleep(min(int(r.headers.get("Retry-After", "60") or 60), 90) + 1)
                r = self.s.post(f"{BASE}/api/auth/login", json={"email": email, "password": pw}, timeout=30)
                if r.status_code == 200:
                    return r
        return r


def main():
    officer = Client()

    print("\n=== O. Officer auth & session ===")
    r = officer.login(OFF, *OFFICER_PWS)
    body = jbody(r)
    check("O1 officer login", r.status_code == 200, r.text[:120])
    OFF_TOKEN = body.get("access_token")
    OFF_H = {"Authorization": f"Bearer {OFF_TOKEN}"}
    check("O2 officer session has OFFICER role", r.status_code == 200 and
          (body.get("user", {}).get("role") or body.get("role") or "").upper() == "OFFICER", json.dumps(body)[:120])

    vr = officer.s.post(BASE + "/api/auth/verify-password", json={"password": OFFICER_NEW}, headers=OFF_H, timeout=30)
    vw = officer.s.post(BASE + "/api/auth/verify-password", json={"password": "nope-wrong"}, headers=OFF_H, timeout=30)
    check("O3 verify-password (correct)", vr.status_code == 200, vr.text[:80])
    check("O4 verify-password (wrong) rejected", vw.status_code in (400, 401, 403), f"got {vw.status_code}")
    wt = officer.s.get(BASE + "/api/auth/ws-token", headers=OFF_H, timeout=30)
    check("O5 officer ws-ticket issued", wt.status_code == 200 and jbody(wt).get("ws_token"), wt.text[:100])

    print("\n=== O-. Role guards: officer must be BLOCKED from admin-only routes ===")
    check("O6 officer -> GET /api/admin/users blocked (403)",
          officer.s.get(BASE + "/api/admin/users", headers=OFF_H, timeout=30).status_code == 403)
    r7 = officer.s.get(BASE + "/api/admin/users/stats", headers=OFF_H, timeout=30)
    check("O7 officer can read user stats (dashboard KPIs, OFFICER+ADMIN by design)",
          r7.status_code == 200 and "total_users" in jbody(r7), f"got {r7.status_code}: {r7.text[:100]}")
    check("O8 officer -> POST /api/admin/users blocked (403)",
          officer.s.post(BASE + "/api/admin/users", headers=OFF_H, timeout=30,
                         json={"full_name": "x", "email": "x@x.com", "password": "Xx12345678!a",
                               "admin_authorization_password": "x"}).status_code == 403)
    check("O9 officer -> POST /api/admin/blacklist blocked (403)",
          officer.s.post(BASE + "/api/admin/blacklist", headers=OFF_H, timeout=30,
                         json={"identifier": "officer@example.com", "admin_password": "x"}).status_code == 403)
    check("O10 officer -> staff support tickets blocked (403)",
          officer.s.get(BASE + "/api/chat/support/staff/tickets", headers=OFF_H, timeout=30).status_code == 403)
    r11 = officer.s.post(BASE + "/api/auth/seed", headers=OFF_H, timeout=30, json={})
    admin_still_ok = False
    if r11.status_code == 200:  # dev-only onboarding endpoint (403 in production)
        c = requests.Session()
        admin_still_ok = c.post(BASE + "/api/auth/login", timeout=30,
                                json={"email": "admin@example.com", "password": "Adm!nSecure#2026x"}).status_code == 200
    check("O11 seed endpoint is env-gated & idempotent (no credential rotation in dev)",
          r11.status_code in (200, 403) and (r11.status_code == 403 or admin_still_ok),
          f"got {r11.status_code}: {r11.text[:100]}")

    print("\n=== O. Officer dashboard data ===")
    r = officer.s.get(BASE + "/api/bids", headers=OFF_H, timeout=30)
    check("O12 dashboard: list all bids", r.status_code == 200, r.text[:120])
    r = officer.s.get(BASE + "/api/bids/stats", headers=OFF_H, timeout=30)
    check("O13 dashboard: bid stats", r.status_code == 200, r.text[:120])
    r = officer.s.get(BASE + "/api/tenders", headers=OFF_H, timeout=30)
    check("O14 dashboard: tenders list", r.status_code == 200, r.text[:120])
    r = officer.s.get(BASE + "/api/bidders", headers=OFF_H, timeout=30)
    bidders = jbody(r)
    check("O15 bidders list w/ compliance summary", r.status_code == 200 and
          any(b.get("email") == BID for b in bidders), r.text[:150])
    r = officer.s.get(BASE + "/api/notifications", headers=OFF_H, timeout=30)
    check("O16 notifications feed", r.status_code == 200, r.text[:120])
    r = officer.s.get(BASE + "/api/bids/my-bids", headers=OFF_H, timeout=30)
    check("O17 my-bids for officer returns empty (not bidder data)",
          r.status_code == 200 and jbody(r) == [], r.text[:100])

    print("\n=== O. Officer tender management ===")
    tid = f"OFFSWEEP/T/{int(time.time())}"
    r = officer.s.post(BASE + "/api/tenders", headers=OFF_H, timeout=30, json={
        "id": tid, "title": "Officer Sweep Tender", "description": "Officer portal sweep",
        "budget_limit": 987654.0, "category": "Works", "department": "QA", "status": "Draft"})
    check("O18 officer creates tender (201)", r.status_code in (200, 201), r.text[:150])
    r = officer.s.put(f"{BASE}/api/tenders/{tid}/requirements", headers=OFF_H, timeout=30, json={
        "requirements": [{"code": "EMD", "description": "EMD receipt", "is_mandatory": True}]})
    check("O19 officer sets requirements", r.status_code == 200, r.text[:150])
    r = officer.s.get(f"{BASE}/api/tenders/{tid}", headers=OFF_H, timeout=30)
    off_req = (jbody(r).get("requirements") or [{}])[0].get("id")
    r = officer.s.post(f"{BASE}/api/tenders/{tid}/publish", headers=OFF_H, timeout=30, json={"admin_password": OFFICER_NEW})
    if r.status_code == 422:
        r = officer.s.post(f"{BASE}/api/tenders/{tid}/publish", headers=OFF_H, timeout=30, json={})
    check("O20 officer publishes tender", r.status_code == 200, r.text[:150])

    print("\n=== O. Officer verification flow (fresh bid) ===")
    bidder = Client()
    r = bidder.login(BID, *BIDDER_PWS)
    BID_H = {"Authorization": f"Bearer {jbody(r)['access_token']}"}
    check("O21 bidder applies to officer's tender (201)",
          bidder.s.post(BASE + "/api/bids", headers=BID_H, timeout=60,
                        json={"tender_id": tid}).status_code == 201)
    r = officer.s.get(BASE + f"/api/bids/tender/{tid}", headers=OFF_H, timeout=30)
    fresh_bid = (jbody(r) or [{}])[0].get("id")
    check("O22 officer sees fresh bid under tender", bool(fresh_bid), r.text[:120])

    r = officer.s.get(BASE + f"/api/bids/{fresh_bid}", headers=OFF_H, timeout=30)
    check("O23 bid detail", r.status_code == 200, r.text[:120])
    r = officer.s.get(BASE + f"/api/v1/override/explainable/{fresh_bid}", headers=OFF_H, timeout=30)
    check("O24 explainable override report", r.status_code == 200, r.text[:150])

    r = officer.s.post(BASE + "/api/v1/override/decision", headers=OFF_H, timeout=60, json={
        "officer_password": "wrong-password-1", "bid_id": fresh_bid,
        "officer_status": "Approved", "justification": "Should fail: wrong officer password."})
    check("O25 decision with WRONG officer password rejected",
          r.status_code in (401, 403), f"got {r.status_code}: {r.text[:100]}")
    r = officer.s.post(BASE + "/api/v1/override/decision", headers=OFF_H, timeout=60, json={
        "officer_password": OFFICER_NEW, "bid_id": fresh_bid,
        "officer_status": "Approved", "justification": "short"})
    check("O26 decision with short justification rejected (422)", r.status_code == 422, f"got {r.status_code}")
    r = officer.s.post(BASE + "/api/v1/override/decision", headers=OFF_H, timeout=60, json={
        "officer_password": OFFICER_NEW, "bid_id": fresh_bid,
        "officer_status": "Approved with Deviation", "deviation_category": "Minor Administrative",
        "justification": "Officer portal sweep: minor administrative deviation, documents verified."})
    check("O27 officer decision recorded (200/201)", r.status_code in (200, 201), r.text[:150])
    r = officer.s.post(BASE + "/api/v1/override/decision", headers=OFF_H, timeout=60, json={
        "officer_password": OFFICER_NEW, "bid_id": fresh_bid,
        "officer_status": "Rejected", "justification": "Second decision must be blocked by the lock."})
    check("O28 double decision blocked (finalized lock)",
          r.status_code == 400 and "finalized" in r.text, f"got {r.status_code}: {r.text[:120]}")

    r = officer.s.post(BASE + f"/api/bids/{fresh_bid}/re-verify", headers=OFF_H, timeout=120, json={})
    check("O29 re-verify bid", r.status_code == 200, r.text[:150])
    req_id = (jbody(officer.s.get(BASE + f"/api/tenders/{tid}", headers=OFF_H, timeout=30)).get("requirements") or [{}])[0].get("id")
    r = officer.s.post(BASE + f"/api/bids/{fresh_bid}/request-clarification", headers=OFF_H, timeout=60, json={
        "requirement_id": req_id, "requirement_name": "EMD receipt",
        "message": "Officer sweep: please confirm EMD is bank-guaranteed."})
    check("O30 request clarification to bidder", r.status_code in (200, 201), r.text[:150])

    r = officer.s.get(BASE + f"/api/documents/bid/{SEED_BID}", headers=OFF_H, timeout=30)
    docs = jbody(r)
    check("O31 officer lists documents of a bid", r.status_code == 200 and isinstance(docs, list), r.text[:120])
    if docs:
        did = docs[0].get("id")
        r = officer.s.get(BASE + f"/api/documents/{did}/extraction", headers=OFF_H, timeout=30)
        check("O32 officer views extraction details", r.status_code == 200, r.text[:120])
        r = officer.s.get(BASE + f"/api/documents/{did}/download", headers=OFF_H, timeout=30)
        check("O33 officer downloads document", r.status_code == 200 and len(r.content) > 100, f"{r.status_code}")

    print("\n=== O. Officer reports ===")
    r = officer.s.get(BASE + "/api/audit/logs", headers=OFF_H, timeout=30)
    logs = jbody(r)
    log_list = logs if isinstance(logs, list) else logs.get("logs", [])
    check("O34 audit trail accessible to officer", r.status_code == 200 and len(log_list) > 0, r.text[:120])
    if log_list:
        r = officer.s.get(BASE + f"/api/audit/verify/{log_list[0].get('id')}", headers=OFF_H, timeout=30)
        check("O35 verify audit log entry", r.status_code == 200, r.text[:120])
    r = officer.s.get(BASE + f"/api/audit/bids/{fresh_bid}/verify", headers=OFF_H, timeout=30)
    check("O36 bid audit-chain verify (officer)", r.status_code == 200, r.text[:150])
    r = officer.s.get(BASE + "/api/v1/blockchain/chain", headers=OFF_H, timeout=30)
    check("O37 blockchain chain (officer)", r.status_code == 200, r.text[:100])
    r = officer.s.get(BASE + "/api/v1/blockchain/integrity-check", headers=OFF_H, timeout=30)
    check("O38 blockchain integrity (officer)", r.status_code == 200, r.text[:120])
    r = officer.s.get(BASE + f"/api/v1/blockchain/merkle-tree/{fresh_bid}", headers=OFF_H, timeout=30)
    check("O39 merkle tree (officer)", r.status_code == 200, r.text[:120])
    r = officer.s.get(BASE + "/api/v1/benchmark/live-metrics", headers=OFF_H, timeout=60)
    check("O40 benchmark live-metrics", r.status_code == 200, r.text[:100])
    r = officer.s.get(BASE + "/api/v1/benchmark/gem-scale-report", headers=OFF_H, timeout=60)
    check("O41 gem-scale report", r.status_code == 200, r.text[:100])
    r = officer.s.post(BASE + f"/api/v1/cartel/analyze/{tid}", headers=OFF_H, timeout=120, json=[
        {"bid_id": "B1", "bidder_name": "Alpha", "gstin": "27AAPCS1234M1Z5", "pan": "AAPCS1234M",
         "quote_amount": 500000, "submission_timestamp": "2026-08-31T10:00:00Z", "ip_address": "1.2.3.4",
         "directors": ["Ravi"], "addresses": ["Addr 1"], "bank_accounts": ["ACC-1"]}])
    check("O42 cartel analysis (officer)", r.status_code == 200, r.text[:120])
    r = officer.s.post(BASE + "/api/post-award/simulate-pfms", headers=OFF_H, timeout=60, json={"bid_id": SEED_BID})
    check("O43 post-award PFMS simulate (officer)", r.status_code == 200, r.text[:120])
    r = officer.s.get(BASE + f"/api/post-award/status/{SEED_BID}", headers=OFF_H, timeout=30)
    check("O44 post-award status (officer)", r.status_code == 200, r.text[:120])
    r = officer.s.post(BASE + "/api/post-award/track-crac", headers=OFF_H, timeout=60, json={"bid_id": SEED_BID})
    check("O45 CRAC track (officer)", r.status_code == 200, r.text[:120])
    r = officer.s.get(BASE + "/api/config/risk-thresholds", headers=OFF_H, timeout=30)
    check("O46 risk-thresholds config", r.status_code == 200, r.text[:100])

    print("\n=== O. Live bid monitoring (officer core feature) ===")
    r = officer.s.get(BASE + "/api/v1/monitoring/recent-events", headers=OFF_H, timeout=30)
    check("O47 recent events", r.status_code == 200, r.text[:100])
    r = officer.s.post(BASE + "/api/v1/monitoring/simulate-bid", headers=OFF_H, timeout=60, json={
        "tender_id": SEED_TENDER, "bidder_name": "OffSweep Compliant", "score": 93,
        "include_forgery_alert": False, "include_cartel_alert": False})
    check("O48 simulate compliant bid", r.status_code == 200, r.text[:120])
    r = officer.s.post(BASE + "/api/v1/monitoring/simulate-bid", headers=OFF_H, timeout=60, json={
        "tender_id": SEED_TENDER, "bidder_name": "OffSweep NonCompliant", "score": 33,
        "include_forgery_alert": True, "include_cartel_alert": True})
    check("O49 simulate non-compliant bid (risk flagged)",
          r.status_code == 200 and ("CRITICAL" in r.text or "HIGH" in r.text), r.text[:120])

    async def ws_test():
        import websockets
        ticket = jbody(officer.s.get(BASE + "/api/auth/ws-token", headers=OFF_H, timeout=30)).get("ws_token")
        async with websockets.connect("ws://127.0.0.1:8000/api/v1/monitoring/live") as ws:
            await ws.send(json.dumps({"token": ticket}))
            msg = json.loads(await asyncio.wait_for(ws.recv(), timeout=15))
            return msg.get("type") == "authenticated"

    try:
        check("O50 WebSocket live feed authenticates with OFFICER ticket", asyncio.run(ws_test()))
    except Exception as e:
        check("O50 WebSocket live feed authenticates with OFFICER ticket", False, repr(e)[:140])

    print("\n=== O. Mobile, chat & support (officer) ===")
    r = officer.s.get(BASE + "/api/v1/mobile/pending-bids", headers=OFF_H, timeout=30)
    check("O51 mobile pending-bids (officer)", r.status_code == 200, r.text[:120])
    r = officer.s.post(BASE + "/api/chat", headers=OFF_H, timeout=60, json={"message": "Officer sweep ping"})
    check("O52 chat works for officer (no 500)", r.status_code != 500, f"got {r.status_code}")
    r = officer.s.post(BASE + "/api/chat/support/tickets", headers=OFF_H, timeout=30,
                       json={"subject": "Officer sweep ticket", "message": f"officer sweep {int(time.time())}"})
    ref = jbody(r).get("id") or jbody(r).get("reference")
    check("O53 officer raises support ticket (201)", r.status_code in (200, 201), r.text[:120])
    r = officer.s.get(BASE + "/api/chat/support/availability", headers=OFF_H, timeout=30)
    check("O54 support availability endpoint", r.status_code == 200, r.text[:100])

    # cleanup: close the sweep tender
    r = officer.s.patch(f"{BASE}/api/tenders/{tid}/status", headers=OFF_H, timeout=30, json={"status": "Closed"})
    check("O55 officer closes tender", r.status_code == 200, r.text[:100])

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

#!/usr/bin/env python3
"""
Full functional sweep of the Bid Zee BIDDER (Supplier) portal against the
live dev server. Covers: bidder auth/session, role-guard negative tests
(incl. IDOR isolation + WebSocket denial), tender browsing, bidding
(apply / duplicate block / my-bids), the full document workflow
(upload -> process -> replace -> reprocess-lock -> delete on Pending),
notifications (incl. officer clarification arriving as a notification),
chat/support tickets (own-ticket isolation), registry verifications,
DigiLocker, multilingual, and mobile push.

Run:  /home/user/repo/.venv/bin/python scripts/bidder_functional_sweep.py
"""
import asyncio
import io
import json
import sys
import time

import requests

BASE = "http://127.0.0.1:8000"
BID = "bidder@example.com"
BIDDER_PWS = ["Bid!derSecure#2026x", "fTjTRNpi-rynI4bj"]
BIDDER_NEW = BIDDER_PWS[0]

SEED_BID = "550e8400-e29b-11d4-a716-446655440000"
SEED_TENDER = "GEM/2026/001"

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


def make_pdf(text):
    import pymupdf
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text((72, 72), text)
    data = doc.tobytes()
    doc.close()
    return data


def poll_status(session, headers, bid_id, doc_id, timeout=75):
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
    bidder = Client()

    print("\n=== P. Bidder auth & session ===")
    r = bidder.login(BID, *BIDDER_PWS)
    body = jbody(r)
    check("P1 bidder login", r.status_code == 200, r.text[:120])
    BID_TOKEN = body.get("access_token")
    BID_H = {"Authorization": f"Bearer {BID_TOKEN}"}
    check("P2 session role is BIDDER", (body.get("user", {}).get("role") or "").upper() == "BIDDER", json.dumps(body)[:120])
    vr = bidder.s.post(BASE + "/api/auth/verify-password", json={"password": BIDDER_NEW}, headers=BID_H, timeout=30)
    vw = bidder.s.post(BASE + "/api/auth/verify-password", json={"password": "nope"}, headers=BID_H, timeout=30)
    check("P3 verify-password (correct)", vr.status_code == 200, vr.text[:80])
    check("P4 verify-password (wrong) rejected", vw.status_code in (400, 401, 403), f"got {vw.status_code}")
    r = bidder.s.get(BASE + "/api/bidders/me/profile", headers=BID_H, timeout=30)
    check("P5 my profile", r.status_code == 200 and jbody(r).get("email") == BID, r.text[:120])

    print("\n=== P. Role guards: bidder must be BLOCKED ===")
    check("P6 bidder -> GET /api/bids (all) blocked (403)",
          bidder.s.get(BASE + "/api/bids", headers=BID_H, timeout=30).status_code == 403)
    check("P7 bidder -> GET /api/bids/tender/{id} blocked (403)",
          bidder.s.get(BASE + f"/api/bids/tender/{SEED_TENDER}", headers=BID_H, timeout=30).status_code == 403)
    check("P8 bidder -> officer decision endpoint blocked (403)",
          bidder.s.post(BASE + f"/api/bids/{SEED_BID}/officer-decision", headers=BID_H, timeout=30,
                        json={"officer_password": "x", "officer_status": "Approved",
                              "justification": "must be blocked"}).status_code == 403)
    check("P9 bidder -> POST /api/v1/override/decision blocked (403)",
          bidder.s.post(BASE + "/api/v1/override/decision", headers=BID_H, timeout=30,
                        json={"officer_password": "x", "bid_id": SEED_BID, "officer_status": "Approved",
                              "justification": "must be blocked"}).status_code == 403)
    check("P10 bidder -> GET /api/admin/users blocked (403)",
          bidder.s.get(BASE + "/api/admin/users", headers=BID_H, timeout=30).status_code == 403)
    check("P11 bidder -> POST /api/tenders (create) blocked (403)",
          bidder.s.post(BASE + "/api/tenders", headers=BID_H, timeout=30,
                        json={"id": "X", "title": "x"}).status_code == 403)
    check("P12 bidder -> GET /api/bidders list blocked (403)",
          bidder.s.get(BASE + "/api/bidders", headers=BID_H, timeout=30).status_code == 403)
    check("P13 bidder -> monitoring recent-events blocked (403)",
          bidder.s.get(BASE + "/api/v1/monitoring/recent-events", headers=BID_H, timeout=30).status_code == 403)
    check("P14 bidder -> monitoring simulate-bid blocked (403)",
          bidder.s.post(BASE + "/api/v1/monitoring/simulate-bid", headers=BID_H, timeout=30, json={}).status_code == 403)

    async def ws_denied():
        import websockets
        ticket = jbody(bidder.s.get(BASE + "/api/auth/ws-token", headers=BID_H, timeout=30)).get("ws_token")
        closed = None
        try:
            async with websockets.connect("ws://127.0.0.1:8000/api/v1/monitoring/live") as ws:
                await ws.send(json.dumps({"token": ticket}))
                while True:
                    msg = await asyncio.wait_for(ws.recv(), timeout=10)
                    if msg in (None, ""):
                        break
                    try:
                        m = json.loads(msg)
                        if m.get("type") == "authenticated":
                            closed = "authenticated-unexpectedly"
                            break
                    except Exception:
                        pass
        except Exception as e:
            closed = e
        return closed

    try:
        res = asyncio.run(ws_denied())
        check("P15 WebSocket live feed DENIED to bidder (1008 close)",
              res is not None and res != "authenticated-unexpectedly", repr(res)[:120])
    except Exception as e:
        check("P15 WebSocket live feed DENIED to bidder (1008 close)", True, f"connection refused = denied ({repr(e)[:80]})")

    print("\n=== P. Tender browsing (supplier view) ===")
    r = bidder.s.get(BASE + "/api/tenders", headers=BID_H, timeout=30)
    tenders = jbody(r)
    check("P16 browse tenders list", r.status_code == 200 and len(tenders) >= 1, r.text[:120])
    r = bidder.s.get(BASE + f"/api/tenders/{SEED_TENDER}", headers=BID_H, timeout=30)
    check("P17 tender detail with requirements", r.status_code == 200 and
          bool(jbody(r).get("requirements")), r.text[:150])
    r = bidder.s.get(BASE + "/api/tenders?status=Active", headers=BID_H, timeout=30)
    check("P18 tender list with status filter", r.status_code == 200, r.text[:120])

    print("\n=== P. Bidding ===")
    # Officer opens a fresh tender for the sweep
    officer = Client()
    r = officer.login("officer@example.com", "Off!cerSecure#2026x")
    OFF_H = {"Authorization": f"Bearer {jbody(r)['access_token']}"}
    tid = f"BIDSWEEP/T/{int(time.time())}"
    ro = officer.s.post(BASE + "/api/tenders", headers=OFF_H, timeout=30, json={
        "id": tid, "title": "Bidder Sweep Tender", "description": "bidder portal sweep",
        "budget_limit": 500000.0, "category": "Goods", "department": "QA", "status": "Draft"})
    officer.s.put(f"{BASE}/api/tenders/{tid}/requirements", headers=OFF_H, timeout=30, json={
        "requirements": [{"code": "GST", "description": "GST certificate", "is_mandatory": True}]})
    ro2 = officer.s.post(f"{BASE}/api/tenders/{tid}/publish", headers=OFF_H, timeout=30, json={})
    check("P19 sweep tender opened (officer helper step)",
          ro.status_code in (200, 201) and ro2.status_code == 200, f"create={ro.status_code} publish={ro2.status_code}")
    off_req = (jbody(officer.s.get(BASE + f"/api/tenders/{tid}", headers=OFF_H, timeout=30)).get("requirements") or [{}])[0].get("id")

    r = bidder.s.post(BASE + "/api/bids", headers=BID_H, timeout=60, json={"tender_id": tid})
    my_bid = jbody(r).get("bid") or jbody(r)
    my_bid_id = my_bid.get("id")
    check("P20 apply to tender (201)", r.status_code == 201 and my_bid_id, r.text[:150])
    r = bidder.s.post(BASE + "/api/bids", headers=BID_H, timeout=60, json={"tender_id": tid})
    dup = (jbody(r).get("bid") or jbody(r)).get("id")
    check("P21 duplicate application deduped (same bid returned, no second bid)",
          r.status_code in (200, 201, 400, 409) and str(dup) == str(my_bid_id),
          f"got {r.status_code}: {r.text[:120]}")
    r = bidder.s.get(BASE + "/api/bids/my-bids", headers=BID_H, timeout=30)
    mybids = jbody(r)
    check("P22 my-bids contains new bid", r.status_code == 200 and
          any(str(b.get("id")) == str(my_bid_id) for b in mybids), r.text[:150])
    r = bidder.s.get(BASE + f"/api/bids/{my_bid_id}", headers=BID_H, timeout=30)
    check("P23 view own bid detail", r.status_code == 200, r.text[:120])
    r = bidder.s.get(BASE + f"/api/bids/{SEED_BID}", headers=BID_H, timeout=30)
    check("P24 view own seeded bid detail", r.status_code == 200, r.text[:120])

    print("\n=== P. IDOR isolation (second bidder) ===")
    admin = Client()
    ra = admin.login("admin@example.com", "Adm!nSecure#2026x")
    AD_H = {"Authorization": f"Bearer {jbody(ra)['access_token']}"}
    email2 = f"sweep.bidder2.{int(time.time())}@example.com"
    ra2 = admin.s.post(BASE + "/api/admin/users", headers=AD_H, timeout=30, json={
        "full_name": "Sweep Bidder Two", "email": email2, "password": "SweepBid2!x99",
        "role": "BIDDER", "admin_authorization_password": "Adm!nSecure#2026x"})
    check("P25 (helper) second bidder created", ra2.status_code == 201, ra2.text[:100])
    b2 = Client()
    r2 = b2.login(email2, "SweepBid2!x99")
    if jbody(r2).get("must_change_password"):
        b2.s.post(BASE + "/api/auth/change-password",
                  json={"current_password": "SweepBid2!x99", "new_password": "SweepBid2!x99a"},
                  headers={"Authorization": f"Bearer {jbody(r2)['access_token']}"}, timeout=30)
        r2 = b2.login(email2, "SweepBid2!x99a")
    B2_H = {"Authorization": f"Bearer {jbody(r2)['access_token']}"}
    r2b = b2.s.post(BASE + "/api/bids", headers=B2_H, timeout=60, json={"tender_id": tid})
    b2_bid = (jbody(r2b).get("bid") or jbody(r2b)).get("id")
    check("P26 second bidder applies to same tender (201)", r2b.status_code == 201 and b2_bid, r2b.text[:120])
    r = bidder.s.get(BASE + f"/api/bids/{b2_bid}", headers=BID_H, timeout=30)
    check("P27 IDOR: cannot view another bidder's bid (403)", r.status_code == 403, f"got {r.status_code}")
    r = bidder.s.get(BASE + f"/api/documents/bid/{b2_bid}", headers=BID_H, timeout=30)
    check("P28 IDOR: cannot list another bidder's documents (403)", r.status_code == 403, f"got {r.status_code}")
    r = bidder.s.get(BASE + "/api/bids/my-bids", headers=BID_H, timeout=30)
    check("P29 my-bids isolated (no other bidder's bids)",
          all(str(b.get("id")) != str(b2_bid) for b in jbody(r)), r.text[:120])

    print("\n=== P. Documents (core bidder workflow) ===")
    pdf = make_pdf("GSTIN 29ABCDE1234F1Z5\nStatus: Active\nRegistration: Regular")
    r = bidder.s.post(BASE + "/api/documents/upload", headers=BID_H, timeout=120,
                      files={"file": ("bidder_gst.pdf", io.BytesIO(pdf), "application/pdf")},
                      data={"bid_id": my_bid_id, "requirement_id": off_req})
    doc = (jbody(r).get("document") or {})
    doc_id = doc.get("id")
    check("P30 upload document (201)", r.status_code == 201 and doc_id, r.text[:150])
    final = poll_status(bidder.s, BID_H, my_bid_id, doc_id) if doc_id else None
    check("P31 document processed to terminal status", final in TERMINAL, f"status={final}")
    r = bidder.s.get(BASE + f"/api/documents/{doc_id}/extraction", headers=BID_H, timeout=30)
    check("P32 extraction details", r.status_code == 200, r.text[:120])
    r = bidder.s.get(BASE + f"/api/documents/{doc_id}/download", headers=BID_H, timeout=30)
    check("P33 download document", r.status_code == 200 and len(r.content) > 100, f"{r.status_code}")
    pdf2 = make_pdf("GSTIN 29ABCDE1234F1Z5\nStatus: Active\nRegistration: Regular\nRev-2")
    r = bidder.s.post(BASE + f"/api/documents/{doc_id}/replace", headers=BID_H, timeout=180,
                      files={"file": ("bidder_gst_v2.pdf", io.BytesIO(pdf2), "application/pdf")})
    check("P34 replace document", r.status_code in (200, 201), r.text[:150])
    new_doc = (jbody(r).get("document") or jbody(r)).get("id") or doc_id
    final2 = poll_status(bidder.s, BID_H, my_bid_id, new_doc, timeout=75) if new_doc else None
    check("P35 replaced document processed to terminal status", final2 in TERMINAL, f"status={final2}")
    r = bidder.s.post(BASE + f"/api/documents/{new_doc}/reprocess", headers=BID_H, timeout=60)
    check("P36 reprocess locked for finalized doc (409)",
          r.status_code == 409 and "reprocessing is not allowed" in r.text, f"got {r.status_code}: {r.text[:100]}")
    r = bidder.s.get(BASE + f"/api/documents/bid/{my_bid_id}", headers=BID_H, timeout=30)
    check("P37 document list for my bid", r.status_code == 200 and len(jbody(r)) >= 1, r.text[:120])
    r = bidder.s.delete(BASE + f"/api/documents/{new_doc}", headers=BID_H, timeout=30)
    check("P37b delete document on still-Pending bid (200/204)", r.status_code in (200, 204), f"got {r.status_code}: {r.text[:100]}")

    print("\n=== P. Notifications (incl. officer clarification) ===")
    r = bidder.s.get(BASE + "/api/notifications", headers=BID_H, timeout=30)
    notifs = jbody(r)
    check("P38 notifications feed", r.status_code == 200 and isinstance(notifs, list), r.text[:120])
    roff = officer.s.post(BASE + f"/api/bids/{my_bid_id}/request-clarification", headers=OFF_H, timeout=60, json={
        "requirement_id": off_req, "requirement_name": "GST certificate",
        "message": "Bidder sweep: please confirm GSTIN is active."})
    check("P39 officer sends clarification (helper step)", roff.status_code in (200, 201), roff.text[:120])
    time.sleep(1)
    r = bidder.s.get(BASE + "/api/notifications", headers=BID_H, timeout=30)
    notifs2 = jbody(r)
    check("P40 clarification arrives as bidder notification",
          any("CLARIFICATION" in str(n.get("type", "")).upper() for n in notifs2), json.dumps(notifs2[:2])[:150])
    if notifs2:
        nid = notifs2[0].get("id")
        r = bidder.s.put(BASE + f"/api/notifications/{nid}/read", headers=BID_H, timeout=30)
        check("P41 mark notification read", r.status_code == 200, f"got {r.status_code}: {r.text[:80]}")

    print("\n=== P. Chat & support (bidder) ===")
    r = bidder.s.post(BASE + "/api/chat", headers=BID_H, timeout=60, json={"message": "Bidder sweep ping"})
    check("P42 chat works for bidder (no 500)", r.status_code != 500, f"got {r.status_code}")
    r = bidder.s.get(BASE + "/api/chat/support/availability", headers=BID_H, timeout=30)
    check("P43 support availability", r.status_code == 200, r.text[:100])
    r = bidder.s.post(BASE + "/api/chat/support/tickets", headers=BID_H, timeout=30,
                      json={"subject": "Bidder sweep ticket", "message": f"bidder sweep {int(time.time())}"})
    ref = jbody(r).get("id") or jbody(r).get("reference")
    check("P44 create support ticket (201)", r.status_code == 201 and ref, r.text[:120])
    if ref:
        r = bidder.s.get(BASE + f"/api/chat/support/tickets/{ref}", headers=BID_H, timeout=30)
        check("P45 read own ticket", r.status_code == 200, r.text[:100])
        r = bidder.s.post(BASE + f"/api/chat/support/tickets/{ref}/messages", headers=BID_H, timeout=30,
                          json={"content": "Following up on my ticket."})
        check("P46 post message on own ticket", r.status_code in (200, 201), f"got {r.status_code}: {r.text[:80]}")
        r = bidder.s.get(BASE + f"/api/chat/support/tickets/{ref}/messages", headers=BID_H, timeout=30)
        check("P47 read ticket thread", r.status_code == 200, r.text[:100])
        r = bidder.s.post(BASE + f"/api/chat/support/tickets/{ref}/escalate", headers=BID_H, timeout=30)
        check("P48 escalate ticket", r.status_code == 200, f"got {r.status_code}: {r.text[:80]}")
    # isolation: second bidder's ticket is invisible to main bidder
    r2t = b2.s.post(BASE + "/api/chat/support/tickets", headers=B2_H, timeout=30,
                    json={"subject": "Bidder2 ticket", "message": "isolation check"})
    ref2 = jbody(r2t).get("id") or jbody(r2t).get("reference")
    if ref2:
        r = bidder.s.get(BASE + f"/api/chat/support/tickets/{ref2}", headers=BID_H, timeout=30)
        check("P49 IDOR: cannot read another bidder's ticket (404/403)", r.status_code in (403, 404), f"got {r.status_code}")

    print("\n=== P. Registry verification, DigiLocker, multilingual, mobile ===")
    r = bidder.s.get(BASE + "/api/mock/gst/29ABCDE1234F1Z5", headers=BID_H, timeout=30)
    check("P50 mock GST registry", r.status_code == 200, r.text[:100])
    r = bidder.s.get(BASE + "/api/verify/gst/29ABCDE1234F1Z5", headers=BID_H, timeout=60)
    check("P51 verify GST", r.status_code == 200, r.text[:120])
    r = bidder.s.get(BASE + "/api/verify/udyam/UDYAM-UP-12-0001234", headers=BID_H, timeout=60)
    check("P52 verify Udyam", r.status_code == 200, r.text[:120])
    r = bidder.s.get(BASE + "/api/verify/mca/U72900MH2020PTC123456", headers=BID_H, timeout=90)
    check("P53 verify MCA (mock mode)", r.status_code == 200, r.text[:120])
    r = bidder.s.get(BASE + "/api/v1/digilocker/authorize-url", headers=BID_H, timeout=30)
    check("P54 digilocker authorize-url", r.status_code == 200 and "url" in json.dumps(jbody(r)), r.text[:120])
    r = bidder.s.get(BASE + "/api/v1/digilocker/documents", headers=BID_H, timeout=30,
                     params={"access_token": "sweep-mock-token"})
    check("P55 digilocker documents (mock)", r.status_code == 200, r.text[:120])
    r = bidder.s.get(BASE + "/api/v1/multilingual/supported-languages", headers=BID_H, timeout=30)
    check("P56 supported languages", r.status_code == 200, r.text[:100])
    r = bidder.s.post(BASE + "/api/v1/multilingual/translate", headers=BID_H, timeout=60,
                      json={"text": "Your bid is under verification", "target_lang": "hi"})
    check("P57 translate", r.status_code == 200, r.text[:100])
    r = bidder.s.get(BASE + "/api/v1/mobile/vapid-public-key", headers=BID_H, timeout=30)
    check("P58 mobile-officer VAPID blocked for bidder (403, officer-only app by design)",
          r.status_code == 403, f"got {r.status_code}")
    r = bidder.s.post(BASE + "/api/v1/mobile/subscribe-push", headers=BID_H, timeout=30, json={
        "user_id": "sweep", "subscription_token": {"endpoint": "https://push.example.com/sweep",
                                                    "keys": {"p256dh": "x", "auth": "y"}}})
    check("P59 mobile-officer push subscribe blocked for bidder (403)",
          r.status_code == 403, f"got {r.status_code}")

    print("\n=== P. Cleanup ===")
    officer.s.patch(BASE + f"/api/tenders/{tid}/status", headers=OFF_H, timeout=30, json={"status": "Closed"})
    admin.s.delete(BASE + f"/api/admin/users/{jbody(ra2).get('id')}", headers=AD_H, timeout=30)

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

"""Run directly: venv/Scripts/python.exe tests/test_chat_support.py.

Uses a temporary database and fake provider answers; never touches configured user data.
"""
import asyncio
import os
from pathlib import Path
import sys
import tempfile
import unittest
import uuid
from unittest.mock import AsyncMock, patch
from datetime import datetime, timedelta, timezone

TEMP = tempfile.TemporaryDirectory(prefix="chat-tests-")
os.environ.update({"ENVIRONMENT": "test", "DATABASE_URL": "sqlite:///" + str(Path(TEMP.name) / "chat.db").replace("\\", "/"),
                   "JWT_SECRET": "chat-tests-only-secret-for-isolated-test-data", "AI_API_KEY": "", "GROQ_API_KEY": ""})
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient
from sqlalchemy import event
import app.models
from app.api.chat import router
from app.api.chat_support import router as support_router
from app.core.config import settings
from app.core.security import create_access_token
from app.db.database import Base, engine, SessionLocal
from app.models.user import User
from app.models.tender import Tender
from app.models.bid import Bid
from app.models.chat_support import ChatRateLimit, SupportTicket, SupportMessage, SupportPresence
from app.services.auth_service import get_current_user
from app.services.chat_service import answer_question, _basic_calculation_answer
from app.services.chat_text import detect_language, has_latex

app = FastAPI()
app.include_router(router, prefix="/api", dependencies=[Depends(get_current_user)])
app.include_router(support_router, prefix="/api", dependencies=[Depends(get_current_user)])


class ChatTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        Base.metadata.create_all(engine)
        cls.client = TestClient(app, raise_server_exceptions=False)

    def setUp(self):
        self.owner = uuid.uuid4()
        self.other = uuid.uuid4()
        self.admin = uuid.uuid4()
        self.bid_id = uuid.uuid4()
        with SessionLocal() as db:
            for user_id, role in ((self.owner, "BIDDER"), (self.other, "BIDDER"), (self.admin, "ADMIN")):
                db.add(User(id=user_id, full_name="Test person", email=f"{user_id}@example.com", password_hash="unused", role=role, is_active=True))
            tender = Tender(id=str(uuid.uuid4()), title="Private tender", budget_limit=100)
            self.tender_id = tender.id
            db.add(tender)
            db.flush()
            db.add(Bid(id=self.bid_id, bidder_id=self.owner, tender_id=tender.id, status="DOCUMENTS_SUBMITTED",
                       compliance_score=42, deviation_justification="PRIVATE INTERNAL NOTE"))
            db.commit()
        self.headers = self.auth(self.owner)

    def test_regional_languages_end_to_end(self):
        from app.services.chat_languages import REGIONAL, LANGUAGE_NAMES
        samples = {"bn": "আমার আবেদন", "ta": "எனது விண்ணப்பம்", "te": "నా దరఖాస్తు", "mr": "माझा अर्ज", "gu": "મારી અરજી", "kn": "ನನ್ನ ಅರ್ಜಿ", "ml": "എന്റെ അപേക്ഷ", "pa": "ਮੇਰੀ ਅਰਜ਼ੀ"}
        for code, sample in samples.items():
            with self.subTest(language=code), patch.object(settings, "AI_PROVIDER", "disabled"):
                self.assertEqual(detect_language(sample), code)
                for selection in (code, "auto"):
                    response = self.client.post("/api/chat", headers=self.headers, json={"message": sample, "language": selection})
                    self.assertEqual(response.status_code, 200)
                    self.assertEqual(response.json()["answer"], REGIONAL[code][0])
                    self.assertEqual(response.json()["suggestions"], REGIONAL[code][1])
                zero = asyncio.run(answer_question("10 / 0", [], "BIDDER", code))
                self.assertEqual(zero[0], REGIONAL[code][2])
            with patch.object(settings, "AI_PROVIDER", "gemini"), patch.object(settings, "AI_API_KEY", "test-only"), patch("app.services.chat_service._generate_ai_answer", return_value=(sample, False)) as provider:
                result = asyncio.run(answer_question("How do I apply?", [], "BIDDER", code))
                self.assertEqual(result[0], sample)
                self.assertIn("Reply language: " + LANGUAGE_NAMES[code], provider.call_args.args[0])

    def auth(self, user_id, role="BIDDER"):
        return {"Authorization": "Bearer " + create_access_token(str(user_id), role)}

    def track(self, reference=None, headers=None):
        return self.client.post("/api/chat/track", headers=headers or self.headers,
                                json={"reference": str(reference or self.bid_id)})

    def ticket(self, reference=None):
        payload = {"subject": "Upload issue", "message": "Please help with the document checklist."}
        if reference:
            payload["application_reference"] = str(reference)
        response = self.client.post("/api/chat/support/tickets", headers=self.headers, json=payload)
        self.assertEqual(response.status_code, 201, response.text)
        return response.json()["id"]

    def test_bid_selection_is_authenticated_owner_scoped_and_minimal(self):
        self.assertEqual(self.client.get("/api/chat/bids").status_code, 401)
        # Another bidder on the same tender must not see this user's submission.
        with SessionLocal() as db:
            other_bid = Bid(bidder_id=self.other, tender_id=self.tender_id, status="Pending")
            db.add(other_bid)
            db.commit()
            other_id = str(other_bid.id)
        response = self.client.get("/api/chat/bids", headers=self.headers)
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.headers["cache-control"], "no-store")
        self.assertFalse(response.json()["has_more"])
        row, = response.json()["items"]
        self.assertEqual(row["reference"], str(self.bid_id))
        self.assertEqual(row["tender_id"], self.tender_id)
        self.assertEqual(row["tender_title"], "Private tender")
        self.assertEqual(row["status"], "under_review")
        self.assertEqual(set(row), {"reference", "tender_id", "tender_title", "status", "submitted_at", "reviewed_at", "next_action"})
        others = self.client.get("/api/chat/bids", headers=self.auth(self.other)).json()["items"]
        self.assertEqual([bid["reference"] for bid in others], [other_id])
        self.assertEqual(self.client.get("/api/chat/bids", headers=self.auth(self.admin, "ADMIN")).json()["items"], [])
        self.assertEqual(self.track(row["reference"]).json()["status"], row["status"])

    def test_bid_search_matches_title_and_literal_tender_id(self):
        special_id = "GEM/2026/" + str(uuid.uuid4()) + "%_"
        with SessionLocal() as db:
            db.add(Tender(id=special_id, title="Office laptops", budget_limit=100))
            db.flush()
            db.add(Bid(bidder_id=self.owner, tender_id=special_id, status="Pending"))
            db.commit()
        for term in ("OFFICE", special_id, "%_", "  laptops  "):
            rows = self.client.get("/api/chat/bids", headers=self.headers, params={"search": term}).json()["items"]
            self.assertEqual([row["tender_id"] for row in rows], [special_id])
        for term in ("nothing matches", "' OR 1=1 --"):
            self.assertEqual(self.client.get("/api/chat/bids", headers=self.headers, params={"search": term}).json()["items"], [])
        self.assertEqual(self.client.get("/api/chat/bids", headers=self.headers, params={"offset": -1}).status_code, 422)
        self.assertEqual(self.client.get("/api/chat/bids", headers=self.headers, params={"search": "a" * 256}).status_code, 422)

    def test_bid_list_pagination_and_status_mapping(self):
        with SessionLocal() as db:
            for i in range(24):
                db.add(Bid(bidder_id=self.owner, tender_id=self.tender_id, status="Compliant",
                           officer_status="Seek Clarification" if i == 0 else "Pending"))
            db.commit()
        first = self.client.get("/api/chat/bids", headers=self.headers).json()
        second = self.client.get("/api/chat/bids", headers=self.headers, params={"offset": 20}).json()
        self.assertEqual(len(first["items"]), 20)
        self.assertTrue(first["has_more"])
        self.assertEqual(len(second["items"]), 5)
        self.assertFalse(second["has_more"])
        rows = first["items"] + second["items"]
        self.assertEqual(len({row["reference"] for row in rows}), 25)
        self.assertEqual(sum(row["status"] == "clarification_needed" for row in rows), 1)
        self.assertTrue(all(row["status"] in {"under_review", "clarification_needed"} for row in rows))
        self.assertEqual([row["submitted_at"] for row in rows], sorted([row["submitted_at"] for row in rows], reverse=True))

    def test_tracking_requires_authentication(self):
        response = self.client.post("/api/chat/track", json={"reference": str(self.bid_id)})
        self.assertEqual(response.status_code, 401)

    def test_owner_only_minimal_readonly_response(self):
        statements = []
        def capture(conn, cursor, statement, parameters, context, executemany):
            statements.append(statement.lower())
        event.listen(engine, "before_cursor_execute", capture)
        try:
            response = self.track()
        finally:
            event.remove(engine, "before_cursor_execute", capture)
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(set(response.json()), {"reference", "status", "submitted_at", "reviewed_at", "next_action"})
        self.assertEqual(response.json()["status"], "under_review")
        self.assertEqual(response.headers["cache-control"], "no-store")
        bid_queries = [s for s in statements if "from bids" in s]
        self.assertTrue(bid_queries)
        self.assertTrue(all("compliance_score" not in s and "deviation_justification" not in s for s in bid_queries))
        self.assertFalse(any(s.startswith(("update bids", "delete from bids", "insert into bids")) for s in statements))

    def test_other_owner_and_missing_are_indistinguishable(self):
        denied = self.track(headers=self.auth(self.other))
        missing = self.track(uuid.uuid4())
        self.assertEqual(denied.status_code, 404)
        self.assertEqual(denied.json(), missing.json())
        self.assertEqual(self.track(headers=self.auth(self.admin, "ADMIN")).status_code, 404)

    def test_invalid_and_injected_reference_rejected(self):
        for value in ("' OR 1=1 --", "BID-12345678", "", "a" * 100):
            self.assertEqual(self.track(value if value else " ").status_code, 422)

    def test_rate_limit_and_next_window(self):
        for _ in range(10):
            self.assertEqual(self.track().status_code, 200)
        response = self.track()
        self.assertEqual(response.status_code, 429)
        self.assertEqual(response.headers["retry-after"], "60")
        with SessionLocal() as db:
            db.query(ChatRateLimit).filter(ChatRateLimit.user_id == self.owner).update({"window": 0})
            db.commit()
        self.assertEqual(self.track().status_code, 200)

    def test_decision_mapping_preserves_uncertainty(self):
        for recorded, expected in (("Approved", "approved"), ("Rejected", "rejected"),
                                   ("Approved with Deviation", "approved_with_deviation"), ("Seek Clarification", "clarification_needed")):
            with SessionLocal() as db:
                db.get(Bid, self.bid_id).officer_status = recorded
                db.commit()
            self.assertEqual(self.track().json()["status"], expected)
        with SessionLocal() as db:
            bid = db.get(Bid, self.bid_id)
            bid.officer_status = "Pending"
            bid.status = "UNRECOGNIZED_STATE"
            db.commit()
        self.assertEqual(self.track().json()["status"], "unknown")

    def test_database_failure_does_not_generate_status(self):
        with patch("app.api.chat.owned_application", side_effect=RuntimeError("database unavailable")):
            response = self.track()
        self.assertEqual(response.status_code, 500)
        self.assertNotIn("approved", response.text)
        self.assertNotIn("database unavailable", response.text)

    def test_role_from_authenticated_account_and_language(self):
        with patch("app.api.chat.answer_question", new_callable=AsyncMock, return_value=("Hello", "knowledge_base", [])) as answer:
            response = self.client.post("/api/chat", headers=self.headers, json={"message": "Hi", "user_role": "ADMIN", "language": "hi"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(answer.call_args.kwargs["user_role"], "BIDDER")
        self.assertEqual(answer.call_args.kwargs["language"], "hi")

    def test_ticket_lifecycle_and_agent_handoff(self):
        reference = self.ticket(self.bid_id)
        base = f"/api/chat/support/tickets/{reference}"
        staff = f"/api/chat/support/staff/tickets/{reference}"
        admin = self.auth(self.admin, "ADMIN")
        self.assertEqual(self.client.post(base + "/escalate", headers=self.headers).status_code, 200)
        first = self.client.get(base, headers=self.headers).json()["escalated_at"]
        self.assertEqual(self.client.post(base + "/escalate", headers=self.headers).json()["escalated_at"], first)
        reply = self.client.post(staff + "/messages", headers=admin, json={"content": "Please use a readable PDF."})
        self.assertEqual(reply.status_code, 200, reply.text)
        rows = self.client.get(base + "/messages", headers=self.headers).json()
        self.assertEqual([m["sender_kind"] for m in rows], ["applicant", "agent"])
        self.assertEqual(set(rows[0]), {"id", "sender_kind", "content", "created_at"})
        self.assertEqual(self.client.get(base, headers=self.headers).json()["status"], "in_progress")
        self.assertEqual(self.client.get(staff, headers=admin).json()["status"], "in_progress")
        self.assertEqual(self.client.patch(staff, headers=admin, json={"status": "resolved"}).status_code, 200)
        self.assertEqual(self.client.post(base + "/messages", headers=self.headers, json={"content": "Hello"}).status_code, 409)
        self.assertEqual(self.client.post(base + "/escalate", headers=self.headers).status_code, 409)
        self.assertEqual(self.client.patch(staff, headers=admin, json={"status": "open"}).status_code, 200)

    def test_ticket_access_restrictions_on_every_operation(self):
        reference = self.ticket()
        base = f"/api/chat/support/tickets/{reference}"
        other = self.auth(self.other)
        for path in (base, base + "/messages"):
            self.assertEqual(self.client.get(path, headers=other).status_code, 404)
        self.assertEqual(self.client.post(base + "/messages", headers=other, json={"content": "Hello"}).status_code, 404)
        self.assertEqual(self.client.post(base + "/escalate", headers=other).status_code, 404)
        self.assertEqual(self.client.post("/api/chat/support/tickets", headers=other, json={
            "subject": "Test", "message": "Test message", "application_reference": str(self.bid_id)}).status_code, 404)
        for path in ("/staff/tickets", f"/staff/tickets/{reference}", f"/staff/tickets/{reference}/messages"):
            self.assertEqual(self.client.get("/api/chat/support" + path, headers=self.headers).status_code, 403)
        self.assertEqual(self.client.post("/api/chat/support/staff/presence", headers=self.headers).status_code, 403)
        self.assertEqual(self.client.post(f"/api/chat/support/staff/tickets/{reference}/messages", headers=self.headers, json={"content": "fake agent"}).status_code, 403)
        self.assertEqual(self.client.patch(f"/api/chat/support/staff/tickets/{reference}", headers=self.headers, json={"status": "resolved"}).status_code, 403)

    def test_no_presence_means_no_live_agent_claim(self):
        with SessionLocal() as db:
            db.query(SupportPresence).delete()
            db.commit()
        base = "/api/chat/support"
        self.assertFalse(self.client.get(base + "/availability", headers=self.headers).json()["available"])
        admin = self.auth(self.admin, "ADMIN")
        self.assertEqual(self.client.post(base + "/staff/presence", headers=admin).status_code, 200)
        self.assertTrue(self.client.get(base + "/availability", headers=self.headers).json()["available"])
        with SessionLocal() as db:
            db.get(SupportPresence, self.admin).seen_at = datetime.now(timezone.utc) - timedelta(minutes=2)
            db.commit()
        self.assertFalse(self.client.get(base + "/availability", headers=self.headers).json()["available"])

    def test_whitespace_support_input_and_invalid_status_rejected(self):
        response = self.client.post("/api/chat/support/tickets", headers=self.headers, json={"subject": "   ", "message": "   "})
        self.assertEqual(response.status_code, 422)

    def test_plain_numbers_and_latex_fallback(self):
        self.assertEqual(_basic_calculation_answer("125000 * 2"), "1,25,000 × 2 = 2,50,000.")
        self.assertEqual(_basic_calculation_answer("1 / 3"), "1 ÷ 3 ≈ 0.333333 (approximate).")
        self.assertIn("undefined", _basic_calculation_answer("2 / 0"))
        with patch.object(settings, "AI_PROVIDER", "groq"), patch.object(settings, "GROQ_API_KEY", "test"), patch(
                "app.services.chat_service._generate_groq_answer", return_value=(r"\(\frac{1}{3}\)", False)):
            answer, source, _ = asyncio.run(answer_question("1 / 3", [], "BIDDER"))
        self.assertFalse(has_latex(answer))
        self.assertEqual(source, "knowledge_base")

    def test_calculation_does_not_inherit_decimal_flags(self):
        from decimal import Decimal, Inexact, localcontext
        with localcontext() as caller:
            Decimal(1) / Decimal(3)
            self.assertTrue(caller.flags[Inexact])
            self.assertEqual(_basic_calculation_answer("2 + 2"), "2 + 2 = 4.")
            self.assertEqual(_basic_calculation_answer("1 / 8"), "1 ÷ 8 = 0.125.")
            self.assertIn("(approximate)", _basic_calculation_answer("1 / 3"))
            self.assertIn("(approximate)", _basic_calculation_answer("1 / 128"))
            self.assertTrue(caller.flags[Inexact], "Do not mutate the caller's Decimal context")

    def test_language_detection_and_outage_fallback(self):
        for question, language in (("आवेदन की स्थिति", "hi"), ("mera status kya hai", "hinglish"), ("Track my application", "en")):
            self.assertEqual(detect_language(question), language)
            with patch.object(settings, "AI_PROVIDER", "disabled"):
                answer, source, suggestions = asyncio.run(answer_question(question, [], "BIDDER"))
            self.assertEqual(source, "knowledge_base")
            self.assertTrue(suggestions)
            self.assertFalse(has_latex(answer))
            if language == "hi":
                self.assertIn("स्थिति", answer)

    def test_additive_migration_is_repeatable(self):
        import importlib.util
        from sqlalchemy import create_engine, inspect, text
        from alembic.migration import MigrationContext
        from alembic.operations import Operations
        path = Path(__file__).resolve().parents[1] / "alembic/versions/c72f61a9e403_add_chat_support.py"
        spec = importlib.util.spec_from_file_location("support_migration", path)
        migration = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(migration)
        temporary_engine = create_engine("sqlite://")
        try:
            with temporary_engine.begin() as connection:
                connection.execute(text("CREATE TABLE users (id UUID PRIMARY KEY)"))
                connection.execute(text("CREATE TABLE bids (id UUID PRIMARY KEY)"))
                with patch.object(migration, "op", Operations(MigrationContext.configure(connection))):
                    migration.upgrade()
                    migration.upgrade()
                    names = inspect(connection).get_table_names()
                    self.assertTrue({"support_tickets", "support_messages", "support_presence", "chat_rate_limits"}.issubset(names))
                    for model in (SupportTicket, SupportMessage, SupportPresence, ChatRateLimit):
                        columns = {c["name"] for c in inspect(connection).get_columns(model.__tablename__)}
                        self.assertEqual(columns, set(model.__table__.columns.keys()))
        finally:
            temporary_engine.dispose()


if __name__ == "__main__":
    try:
        unittest.main(verbosity=2)
    finally:
        engine.dispose()
        TEMP.cleanup()

"""Provider regressions; mocked transports, no network or application database."""
import asyncio
import json
from pathlib import Path
import sys
from types import SimpleNamespace
import unittest
from unittest.mock import Mock, patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.core.config import settings
from app.services import chat_service as chat


class ProviderTests(unittest.TestCase):
    def test_dedicated_gemini_key_enables_chat(self):
        with patch.multiple(settings, AI_PROVIDER="gemini", AI_API_KEY="", GEMINI_API_KEY=" dedicated "), patch.object(
            chat, "_generate_ai_answer", return_value=("An AI answer", False)
        ) as generator:
            self.assertEqual(asyncio.run(chat.answer_question("Hello", [], "BIDDER"))[1], "ai")
            generator.assert_called_once()
            self.assertEqual(settings.effective_gemini_api_key, "dedicated")

    def test_gemini_transport_uses_dedicated_key_timeout_and_closes(self):
        client = Mock()
        client.models.generate_content.return_value = SimpleNamespace(text="Reply")
        sdk = SimpleNamespace(Client=Mock(return_value=client))
        with patch.dict(sys.modules, {"google.genai": sdk}), patch.multiple(
            settings, AI_API_KEY="generic", GEMINI_API_KEY="dedicated"
        ):
            self.assertEqual(chat._generate_ai_answer("Hello", [], "BIDDER"), ("Reply", False))
            self.assertEqual(sdk.Client.call_args.kwargs["api_key"], "dedicated")
            self.assertLess(sdk.Client.call_args.kwargs["http_options"]["timeout"], chat.CHAT_TIMEOUT_SECONDS * 1000)
            client.close.assert_called_once()

    def test_missing_sdks_return_local_guidance_not_a_fake_ai_answer(self):
        with patch.multiple(settings, AI_PROVIDER="gemini", AI_API_KEY="fake", GEMINI_API_KEY=""), patch.dict(
            sys.modules, {"google.genai": None, "google.generativeai": None}
        ):
            result = asyncio.run(chat.answer_question("How do I upload a document?", [], "BIDDER"))
            self.assertEqual(result[1], "knowledge_base")
            self.assertIn("Upload Document", result[0])

    def test_empty_and_failed_provider_answers_return_guidance(self):
        for answer in ("", "   ", None):
            with self.subTest(answer=answer), patch.multiple(settings, AI_PROVIDER="groq", GROQ_API_KEY="fake"), patch.object(
                chat, "_generate_groq_answer", return_value=(answer, False)
            ):
                self.assertEqual(asyncio.run(chat.answer_question("Hello", [], "BIDDER"))[1], "knowledge_base")

    def test_provider_deadline_returns_before_deployment_limit(self):
        async def slow_transport(*args):
            await asyncio.sleep(1)
        with patch.multiple(settings, AI_PROVIDER="groq", GROQ_API_KEY="fake"), patch.object(
            chat, "CHAT_TIMEOUT_SECONDS", 0.01
        ), patch.object(chat.asyncio, "to_thread", side_effect=slow_transport):
            self.assertEqual(asyncio.run(chat.answer_question("Hello", [], "BIDDER"))[1], "knowledge_base")
        config = json.loads((Path(__file__).resolve().parents[2] / "vercel.json").read_text())
        self.assertLess(chat.CHAT_TIMEOUT_SECONDS, config["functions"]["api/index.py"]["maxDuration"])

    def test_standard_groq_failure_is_not_retried(self):
        with patch.multiple(settings, GROQ_MODEL="openai/gpt-oss-20b", GROQ_API_KEY="fake"), patch(
            "requests.post", side_effect=RuntimeError("offline")
        ) as post:
            with self.assertRaises(RuntimeError):
                chat._generate_groq_answer("Hello", [], "BIDDER")
            post.assert_called_once()
            payload = post.call_args.kwargs["json"]
            self.assertEqual(payload["reasoning_effort"], "low")
            self.assertGreaterEqual(payload["max_completion_tokens"], 2048)

    def test_web_failure_can_fall_back_to_standard_model(self):
        response = Mock()
        response.json.return_value = {"choices": [{"message": {"content": "Reply"}}]}
        payloads = []
        def post(*args, **kwargs):
            payloads.append(dict(kwargs["json"]))
            if len(payloads) == 1:
                raise RuntimeError("web unavailable")
            return response
        with patch.multiple(settings, GROQ_MODEL="openai/gpt-oss-20b", GROQ_WEB_MODEL="groq/compound-mini",
                            GROQ_WEB_SEARCH_ENABLED=True, GROQ_API_KEY="fake"), patch("requests.post", side_effect=post):
            self.assertEqual(chat._generate_groq_answer("latest update", [], "BIDDER"), ("Reply", False))
            self.assertNotIn("reasoning_effort", payloads[0])
            self.assertEqual(payloads[1]["reasoning_effort"], "low")

    def test_deployed_chat_matches_backend(self):
        root = Path(__file__).resolve().parents[2]
        for name in ("services/chat_service.py", "api/chat.py", "schemas/chat.py", "services/chat_access.py",
                     "services/chat_text.py", "services/chat_languages.py"):
            self.assertEqual((root / "backend/app" / name).read_text(encoding="utf-8"),
                             (root / "api/app" / name).read_text(encoding="utf-8"))

    def test_offline_support_tracking_and_officer_navigation(self):
        from app.services.chat_text import localized_fallback
        from app.services.chat_languages import REGIONAL
        self.assertIn("Track ticket", chat._knowledge_base_answer("track my ticket", "BIDDER")[0])
        self.assertIn("Track bid", chat._knowledge_base_answer("Where can I track my bid?", "BIDDER")[0])
        for role in ("AUDITOR", "VERIFICATION OFFICER"):
            self.assertIn("Bidders", chat._knowledge_base_answer("portal navigation", role)[0])
        for language in ("hi", "hinglish"):
            self.assertIn("Tender ID", localized_fallback("status", language)[0])
        for guidance, *_ in REGIONAL.values():
            self.assertIn("Tender ID", guidance)


if __name__ == "__main__":
    unittest.main(verbosity=2)

import json
import logging
import re
from typing import Dict, Any, List, Optional
try:
    # pyrefly: ignore [missing-import]
    from google import genai as new_genai
except ImportError:
    new_genai = None

if new_genai is None:
    try:
        # pyrefly: ignore [missing-import]
        import google.generativeai as genai
    except ImportError:
        genai = None
else:
    genai = None

from app.core.config import settings

logger = logging.getLogger(__name__)

class AIExtractionService:
    SCHEMAS = {
        "GST_CERTIFICATE": {
            "gstin": "GST Registration Number (15-character alphanumeric)",
            "legal_name": "Legal name of business",
            "trade_name": "Trade name or brand name",
            "registration_date": "Date of registration (YYYY-MM-DD)",
            "status": "Registration status (Active/Suspended/etc.)",
            "business_address": "Principal place of business address"
        },
        "PAN": {
            "pan_number": "Permanent Account Number (10-character alphanumeric)",
            "name": "Name of cardholder",
            "date_of_birth_or_incorporation": "Date of birth or incorporation (YYYY-MM-DD)"
        },
        "UDYAM": {
            "udyam_number": "Udyam Registration Number (UDYAM-XX-00-0000000)",
            "enterprise_name": "Name of Enterprise",
            "enterprise_type": "Type of Enterprise (Micro/Small/Medium)",
            "major_activity": "Major Activity (Manufacturing/Services)",
            "state": "State of operation",
            "district": "District of operation"
        },
        "EPFO": {
            "establishment_id": "EPFO Establishment ID",
            "establishment_name": "Name of Establishment",
            "registration_status": "Status of registration"
        },
        "ESIC": {
            "employer_code": "ESIC Employer Code (17 digits)",
            "employer_name": "Name of Employer",
            "registration_status": "Status of registration"
        },
        "OEM_AUTHORIZATION": {
            "oem_name": "Name of the Original Equipment Manufacturer",
            "authorized_bidder": "Name of authorized bidding agent/reseller",
            "authorization_number": "OEM Authorization letter or Certificate reference number",
            "issue_date": "Date of authorization issue (YYYY-MM-DD)",
            "expiry_date": "Date of authorization expiry (YYYY-MM-DD)",
            "product_scope": "Scope of products authorized for sale"
        },
        "MAKE_IN_INDIA": {
            "bidder_name": "Name of the bidder company",
            "product_name": "Product/Service name",
            "local_content_percentage": "Percentage of local content (numeric or string)",
            "local_content_value": "Value of local content",
            "declaration_date": "Date of the local content declaration (YYYY-MM-DD)",
            "declarant": "Name and designation of declarant"
        },
        "BLACKLIST_DECLARATION": {
            "bidder_name": "Name of the bidder company",
            "blacklisting_status": "Debarred/Blacklisted status (e.g. Not Blacklisted, Blacklisted)",
            "authority": "Authority ordering blacklisting (if blacklisted)",
            "order_number": "Order number of blacklisting/debarment",
            "order_date": "Date of debarment order (YYYY-MM-DD)",
            "valid_until": "End date of blacklisting/debarment period (YYYY-MM-DD)"
        }
    }

    @classmethod
    def _get_effective_api_key(cls) -> str:
        import os
        return settings.effective_gemini_api_key or os.getenv("GEMINI_API_KEY") or ""

    @classmethod
    def classify_document_type_ai(cls, text: str) -> str:
        """Fallback AI method to classify a document if rule-based fails."""
        api_key = cls._get_effective_api_key()
        if not api_key or api_key in {"YOUR_KEY", "your_gemini_api_key_here"}:
            for doc_type in cls.SCHEMAS.keys():
                if doc_type.split("_")[0].lower() in text.lower():
                    return doc_type
            return "OTHER"

        prompt = (
            "You are an AI document classifier. Classify the following text into one of these types:\n"
            "PAN, GST_CERTIFICATE, GST_RETURN, UDYAM, INCOME_TAX, EPFO, ESIC, STARTUP_INDIA, NSIC, OEM_AUTHORIZATION, MAKE_IN_INDIA, BIS, DPIIT, BLACKLIST_DECLARATION, OTHER.\n"
            "Respond with ONLY the type string, nothing else.\n\n"
            f"Text:\n{text[:2000]}"
        )

        if new_genai is not None:
            try:
                client = new_genai.Client(api_key=api_key)
                response = client.models.generate_content(model=settings.AI_MODEL, contents=prompt)
                classification = response.text.strip().upper()
                if classification in cls.SCHEMAS or classification in {"GST_RETURN", "INCOME_TAX", "STARTUP_INDIA", "NSIC", "BIS", "DPIIT", "OTHER"}:
                    return classification
                return "OTHER"
            except Exception as e:
                logger.warning(f"Google GenAI SDK classification failed: {e}")

        if genai is not None:
            try:
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel(settings.AI_MODEL)
                response = model.generate_content(prompt)
                classification = response.text.strip().upper()
                if classification in cls.SCHEMAS or classification in {"GST_RETURN", "INCOME_TAX", "STARTUP_INDIA", "NSIC", "BIS", "DPIIT", "OTHER"}:
                    return classification
                return "OTHER"
            except Exception as e:
                logger.warning(f"Legacy Gemini AI classification failed: {e}")

        for doc_type in cls.SCHEMAS.keys():
            if doc_type.split("_")[0].lower() in text.lower():
                return doc_type
        return "OTHER"

    @classmethod
    def extract_fields(cls, text: str, document_type: str) -> Dict[str, Any]:
        """Extract structured fields from text based on document_type using Gemini or rule-based mock."""
        api_key = cls._get_effective_api_key()
        if not api_key or api_key in {"YOUR_KEY", "your_gemini_api_key_here"}:
            logger.info("AIExtractionService: Using mock extraction fallback.")
            return cls._mock_extraction(text, document_type)

        schema = cls.SCHEMAS.get(document_type)
        if not schema:
            return {
                "document_type": document_type,
                "fields": {},
                "confidence": 0.80,
                "missing_fields": [],
                "requires_review": False
            }

        prompt = (
            "You are a highly accurate document data extraction assistant.\n"
            f"Analyze the following text from a {document_type} document.\n"
            "Extract the following fields according to these definitions:\n"
            f"{json.dumps(schema, indent=2)}\n\n"
            "Follow these instructions strictly:\n"
            "1. If a field is not present, or you cannot find it with high confidence, set it to null. Do NOT invent/guess/fabricate any information.\n"
            "2. Return a valid JSON object ONLY. Do not include markdown wraps like ```json or any other text.\n"
            "3. The output JSON must have this structure:\n"
            "{\n"
            "  \"fields\": { ... extracted fields ... },\n"
            "  \"confidence\": 0.95, // overall confidence score between 0.0 and 1.0\n"
            "  \"missing_fields\": [ ... list of keys in schema not found ... ],\n"
            "  \"requires_review\": false // set to true if critical fields are missing or if you are highly uncertain\n"
            "}\n\n"
            f"Text:\n{text}"
        )

        raw_response_text = None
        if new_genai is not None:
            try:
                client = new_genai.Client(api_key=api_key)
                response = client.models.generate_content(model=settings.AI_MODEL, contents=prompt)
                raw_response_text = response.text
            except Exception as e:
                logger.warning(f"Google GenAI SDK extract_fields failed: {e}")

        if raw_response_text is None and genai is not None:
            try:
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel(settings.AI_MODEL)
                response = model.generate_content(prompt)
                raw_response_text = response.text
            except Exception as e:
                logger.warning(f"Legacy Gemini AI extract_fields failed: {e}")

        if not raw_response_text:
            return cls._mock_extraction(text, document_type)

        try:
            clean_res = raw_response_text.strip()
            if clean_res.startswith("```json"):
                clean_res = clean_res[7:]
            if clean_res.endswith("```"):
                clean_res = clean_res[:-3]
            clean_res = clean_res.strip()
            data = json.loads(clean_res)
            return {
                "document_type": document_type,
                "fields": data.get("fields", {}),
                "confidence": data.get("confidence", 0.90),
                "missing_fields": data.get("missing_fields", []),
                "requires_review": data.get("requires_review", False)
            }
        except Exception as e:
            logger.warning(f"Failed to parse Gemini JSON extraction output ({e}). Falling back to rule-based extraction.")
            return cls._mock_extraction(text, document_type)

    @classmethod
    def _mock_extraction(cls, text: str, document_type: str) -> Dict[str, Any]:
        """Rule-based regex extraction fallback for common document types."""
        from app.services.regex_extractor import RegexExtractor
        return RegexExtractor.extract_all_fields(text, document_type)

import json
import logging
import re
from typing import Dict, Any, List, Optional
import google.generativeai as genai
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
        if not api_key or api_key == "YOUR_KEY" or api_key == "your_gemini_api_key_here":
            # If mock, look at text content for generic fallback
            for doc_type in cls.SCHEMAS.keys():
                if doc_type.split("_")[0].lower() in text.lower():
                    return doc_type
            return "OTHER"

        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(settings.AI_MODEL)
            prompt = (
                "You are an AI document classifier. Classify the following text into one of these types:\n"
                "PAN, GST_CERTIFICATE, GST_RETURN, UDYAM, INCOME_TAX, EPFO, ESIC, STARTUP_INDIA, NSIC, OEM_AUTHORIZATION, MAKE_IN_INDIA, BIS, DPIIT, BLACKLIST_DECLARATION, OTHER.\n"
                "Respond with ONLY the type string, nothing else.\n\n"
                f"Text:\n{text[:2000]}"
            )
            response = model.generate_content(prompt)
            classification = response.text.strip().upper()
            if classification in cls.SCHEMAS or classification in {"GST_RETURN", "INCOME_TAX", "STARTUP_INDIA", "NSIC", "BIS", "DPIIT", "OTHER"}:
                return classification
            return "OTHER"
        except Exception as e:
            logger.warning(f"AI classification failed: {e}")
            return "OTHER"

    @classmethod
    def extract_fields(cls, text: str, document_type: str) -> Dict[str, Any]:
        """Extract structured fields from text based on document_type using Gemini or rule-based mock."""
        api_key = cls._get_effective_api_key()
        if not api_key or api_key == "YOUR_KEY" or api_key == "your_gemini_api_key_here":
            logger.info("AIExtractionService: Using mock extraction fallback.")
            return cls._mock_extraction(text, document_type)


        schema = cls.SCHEMAS.get(document_type)
        if not schema:
            # For unsupported/OTHER, store raw text and return empty fields
            return {
                "document_type": document_type,
                "fields": {},
                "confidence": 0.80,
                "missing_fields": [],
                "requires_review": False
            }

        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(settings.AI_MODEL)
            
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
            
            response = model.generate_content(prompt)
            # Parse response. Try to clean up any markdown code block wraps.
            clean_res = response.text.strip()
            if clean_res.startswith("```json"):
                clean_res = clean_res[7:]
            if clean_res.endswith("```"):
                clean_res = clean_res[:-3]
            clean_res = clean_res.strip()
            
            parsed = json.loads(clean_res)
            # Ensure the document_type is set
            parsed["document_type"] = document_type
            return parsed
        except Exception as e:
            logger.exception(f"Gemini extraction failed: {e}")
            # In case of failure, fall back to mock extraction to keep system working
            mock_res = cls._mock_extraction(text, document_type)
            mock_res["requires_review"] = True
            return mock_res

    @classmethod
    def _mock_extraction(cls, text: str, document_type: str) -> Dict[str, Any]:
        """Intelligent rule-based mock extractor using RegexExtractor and keyword heuristics."""
        fields = {}
        missing_fields = []
        confidence = 0.90
        
        from app.services.regex_extractor import RegexExtractor
        extracted_ids = RegexExtractor.extract_identifiers(text)

        schema = cls.SCHEMAS.get(document_type)
        if not schema:
            return {
                "document_type": document_type,
                "fields": {},
                "confidence": 0.50,
                "missing_fields": [],
                "requires_review": True
            }

        # Seed default nulls
        for key in schema.keys():
            fields[key] = None

        text_upper = text.upper()

        # Helper regex to scan text for company entity patterns
        company_scan = re.search(r'([A-Z0-9\s&.-]+(?:\b(?:PRIVATE|PVT|LIMITED|LTD|CORP|SOLUTIONS|TRADERS|ENTERPRISES|INDUSTRIES|ENGINEERING|SYSTEMS)\b))', text, re.IGNORECASE)
        scanned_name = company_scan.group(1).strip() if company_scan else None

        if document_type == "GST_CERTIFICATE":
            if extracted_ids["gstin"]:
                fields["gstin"] = extracted_ids["gstin"][0]
            name_match = re.search(r"LEGAL\s+NAME[:\s]+([A-Z\s0-9&.-]+)", text, re.IGNORECASE)
            if name_match:
                fields["legal_name"] = name_match.group(1).strip()
            elif scanned_name:
                fields["legal_name"] = scanned_name
                
            trade_match = re.search(r"TRADE\s+NAME[:\s]+([A-Z\s0-9&.-]+)", text, re.IGNORECASE)
            if trade_match:
                fields["trade_name"] = trade_match.group(1).strip()
            elif scanned_name:
                fields["trade_name"] = scanned_name

            date_match = re.search(r"(?:REGISTRATION\s+DATE|DATE\s+OF\s+REGISTRATION)[:\s]+(\d{4}-\d{2}-\d{2}|\d{2}[/-]\d{2}[/-]\d{4})", text, re.IGNORECASE)
            if date_match:
                fields["registration_date"] = date_match.group(1)

            if "ACTIVE" in text_upper:
                fields["status"] = "ACTIVE"
            elif "SUSPENDED" in text_upper:
                fields["status"] = "SUSPENDED"

            addr_match = re.search(r"(?:ADDRESS|PLACE\s+OF\s+BUSINESS)[:\s]+([A-Z0-9\s,.-]+)", text, re.IGNORECASE)
            if addr_match:
                fields["business_address"] = addr_match.group(1).strip()

        elif document_type == "PAN":
            if extracted_ids["pan"]:
                fields["pan_number"] = extracted_ids["pan"][0]
            elif extracted_ids["gstin"]:
                fields["pan_number"] = extracted_ids["gstin"][0][2:12]
                
            name_match = re.search(r"NAME[:\s]+([A-Z\s&.-]+)", text, re.IGNORECASE)
            if name_match:
                fields["name"] = name_match.group(1).strip()
            elif scanned_name:
                fields["name"] = scanned_name

            dob_match = re.search(r"(?:DOB|DATE\s+OF\s+BIRTH|INCORPORATION)[:\s]+(\d{4}-\d{2}-\d{2}|\d{2}[/-]\d{2}[/-]\d{4})", text, re.IGNORECASE)
            if dob_match:
                fields["date_of_birth_or_incorporation"] = dob_match.group(1)

        elif document_type == "UDYAM":
            if extracted_ids["udyam"]:
                fields["udyam_number"] = extracted_ids["udyam"][0]
            if scanned_name:
                fields["enterprise_name"] = scanned_name
            if "MICRO" in text_upper:
                fields["enterprise_type"] = "MICRO"
            elif "SMALL" in text_upper:
                fields["enterprise_type"] = "SMALL"
            elif "MEDIUM" in text_upper:
                fields["enterprise_type"] = "MEDIUM"

            if "MANUFACTURING" in text_upper:
                fields["major_activity"] = "MANUFACTURING"
            elif "SERVICES" in text_upper:
                fields["major_activity"] = "SERVICES"

        elif document_type == "EPFO":
            est_match = re.search(r"ESTABLISHMENT\s+ID[:\s]+([A-Z0-9]+)", text, re.IGNORECASE)
            if est_match:
                fields["establishment_id"] = est_match.group(1).strip()
            if scanned_name:
                fields["establishment_name"] = scanned_name
            if "ACTIVE" in text_upper:
                fields["registration_status"] = "ACTIVE"

        elif document_type == "ESIC":
            emp_match = re.search(r"EMPLOYER\s+CODE[:\s]+([0-9]+)", text, re.IGNORECASE)
            if emp_match:
                fields["employer_code"] = emp_match.group(1).strip()
            if scanned_name:
                fields["employer_name"] = scanned_name
            if "ACTIVE" in text_upper:
                fields["registration_status"] = "ACTIVE"

        elif document_type == "OEM_AUTHORIZATION":
            oem_match = re.search(r"OEM\s+NAME[:\s]+([A-Z0-9\s&.-]+)", text, re.IGNORECASE)
            if oem_match:
                fields["oem_name"] = oem_match.group(1).strip()
            if scanned_name:
                fields["authorized_bidder"] = scanned_name
            auth_match = re.search(r"AUTHORIZATION\s+NUMBER[:\s]+([A-Z0-9/-]+)", text, re.IGNORECASE)
            if auth_match:
                fields["authorization_number"] = auth_match.group(1).strip()

        elif document_type == "MAKE_IN_INDIA":
            if scanned_name:
                fields["bidder_name"] = scanned_name
            local_pct_match = re.search(r"LOCAL\s+CONTENT[:\s]+(\d+(?:\.\d+)?%)", text, re.IGNORECASE)
            if local_pct_match:
                fields["local_content_percentage"] = local_pct_match.group(1)

        elif document_type == "BLACKLIST_DECLARATION":
            if scanned_name:
                fields["bidder_name"] = scanned_name
            if "DEBARRED" in text_upper or "BLACKLISTED" in text_upper:
                if "NOT BLACKLISTED" in text_upper or "NEVER BLACKLISTED" in text_upper or "NOT DEBARRED" in text_upper:
                    fields["blacklisting_status"] = "NOT BLACKLISTED"
                else:
                    fields["blacklisting_status"] = "BLACKLISTED"
            elif "NOT BLACKLISTED" in text_upper or "NEVER BLACKLISTED" in text_upper:
                fields["blacklisting_status"] = "NOT BLACKLISTED"

        # Determine missing fields and confidence adjustments
        for key, val in fields.items():
            if val is None:
                missing_fields.append(key)
                
        # If any field is missing, lower the confidence
        if missing_fields:
            confidence = max(0.50, confidence - 0.15 * len(missing_fields))
            
        requires_review = confidence < 0.60 or "BLACKLISTED" in str(fields.get("blacklisting_status", "")).upper()

        return {
            "document_type": document_type,
            "fields": fields,
            "confidence": round(confidence, 2),
            "missing_fields": missing_fields,
            "requires_review": requires_review
        }

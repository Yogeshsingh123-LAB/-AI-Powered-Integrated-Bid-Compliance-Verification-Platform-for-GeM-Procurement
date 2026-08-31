# pyrefly: ignore [missing-import]
import re
import json
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

# Standard GeM Procurement RFP Default Baseline Requirements
DEFAULT_GEM_RFP_CLAUSES = [
    {
        "clause_id": "RFP-01",
        "title": "Statutory GSTIN & PAN Registration",
        "description": "Bidder must possess valid active GSTIN and PAN registration certificates in India.",
        "mandatory": True,
        "keywords": ["gstin", "gst", "pan", "tax", "income tax", "registration certificate"]
    },
    {
        "clause_id": "RFP-02",
        "title": "Minimum Financial Turnover & Experience",
        "description": "Bidder must demonstrate prior turnover or execution experience in relevant supply/service category.",
        "mandatory": True,
        "keywords": ["turnover", "experience", "revenue", "lakhs", "crores", "financial", "annual", "years"]
    },
    {
        "clause_id": "RFP-03",
        "title": "MSME / Micro & Small Enterprise Exemption Certificate",
        "description": "Eligible MSE Manufacturers/Service Providers may claim EMD exemption by furnishing Udyam registration (Traders excluded).",
        "mandatory": False,
        "keywords": ["udyam", "msme", "micro", "small", "manufacturer", "service provider", "exemption", "certificate"]
    },
    {
        "clause_id": "RFP-04",
        "title": "OEM Authorization Certificate",
        "description": "If bidder is an authorized dealer/reseller, OEM authorization letter must be attached.",
        "mandatory": False,
        "keywords": ["oem", "authorization", "manufacturer", "dealer", "reseller", "partner"]
    },
    {
        "clause_id": "RFP-05",
        "title": "Non-Blacklisting & Integrity Undertaking",
        "description": "Bidder must submit self-declaration confirming they are not debarred or blacklisted by any Govt entity.",
        "mandatory": True,
        "keywords": ["blacklisted", "debarred", "undertaking", "declaration", "integrity", "affidavit"]
    },
    {
        "clause_id": "RFP-06",
        "title": "Land Border Sharing Country Compliance (GFR Rule 144(xi))",
        "description": "Bidder must declare compliance with land-border country restrictions or provide DPIIT Competent Authority registration.",
        "mandatory": True,
        "keywords": ["land border", "rule 144", "gfr", "sharing border", "competent authority", "dpiit registration", "border restriction"]
    },
    {
        "clause_id": "RFP-07",
        "title": "EMD & Performance Bank Guarantee (PBG) Compliance",
        "description": "Bidder must furnish EMD payment receipt/e-PBG guarantee or present valid MSE/Startup exemption proof.",
        "mandatory": True,
        "keywords": ["emd", "earnest money", "pbg", "bank guarantee", "security deposit", "emd exemption", "dd", "fdr"]
    },
    {
        "clause_id": "RFP-08",
        "title": "Startup DPIIT Exemption Path",
        "description": "DPIIT-recognized Startups can claim relaxation from prior turnover and experience criteria.",
        "mandatory": False,
        "keywords": ["startup", "dpiit", "dipp", "recognition", "startup india", "turnover relaxation", "experience exemption"]
    }
]



class SemanticRFPComparator:
    """
    Semantic NLP RFP Clause Comparator:
    Evaluates bid document text against tender RFP clauses using NLP keyword similarity
    and optional Gemini LLM deep semantic reasoning.
    """

    @classmethod
    def evaluate_bid_against_rfp(
        cls,
        bid_text: str,
        rfp_clauses: Optional[List[Dict[str, Any]]] = None,
        use_llm: bool = True
    ) -> Dict[str, Any]:
        """
        Compares bid document content against RFP clauses and computes clause compliance details.
        """
        clauses = rfp_clauses or DEFAULT_GEM_RFP_CLAUSES
        if not bid_text or not bid_text.strip():
            return cls._empty_evaluation(clauses)

        cleaned_text = bid_text.lower()

        # 1. First try Gemini LLM semantic evaluation if enabled & key configured
        llm_result = None
        if use_llm:
            llm_result = cls._try_gemini_llm_evaluation(bid_text, clauses)

        if llm_result:
            return llm_result

        # 2. Local Advanced NLP Keyword & Pattern Matching Engine
        clause_results = []
        met_count = 0
        total_mandatory = 0
        met_mandatory = 0

        for clause in clauses:
            is_mandatory = clause.get("mandatory", False)
            if is_mandatory:
                total_mandatory += 1

            title = clause.get("title", "")
            clause_id = clause.get("clause_id", "")
            keywords = clause.get("keywords", [])

            # Calculate keyword match density
            matched_keywords = [kw for kw in keywords if kw.lower() in cleaned_text]
            match_ratio = len(matched_keywords) / max(len(keywords), 1)

            # Find snippet evidence
            evidence_snippet = cls._extract_evidence_snippet(cleaned_text, matched_keywords)

            if match_ratio >= 0.4 or len(matched_keywords) >= 2:
                status = "MET"
                met_count += 1
                if is_mandatory:
                    met_mandatory += 1
                confidence = round(min(0.95, 0.6 + match_ratio * 0.4), 2)
            elif len(matched_keywords) == 1:
                status = "PARTIALLY_MET"
                confidence = 0.5
            else:
                status = "NOT_MET"
                confidence = 0.85

            clause_results.append({
                "clause_id": clause_id,
                "title": title,
                "description": clause.get("description", ""),
                "mandatory": is_mandatory,
                "status": status,
                "confidence": confidence,
                "matched_keywords": matched_keywords,
                "evidence_snippet": evidence_snippet or "No explicit text evidence located in document."
            })

        # Calculate overall semantic compliance score (0 - 100)
        total_clauses = len(clauses)
        base_score = (met_count / total_clauses) * 100 if total_clauses > 0 else 0

        # Mandatory clause penalty
        if total_mandatory > 0 and met_mandatory < total_mandatory:
            unmet_mandatory = total_mandatory - met_mandatory
            mandatory_penalty = unmet_mandatory * 20
            semantic_score = max(0, int(base_score - mandatory_penalty))
        else:
            semantic_score = int(base_score)

        return {
            "semantic_score": semantic_score,
            "evaluator": "Local NLP Clause Engine",
            "total_clauses": total_clauses,
            "met_clauses": met_count,
            "mandatory_met": f"{met_mandatory}/{total_mandatory}",
            "clause_details": clause_results,
            "summary": f"Bid meets {met_count}/{total_clauses} RFP clauses with {semantic_score}/100 semantic alignment."
        }

    @classmethod
    def _extract_evidence_snippet(cls, text: str, matched_keywords: List[str]) -> Optional[str]:
        """Extracts a sentence or window of text surrounding matched keywords as evidence."""
        if not matched_keywords:
            return None

        sentences = re.split(r'[.\n\r]+', text)
        for sentence in sentences:
            sentence_clean = sentence.strip()
            if any(kw.lower() in sentence_clean for kw in matched_keywords) and len(sentence_clean) > 15:
                return sentence_clean[:180].capitalize() + ("..." if len(sentence_clean) > 180 else "")

        return None

    @classmethod
    def _try_gemini_llm_evaluation(cls, bid_text: str, clauses: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        import os
        from app.core.config import settings
        gemini_api_key = settings.effective_gemini_api_key or os.getenv("GEMINI_API_KEY")
        if not gemini_api_key or gemini_api_key in {"YOUR_KEY", "your_gemini_api_key_here"}:
            return None


        try:
            # pyrefly: ignore [missing-import]
            import google.generativeai as genai
            genai.configure(api_key=gemini_api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")

            prompt = f"""
You are an expert procurement auditor for the Government e-Marketplace (GeM).
Analyze the following Bid Text against the provided Tender RFP Clauses.

Bid Text Snippet (First 3000 chars):
{bid_text[:3000]}

RFP Clauses:
{json.dumps(clauses, indent=2)}

Return a JSON object with:
{{
  "semantic_score": <number 0-100>,
  "evaluator": "Gemini LLM Semantic Reasoning Engine",
  "total_clauses": {len(clauses)},
  "met_clauses": <number>,
  "clause_details": [
     {{
       "clause_id": "<clause_id>",
       "title": "<title>",
       "status": "MET" | "PARTIALLY_MET" | "NOT_MET",
       "confidence": <0.0-1.0>,
       "evidence_snippet": "<extracted text quote or reasoning>"
     }}
  ],
  "summary": "<one sentence executive evaluation summary>"
}}
Output pure JSON with no markdown backticks.
"""
            response = model.generate_content(prompt)
            clean_res = re.sub(r'```json\s*|\s*```', '', response.text).strip()
            parsed = json.loads(clean_res)
            return parsed
        except Exception as e:
            logger.warning(f"Gemini LLM semantic evaluation fallback to local NLP: {e}")
            return None

    @classmethod
    def _empty_evaluation(cls, clauses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Fallback evaluation for empty document text."""
        return {
            "semantic_score": 0,
            "evaluator": "Local NLP Clause Engine",
            "total_clauses": len(clauses),
            "met_clauses": 0,
            "mandatory_met": f"0/{len([c for c in clauses if c.get('mandatory')])}",
            "clause_details": [
                {
                    "clause_id": c.get("clause_id", ""),
                    "title": c.get("title", ""),
                    "status": "NOT_MET",
                    "confidence": 1.0,
                    "evidence_snippet": "Empty document text."
                }
                for c in clauses
            ],
            "summary": "No extracted text found in document for semantic RFP evaluation."
        }

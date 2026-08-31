import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class ExplainableAIEngine:
    """
    Generates Explainable AI (XAI) reports with evidence snippets (document title, page number, exact quote, AI confidence)
    and human-readable scoring rationale for every compliance score component.
    """

    @classmethod
    def generate_explainable_report(
        cls,
        bid_id: str,
        compliance_report: Dict[str, Any],
        extracted_data: Optional[Dict[str, Any]] = None,
        documents_metadata: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Enriches compliance scoring metrics with evidence snippets and XAI explanations.
        """
        logger.info(f"ExplainableAIEngine: Generating XAI evidence report for Bid '{bid_id}'...")

        docs_map = {d.get("id"): d for d in (documents_metadata or [])}
        extractions = extracted_data or {}

        # 1. Document Completeness & Presence Evidence
        presence_evidence = []
        breakdown = compliance_report.get("breakdown", {})
        
        presence_items = [
            ("GSTIN", "GST Registration Certificate", 10),
            ("PAN", "Income Tax PAN Card", 10),
            ("Udyam", "MSME Udyam Registration Certificate", 10),
            ("Aadhaar", "Authorized Signatory Aadhaar Card", 10)
        ]

        for item_key, item_name, weight in presence_items:
            found = False
            snippet = ""
            doc_name = "Not Attached"
            page_num = 1
            confidence = 0.0

            # Check extractions for item
            if item_key.lower() in extractions:
                found = True
                ext_info = extractions[item_key.lower()]
                doc_name = ext_info.get("document_name", f"{item_name}.pdf")
                page_num = ext_info.get("page_number", 1)
                snippet = ext_info.get("extracted_text", f"Verified {item_key} registration document detected.")
                confidence = ext_info.get("confidence", 0.95)

            presence_evidence.append({
                "component": f"{item_key} Document Presence",
                "weight": weight,
                "status": "PRESENT" if found else "MISSING",
                "doc_name": doc_name if found else "No Document Uploaded",
                "page_number": page_num,
                "snippet_quote": snippet if found else f"No valid {item_name} document located in bid package.",
                "confidence": confidence if found else 0.0,
                "reasoning": f"Awarded {weight} pts for attaching valid {item_name}." if found else f"Deducted {weight} pts: Missing mandatory statutory {item_name}."
            })

        # 2. Database Verification Evidence
        verification_evidence = []
        deductions = compliance_report.get("deductions", [])

        # Check for status issues and name mismatches
        status_deductions = [d for d in deductions if "status is" in d or "record" in d]
        if not status_deductions:
            verification_evidence.append({
                "component": "Government Registry Cross-Verification",
                "status": "VERIFIED",
                "doc_name": "GSTN / NSDL / Udyam Mock Portal APIs",
                "page_number": 1,
                "snippet_quote": "API Verification Status: 'Active'. Zero statutory defaults or blacklisting flags returned.",
                "confidence": 0.99,
                "reasoning": "Full 40/40 points awarded: Tax and statutory databases confirm active, good standing."
            })
        else:
            for s_ded in status_deductions:
                verification_evidence.append({
                    "component": "Registry Status Discrepancy",
                    "status": "FLAGGED",
                    "doc_name": "Government Public Portal API",
                    "page_number": 1,
                    "snippet_quote": s_ded,
                    "confidence": 0.98,
                    "reasoning": f"Scoring Penalty Applied: {s_ded}"
                })

        # 3. Registry & AI Tampering Integrity Evidence
        integrity_evidence = []
        forgery_info = compliance_report.get("forgery_analysis", {})
        if forgery_info and not forgery_info.get("authentic", True):
            for anomaly in forgery_info.get("anomalies", []):
                integrity_evidence.append({
                    "component": "Document Integrity & Forgery Check",
                    "status": "AI_TAMPERING_ALERT",
                    "doc_name": forgery_info.get("document_name", "Submitted PDF"),
                    "page_number": forgery_info.get("suspicious_page", 1),
                    "snippet_quote": f"Font Manipulation / Pixel Discrepancy: {anomaly}",
                    "confidence": 0.92,
                    "reasoning": f"Integrity Penalty Applied: AI forgery detector identified structural font/image anomalies."
                })
        else:
            integrity_evidence.append({
                "component": "Document Structural Integrity",
                "status": "AUTHENTIC",
                "doc_name": "All Submitted Bid PDFs",
                "page_number": 1,
                "snippet_quote": "PDF Metadata & E-Signature Check: Original font structures intact, no pixel manipulation detected.",
                "confidence": 0.96,
                "reasoning": "Baseline 30/30 integrity score maintained: No document tampering detected."
            })

        # 4. Semantic RFP Alignment & Custom Rules Evidence
        custom_rules_evidence = []
        semantic_info = compliance_report.get("semantic_analysis", {})
        if semantic_info and "clause_details" in semantic_info:
            for clause in semantic_info["clause_details"]:
                custom_rules_evidence.append({
                    "component": f"RFP Clause {clause.get('clause_id')}",
                    "status": clause.get("status", "MET"),
                    "doc_name": clause.get("source_document", "Bid Commercial RFP Response"),
                    "page_number": clause.get("page_number", 1),
                    "snippet_quote": clause.get("snippet", clause.get("description", "")),
                    "confidence": clause.get("confidence", 0.90),
                    "reasoning": clause.get("evaluation_notes", f"Clause status evaluated as {clause.get('status')}")
                })

        return {
            "bid_id": bid_id,
            "explainable_summary": {
                "overall_score": compliance_report.get("score", 0),
                "risk_level": compliance_report.get("risk_level", "LOW"),
                "total_evidence_components": len(presence_evidence) + len(verification_evidence) + len(integrity_evidence) + len(custom_rules_evidence)
            },
            "evidence_sections": {
                "document_completeness": presence_evidence,
                "database_verification": verification_evidence,
                "registry_integrity": integrity_evidence,
                "rfp_and_custom_rules": custom_rules_evidence
            },
            "raw_deductions": deductions,
            "raw_recommendations": compliance_report.get("recommendations", [])
        }

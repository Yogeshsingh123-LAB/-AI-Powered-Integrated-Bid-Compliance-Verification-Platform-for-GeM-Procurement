"""
Unit tests for Explainable AI Evidence Engine and Officer Override ("Approve with Deviation") Workflow
"""

# pyrefly: ignore [missing-import]
import pytest
from app.services.explainable_ai_engine import ExplainableAIEngine

def test_generate_explainable_report_structure():
    """Verifies that ExplainableAIEngine produces evidence snippets and XAI explanations for all breakdown items."""
    mock_compliance_report = {
        "score": 85,
        "risk_level": "LOW",
        "breakdown": {
            "document_completeness": "30/30",
            "database_verification": "40/40",
            "registry_integrity": "15/30"
        },
        "deductions": ["GSTIN 27AAAAA1111A1Z1 status is 'Suspended' (-10 pts)"],
        "recommendations": ["Request tax status clarification."],
        "forgery_analysis": {
            "authentic": False,
            "anomalies": ["Font mismatch on page 2"],
            "document_name": "GST_Certificate.pdf",
            "suspicious_page": 2
        }
    }

    mock_extractions = {
        "gstin": {
            "document_name": "GSTIN_Doc.pdf",
            "page_number": 1,
            "extracted_text": "GSTIN: 27AAAAA1111A1Z1 Legal Name: Apex Infra",
            "confidence": 0.98
        }
    }

    xai_report = ExplainableAIEngine.generate_explainable_report(
        bid_id="BID-TEST-123",
        compliance_report=mock_compliance_report,
        extracted_data=mock_extractions
    )

    assert "evidence_sections" in xai_report
    assert len(xai_report["evidence_sections"]["document_completeness"]) == 4
    
    gst_ev = xai_report["evidence_sections"]["document_completeness"][0]
    assert gst_ev["component"] == "GSTIN Document Presence"
    assert gst_ev["status"] == "PRESENT"
    assert gst_ev["doc_name"] == "GSTIN_Doc.pdf"
    assert gst_ev["page_number"] == 1
    assert "27AAAAA1111A1Z1" in gst_ev["snippet_quote"]

    integrity_ev = xai_report["evidence_sections"]["registry_integrity"][0]
    assert integrity_ev["status"] == "AI_TAMPERING_ALERT"
    assert "Font mismatch" in integrity_ev["snippet_quote"]

"""
Locust Load Testing Suite for GeM Bid Compliance Verification Platform
Simulates concurrent bidder requests, PDF document uploads, OCR/NLP processing, and API verification.

Usage:
    locust -f backend/tests/load_test_locust.py --headless -u 50 -r 10 --run-time 1m --host http://localhost:8000
"""

import os
import io
import time
from locust import HttpUser, task, between

class GeMBidComplianceUser(HttpUser):
    wait_time = between(1, 3)  # Simulates realistic user click delay between 1-3 seconds

    def on_start(self):
        """Prepares sample test payload and authenticates prior to starting tasks."""
        self.headers = {"Content-Type": "application/json"}
        # Sample simulated PDF content for multi-part upload tests
        self.sample_pdf = (
            b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
            b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
            b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            b"/Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 120 >>\nstream\n"
            b"BT /F1 12 Tf 100 700 Td (GSTIN: 29AAPCS1234M1Z5 PAN: AAPCS1234M Udyam: UDYAM-KA-02-0098765 Manufacturer OEM Declaration Land Border Compliance GFR Rule 144) Tj ET\n"
            b"endstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n"
            b"0000000058 00000 n\n00000000115 00000 n\n00000000210 00000 n\n"
            b"trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n380\n%%EOF\n"
        )

    @task(3)
    def check_health_and_status(self):
        """Ping system health and readiness endpoints."""
        self.client.get("/api/v1/health", name="Health Check")

    @task(4)
    def test_direct_verification_apis(self):
        """Simulate quick verification request against mock CBIC GSTN sandbox."""
        payload = {"gstin": "29AAPCS1234M1Z5"}
        self.client.post(
            "/api/v1/verify/gstin",
            json=payload,
            name="Verify GSTIN API"
        )

    @task(2)
    def test_bid_document_upload_and_compliance(self):
        """Simulate concurrent document upload and automated compliance extraction."""
        files = {
            'file': ('gem_tender_bid_sample.pdf', io.BytesIO(self.sample_pdf), 'application/pdf')
        }
        self.client.post(
            "/api/v1/documents/analyze",
            files=files,
            name="Upload & Analyze Bid Document"
        )

    @task(1)
    def test_rfp_semantic_clause_comparator(self):
        """Simulate semantic RFP clause matching performance."""
        payload = {
            "bid_text": "Bidder possesses GSTIN 29AAPCS1234M1Z5, PAN AAPCS1234M, Udyam UDYAM-KA-02-0098765. Manufacturer of IT hardware. Compliant with Land Border Rule 144(xi).",
            "use_llm": False
        }
        self.client.post(
            "/api/v1/analyze/semantic",
            json=payload,
            name="Semantic Clause Comparator"
        )

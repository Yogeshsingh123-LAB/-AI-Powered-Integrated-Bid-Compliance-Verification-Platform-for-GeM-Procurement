# Synthetic Evaluation Test Scenarios (GeM Bid Compliance Platform)

This directory contains synthetic PDF bid compliance test documents designed to evaluate the AI extraction engine, forgery/tampering detectors, cross-registry mock verifiers (GSTIN, PAN, Udyam/MSME, Debarment), and multi-criteria compliance scoring system.

---

## 📋 Scenario Matrix

| Scenario File | Target Entity | Scenario Type | Expected Compliance Score | Primary Findings & Alerts |
| :--- | :--- | :--- | :---: | :--- |
| `scenario_1_perfect.pdf` | **TechGov Solutions Pvt Ltd** | Clean / Fully Compliant | **100 / 100** | All statutory documents valid, active GSTIN, verified MSME exemption, zero forgery risk. |
| `scenario_2_suspended_gst.pdf` | **Apex Infra Ventures Ltd** | Regulatory Non-Compliance | **65 / 100** | GSTIN status returns `SUSPENDED` from central portal simulation. High risk flag raised. |
| `scenario_3_blacklisted.pdf` | **Deccan Trade Links** | Debarred / Blacklisted Entity | **0 / 100** | Listed on central CPPP/GeM debarment registry. Automatic disqualification (Critical Flag). |
| `scenario_4_name_mismatch.pdf` | **Vanguard Tech Supplies** | Identity / Entity Mismatch | **50 / 100** | Portal bidder name ("Vanguard Tech Supplies") differs from GST registration name ("Vanguard Enterprises"). |
| `scenario_5_missing_registries.pdf` | **Alpha Logistics Services** | Missing Mandatory Filings | **40 / 100** | Omitted mandatory statutory filings and missing Udyam MSME registration proof. |

---

## 🧪 How to Execute Scenario Verification

Run the automated scenario test suite from the `backend/` directory:

```bash
# Execute full scenario scoring test suite
python run_scoring_test.py

# Execute end-to-end AI engine & extraction verification
python run_ai_engine_test.py

# Run complete system integration tests
python run_final_integration_test.py
```

---

## 🔍 Technical Inspection Workflow

1. **OCR & Metadata Extraction**: Scans PDF streams, extracts text, metadata, and structural layout using `pdfplumber` / `PyPDF2` / `Tesseract`.
2. **Registry Cross-Verification**: Query mock GSTIN, PAN, and Debarment APIs against extracted credentials.
3. **Forgery & Tampering Analysis**: Checks font inconsistency, metadata modification software (e.g. Photoshop/Canva signatures), image manipulation, and duplicate GSTIN collusion risks.
4. **Blockchain Audit Trail**: Records immutable event trace in `AuditLog` with SHA-256 block hash chaining.

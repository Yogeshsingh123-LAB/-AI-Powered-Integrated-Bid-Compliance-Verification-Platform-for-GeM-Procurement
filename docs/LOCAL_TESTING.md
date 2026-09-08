# Run and test locally

Open two PowerShell terminals. Keep both running while testing.

## Terminal 1: backend

```powershell
cd 'C:\sih_ps100\-AI-Powered-Integrated-Bid-Compliance-Verification-Platform-for-GeM-Procurement\backend'
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Wait for `Application startup complete`. Open http://127.0.0.1:8000/health
to check the backend. API documentation is at http://127.0.0.1:8000/docs.
The backend uses your configured Supabase database and storage, so test accounts,
tenders and uploads persist there. Use clearly labelled demo records.

## Terminal 2: frontend

```powershell
cd 'C:\sih_ps100\-AI-Powered-Integrated-Bid-Compliance-Verification-Platform-for-GeM-Procurement\frontend'
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open http://127.0.0.1:5173. Dependencies are already installed. If using a new
checkout and Vite is missing, run `npm ci --include=dev` in the frontend first.
Leave `VITE_API_URL` empty for local testing so Vite proxies API requests to
port 8000. If a port is occupied, use the existing app or stop its terminal
with Ctrl+C before starting another copy.

## Upload workflow

Extract `output/pdf/local-test-documents.zip`, or use the PDFs already in
`output/pdf/local-test-documents/`.

1. Log into Administrative Console with your existing administrator account.
2. Create an Active tender named `LOCAL DEMO - Office Supplies`, with a unique
   ID such as `GEM/LOCAL/001`, budget 50000 and a future closing date. Select
   only PAN, GST and UDYAM requirements before publishing.
3. In a separate browser session, register and log into Bidder Portal. Use
   `BidVerify Demo Supplies Private Limited` as the company name.
4. Open that tender, apply and upload each document to its matching slot:

| Upload slot | File | Expected extracted identifier |
| --- | --- | --- |
| PAN | `01_pan_demo.pdf` | `ABCDE1234F` |
| GST | `02_gst_demo.pdf` | `27ABCDE1234F1Z0` |
| UDYAM | `03_udyam_demo.pdf` | `UDYAM-MH-12-0099999` |

5. Inspect extraction results, open/download the documents and refresh the page
   to check persistence. Complete any required bid submission step shown by the UI.
6. Review the bid as administrator/officer. Use your actual account password to
   save a decision. Confirm the saved decision and audit record after refresh.
7. Use a separate test bid or tender for negative cases. Substitute
   `04_pan_name_mismatch.pdf` for the normal PAN file to introduce a different
   company name. Use `05_missing_identifiers.pdf` to inspect missing-field handling.

These synthetic identifiers and documents are not official credentials. They
test extraction and review behavior, not live government validity. Exact scores
and automatic mismatch findings depend on configured rules, registry fixtures
and AI services. Digital PDFs do not exercise scanned-image OCR.

## Administrator login problems

Use your existing credentials. There is no universal demo-password bypass.
If you need to reset an existing administrator password, from the backend folder:

```powershell
.\venv\Scripts\python.exe manage_admin.py --email YOUR_EXISTING_ADMIN_EMAIL
```

Replace the email with the existing administrator's email. Enter the new password
at the hidden prompts; this changes that account in the configured database.

## Stop the app

Press Ctrl+C in each running terminal. Your Supabase records remain saved.

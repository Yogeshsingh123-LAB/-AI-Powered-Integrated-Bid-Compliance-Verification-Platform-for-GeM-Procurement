"""Generate clearly fictional PDFs for the local bidder upload workflow."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "local-test-documents"
COMPANY = "BidVerify Demo Supplies Private Limited"
SAMPLES = [
    ("01_pan_demo.pdf", "PAN extraction sample", [
        ("Document type", "PAN / Permanent Account Number"),
        ("Name", COMPANY), ("PAN Number", "ABCDE1234F"),
        ("Date of incorporation", "01/04/2020"),
    ], "Upload in the PAN slot. Check that the extracted PAN is ABCDE1234F."),
    ("02_gst_demo.pdf", "GST extraction sample", [
        ("Document type", "GST Registration"), ("Legal Name", COMPANY),
        ("GSTIN", "27ABCDE1234F1Z0"), ("State", "Maharashtra"),
        ("Registration Date", "01/04/2020"),
    ], "Upload in the GST slot. The GSTIN embeds the same PAN as the PAN sample. "
       "This identifier is test input, not evidence of registration or checksum validity."),
    ("03_udyam_demo.pdf", "Udyam extraction sample", [
        ("Document type", "Udyam / MSME Registration"),
        ("Enterprise Name", COMPANY),
        ("Udyam Registration Number", "UDYAM-MH-12-0099999"),
        ("Enterprise Type", "Micro"), ("Major Activity", "Services"),
    ], "Upload in the UDYAM slot. Check extraction of the full hyphenated identifier."),
    ("04_pan_name_mismatch.pdf", "Name mismatch sample", [
        ("Document type", "PAN / Permanent Account Number"),
        ("Name", "Different Demo Trading Private Limited"),
        ("PAN Number", "ABCDE1234F"),
        ("Date of incorporation", "01/04/2020"),
    ], "Use instead of the normal PAN sample in a separate test bid. "
       "The company name deliberately conflicts with the GST and Udyam samples. "
       "Inspect the extracted name and any review findings; an automatic alert depends on the configured analysis."),
    ("05_missing_identifiers.pdf", "Missing identifiers sample", [
        ("Document type", "General supplier statement"),
        ("Company Name", COMPANY),
        ("Statement", "We supply office equipment for demonstration procurement."),
        ("Evidence", "Registration identifiers intentionally omitted."),
    ], "Use in a separate test bid to examine missing-field handling. "
       "No PAN, GSTIN or Udyam identifier should be extracted. "
       "This is a valid PDF with incomplete evidence, not a corrupted file."),
]


def footer(canvas, doc):
    canvas.setStrokeColor(colors.HexColor("#CBD5E1"))
    canvas.line(48, 62, A4[0] - 48, 62)
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(colors.HexColor("#475569"))
    canvas.drawString(48, 45, "BidVerify local test pack | Synthetic data only")
    canvas.drawRightString(A4[0] - 48, 45, f"Page {doc.page}")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle("DemoTitle", fontName="Helvetica-Bold", fontSize=23,
                              leading=28, textColor=colors.HexColor("#0F172A"), spaceAfter=18))
    styles.add(ParagraphStyle("Notice", fontName="Helvetica-Bold", fontSize=11,
                              leading=16, textColor=colors.HexColor("#9A3412"), spaceAfter=16))
    styles["BodyText"].leading = 16
    for filename, title, fields, expected in SAMPLES:
        story = [Paragraph("DEMO / NOT VALID FOR OFFICIAL USE", styles["Notice"]),
                 Paragraph(title, styles["DemoTitle"]),
                 Paragraph("Fictional sample for software testing. This is not a government-issued "
                           "certificate and makes no claim about a real business or registry record.", styles["BodyText"]),
                 Spacer(1, 24)]
        rows = [[Paragraph(label, styles["BodyText"]), Paragraph(value, styles["BodyText"])]
                for label, value in fields]
        table = Table(rows, colWidths=[145, A4[0] - 96 - 145])
        table.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#F1F5F9")),
            ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#CBD5E1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#E2E8F0")),
            ("LEFTPADDING", (0, 0), (-1, -1), 12),
            ("RIGHTPADDING", (0, 0), (-1, -1), 12),
            ("TOPPADDING", (0, 0), (-1, -1), 11),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 11),
        ]))
        story += [table, Spacer(1, 24), Paragraph("What to check", styles["Heading2"]),
                  Paragraph(expected, styles["BodyText"])]
        SimpleDocTemplate(str(OUT / filename), pagesize=A4, rightMargin=48,
                          leftMargin=48, topMargin=48, bottomMargin=80,
                          title=title, author="BidVerify synthetic test data").build(
                              story, onFirstPage=footer, onLaterPages=footer)
    readme = """# Local upload test

All five PDFs are fictional, text-based test inputs. No real registry validation
or exact compliance score is promised. Registry responses may be simulated;
external AI configuration can change analysis results. These files test digital
PDF extraction; scanned image OCR needs a separate test with Tesseract installed.

1. Start backend and frontend using docs/LOCAL_TESTING.md in the repository.
2. Log into Administrative Console with your existing administrator account.
3. Create an Active test tender (e.g. GEM/LOCAL/001) with a future closing date.
   Select only PAN, GST and UDYAM document requirements before publishing it.
4. Register a separate Bidder Portal account. Use the company name
   'BidVerify Demo Supplies Private Limited' when filling its business profile.
   If required, use PAN ABCDE1234F and GSTIN 27ABCDE1234F1Z0 as synthetic inputs.
5. Open the tender and apply. Upload 01 in PAN, 02 in GST, 03 in UDYAM.
6. Check extracted identifiers and view/download the uploaded PDFs.
7. Review the bid from the administrator/officer side. Save a decision using
   your actual account password and verify it remains saved after refresh.
8. For a separate negative test, use 04 instead of 01 to introduce a name
   mismatch, or upload 05 to inspect missing identifiers. Do not expect an
   exact score or automatic alert solely because of these filenames.

If you cannot log in as admin, use backend/manage_admin.py --email with the
email of an existing administrator. The command prompts for a new password.
The old hardcoded demo passwords no longer bypass authentication.
"""
    (OUT / "README.md").write_text(readme, encoding="utf-8")
    with ZipFile(OUT.parent / "local-test-documents.zip", "w", ZIP_DEFLATED) as archive:
        for filename in [item[0] for item in SAMPLES] + ["README.md"]:
            archive.write(OUT / filename, arcname=filename)
    print(f"Created {len(SAMPLES)} PDFs and ZIP in {OUT.parent}")


if __name__ == "__main__":
    main()

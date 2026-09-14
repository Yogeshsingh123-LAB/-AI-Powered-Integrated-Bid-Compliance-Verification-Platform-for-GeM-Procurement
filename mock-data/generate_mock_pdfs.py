import os
import json
from PIL import Image, ImageDraw

# Define dataset metadata
DATASETS = {
    "bidder_01": {
        "company": "Acme Tech Solutions Pvt Ltd",
        "trade_name": "Acme Tech",
        "pan": "AAPCS1234M",
        "gstin": "27AAPCS1234M1Z5",
        "udyam": "UDYAM-MH-12-0012345",
        "address": "Plot 42, MIDC Industrial Area, Andheri East, Mumbai, Maharashtra 400093",
        "case": "Fully Compliant - Low Risk"
    },
    "bidder_02": {
        "company": "Zenith Energy Services Pvt Ltd",
        "trade_name": "Zenith Energy",
        "pan": "BZXPV9876K",
        "gstin": "07BZXPV9876K1Z9",
        "udyam": "UDYAM-DL-07-0098765",
        "address": "Suite 102, Connaught Place, New Delhi 110001",
        "case": "Mismatch Case - EPFO Legal Name Variation"
    },
    "bidder_03": {
        "company": "Apex Infra Logistics Pvt Ltd",
        "trade_name": "Apex Logistics",
        "pan": "CKLPA4321R",
        "gstin": "33CKLPA4321R1Z2",
        "udyam": "UDYAM-TN-33-0043210",
        "address": "GST Road, Guindy, Chennai, Tamil Nadu 600032",
        "case": "Missing OEM Authorization Form"
    }
}

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def generate_pdf_bytes(title, details):
    """Generate minimal valid PDF bytes with text content."""
    lines = [f"{title}", "=========================================="]
    for k, v in details.items():
        lines.append(f"{k.upper()}: {v}")
    
    text_content = "\n".join(lines)
    
    pdf_template = f"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length {len(text_content) + 100} >>
stream
BT
/F1 12 Tf
50 720 Td
14 TL
"""
    for line in lines:
        safe_line = line.replace("(", "\\(").replace(")", "\\)")
        pdf_template += f"({safe_line}) '\n"
    
    pdf_template += """ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000500 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
580
%%EOF"""
    return pdf_template.encode('latin1')

def generate_png_image(title, details, output_path):
    """Generate high-resolution PNG image for document verification test."""
    width, height = 800, 1000
    img = Image.new('RGB', (width, height), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Header bar
    draw.rectangle([0, 0, width, 80], fill=(15, 23, 42))
    draw.text((30, 25), "GOVERNMENT OF INDIA - STATUTORY COMPLIANCE DOCUMENT", fill=(255, 255, 255))
    
    draw.text((30, 110), f"DOCUMENT TYPE: {title.upper()}", fill=(2, 132, 199))
    draw.line([30, 140, 770, 140], fill=(203, 213, 225), width=2)
    
    y = 170
    for k, v in details.items():
        draw.text((30, y), f"{k.upper()}: {v}", fill=(15, 23, 42))
        y += 40
        
    draw.text((30, 930), "BID ZEE OFFICIAL DEMO DATASET - VERIFIED CERTIFICATE", fill=(16, 185, 129))
    img.save(output_path, format="PNG")

def build_datasets():
    for bidder_key, data in DATASETS.items():
        dataset_dir = os.path.join(BASE_DIR, "dataset", bidder_key)
        docs_dir = os.path.join(BASE_DIR, "documents", bidder_key)
        os.makedirs(dataset_dir, exist_ok=True)
        os.makedirs(docs_dir, exist_ok=True)
        
        # Profile JSON
        profile_path = os.path.join(dataset_dir, "profile.json")
        with open(profile_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
            
        doc_types = [
            ("PAN_Certificate", {"PAN Number": data["pan"], "Legal Entity Name": data["company"], "Status": "Active"}),
            ("GSTIN_Registration", {"GSTIN": data["gstin"], "Legal Name": data["company"], "Trade Name": data["trade_name"], "Status": "Active"}),
            ("Udyam_Certificate", {"Udyam Registration Number": data["udyam"], "Enterprise Name": data["company"], "Category": "Micro Enterprise"}),
            ("ITR_Acknowledgement", {"PAN": data["pan"], "Assessee Name": data["company"], "Assessment Year": "2025-26", "Status": "E-filed Verified"}),
            ("OEM_Authorization", {"Manufacturer": "Global Server Solutions Ltd", "Authorized Partner": data["company"], "Validity": "2026-2027"})
        ]
        
        for name, details in doc_types:
            pdf_bytes = generate_pdf_bytes(name.replace("_", " "), details)
            pdf_path = os.path.join(docs_dir, f"{name}.pdf")
            with open(pdf_path, "wb") as f:
                f.write(pdf_bytes)
                
            png_path = os.path.join(docs_dir, f"{name}.png")
            generate_png_image(name.replace("_", " "), details, png_path)

    readme_path = os.path.join(BASE_DIR, "README.md")
    readme_content = """# Bid Zee — Test Mock Datasets

This directory contains standalone, reproducible test datasets and matching PDF/PNG certificates for Bid Zee verification testing.

> [!IMPORTANT]
> These files are for manual testing and explicit dataset imports ONLY. They are NOT automatically seeded into the application database on normal startup.

## Datasets Available

1. **`bidder_01` — Acme Tech Solutions Pvt Ltd**
   - PAN: `AAPCS1234M`
   - GSTIN: `27AAPCS1234M1Z5`
   - Udyam: `UDYAM-MH-12-0012345`
   - Case: Fully Compliant (100% Match)

2. **`bidder_02` — Zenith Energy Services Pvt Ltd**
   - PAN: `BZXPV9876K`
   - GSTIN: `07BZXPV9876K1Z9`
   - Udyam: `UDYAM-DL-07-0098765`
   - Case: EPFO Name Variation Warning

3. **`bidder_03` — Apex Infra Logistics Pvt Ltd**
   - PAN: `CKLPA4321R`
   - GSTIN: `33CKLPA4321R1Z2`
   - Udyam: `UDYAM-TN-33-0043210`
   - Case: Missing OEM Form

## How to Import a Dataset

To import a test dataset for a specific logged-in user, run:
```bash
python scripts/import_mock_dataset.py --user-email banti@example.com --dataset bidder_01
```
"""
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(readme_content)

if __name__ == "__main__":
    build_datasets()
    print("Successfully built mock dataset PDFs, PNGs, profiles, and README.")

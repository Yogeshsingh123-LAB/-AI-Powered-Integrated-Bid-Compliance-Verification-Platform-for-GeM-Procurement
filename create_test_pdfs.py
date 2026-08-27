import os
from PIL import Image, ImageDraw, ImageFont

def generate_digital_pdf(filename: str):
    """Generates a text-based (digital) PDF using reportlab."""
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.pdfgen import canvas
        
        c = canvas.Canvas(filename, pagesize=letter)
        c.drawString(100, 750, "BID COMPLIANCE REPORT - DIGITAL TEST")
        c.drawString(100, 720, "GSTIN: 27AAPCS1234M1Z5")
        c.drawString(100, 690, "PAN Number: AAPCS1234M")
        c.drawString(100, 660, "Udyam registration number: UDYAM-MH-12-0012345")
        c.drawString(100, 630, "This is a digital text page. No OCR should be needed.")
        c.showPage()
        c.save()
        print(f"Successfully generated digital PDF: {filename}")
    except ImportError:
        print("reportlab library not installed. Cannot generate digital PDF. Please run 'pip install reportlab' first.")

def generate_scanned_pdf(filename: str):
    """Generates a scanned PDF by creating a text image and saving it as PDF."""
    try:
        # Create a white image
        img = Image.new('RGB', (800, 600), color=(255, 255, 255))
        d = ImageDraw.Draw(img)
        
        # Draw some text onto the image
        # Using default font since we want it to be cross-platform
        d.text((50, 50), "BID COMPLIANCE REPORT - SCANNED TEST", fill=(0, 0, 0))
        d.text((50, 100), "GSTIN: 22AAAAA1111A1Z1", fill=(0, 0, 0))
        d.text((50, 150), "PAN: AAAAA1111A", fill=(0, 0, 0))
        d.text((50, 200), "Udyam Reg: UDYAM-DL-01-0098765", fill=(0, 0, 0))
        d.text((50, 250), "This is a scanned page containing image text. OCR is required.", fill=(0, 0, 0))
        
        # Save as PDF
        img.save(filename, "PDF")
        print(f"Successfully generated scanned PDF: {filename}")
    except Exception as e:
        print(f"Failed to generate scanned PDF: {str(e)}")

if __name__ == "__main__":
    generate_digital_pdf("digital_test.pdf")
    generate_scanned_pdf("scanned_test.pdf")

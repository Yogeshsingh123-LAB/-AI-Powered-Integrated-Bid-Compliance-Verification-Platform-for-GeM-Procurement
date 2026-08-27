import os
import fitz  # PyMuPDF

# Define scenarios directory
SCENARIOS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scenarios")
os.makedirs(SCENARIOS_DIR, exist_ok=True)

def create_scenario_pdf(filename: str, title: str, content: str):
    """Generates a text-extractable PDF file using PyMuPDF."""
    file_path = os.path.join(SCENARIOS_DIR, filename)
    
    # Create new PDF document
    doc = fitz.open()
    page = doc.new_page()
    
    # Insert Title
    page.insert_text((50, 50), title, fontsize=16, fontname="helv", color=(0, 0, 0))
    
    # Insert content lines
    y_offset = 100
    for line in content.strip().split("\n"):
        if line.strip():
            page.insert_text((50, y_offset), line.strip(), fontsize=11, fontname="helv", color=(0.1, 0.1, 0.1))
            y_offset += 25
            
    doc.save(file_path)
    doc.close()
    print(f"Generated PDF: {file_path}")

def generate_all_scenarios():
    # Scenario 1: Perfect Compliance
    create_scenario_pdf(
        "scenario_1_perfect.pdf",
        "Compliance Certificate - Scenario 1 (Perfect Compliance)",
        """
        Entity Legal Name: Acme Tech Solutions Private Limited
        Trade Name: Acme Tech
        Registration Date: 2018-04-12
        State of Operation: Maharashtra
        
        Government Registries and Identifiers:
        GSTIN: 27AAPCS1234M1Z5
        PAN Number: AAPCS1234M
        Udyam Registration Number: UDYAM-MH-12-0012345
        
        We certify that this business is a micro enterprise operating in Services.
        """
    )
    
    # Scenario 2: Suspended GSTIN
    create_scenario_pdf(
        "scenario_2_suspended_gst.pdf",
        "Business Profile - Scenario 2 (Suspended GSTIN)",
        """
        Entity Legal Name: Suspended Enterprise Private Limited
        Trade Name: Suspended Ent
        Registration Date: 2019-05-18
        
        Government Registries and Identifiers:
        GSTIN: 27AAPCS5678N1Z0
        PAN Number: AAPCS5678N
        Udyam Registration Number: UDYAM-MH-12-0056789
        
        Note: GSTIN registration status for this taxpayer is Suspended on GSTIN portal records.
        """
    )
    
    # Scenario 3: Blacklisted Bidder
    create_scenario_pdf(
        "scenario_3_blacklisted.pdf",
        "Vendor Declaration - Scenario 3 (Blacklisted Bidder)",
        """
        Entity Legal Name: Global Traders Inc
        Government Registries and Identifiers:
        GSTIN: 22AAAAA1111A1Z1
        PAN Number: AAAAA1111A
        
        WARNING: This enterprise is currently blacklisted by GeM SPV Administration.
        Order Number: GeM/BL/2025/ORD-9021. Debarment valid until 2028-01-10.
        """
    )
    
    # Scenario 4: Name Mismatch
    create_scenario_pdf(
        "scenario_4_name_mismatch.pdf",
        "Bid Document - Scenario 4 (Registry Name Mismatch)",
        """
        Company Profile Details:
        We are presenting documents representing different entities:
        
        GSTIN Registry: 27AAPCS1234M1Z5 (Registered under Acme Tech Solutions Private Limited)
        Udyam Registry: UDYAM-DL-01-0098765 (Registered under Different Name LLC or Global Traders Inc)
        PAN Number: AAPCS1234M
        
        This will trigger a name alignment validation mismatch.
        """
    )
    
    # Scenario 5: Missing Registries
    create_scenario_pdf(
        "scenario_5_missing_registries.pdf",
        "Generic Bid Outline - Scenario 5 (Missing Registries)",
        """
        This is a bid submission proposal document.
        Bidder Name: Unknown Bidding Entity Ltd.
        
        No official GSTIN registration certificate, PAN Card registry, 
        or Udyam registration ID numbers have been declared in this document text.
        Contact representative: John Doe.
        """
    )

if __name__ == "__main__":
    generate_all_scenarios()

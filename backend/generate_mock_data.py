import os
import json
import random
from faker import Faker

fake = Faker("en_IN")

# Create target directory for data if it doesn't exist
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app", "mock_apis", "data")
os.makedirs(DATA_DIR, exist_ok=True)

def generate_databases(n=60):
    gst_records = {}
    pan_records = {}
    udyam_records = {}
    blacklist_records = {}
    
    # Predefined Indian states and code mapping for realistic GSTINs
    states = [
        {"code": "27", "name": "Maharashtra"},
        {"code": "07", "name": "Delhi"},
        {"code": "29", "name": "Karnataka"},
        {"code": "33", "name": "Tamil Nadu"},
        {"code": "24", "name": "Gujarat"},
        {"code": "09", "name": "Uttar Pradesh"},
        {"code": "19", "name": "West Bengal"},
        {"code": "32", "name": "Kerala"},
        {"code": "36", "name": "Telangana"},
        {"code": "03", "name": "Punjab"}
    ]
    
    # Standard compliance authorities for mock blacklists
    blacklist_authorities = [
        "Directorate General of Supplies & Disposals (DGS&D)",
        "Ministry of Defence, Government of India",
        "GeM SPV Administration",
        "Public Works Department (PWD)",
        "Indian Railways Procurement Division"
    ]
    
    # 1. Seed some standard test records for predictable unit/integration testing
    # Seed Acme Tech Solutions Private Limited (Fully Compliant)
    seed_pan_acme = "AAPCS1234M"
    seed_gst_acme = "27AAPCS1234M1Z5"
    seed_udyam_acme = "UDYAM-MH-12-0012345"
    acme_name = "Acme Tech Solutions Private Limited"
    
    gst_records[seed_gst_acme] = {
        "gstin": seed_gst_acme,
        "legal_name": acme_name,
        "trade_name": "Acme Tech",
        "status": "Active",
        "business_type": "Private Limited",
        "returns_filed": 12,
        "registration_date": "2018-04-12"
    }
    pan_records[seed_pan_acme] = {
        "pan": seed_pan_acme,
        "name": acme_name,
        "status": "Active",
        "category": "Company",
        "date_of_issue": "2018-03-15"
    }
    udyam_records[seed_udyam_acme] = {
        "udyam_number": seed_udyam_acme,
        "enterprise_name": acme_name,
        "enterprise_type": "Micro",
        "major_activity": "Services",
        "status": "Active",
        "date_of_registration": "2020-07-02",
        "state": "Maharashtra",
        "district": "Mumbai City"
    }
    blacklist_records[seed_pan_acme] = {
        "identifier": seed_pan_acme,
        "name": acme_name,
        "blacklisting_status": "Not Blacklisted",
        "authority": None,
        "order_number": None,
        "order_date": None,
        "valid_until": None
    }
    blacklist_records[seed_gst_acme] = blacklist_records[seed_pan_acme].copy()
    blacklist_records[seed_gst_acme]["identifier"] = seed_gst_acme
    
    # Seed Global Traders Inc (Suspended/Blacklisted Risk)
    seed_pan_global = "AAAAA1111A"
    seed_gst_global = "22AAAAA1111A1Z1"
    seed_udyam_global = "UDYAM-DL-01-0098765"
    global_name = "Global Traders Inc"
    
    gst_records[seed_gst_global] = {
        "gstin": seed_gst_global,
        "legal_name": global_name,
        "trade_name": "Global Traders",
        "status": "Suspended",
        "business_type": "Proprietorship",
        "returns_filed": 4,
        "registration_date": "2020-09-01"
    }
    pan_records[seed_pan_global] = {
        "pan": seed_pan_global,
        "name": global_name,
        "status": "Active",
        "category": "Individual",
        "date_of_issue": "2020-08-10"
    }
    udyam_records[seed_udyam_global] = {
        "udyam_number": seed_udyam_global,
        "enterprise_name": global_name,
        "enterprise_type": "Small",
        "major_activity": "Manufacturing",
        "status": "Active",
        "date_of_registration": "2021-02-14",
        "state": "Delhi",
        "district": "Central Delhi"
    }
    blacklist_records[seed_pan_global] = {
        "identifier": seed_pan_global,
        "name": global_name,
        "blacklisting_status": "Blacklisted",
        "authority": "GeM SPV Administration",
        "order_number": "GeM/BL/2025/ORD-9021",
        "order_date": "2025-01-10",
        "valid_until": "2028-01-10"
    }
    blacklist_records[seed_gst_global] = blacklist_records[seed_pan_global].copy()
    blacklist_records[seed_gst_global]["identifier"] = seed_gst_global

    # 2. Generate random records
    for i in range(n):
        # Determine taxpayer category and company names
        is_company = random.choice([True, True, False])
        category = "Company" if is_company else "Individual"
        legal_name = fake.company() if is_company else fake.name()
        
        # Generate PAN
        # PAN structure: 5 letters, 4 digits, 1 letter. 4th letter is C/P
        pan_prefix_letters = "".join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ", k=3))
        pan_fourth = "C" if is_company else "P"
        pan_fifth = legal_name[0].upper() if legal_name else "X"
        pan_digits = f"{random.randint(1000, 9999)}"
        pan_last = random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
        pan = f"{pan_prefix_letters}{pan_fourth}{pan_fifth}{pan_digits}{pan_last}"
        
        # Generate GSTIN (only for some records)
        has_gstin = random.choice([True, True, False])
        gstin = None
        if has_gstin:
            state = random.choice(states)
            entity_indicator = random.choice("123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ")
            checksum = random.choice("123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ")
            gstin = f"{state['code']}{pan}{entity_indicator}Z{checksum}"
            
            gst_records[gstin] = {
                "gstin": gstin,
                "legal_name": legal_name,
                "trade_name": legal_name.split()[0],
                "status": random.choices(["Active", "Suspended", "Inactive"], weights=[85, 10, 5])[0],
                "business_type": random.choice(["Private Limited", "Proprietorship", "Partnership", "LLP"]),
                "returns_filed": random.randint(0, 12),
                "registration_date": fake.date_between(start_date="-8y", end_date="-1y").isoformat()
            }
            
        # Add PAN record
        pan_records[pan] = {
            "pan": pan,
            "name": legal_name,
            "status": "Active",
            "category": category,
            "date_of_issue": fake.date_between(start_date="-10y", end_date="-2y").isoformat()
        }
        
        # Generate Udyam Registration (for a subset of businesses)
        has_udyam = random.choice([True, False])
        if has_udyam:
            state = random.choice(states)
            state_abbr = state["name"][:2].upper()
            dist_code = f"{random.randint(10, 99)}"
            serial = f"{random.randint(1000000, 9999999)}"
            udyam_number = f"UDYAM-{state_abbr}-{dist_code}-{serial}"
            
            udyam_records[udyam_number] = {
                "udyam_number": udyam_number,
                "enterprise_name": legal_name,
                "enterprise_type": random.choices(["Micro", "Small", "Medium"], weights=[70, 25, 5])[0],
                "major_activity": random.choice(["Manufacturing", "Services"]),
                "status": random.choices(["Active", "Inactive"], weights=[90, 10])[0],
                "date_of_registration": fake.date_between(start_date="-5y", end_date="-1y").isoformat(),
                "state": state["name"],
                "district": f"{state['name']} District {random.randint(1, 3)}"
            }
            
        # Blacklist Simulation
        # Simulate ~10% blacklisted rate for generated records
        is_blacklisted = random.choices([True, False], weights=[8, 92])[0]
        if is_blacklisted:
            blacklist_records[pan] = {
                "identifier": pan,
                "name": legal_name,
                "blacklisting_status": "Blacklisted",
                "authority": random.choice(blacklist_authorities),
                "order_number": f"GEM/BL/{random.randint(2023, 2026)}/ORD-{random.randint(1000, 9999)}",
                "order_date": fake.date_between(start_date="-3y", end_date="-1m").isoformat(),
                "valid_until": fake.date_between(start_date="+6m", end_date="+5y").isoformat()
            }
            # Add mapping for GSTIN as well if it exists
            if gstin:
                blacklist_records[gstin] = blacklist_records[pan].copy()
                blacklist_records[gstin]["identifier"] = gstin
        else:
            blacklist_records[pan] = {
                "identifier": pan,
                "name": legal_name,
                "blacklisting_status": "Not Blacklisted",
                "authority": None,
                "order_number": None,
                "order_date": None,
                "valid_until": None
            }
            if gstin:
                blacklist_records[gstin] = blacklist_records[pan].copy()
                blacklist_records[gstin]["identifier"] = gstin

    # Save to JSON database files
    with open(os.path.join(DATA_DIR, "gst_db.json"), "w") as f:
        json.dump(gst_records, f, indent=2)
    with open(os.path.join(DATA_DIR, "pan_db.json"), "w") as f:
        json.dump(pan_records, f, indent=2)
    with open(os.path.join(DATA_DIR, "udyam_db.json"), "w") as f:
        json.dump(udyam_records, f, indent=2)
    with open(os.path.join(DATA_DIR, "blacklist_db.json"), "w") as f:
        json.dump(blacklist_records, f, indent=2)
        
    print(f"Mock Data Generation Complete!")
    print(f"Generated {len(gst_records)} GST records")
    print(f"Generated {len(pan_records)} PAN records")
    print(f"Generated {len(udyam_records)} Udyam records")
    print(f"Generated {len(blacklist_records)} Blacklist registry records")

if __name__ == "__main__":
    generate_databases(60)

import logging
import re
from typing import Dict, List, Any, Tuple

logger = logging.getLogger(__name__)

class ScoringEngine:
    """
    A weighted compliance scoring and risk analysis engine for bid verification.
    Computes a score from 0-100, determines risk level, and generates actionable recommendations.
    """

    @staticmethod
    def calculate_compliance_score(verification_results: Dict[str, List[Dict[str, Any]]]) -> Dict[str, Any]:
        """
        Calculates compliance score and builds a structured report.
        
        Weights structure:
        1. ID Presence & Completeness (Max 30 pts):
           - GSTIN present: 10 pts
           - PAN present: 10 pts
           - Udyam present: 10 pts
           
        2. Database Verification (Max 40 pts):
           - GSTIN verified & found: 15 pts
           - PAN verified & found: 15 pts
           - Udyam verified & found: 10 pts
           
        3. Risk Checks & Alignment (Max 30 pts starting baseline, deductions apply):
           - Any ID status is not "Active": -10 pts
           - GSTIN compliance history is Poor: -10 pts
           - Name mismatch between registries: -10 pts
        """
        logger.info("Initializing compliance scoring and risk assessment...")
        
        # 1. Presence & Completeness Check (Max 30)
        presence_score = 0
        gstin_list = verification_results.get("gstin", [])
        pan_list = verification_results.get("pan", [])
        udyam_list = verification_results.get("udyam", [])
        
        has_gstin = len(gstin_list) > 0
        has_pan = len(pan_list) > 0
        has_udyam = len(udyam_list) > 0
        
        if has_gstin: presence_score += 10
        if has_pan: presence_score += 10
        if has_udyam: presence_score += 10
        
        # 2. Database Verification Check (Max 40)
        verification_score = 0
        
        # Helper to check if at least one ID of a type was verified
        gstin_verified = any(item.get("verified", False) for item in gstin_list)
        pan_verified = any(item.get("verified", False) for item in pan_list)
        udyam_verified = any(item.get("verified", False) for item in udyam_list)
        
        if gstin_verified: verification_score += 15
        if pan_verified: verification_score += 15
        if udyam_verified: verification_score += 10
        
        # 3. Risk & Integrity Checks (Max 30 baseline, apply deductions)
        integrity_score = 30
        deductions = []
        recommendations = []

        blacklisted = any(
            item.get("verified") and item.get("data", {}).get("blacklisted", False)
            for items in verification_results.values()
            for item in items
        )
        if blacklisted:
            integrity_score = 0
            deductions.append("Vendor is blacklisted (-30 pts)")
            recommendations.append("CRITICAL: The vendor is blacklisted. Reject the bid and escalate for review.")
        
        # Collect legal names to check for alignment mismatches
        legal_names: List[Tuple[str, str]] = []  # List of (registry_type, name)
        
        # Check GSTIN Registry Details
        for g in gstin_list:
            if g.get("verified"):
                data = g.get("data", {})
                # Check status
                status = data.get("status")
                if status != "Active":
                    integrity_score -= 10
                    deductions.append(f"GSTIN {data.get('gstin')} status is '{status}' (-10 pts)")
                    recommendations.append(
                        f"CRITICAL: The GSTIN '{data.get('gstin')}' is registered as '{status}'. "
                        "Do not approve the bid until active registration proof is uploaded."
                    )
                # Check compliance record
                record = data.get("compliance_record")
                if record == "Poor":
                    integrity_score -= 10
                    deductions.append(f"GSTIN {data.get('gstin')} has a Poor compliance record (-10 pts)")
                    recommendations.append(
                        f"WARNING: The bidder has a Poor compliance record on the GST portal. "
                        "Request GSTR-3B filing receipts for the last 3 consecutive months."
                    )
                # Collect name
                if data.get("legal_name"):
                    legal_names.append(("GSTIN", data.get("legal_name")))
            else:
                if has_gstin:
                    recommendations.append(
                        f"WARNING: Extracted GSTIN '{g['data']['gstin']}' could not be verified in the database. "
                        "Ensure the GSTIN was typed correctly in the bid document."
                    )

        # Check PAN Registry Details
        for p in pan_list:
            if p.get("verified"):
                data = p.get("data", {})
                status = data.get("status")
                if status != "Active":
                    integrity_score -= 10
                    deductions.append(f"PAN {data.get('pan')} status is '{status}' (-10 pts)")
                    recommendations.append(
                        f"CRITICAL: PAN '{data.get('pan')}' is listed as '{status}' (Inactive) in Tax Records."
                    )
                if data.get("name"):
                    legal_names.append(("PAN", data.get("name")))
            else:
                if has_pan:
                    recommendations.append(
                        f"WARNING: Extracted PAN '{p['data']['pan']}' is invalid or not found in registry."
                    )

        # Check Udyam Registry Details
        for u in udyam_list:
            if u.get("verified"):
                data = u.get("data", {})
                status = data.get("status")
                if status != "Active":
                    integrity_score -= 10
                    deductions.append(f"Udyam {data.get('udyam_number')} status is '{status}' (-10 pts)")
                    recommendations.append(
                        f"CRITICAL: Udyam Registration '{data.get('udyam_number')}' is '{status}'."
                    )
                if data.get("enterprise_name"):
                    legal_names.append(("Udyam", data.get("enterprise_name")))
            else:
                if has_udyam:
                    recommendations.append(
                        f"WARNING: Extracted Udyam Number '{u['data']['udyam_number']}' is unverified."
                    )

        # Check Name Alignment across registries (Simple Substring/Token match)
        if len(legal_names) > 1:
            # Let's check matching of words in names
            names_match = True
            base_ref_type, base_ref_name = legal_names[0]
            base_tokens = set(re.findall(r"\w+", base_ref_name.lower()))
            # Remove generic corporate words
            corporate_words = {"pvt", "ltd", "private", "limited", "inc", "co", "company", "associates", "traders"}
            base_tokens = base_tokens - corporate_words
            
            for other_type, other_name in legal_names[1:]:
                other_tokens = set(re.findall(r"\w+", other_name.lower())) - corporate_words
                # Check intersection (if there are no common significant words, flag a mismatch)
                intersection = base_tokens.intersection(other_tokens)
                if len(intersection) == 0:
                    names_match = False
                    integrity_score -= 10
                    mismatch_desc = f"Name mismatch between {base_ref_type} ('{base_ref_name}') and {other_type} ('{other_name}')"
                    deductions.append(f"Registry name mismatch (-10 pts)")
                    recommendations.append(
                        f"WARNING: {mismatch_desc}. Ensure these documents belong to the same entity."
                    )
                    break

        # Apply basic recommendations for missing documents
        if not has_gstin:
            recommendations.append("NOTICE: GSTIN is missing. Confirm if the bidder is exempt from GST registration.")
        if not has_pan:
            recommendations.append("CRITICAL: PAN details are missing. A PAN is mandatory for all bidding entities.")
        if not has_udyam:
            recommendations.append(
                "NOTICE: Udyam MSME Registration is missing. The bidder will not be eligible for MSME exemptions "
                "(e.g., Earnest Money Deposit / EMD waiver, purchase preferences)."
            )

        # Clamp integrity score to minimum 0
        integrity_score = max(0, integrity_score)
        
        # Calculate Final Weighted Score
        total_score = presence_score + verification_score + integrity_score
        
        # Determine Risk Level
        if blacklisted:
            risk_level = "HIGH"
        elif total_score >= 85:
            risk_level = "LOW"
        elif total_score >= 50:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"
            
        logger.info(f"Scoring completed. Final Score: {total_score}, Risk Level: {risk_level}")

        return {
            "score": total_score,
            "risk_level": risk_level,
            "breakdown": {
                "document_completeness": f"{presence_score}/30",
                "database_verification": f"{verification_score}/40",
                "registry_integrity": f"{integrity_score}/30"
            },
            "deductions": deductions,
            "recommendations": recommendations if recommendations else ["All parameters are highly compliant. No risks identified."]
        }

if __name__ == "__main__":
    print("Testing ScoringEngine:")
    # Mocking active and perfect results (Low Risk)
    perfect_verification = {
        "gstin": [{"verified": True, "found": True, "data": {"gstin": "27AAPCS1234M1Z5", "status": "Active", "compliance_record": "Excellent", "legal_name": "Acme Tech Solutions Private Limited"}}],
        "pan": [{"verified": True, "found": True, "data": {"pan": "AAPCS1234M", "status": "Active", "name": "Acme Tech Solutions Private Limited"}}],
        "udyam": [{"verified": True, "found": True, "data": {"udyam_number": "UDYAM-MH-12-0012345", "status": "Active", "enterprise_name": "Acme Tech Solutions Private Limited"}}]
    }
    
    # Mocking risky results (High Risk)
    risky_verification = {
        "gstin": [{"verified": True, "found": True, "data": {"gstin": "22AAAAA1111A1Z1", "status": "Suspended", "compliance_record": "Poor", "legal_name": "Global Traders Inc"}}],
        "pan": [{"verified": True, "found": True, "data": {"pan": "AAAAA1111A", "status": "Active", "name": "Global Traders Inc"}}],
        "udyam": [{"verified": True, "found": True, "data": {"udyam_number": "UDYAM-DL-01-0098765", "status": "Active", "enterprise_name": "Different Name LLC"}}] # Name mismatch
    }

    import json
    print("\n--- Perfect Case ---")
    print(json.dumps(ScoringEngine.calculate_compliance_score(perfect_verification), indent=2))
    
    print("\n--- Risky Case ---")
    print(json.dumps(ScoringEngine.calculate_compliance_score(risky_verification), indent=2))

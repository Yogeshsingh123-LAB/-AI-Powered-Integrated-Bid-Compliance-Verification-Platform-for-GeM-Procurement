import re
import logging
from typing import Dict, List, Any, Tuple, Optional
from .risk_classifier import RiskClassifier
from .recommendation_engine import RecommendationEngine

logger = logging.getLogger(__name__)

class ComplianceScorer:
    """
    Computes a compliance score from 0-100, determines risk level, and generates actionable recommendations.
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
           
        3. Risk Checks & Alignment (Max 30 pts baseline, deductions apply):
           - Any ID status is not "Active": -10 pts
           - GSTIN compliance history is Poor: -10 pts
           - Name mismatch between registries: -10 pts
        """
        logger.info("ComplianceScorer: Calculating compliance scoring report...")
        
        # 1. Presence & Completeness Check (Max 30)
        presence_score = 0
        gstin_list = verification_results.get("gstin", [])
        pan_list = verification_results.get("pan", [])
        udyam_list = verification_results.get("udyam", [])
        aadhaar_list = verification_results.get("aadhaar", [])
        
        has_gstin = len(gstin_list) > 0
        has_pan = len(pan_list) > 0
        has_udyam = len(udyam_list) > 0
        has_aadhaar = len(aadhaar_list) > 0
        
        if has_gstin: presence_score += 10
        if has_pan: presence_score += 10
        if has_udyam: presence_score += 10
        if has_aadhaar: presence_score += 10
        presence_score = min(30, presence_score)
        
        # 2. Database Verification Check (Max 40)
        verification_score = 0
        gstin_verified = any(item.get("verified", False) for item in gstin_list)
        pan_verified = any(item.get("verified", False) for item in pan_list)
        udyam_verified = any(item.get("verified", False) for item in udyam_list)
        aadhaar_verified = any(item.get("verified", False) for item in aadhaar_list)
        
        if gstin_verified: verification_score += 15
        if pan_verified: verification_score += 15
        if udyam_verified: verification_score += 10
        if aadhaar_verified: verification_score += 10
        verification_score = min(40, verification_score)
        
        # 3. Risk & Integrity Checks (Max 30 baseline, apply deductions)
        if not (has_gstin or has_pan or has_udyam or has_aadhaar):
            integrity_score = 0
            deductions = ["No government compliance identifiers (GSTIN, PAN, Udyam, Aadhaar) found in document (-30 pts)"]
            status_issues = []
            compliance_issues = []
            has_status_issue = True
            blacklisted = False
            legal_names = []
            name_mismatch_desc = None
            has_name_mismatch = False
        else:
            integrity_score = 30
            deductions = []
            status_issues = []
            compliance_issues = []
            has_status_issue = False
            
            # Check if blacklisted
            blacklisted = any(
                item.get("verified") and item.get("data", {}).get("blacklisted", False)
                for items in verification_results.values()
                for item in items
            )
            if blacklisted:
                integrity_score = 0
                deductions.append("Vendor is blacklisted (-30 pts)")
                
            legal_names: List[Tuple[str, str]] = []
            
            # Check GSTIN
            for g in gstin_list:
                if g.get("verified"):
                    data = g.get("data", {})
                    status = data.get("status")
                    if status != "Active":
                        integrity_score -= 10
                        has_status_issue = True
                        deductions.append(f"GSTIN {data.get('gstin')} status is '{status}' (-10 pts)")
                        status_issues.append(f"GSTIN '{data.get('gstin')}' status is '{status}'")
                    if data.get("compliance_record") == "Poor":
                        integrity_score -= 10
                        deductions.append(f"GSTIN {data.get('gstin')} has a Poor compliance record (-10 pts)")
                        compliance_issues.append(f"GSTIN '{data.get('gstin')}' has a Poor compliance record")
                    if data.get("legal_name"):
                        legal_names.append(("GSTIN", data.get("legal_name")))
                        
            # Check PAN
            for p in pan_list:
                if p.get("verified"):
                    data = p.get("data", {})
                    status = data.get("status")
                    if status != "Active":
                        integrity_score -= 10
                        has_status_issue = True
                        deductions.append(f"PAN {data.get('pan')} status is '{status}' (-10 pts)")
                        status_issues.append(f"PAN '{data.get('pan')}' is '{status}' in Tax Records")
                    if data.get("name"):
                        legal_names.append(("PAN", data.get("name")))
                        
            # Check Udyam
            for u in udyam_list:
                if u.get("verified"):
                    data = u.get("data", {})
                    status = data.get("status")
                    if status != "Active":
                        integrity_score -= 10
                        has_status_issue = True
                        deductions.append(f"Udyam {data.get('udyam_number')} status is '{status}' (-10 pts)")
                        status_issues.append(f"Udyam Registration '{data.get('udyam_number')}' is '{status}'")
                    if data.get("enterprise_name"):
                        legal_names.append(("Udyam", data.get("enterprise_name")))
                        
            # Check Aadhaar
            for a in aadhaar_list:
                if a.get("verified"):
                    data = a.get("data", {})
                    status = data.get("status")
                    if status != "Active":
                        integrity_score -= 10
                        has_status_issue = True
                        deductions.append(f"Aadhaar {data.get('aadhaar_number')} status is '{status}' (-10 pts)")
                        status_issues.append(f"Aadhaar '{data.get('aadhaar_number')}' status is '{status}'")
                    if data.get("name"):
                        legal_names.append(("Aadhaar", data.get("name")))

            # Name mismatch alignment check
            name_mismatch_desc = None
            has_name_mismatch = False
            if len(legal_names) > 1:
                base_ref_type, base_ref_name = legal_names[0]
                base_tokens = set(re.findall(r"\w+", base_ref_name.lower()))
                corporate_words = {"pvt", "ltd", "private", "limited", "inc", "co", "company", "associates", "traders"}
                base_tokens = base_tokens - corporate_words
                
                for other_type, other_name in legal_names[1:]:
                    other_tokens = set(re.findall(r"\w+", other_name.lower())) - corporate_words
                    intersection = base_tokens.intersection(other_tokens)
                    if len(intersection) == 0:
                        integrity_score -= 10
                        has_name_mismatch = True
                        deductions.append(f"Registry name mismatch (-10 pts)")
                        name_mismatch_desc = f"Name mismatch between {base_ref_type} ('{base_ref_name}') and {other_type} ('{other_name}')"
                        break
                        
            # Clamp integrity score
            integrity_score = max(0, integrity_score)
        
        # Calculate score
        total_score = presence_score + verification_score + integrity_score
        
        # Resolve risk level
        risk_level = RiskClassifier.classify_risk(
            score=total_score,
            has_status_issue=has_status_issue,
            has_name_mismatch=has_name_mismatch,
            is_blacklisted=blacklisted
        )
        
        # Generate recommendations
        recommendations = RecommendationEngine.generate_recommendations(
            has_gstin=has_gstin,
            has_pan=has_pan,
            has_udyam=has_udyam,
            has_aadhaar=has_aadhaar,
            gstin_verified=gstin_verified,
            pan_verified=pan_verified,
            udyam_verified=udyam_verified,
            aadhaar_verified=aadhaar_verified,
            is_blacklisted=blacklisted,
            status_issues=status_issues,
            compliance_issues=compliance_issues,
            name_mismatch_desc=name_mismatch_desc
        )
        
        return {
            "score": total_score,
            "risk_level": risk_level,
            "breakdown": {
                "document_completeness": f"{presence_score}/30",
                "database_verification": f"{verification_score}/40",
                "registry_integrity": f"{integrity_score}/30"
            },
            "deductions": deductions,
            "recommendations": recommendations
        }

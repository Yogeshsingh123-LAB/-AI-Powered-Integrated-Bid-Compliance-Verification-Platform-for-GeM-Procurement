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
    def evaluate_custom_rules(
        custom_rules: List[Dict[str, Any]],
        semantic_analysis: Optional[Dict[str, Any]],
        verification_results: Dict[str, List[Dict[str, Any]]]
    ) -> Tuple[int, List[str]]:
        """Evaluates tender-specific buyer custom compliance rules."""
        if not custom_rules:
            return 100, []

        passed_weight = 0
        total_weight = 0
        deductions = []

        summary_text = str(semantic_analysis or {}).lower()

        for rule in custom_rules:
            weight = rule.get("weight", 10)
            total_weight += weight
            field = rule.get("field", "").lower()
            op = rule.get("operator", ">=")
            target_val = rule.get("value", 0)
            rule_name = rule.get("name", "Custom Rule")

            rule_met = False
            has_negative = bool(re.search(r'\b(no|not|missing|unmet|absent|lacking|without|failed|non-compliant)\b', summary_text))

            if field == "turnover":
                has_keywords = any(k in summary_text for k in ["turnover", "lakhs", "crores", "revenue"])
                rule_met = has_keywords and not bool(re.search(r'\b(no|not|missing|unmet|absent|lacking|without|failed)\b', summary_text))
            elif field == "experience_years":
                has_keywords = any(k in summary_text for k in ["experience", "years", "execution"])
                rule_met = has_keywords and not bool(re.search(r'\b(no|not|missing|unmet|absent|lacking|without|failed)\b', summary_text))
            elif field == "local_content_pct":
                has_keywords = any(k in summary_text for k in ["local content", "make in india", "class-i"])
                rule_met = has_keywords and not bool(re.search(r'\b(no|not|missing|unmet|absent|lacking|without|failed|non-compliant)\b', summary_text))
            elif field == "oem_authorization":
                has_keywords = any(k in summary_text for k in ["oem", "authorization", "maf"])
                rule_met = has_keywords and not has_negative
            else:
                rule_met = True

            if rule_met:
                passed_weight += weight
            else:
                deductions.append(f"Custom Rule Unmet: '{rule_name}' ({field} {op} {target_val}) (-{weight} pts)")

        score = int((passed_weight / total_weight) * 100) if total_weight > 0 else 100
        return score, deductions

    @staticmethod
    def calculate_compliance_score(
        verification_results: Dict[str, List[Dict[str, Any]]],
        forgery_analysis: Optional[Dict[str, Any]] = None,
        fraud_analysis: Optional[Dict[str, Any]] = None,
        semantic_analysis: Optional[Dict[str, Any]] = None,
        tender_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calculates compliance score and builds a structured report.
        Supports per-tender custom rules and dynamic buyer-configured scoring weights.
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
            
            # Heavy penalty if primary mandatory procurement identifiers (GSTIN & PAN) are both missing
            if not (has_gstin or has_pan):
                integrity_score = max(0, integrity_score - 15)
                deductions.append("Missing primary mandatory procurement identifiers (GSTIN/PAN) (-15 pts)")

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

            # Deductions for Forgery & Structural Anomalies
            if forgery_analysis and not forgery_analysis.get("authentic", True):
                forgery_penalty = 100 - forgery_analysis.get("forgery_score", 100)
                deduction_val = min(30, int(forgery_penalty * 0.3))
                integrity_score -= deduction_val
                anomalies = forgery_analysis.get("anomalies", [])
                for anomaly in anomalies:
                    deductions.append(f"AI Tampering Alert: {anomaly}")

            # Deductions for Multi-Bidder Collusion & Fraud
            if fraud_analysis:
                fraud_pen = fraud_analysis.get("fraud_penalty", 0)
                if fraud_pen > 0:
                    integrity_score -= min(30, fraud_pen)
                for w in fraud_analysis.get("all_warnings", []):
                    deductions.append(f"Procurement Fraud Risk: {w}")
                if fraud_analysis.get("is_collusion_risk"):
                    has_status_issue = True # Elevate risk level

            # Deductions for Specific GeM Real Tender Domain Rules
            if semantic_analysis and "clause_details" in semantic_analysis:
                clause_map = {c.get("clause_id"): c for c in semantic_analysis["clause_details"]}
                
                # Rule 1: Land Border Sharing Country Restriction (GFR Rule 144(xi))
                rfp_06 = clause_map.get("RFP-06")
                if rfp_06 and rfp_06.get("status") == "NOT_MET":
                    integrity_score -= 10
                    deductions.append("Land Border Sharing Country Compliance Declaration (Rule 144(xi)) missing or non-compliant (-10 pts)")

                # Rule 2: EMD / Bank Guarantee Proof & Exemption Validity
                rfp_07 = clause_map.get("RFP-07")
                rfp_03 = clause_map.get("RFP-03")
                rfp_08 = clause_map.get("RFP-08")
                
                # Check Trader Category Exclusion for MSME Exemption
                bid_summary_text = str(semantic_analysis).lower()
                is_trader = any(k in bid_summary_text for k in ["trader", "reseller", "dealer", "distributor"])
                has_msme_exemption = rfp_03 and rfp_03.get("status") == "MET"
                has_startup_exemption = rfp_08 and rfp_08.get("status") == "MET"

                if is_trader and has_msme_exemption:
                    integrity_score -= 10
                    deductions.append("Trader/Reseller enterprise category detected: Ineligible for MSME EMD Exemption per GeM rules (-10 pts)")

                if rfp_07 and rfp_07.get("status") == "NOT_MET" and not (has_startup_exemption or (has_msme_exemption and not is_trader)):
                    integrity_score -= 10
                    deductions.append("EMD payment receipt/e-PBG guarantee or valid MSME/Startup exemption proof missing (-10 pts)")

            # NOTE: Cumulative deductions above (e.g. blacklisting, forgery, collusion, missing declarations)
            # may push the intermediate integrity_score below 0. The max(0, ...) clamp below guarantees
            # the final registry_integrity breakdown score stays within [0, 30] without underflowing.
            integrity_score = max(0, integrity_score)

        # Evaluate Tender Custom Rules if present
        custom_rules_score = 100
        if tender_config and tender_config.get("custom_rules"):
            custom_rules_score, custom_deductions = ComplianceScorer.evaluate_custom_rules(
                tender_config["custom_rules"],
                semantic_analysis,
                verification_results
            )
            deductions.extend(custom_deductions)

        # Calculate total score (Default 30/40/30 baseline or Buyer-Configured Weighted Scoring)
        if tender_config and tender_config.get("scoring_weights"):
            weights = tender_config["scoring_weights"]
            w_comp = weights.get("completeness", 25)
            w_ver = weights.get("verification", 35)
            w_int = weights.get("integrity", 20)
            w_cust = weights.get("custom_rules", 20)

            scale_comp = (presence_score / 30.0) * w_comp
            scale_ver = (verification_score / 40.0) * w_ver
            scale_int = (integrity_score / 30.0) * w_int
            scale_cust = (custom_rules_score / 100.0) * w_cust

            total_score = int(scale_comp + scale_ver + scale_int + scale_cust)
            total_score = min(100, max(0, total_score))
        else:
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

        # Append forgery & collusion warnings to recommendations
        if forgery_analysis and forgery_analysis.get("anomalies"):
            for a in forgery_analysis["anomalies"]:
                recommendations.append(f"FORGERY DETECTED: {a}")

        if fraud_analysis and fraud_analysis.get("all_warnings"):
            for w in fraud_analysis["all_warnings"]:
                recommendations.append(f"FRAUD DETECTED: {w}")
        
        return {
            "score": total_score,
            "risk_level": risk_level,
            "breakdown": {
                "document_completeness": f"{presence_score}/30",
                "database_verification": f"{verification_score}/40",
                "registry_integrity": f"{integrity_score}/30",
                "semantic_rfp_alignment": f"{semantic_analysis.get('semantic_score', 100)}/100" if semantic_analysis else "100/100"
            },
            "deductions": deductions,
            "recommendations": recommendations,
            "forgery_analysis": forgery_analysis or {},
            "fraud_analysis": fraud_analysis or {},
            "semantic_analysis": semantic_analysis or {}
        }


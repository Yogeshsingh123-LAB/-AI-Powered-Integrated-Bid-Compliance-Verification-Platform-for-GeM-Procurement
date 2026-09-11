import re
import json
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class TenderRequirementAnalyzer:
    """
    AI Tender Requirement Analyzer for BidVerify Platform.
    Analyzes tender title, description, category, estimated value, and additional conditions
    to intelligently suggest required bidder documents, compliance checks, and weighting.
    Enforces decision-support principles (all suggestions require Procurement Officer review).
    """

    @classmethod
    def analyze_tender_requirements(
        cls,
        tender_title: str,
        tender_description: str,
        tender_category: Optional[str] = None,
        estimated_value: Optional[float] = None,
        additional_conditions: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes NLP & rule-guided pattern analysis to produce strict JSON format matching BidVerify spec.
        """
        title_lower = (tender_title or "").lower()
        desc_lower = (tender_description or "").lower()
        cond_lower = (additional_conditions or "").lower()
        combined_text = f"{title_lower} {desc_lower} {cond_lower}"
        
        category = tender_category or "General Procurement"
        val = float(estimated_value or 0.0)

        # 1. Detect procurement nature & bidder profile
        is_goods = any(k in combined_text for k in ["supply", "procurement", "equipment", "hardware", "goods", "machinery", "materials"])
        is_services = any(k in combined_text for k in ["services", "maintenance", "consulting", "manpower", "operation", "installation"])
        is_works = any(k in combined_text for k in ["construction", "works", "civil", "renovation", "turnkey"])
        
        procurement_type = "Goods & Equipment" if is_goods else ("Services & AMC" if is_services else ("Civil Works" if is_works else "General Procurement"))

        detected_keywords = []
        suggested_docs = []
        compliance_checks = []
        uncertain_reqs = []

        # Weight accumulator tracking
        weights = {}

        # --- RULE 1: OEM / Manufacturer Authorization Check ---
        has_oem_explicit = any(k in combined_text for k in ["oem", "manufacturer", "distributor", "reseller", "maf", "original equipment manufacturer"])
        if has_oem_explicit:
            detected_keywords.append("OEM Authorization / Manufacturer Requirement")
            suggested_docs.append({
                "document_name": "OEM Authorization Certificate (MAF)",
                "category": "Manufacturer / OEM",
                "status": "MANDATORY",
                "reason": "Tender explicitly requires authorized manufacturer or distributor status.",
                "source_in_description": "Tender text specifies authorized manufacturer/distributor/OEM compliance.",
                "verification_methods": ["Document Verification", "OCR Extraction", "Cross-Document Verification", "Mock Government Verification"],
                "verification_source": "Original Equipment Manufacturer Registry",
                "expiry_check": True,
                "cross_document_check": True,
                "suggested_weight": 20,
                "risk_if_missing": "CRITICAL"
            })
            compliance_checks.append({
                "check_name": "OEM Authorization Verification",
                "description": "Verify that OEM letter is valid for tender reference and issued by recognized manufacturer.",
                "status": "MANDATORY",
                "verification_method": "OCR Extraction & Domain Matching",
                "risk": "CRITICAL"
            })
            weights["oem"] = 20

        # --- RULE 2: Make in India (Local Content) Check ---
        has_mii = any(k in combined_text for k in ["make in india", "local content", "class-i", "class-ii", "pppi-mfe", "indigenous"])
        if has_mii:
            detected_keywords.append("Make in India / Local Content Preference")
            suggested_docs.append({
                "document_name": "Make in India / Local Content Declaration",
                "category": "Make in India",
                "status": "MANDATORY",
                "reason": "Tender explicitly specifies Make in India preference or minimum local content threshold.",
                "source_in_description": "Specified in tender guidelines for PPP-MII policy preference.",
                "verification_methods": ["Document Verification", "AI Content Analysis", "Manual Officer Review"],
                "verification_source": "Bidder Self-Declaration & Statutory Auditor Certificate",
                "expiry_check": False,
                "cross_document_check": False,
                "suggested_weight": 15,
                "risk_if_missing": "HIGH"
            })
            compliance_checks.append({
                "check_name": "Local Content % Calculation",
                "description": "Verify minimum 50% local content for Class-I or 20% for Class-II supplier status.",
                "status": "MANDATORY",
                "verification_method": "AI Content Analysis",
                "risk": "HIGH"
            })
            weights["mii"] = 15

        # --- RULE 3: Product Quality & Safety Certifications ---
        has_cert = any(k in combined_text for k in ["safety standard", "bis", "iso", "ce", "certificate", "testing", "quality standard", "isi mark"])
        if has_cert:
            detected_keywords.append("Technical & Product Safety Certification")
            suggested_docs.append({
                "document_name": "Product Quality & Safety Compliance Certification",
                "category": "Certification",
                "status": "MANDATORY",
                "reason": "Tender explicitly requires compliance with applicable Indian safety standards (BIS/ISO/CE).",
                "source_in_description": "Stated under technical specifications and product safety compliance.",
                "verification_methods": ["Document Verification", "Expiry Verification", "Mock Government Verification"],
                "verification_source": "BIS / Accredited Testing Laboratory",
                "expiry_check": True,
                "cross_document_check": False,
                "suggested_weight": 20,
                "risk_if_missing": "CRITICAL"
            })
            compliance_checks.append({
                "check_name": "BIS / ISO Certificate Validity",
                "description": "Ensure product test reports and quality certificates are active and unexpired.",
                "status": "MANDATORY",
                "verification_method": "Expiry Verification",
                "risk": "CRITICAL"
            })
            weights["cert"] = 20

        # --- RULE 4: GST Registration & Return Filing ---
        suggested_docs.append({
            "document_name": "GST Registration Certificate & Return Status",
            "category": "Statutory Registration",
            "status": "REVIEW_REQUIRED",
            "reason": "Relevant for establishing bidder tax identity and verifying GSTN portal active status.",
            "source_in_description": "Standard statutory tax compliance requirement for commercial bidders.",
            "verification_methods": ["Document Verification", "Government Portal Verification", "Cross-Document Verification", "Mock Government Verification"],
            "verification_source": "GSTN Portal API (Mock)",
            "expiry_check": False,
            "cross_document_check": True,
            "suggested_weight": 10,
            "risk_if_missing": "HIGH"
        })
        compliance_checks.append({
            "check_name": "GSTN Active Status & Filing Verification",
            "description": "Cross-check GSTIN against GSTN portal to verify ACTIVE status and GSTR-3B filings.",
            "status": "REVIEW_REQUIRED",
            "verification_method": "Government Portal Verification",
            "risk": "HIGH"
        })
        weights["gst"] = 10

        # --- RULE 5: PAN Card Verification ---
        suggested_docs.append({
            "document_name": "PAN Card Verification",
            "category": "Identity",
            "status": "REVIEW_REQUIRED",
            "reason": "Required for statutory tax identity and legal entity name cross-verification.",
            "source_in_description": "Standard statutory compliance requirement for Indian procurement.",
            "verification_methods": ["Document Verification", "Cross-Document Verification", "Mock Government Verification"],
            "verification_source": "Income Tax Department Registry (Mock)",
            "expiry_check": False,
            "cross_document_check": True,
            "suggested_weight": 10,
            "risk_if_missing": "HIGH"
        })
        compliance_checks.append({
            "check_name": "PAN Legal Entity Name Matching",
            "description": "Verify extracted PAN against Income Tax database and check name similarity.",
            "status": "REVIEW_REQUIRED",
            "verification_method": "Cross-Document Verification",
            "risk": "HIGH"
        })
        weights["pan"] = 10

        # --- RULE 6: Experience Requirements ---
        has_exp = any(k in combined_text for k in ["experience", "past performance", "similar work", "years", "executed orders", "track record"])
        if has_exp:
            detected_keywords.append("Past Experience & Performance Track Record")
            suggested_docs.append({
                "document_name": "Past Work Orders & Completion Certificates",
                "category": "Experience",
                "status": "MANDATORY" if "must have" in combined_text or "minimum" in combined_text else "REVIEW_REQUIRED",
                "reason": "Tender mandates prior experience and successful execution of similar supply/service contracts.",
                "source_in_description": "Stated under eligibility criteria for past performance.",
                "verification_methods": ["Document Verification", "OCR Extraction", "Manual Officer Review"],
                "verification_source": "Client Completion Certificates & Purchase Orders",
                "expiry_check": False,
                "cross_document_check": True,
                "suggested_weight": 15,
                "risk_if_missing": "HIGH"
            })
            weights["exp"] = 15

        # --- RULE 7: Financial Turnover / Audited Balance Sheet ---
        if val > 1000000 or "turnover" in combined_text or "financial" in combined_text:
            detected_keywords.append("Financial Capacity & Annual Turnover")
            suggested_docs.append({
                "document_name": "Audited Financial Statements / Annual Turnover Certificate",
                "category": "Financial",
                "status": "REVIEW_REQUIRED",
                "reason": "Required to demonstrate financial capacity to execute tender worth ₹" + f"{val:,.2f}",
                "source_in_description": "Inferred from estimated tender valuation and financial capability norms.",
                "verification_methods": ["Document Verification", "OCR Extraction", "Manual Officer Review"],
                "verification_source": "Chartered Accountant UDIN Certified Financials",
                "expiry_check": True,
                "cross_document_check": False,
                "suggested_weight": 10,
                "risk_if_missing": "MEDIUM"
            })
            weights["fin"] = 10

        # --- RULE 8: Labor & EPFO / ESIC Check for Services / Maintenance ---
        if is_services or "epfo" in combined_text or "labor" in combined_text or "labour" in combined_text:
            uncertain_reqs.append({
                "requirement": "EPFO & ESIC Labor Compliance Certificates",
                "reason_for_uncertainty": "Services tender detected. Required if bidder employs > 20 personnel for site maintenance.",
                "officer_action": "REVIEW_REQUIRED"
            })

        # --- RULE 9: Non-Blacklisting Affidavit ---
        suggested_docs.append({
            "document_name": "Non-Blacklisting Declaration & Debarment Check",
            "category": "Declaration",
            "status": "MANDATORY",
            "reason": "Mandatory to certify bidder has not been debarred by GeM or Central Government ministries.",
            "source_in_description": "Central Public Procurement Policy requirement.",
            "verification_methods": ["Document Verification", "Government Portal Verification", "Mock Government Verification"],
            "verification_source": "Central Debarment Registry (Mock)",
            "expiry_check": True,
            "cross_document_check": False,
            "suggested_weight": 10,
            "risk_if_missing": "CRITICAL"
        })
        compliance_checks.append({
            "check_name": "Central Debarment Registry Lookup",
            "description": "Check bidder PAN and GSTIN against Central Debarment Database for active blacklisting orders.",
            "status": "MANDATORY",
            "verification_method": "Government Portal Verification",
            "risk": "CRITICAL"
        })
        weights["blacklisting"] = 10

        # Adjust weights to total 100
        current_sum = sum(weights.values())
        if current_sum > 0 and current_sum != 100:
            scale_factor = 100.0 / current_sum
            for doc in suggested_docs:
                doc["suggested_weight"] = max(5, int(round(doc["suggested_weight"] * scale_factor)))

        # Re-verify exact sum to 100
        total = sum(d["suggested_weight"] for d in suggested_docs)
        if total != 100 and len(suggested_docs) > 0:
            diff = 100 - total
            suggested_docs[0]["suggested_weight"] += diff

        # Classify count for procurement officer decision support summary
        clearly_required = len([d for d in suggested_docs if d["status"] == "MANDATORY"])
        suggested_review = len([d for d in suggested_docs if d["status"] == "REVIEW_REQUIRED"])
        uncertain_count = len(uncertain_reqs)

        summary_text = (
            f"AI analyzed tender '{tender_title}' and identified {len(suggested_docs)} bidder requirements: "
            f"{clearly_required} Clearly Required (MANDATORY), {suggested_review} Suggested for Officer Review (REVIEW_REQUIRED), "
            f"and {uncertain_count} Need Clarification."
        )

        return {
            "tender_analysis": {
                "procurement_type": procurement_type,
                "category": category,
                "summary": summary_text,
                "detected_requirements": detected_keywords
            },
            "suggested_documents": suggested_docs,
            "suggested_compliance_checks": compliance_checks,
            "uncertain_requirements": uncertain_reqs
        }

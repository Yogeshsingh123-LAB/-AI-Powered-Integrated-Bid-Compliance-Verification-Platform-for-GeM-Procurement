import logging
from typing import List, Optional

logger = logging.getLogger(__name__)

class RecommendationEngine:
    """
    Generates context-specific, structured, actionable recommendations depending on the compliance flags,
    missing documents, status warnings, and risk level.
    """
    
    @staticmethod
    def generate_recommendations(
        has_gstin: bool,
        has_pan: bool,
        has_udyam: bool,
        has_aadhaar: bool,
        gstin_verified: bool,
        pan_verified: bool,
        udyam_verified: bool,
        aadhaar_verified: bool,
        is_blacklisted: bool,
        status_issues: List[str],
        compliance_issues: List[str],
        name_mismatch_desc: Optional[str]
    ) -> List[str]:
        """Generates list of recommendations based on verification findings."""
        logger.info("RecommendationEngine: Generating compliance recommendations...")
        recommendations = []
        
        # 1. Critical Blacklisting Warning
        if is_blacklisted:
            recommendations.append("CRITICAL: The vendor is blacklisted. Reject the bid and escalate for review.")
            
        # 2. Status & Registration issues
        for issue in status_issues:
            recommendations.append(f"CRITICAL: {issue}. Do not approve the bid until active registration proof is uploaded.")
            
        # 3. Compliance Record issues (e.g. GST compliance_record == "Poor")
        for issue in compliance_issues:
            recommendations.append(f"WARNING: {issue}. Request GSTR-3B filing receipts for the last 3 consecutive months.")
            
        # 4. Name Mismatch Warnings
        if name_mismatch_desc:
            recommendations.append(f"WARNING: {name_mismatch_desc}. Ensure these documents belong to the same entity.")

        # 5. Unverified Documents Warning
        if has_gstin and not gstin_verified:
            recommendations.append("WARNING: Extracted GSTIN could not be verified in the database. Verify typings in the document.")
        if has_pan and not pan_verified:
            recommendations.append("WARNING: Extracted PAN is invalid or not found in registry database.")
        if has_udyam and not udyam_verified:
            recommendations.append("WARNING: Extracted Udyam Number is unverified or not found in mock database.")
        if has_aadhaar and not aadhaar_verified:
            recommendations.append("WARNING: Extracted Aadhaar number is unverified or not found in UIDAI database.")

        # 6. Missing Documents Warnings
        if not (has_gstin or has_pan or has_udyam or has_aadhaar):
            recommendations.append(
                "CRITICAL: Uploaded document contains no valid government compliance identifiers (GSTIN, PAN, Udyam, Aadhaar). "
                "The file appears to be an invalid or unrelated document (e.g. class notes). Score: 0/100 (HIGH RISK / REJECTED)."
            )
        else:
            if not has_gstin:
                recommendations.append("NOTICE: GSTIN is missing. Confirm if the bidder is exempt from GST registration.")
            if not has_pan:
                recommendations.append("CRITICAL: PAN details are missing. A PAN is mandatory for all bidding entities.")
            if not has_udyam:
                recommendations.append(
                    "NOTICE: Udyam MSME Registration is missing. The bidder will not be eligible for MSME exemptions "
                    "(e.g., Earnest Money Deposit / EMD waiver, purchase preferences)."
                )
            
        if not recommendations:
            recommendations.append("All parameters are highly compliant. No risks identified.")
            
        return recommendations

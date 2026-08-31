import os
import re
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# List of Scheduled Commercial Banks in India recognized by GeM portal for e-EMD & e-PBG
SCHEDULED_BANKS = [
    "State Bank of India", "SBI",
    "HDFC Bank", "HDFC",
    "ICICI Bank", "ICICI",
    "Punjab National Bank", "PNB",
    "Bank of Baroda", "BOB",
    "Axis Bank", "AXIS",
    "Canara Bank",
    "Union Bank of India", "UBI",
    "Bank of India", "BOI",
    "Indian Bank",
    "Kotak Mahindra Bank", "KOTAK",
    "IndusInd Bank",
    "IDBI Bank", "IDBI",
    "Central Bank of India",
    "Indian Overseas Bank", "IOB",
    "UCO Bank",
    "Punjab & Sind Bank",
    "Yes Bank",
    "Federal Bank",
    "IDFC FIRST Bank", "IDFC"
]


def extract_text_from_input(source: str) -> str:
    """Extracts text from file path if it exists, otherwise returns source string."""
    if isinstance(source, str) and os.path.exists(source) and os.path.isfile(source):
        ext = os.path.splitext(source)[1].lower()
        if ext == ".pdf":
            try:
                from app.ai_engine import PDFHandler
                handler = PDFHandler()
                with open(source, "rb") as f:
                    res = handler.extract_text(f.read())
                return res.get("text", "")
            except Exception as e:
                logger.warning(f"Failed PDF extraction via PDFHandler for {source}: {e}")
                try:
                    # pyrefly: ignore [missing-import]
                    import fitz  # PyMuPDF
                    doc = fitz.open(source)
                    text = "\n".join([page.get_text() for page in doc])
                    return text
                except Exception as e2:
                    logger.error(f"PyMuPDF extraction failed: {e2}")
                    return ""
        else:
            try:
                with open(source, "r", encoding="utf-8", errors="ignore") as f:
                    return f.read()
            except Exception as e:
                logger.error(f"Text file read failed: {e}")
                return ""
    return str(source or "")


def detect_scheduled_bank(text: str) -> Optional[str]:
    """Detects if issuing bank in text is a recognized Scheduled Commercial Bank."""
    text_upper = text.upper()
    for bank in SCHEDULED_BANKS:
        # Match word boundary for short bank codes like SBI, PNB, BOB, etc.
        if len(bank) <= 5:
            if re.search(r'\b' + re.escape(bank) + r'\b', text_upper):
                return bank
        else:
            if bank.upper() in text_upper:
                return bank
    return None


def extract_amount_from_text(text: str) -> Optional[float]:
    """Extracts highest monetary amount (INR / ₹ / Rs.) from text using regex."""
    patterns = [
        r'(?:₹|INR|Rs\.?)\s*([\d,]+(?:\.\d{1,2})?)',
        r'Amount[:\s]+(?:₹|INR|Rs\.?)?\s*([\d,]+(?:\.\d{1,2})?)',
        r'Sum of\s+(?:₹|INR|Rs\.?)?\s*([\d,]+(?:\.\d{1,2})?)'
    ]
    amounts = []
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for m in matches:
            clean_num = m.replace(',', '').strip()
            try:
                val = float(clean_num)
                if val > 0:
                    amounts.append(val)
            except ValueError:
                continue
    return max(amounts) if amounts else None


def check_digital_signature(text: str) -> bool:
    """Checks if certificate contains digital signature or PKCS#7 e-sign indicators."""
    keywords = ["DIGITALLY SIGNED", "DIGITAL SIGNATURE", "PKCS#7", "E-SIGNED", "VALIDATED SIGNATURE"]
    text_upper = text.upper()
    return any(kw in text_upper for kw in keywords)


def validate_emd(pbg_cert_path_or_text: str, tender_value: Optional[float] = None) -> Dict[str, Any]:
    """
    Validates electronic Earnest Money Deposit (e-EMD) certificate for GeM 3.0/4.0 compliance.
    - Check document keywords ("Earnest Money Deposit", "EMD", "Bid Security")
    - Check issuer (must be a scheduled commercial bank)
    - Check amount (must be >= tender_value * 2% if tender_value provided)
    - Check digital signature verification
    """
    text = extract_text_from_input(pbg_cert_path_or_text)
    if not text or len(text.strip()) == 0:
        return {
            "valid": False,
            "reason": "Empty or unreadable EMD document",
            "amount": 0.0,
            "issuer": None,
            "digitally_signed": False
        }

    # 1. Document Keyword Check
    emd_keywords = ["EARNEST MONEY DEPOSIT", "EMD", "BID SECURITY", "EARNEST MONEY GUARANTEE"]
    text_upper = text.upper()
    has_emd_keyword = any(kw in text_upper for kw in emd_keywords)

    if not has_emd_keyword:
        return {
            "valid": False,
            "reason": "Not an EMD certificate (missing 'Earnest Money Deposit' / 'EMD' keywords)",
            "amount": 0.0,
            "issuer": None,
            "digitally_signed": False
        }

    # 2. Extract Amount
    amount = extract_amount_from_text(text)
    if amount is None or amount <= 0:
        return {
            "valid": False,
            "reason": "Amount missing or unreadable in EMD certificate",
            "amount": 0.0,
            "issuer": None,
            "digitally_signed": False
        }

    # 3. Bank Issuer Check
    bank_issuer = detect_scheduled_bank(text)
    if not bank_issuer:
        return {
            "valid": False,
            "reason": "Issuing bank is not a recognized Scheduled Commercial Bank",
            "amount": amount,
            "issuer": None,
            "digitally_signed": False
        }

    # 4. Amount Sufficiency Check (>= 2% of tender_value)
    if tender_value and tender_value > 0:
        min_required_emd = tender_value * 0.02  # 2% standard EMD requirement
        if amount < min_required_emd:
            return {
                "valid": False,
                "reason": f"EMD amount (₹{amount:,.2f}) is insufficient. Minimum 2% required (₹{min_required_emd:,.2f})",
                "amount": amount,
                "required_minimum": min_required_emd,
                "issuer": bank_issuer,
                "digitally_signed": check_digital_signature(text)
            }

    is_signed = check_digital_signature(text)

    return {
        "valid": True,
        "amount": amount,
        "amount_formatted": f"₹{amount:,.2f}",
        "issuer": bank_issuer,
        "digitally_signed": is_signed,
        "reason": "Valid electronic Earnest Money Deposit (e-EMD) certificate"
    }


def validate_epbg(pbg_cert_path_or_text: str, tender_value: Optional[float] = None) -> Dict[str, Any]:
    """
    Validates electronic Performance Bank Guarantee (e-PBG) certificate for GeM compliance.
    - Check document format ("Performance Bank Guarantee", "e-PBG", "PBG", "Performance Security")
    - Check issuer (must be a scheduled commercial bank)
    - Check amount (must be >= tender_value * 3% for GeM 3.0/4.0 standards)
    - Check digital signature verification
    """
    text = extract_text_from_input(pbg_cert_path_or_text)
    if not text or len(text.strip()) == 0:
        return {
            "valid": False,
            "reason": "Empty or unreadable e-PBG document",
            "amount": 0.0,
            "issuer": None,
            "digitally_signed": False
        }

    # 1. Document Format / Keyword Check
    epbg_keywords = [
        "PERFORMANCE BANK GUARANTEE", "E-PBG", "PBG", "PERFORMANCE SECURITY",
        "PERFORMANCE GUARANTEE", "BANK GUARANTEE FOR PERFORMANCE"
    ]
    text_upper = text.upper()
    has_epbg_keyword = any(kw in text_upper for kw in epbg_keywords)

    if not has_epbg_keyword:
        return {
            "valid": False,
            "reason": "Not an e-PBG certificate (missing 'Performance Bank Guarantee' / 'e-PBG' keywords)",
            "amount": 0.0,
            "issuer": None,
            "digitally_signed": False
        }

    # 2. Extract Amount
    amount = extract_amount_from_text(text)
    if amount is None or amount <= 0:
        return {
            "valid": False,
            "reason": "Amount missing or unreadable in e-PBG certificate",
            "amount": 0.0,
            "issuer": None,
            "digitally_signed": False
        }

    # 3. Scheduled Bank Issuer Check
    bank_issuer = detect_scheduled_bank(text)
    if not bank_issuer:
        return {
            "valid": False,
            "reason": "Issuing bank is not a recognized Scheduled Commercial Bank",
            "amount": amount,
            "issuer": None,
            "digitally_signed": False
        }

    # 4. Amount Sufficiency Check (>= 3% of tender_value)
    if tender_value and tender_value > 0:
        min_required_pbg = tender_value * 0.03  # 3% min GeM standard
        if amount < min_required_pbg:
            return {
                "valid": False,
                "reason": f"e-PBG amount (₹{amount:,.2f}) is insufficient. Minimum 3% required (₹{min_required_pbg:,.2f})",
                "amount": amount,
                "required_minimum": min_required_pbg,
                "issuer": bank_issuer,
                "digitally_signed": check_digital_signature(text)
            }

    is_signed = check_digital_signature(text)

    return {
        "valid": True,
        "amount": amount,
        "amount_formatted": f"₹{amount:,.2f}",
        "issuer": bank_issuer,
        "digitally_signed": is_signed,
        "reason": "Valid electronic Performance Bank Guarantee (e-PBG) certificate"
    }


def perform_statutory_checks(doc_text: str, tender_value: Optional[float] = None) -> Dict[str, Any]:
    """
    Consolidated helper executing EMD, PBG, and statutory document checks.
    """
    emd_res = validate_emd(doc_text, tender_value=tender_value)
    epbg_res = validate_epbg(doc_text, tender_value=tender_value)
    
    return {
        "emd_validation": emd_res,
        "epbg_validation": epbg_res,
        "statutory_pass": emd_res.get("valid", False) or epbg_res.get("valid", False)
    }

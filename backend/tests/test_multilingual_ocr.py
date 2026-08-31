"""
Unit tests for Multi-Language Support, Indic Language Script Detection, and Regional OCR Service
"""

# pyrefly: ignore [missing-import]
import pytest
from app.ai_engine.multilingual_ocr import MultilingualOCREngine
from app.services.multilingual_service import MultilingualService

def test_script_detection_hindi_devanagari():
    """Verifies that Devanagari text is correctly identified as Hindi/Marathi."""
    text = "जीएसटी पंजीकरण संख्या 27AAAAA1111A1Z1 स्थायी खाता संख्या AAAAA1111A"
    detected = MultilingualOCREngine.detect_script_from_text(text)
    assert detected == "hin"

def test_script_detection_gujarati():
    """Verifies that Gujarati script is correctly identified."""
    text = "જીએસટી નંબર 27AAAAA1111A1Z1 પાન કાર્ડ AAAAA1111A ઉદ્યમ નોંધણી"
    detected = MultilingualOCREngine.detect_script_from_text(text)
    assert detected == "guj"

def test_extract_hindi_statutory_entities():
    """Verifies Hindi statutory keyword mapping and standard identifier extraction."""
    hindi_text = "माल एवं सेवा कर 27AAAAA1111A1Z1 स्थायी खाता संख्या AAAAA1111A वार्षिक कारोबार 75 लाख धरोहर राशि छूट"
    entities = MultilingualService.extract_statutory_entities_from_regional_text(hindi_text, "hin")

    assert entities["gstin"] == "27AAAAA1111A1Z1"
    assert entities["pan"] == "AAAAA1111A"
    assert entities["has_turnover_declaration"] is True
    assert entities["has_emd_exemption_claim"] is True

def test_translate_regional_report_gujarati():
    """Verifies Gujarati text translation into standardized English compliance summary."""
    gujarati_text = "વસ્તુ અને સેવા કર 27BBBBB2222B1Z2 કાયમી ખાતા નંબર BBBBB2222B ઉદ્યમ નોંધણી UDYAM-GJ-01-0012345"
    report = MultilingualService.translate_regional_report_to_english(gujarati_text, "guj")

    assert "27BBBBB2222B1Z2" in report["translated_english_summary"]
    assert "BBBBB2222B" in report["translated_english_summary"]
    assert "UDYAM-GJ-01-0012345" in report["translated_english_summary"]

from typing import Dict, List, Any, Optional
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, HTTPException, status
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, Field

from app.ai_engine.multilingual_ocr import MultilingualOCREngine
from app.services.multilingual_service import MultilingualService

router = APIRouter(prefix="/v1/multilingual", tags=["Multi-Language Support & Regional OCR Engine"])

class RegionalOCRRequest(BaseModel):
    raw_text: Optional[str] = Field(default=None, example="जीएसटी पंजीकरण संख्या 27AAAAA1111A1Z1 स्थायी खाता संख्या AAAAA1111A वार्षिक कारोबार 75 लाख")
    target_language: str = Field(default="hin", example="hin") # "hin", "guj", "mar", "tam", "ben", "tel"

class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=2, example="આવકવેરો પાન કાર્ડ AAAAA1111A વાર્ષિક ટર્નઓવર 50 લાખ")
    language: str = Field(default="guj", example="guj")

@router.get("/supported-languages", response_model=Dict[str, Any])
def get_supported_languages():
    """Lists supported pan-India Indic regional languages and script metadata."""
    return {
        "supported_languages": MultilingualOCREngine.SUPPORTED_LANGUAGES,
        "default_ocr_langs": "hin+guj+mar+eng"
    }

@router.post("/ocr", response_model=Dict[str, Any])
def process_regional_ocr(payload: RegionalOCRRequest):
    """Processes regional language document text/scans and extracts statutory compliance entities."""
    ocr_result = MultilingualOCREngine.perform_multilingual_ocr(
        target_lang=payload.target_language,
        raw_text_input=payload.raw_text
    )

    detected_lang = ocr_result["detected_language"]
    translation_result = MultilingualService.translate_regional_report_to_english(
        regional_text=ocr_result["extracted_text"],
        detected_lang=detected_lang
    )

    return {
        "ocr_result": ocr_result,
        "translation_result": translation_result
    }

@router.post("/translate", response_model=Dict[str, Any])
def translate_regional_text(payload: TranslateRequest):
    """Translates regional document text into standardized English compliance summary."""
    return MultilingualService.translate_regional_report_to_english(
        regional_text=payload.text,
        detected_lang=payload.language
    )

"""AI engine package.

Submodules pull in heavy dependencies (PyMuPDF, pdfplumber, spaCy, OpenCV)
and model weights. They are imported lazily (PEP 562) so that API cold starts
on serverless runtimes (Vercel) and code paths that never touch the AI engine
do not pay the import cost. All public names still work with the same
`from app.ai_engine import X` syntax.
"""

_LAZY = {
    "OCRParser": (".ocr_parser", "OCRParser"),
    "PDFHandler": (".pdf_handler", "PDFHandler"),
    "EntityExtractor": (".entity_extractor", "EntityExtractor"),
    "DocumentAnalyzer": (".document_analyzer", "DocumentAnalyzer"),
    "ForgeryDetector": (".forgery_detector", "ForgeryDetector"),
    "SemanticRFPComparator": (".semantic_analyzer", "SemanticRFPComparator"),
}

__all__ = list(_LAZY.keys())


def __getattr__(name):
    if name in _LAZY:
        import importlib
        module_name, attr = _LAZY[name]
        module = importlib.import_module(module_name, __name__)
        return getattr(module, attr)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


def __dir__():
    return sorted(list(globals().keys()) + __all__)

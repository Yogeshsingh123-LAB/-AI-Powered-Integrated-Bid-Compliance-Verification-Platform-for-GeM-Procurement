import logging
from typing import Dict, List
from app.ai_engine import EntityExtractor

logger = logging.getLogger(__name__)

class RegexExtractor:
    """
    Wrapper for backward compatibility, delegating to app.ai_engine.EntityExtractor.
    """
    @classmethod
    def extract_identifiers(cls, text: str) -> Dict[str, List[str]]:
        return EntityExtractor.extract_identifiers(text)

if __name__ == "__main__":
    print("RegexExtractor wrapper compiled successfully.")

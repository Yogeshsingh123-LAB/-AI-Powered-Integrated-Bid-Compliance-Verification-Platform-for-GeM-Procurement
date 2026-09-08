import unittest

from app.ai_engine.entity_extractor import EntityExtractor


class IdentifierExtractionTests(unittest.TestCase):
    def test_prose_does_not_create_pan_identifiers(self):
        result = EntityExtractor.extract_identifiers(
            'Not valid for official submission. Supply and commission pumps.'
        )
        self.assertEqual(result['pan'], [])

    def test_real_digits_anchor_ocr_repair(self):
        result = EntityExtractor.extract_identifiers('PAN: AAPCS12B4M')
        self.assertIn('AAPCS1284M', result['pan'])

    def test_fixture_identifiers_are_preserved(self):
        result = EntityExtractor.extract_identifiers(
            'PAN: AAPCS1234M GSTIN: 27AAPCS1234M1Z5. For demo submission.'
        )
        self.assertEqual(result['pan'], ['AAPCS1234M'])
        self.assertEqual(result['gstin'], ['27AAPCS1234M1Z5'])

    def test_gstin_alone_does_not_invent_separate_pan_evidence(self):
        result = EntityExtractor.extract_identifiers('GSTIN: 27AAPCS1234M1Z5')
        self.assertEqual(result['pan'], [])
        self.assertEqual(result['gstin'], ['27AAPCS1234M1Z5'])


if __name__ == '__main__':
    unittest.main()

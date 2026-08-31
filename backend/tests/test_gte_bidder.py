# pyrefly: ignore [missing-import]
import pytest
from app.models.bidder import Bidder
from app.services.statutory_checks import validate_bidder_statutory, perform_statutory_checks
from app.services.tender_analyzer import check_statutory


def test_bidder_model_defaults():
    bidder = Bidder(company_name="India Tech Solutions", pan="ABCDE1234F", gst="27ABCDE1234F1Z5")
    assert bidder.company_name == "India Tech Solutions"
    assert bidder.country == "India"
    assert bidder.pan == "ABCDE1234F"
    assert bidder.gst == "27ABCDE1234F1Z5"
    assert bidder.foreign_tax_id is None
    assert bidder.import_license is None


def test_bidder_model_foreign():
    bidder = Bidder(
        company_name="Global Robotics Inc",
        country="USA",
        foreign_tax_id="EIN-98-7654321",
        import_license="IEC-US-2026-99"
    )
    assert bidder.company_name == "Global Robotics Inc"
    assert bidder.country == "USA"
    assert bidder.pan is None
    assert bidder.gst is None
    assert bidder.foreign_tax_id == "EIN-98-7654321"
    assert bidder.import_license == "IEC-US-2026-99"


def test_validate_bidder_statutory_domestic_pass():
    bidder = Bidder(company_name="Domestic Vendor", pan="ABCDE1234F", gst="27ABCDE1234F1Z5")
    res = validate_bidder_statutory(bidder)
    assert res["passed"] is True
    assert res["is_foreign"] is False
    assert res["validated_checks"]["pan"] is True
    assert res["validated_checks"]["gst"] is True


def test_validate_bidder_statutory_domestic_fail():
    bidder = Bidder(company_name="Incomplete Vendor", pan=None, gst=None)
    res = validate_bidder_statutory(bidder)
    assert res["passed"] is False
    assert res["is_foreign"] is False


def test_validate_bidder_statutory_foreign_pass():
    bidder = Bidder(
        company_name="Siemens AG",
        country="Germany",
        foreign_tax_id="DE123456789",
        import_license="IEC-DE-8899"
    )
    res = validate_bidder_statutory(bidder)
    assert res["passed"] is True
    assert res["is_foreign"] is True
    assert "pan" in res["skipped_checks"]
    assert "gst" in res["skipped_checks"]
    assert res["validated_checks"]["foreign_tax_id"] is True
    assert res["validated_checks"]["import_license"] is True


def test_validate_bidder_statutory_foreign_fail():
    bidder = Bidder(
        company_name="Foreign Vendor No License",
        country="Japan",
        foreign_tax_id="JP-TAX-112233"
        # Missing import_license
    )
    res = validate_bidder_statutory(bidder)
    assert res["passed"] is False
    assert res["is_foreign"] is True
    assert res["validated_checks"]["import_license"] is False


def test_perform_statutory_checks_with_gte_bidder():
    bidder = Bidder(
        company_name="Tokyo Instruments",
        country="Japan",
        foreign_tax_id="JP-998877",
        import_license="IEC-JP-1002"
    )
    res = perform_statutory_checks(doc_text="Sample EMD", bidder_data=bidder)
    assert res["bidder_statutory"]["passed"] is True
    assert res["bidder_statutory"]["is_foreign"] is True


def test_check_statutory_gte_tender_analyzer():
    foreign_doc = {
        "bidder_name": "US Hardware LLC",
        "country": "United States",
        "foreign_tax_id": "EIN-12-3456789",
        "import_license": "IEC-US-5544"
    }
    res = check_statutory(foreign_doc)
    assert res["status"] == "PASS"
    assert res["is_foreign"] is True
    assert res["score"] == 100.0

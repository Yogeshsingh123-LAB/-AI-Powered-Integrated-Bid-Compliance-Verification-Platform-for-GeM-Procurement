from app.services.chat_service import _knowledge_base_answer, _needs_web_search


def test_answers_gem_full_form():
    answer, suggestions = _knowledge_base_answer("What is the full form of GeM?", "Guest")

    assert "Government e-Marketplace" in answer
    assert suggestions


def test_answers_simple_calculation():
    answer, _ = _knowledge_base_answer("5+10", "Guest")

    assert answer == "5 + 10 = 15."


def test_which_is_not_mistaken_for_hi():
    answer, _ = _knowledge_base_answer("Which documents are checked?", "Supplier")

    assert not answer.startswith("Hello!")
    assert "GSTIN, PAN, and Udyam" in answer


def test_profile_is_not_mistaken_for_file():
    answer, _ = _knowledge_base_answer("Where is my profile?", "Supplier")

    assert "My Profile" in answer
    assert "select or drop your PDF" not in answer


def test_current_information_requests_use_web_search():
    assert _needs_web_search("What is the latest official GeM update?") is True
    assert _needs_web_search("How is the score calculated?") is False


def test_supplier_bid_application_uses_current_navigation():
    answer, suggestions = _knowledge_base_answer("How do I upload a bid?", "Supplier")

    assert "Open Tenders" in answer
    assert "select Apply" in answer
    assert "Documents" in answer
    assert "My Bids" in answer
    assert "Verification Terminal" not in answer
    assert suggestions


def test_supplier_status_uses_my_bids_instead_of_old_status_tracker():
    answer, _ = _knowledge_base_answer("Where can I track my bid status?", "Supplier")

    assert "My Bids" in answer
    assert "Documents" in answer
    assert "Status Tracker" not in answer


def test_buyer_review_uses_bidders_and_verification():
    answer, _ = _knowledge_base_answer("How does a buyer review a bid?", "Buyer")

    assert "Bidders" in answer
    assert "Verification" in answer
    assert "Audit Trail" in answer
    assert "Master Audit Queue" not in answer


def test_document_upload_answer_matches_current_compliance_vault():
    answer, _ = _knowledge_base_answer("How do I replace a document?", "Supplier")

    assert "Compliance Vault" in answer
    assert "Required Documents Checklist" in answer
    assert "Replace File" in answer
    assert "10 MB" in answer


def test_role_specific_navigation_answers():
    supplier_answer, _ = _knowledge_base_answer("Show me the navigation menu", "Supplier")
    buyer_answer, _ = _knowledge_base_answer("Show me the navigation menu", "Buyer")

    assert "My Bids" in supplier_answer
    assert "Notifications" in supplier_answer
    assert "Bidders" in buyer_answer
    assert "Reports" in buyer_answer


def test_create_tender_suggestion_has_a_current_interface_answer():
    answer, _ = _knowledge_base_answer("How do I create a tender?", "Buyer")

    assert "Open Tenders" in answer
    assert "Create New Tender" in answer
    assert "Basic Details" in answer
    assert "Review & Publish" in answer


def test_supplier_audit_question_does_not_describe_buyer_controls():
    answer, _ = _knowledge_base_answer("Where is the audit trail?", "Supplier")

    assert "My Bids" in answer
    assert "buyer’s detailed Audit Trail" in answer
    assert "record Qualified" not in answer


def test_initial_flagged_document_suggestion_has_actionable_answer():
    answer, _ = _knowledge_base_answer("Why is my document flagged?", "Supplier")

    assert "does not match the selected requirement" in answer
    assert "Upload Correct Document" in answer


def test_name_mismatch_suggestion_is_not_treated_as_document_status():
    answer, _ = _knowledge_base_answer("What causes a name mismatch?", "Supplier")

    assert "GSTIN, PAN" in answer
    assert "same registered entity" in answer

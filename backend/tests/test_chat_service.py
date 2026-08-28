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

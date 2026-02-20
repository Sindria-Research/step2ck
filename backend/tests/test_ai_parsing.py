"""Tests for AI flashcard response parsing and error handling."""
import pytest

from app.services.ai import _parse_multi_flashcard_response, AIFlashcardError


class TestParseMultiFlashcardResponse:
    def test_basic_two_cards(self):
        raw = (
            "FRONT: What is the most common cause of bacterial meningitis in neonates?\n"
            "BACK: **Group B Streptococcus** (GBS) is the most common cause.\n"
            "\n"
            "FRONT: What is the empiric treatment for neonatal meningitis?\n"
            "BACK: **Ampicillin + gentamicin** (or cefotaxime).\n"
        )
        cards = _parse_multi_flashcard_response(raw)
        assert len(cards) == 2
        assert "bacterial meningitis" in cards[0][0]
        assert "GBS" in cards[0][1] or "Streptococcus" in cards[0][1]
        assert "empiric treatment" in cards[1][0]

    def test_five_cards(self):
        raw = "\n".join(
            f"FRONT: Question {i}\nBACK: Answer {i}\n" for i in range(1, 6)
        )
        cards = _parse_multi_flashcard_response(raw)
        assert len(cards) == 5

    def test_multiline_back(self):
        raw = (
            "FRONT: What are the features of nephrotic syndrome?\n"
            "BACK: Nephrotic syndrome is characterized by:\n"
            "- Proteinuria >3.5g/day\n"
            "- Hypoalbuminemia\n"
            "- Edema\n"
        )
        cards = _parse_multi_flashcard_response(raw)
        assert len(cards) == 1
        assert "Proteinuria" in cards[0][1]

    def test_empty_string(self):
        cards = _parse_multi_flashcard_response("")
        assert cards == []

    def test_front_only_no_back(self):
        raw = "FRONT: A question without an answer"
        cards = _parse_multi_flashcard_response(raw)
        assert cards == []

    def test_back_only_no_front(self):
        raw = "BACK: An answer without a question"
        cards = _parse_multi_flashcard_response(raw)
        assert cards == []

    def test_case_insensitive_markers(self):
        raw = "front: What is X?\nback: X is Y."
        cards = _parse_multi_flashcard_response(raw)
        assert len(cards) == 1

    def test_extra_whitespace(self):
        raw = (
            "   FRONT:   What is X?   \n"
            "   BACK:   X is Y.   \n"
        )
        cards = _parse_multi_flashcard_response(raw)
        assert len(cards) == 1
        assert cards[0][0] == "What is X?"
        assert cards[0][1] == "X is Y."

    def test_no_markers_returns_empty(self):
        raw = "This is just a random text with no FRONT: or BACK: markers."
        cards = _parse_multi_flashcard_response(raw)
        assert cards == []

    def test_markdown_in_back(self):
        raw = (
            "FRONT: What enzyme is deficient in PKU?\n"
            "BACK: **Phenylalanine hydroxylase** deficiency → ↑ phenylalanine, musty odor.\n"
        )
        cards = _parse_multi_flashcard_response(raw)
        assert len(cards) == 1
        assert "**Phenylalanine hydroxylase**" in cards[0][1]


class TestAIFlashcardError:
    def test_error_is_exception(self):
        with pytest.raises(AIFlashcardError, match="test error"):
            raise AIFlashcardError("test error")

    def test_error_message(self):
        err = AIFlashcardError("API key missing")
        assert str(err) == "API key missing"

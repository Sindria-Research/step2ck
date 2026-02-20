"""AI explanation service."""
from __future__ import annotations

import logging
from typing import Optional

import httpx

from app.config import get_settings
from app.models import Question

logger = logging.getLogger(__name__)


def _format_choices(choices: dict[str, str]) -> str:
    out: list[str] = []
    for key in sorted(choices.keys()):
        out.append(f"{key}. {choices[key]}")
    return "\n".join(out)


def _fallback_explanation(
    question: Question,
    selected_answer: Optional[str],
    selection_text: Optional[str],
) -> str:
    if selection_text:
        base = "Chiron is not configured yet. "
        if question.correct_explanation:
            return (
                f"{base}For now, use this core teaching point:\n\n"
                f"{question.correct_explanation}"
            )
        return f"{base}No built-in explanation is available for this question."

    parts: list[str] = []
    if selected_answer:
        if selected_answer == question.correct_answer:
            parts.append("You selected the correct answer.")
        else:
            parts.append(
                f"You selected {selected_answer}. The correct answer is {question.correct_answer}."
            )
    if question.correct_explanation:
        parts.append(question.correct_explanation)
    if question.incorrect_explanation:
        parts.append(f"Why other options are wrong:\n{question.incorrect_explanation}")
    if not parts:
        return "Chiron is not configured yet, and no stored explanation exists."
    return "\n\n".join(parts)


def _build_user_prompt(
    question: Question,
    selected_answer: Optional[str],
    selection_text: Optional[str],
) -> str:
    selected_line = selected_answer or "None"
    mode_block = (
        (
            "Task mode: Explain a selected text snippet from the question stem.\n"
            f"Selection: {selection_text}\n"
            "Focus your explanation on what this selection means and why it matters.\n"
        )
        if selection_text
        else (
            "Task mode: Explain the full question reasoning.\n"
            "Give the key logic that leads to the correct answer, and briefly contrast common traps.\n"
        )
    )
    return (
        f"{mode_block}\n"
        "Question context:\n"
        f"Section: {question.section}\n"
        f"System: {question.system or 'Unknown'}\n"
        f"Stem:\n{question.question_stem}\n\n"
        f"Choices:\n{_format_choices(question.choices)}\n\n"
        f"Correct answer: {question.correct_answer}\n"
        f"User selected answer: {selected_line}\n\n"
        "Stored explanation context:\n"
        f"Correct explanation: {question.correct_explanation or 'N/A'}\n"
        f"Incorrect explanation: {question.incorrect_explanation or 'N/A'}\n"
    )


class AIFlashcardError(Exception):
    """Raised when AI flashcard generation fails."""


def generate_ai_flashcards(
    question: Question,
    selected_answer: Optional[str] = None,
    num_cards: int = 4,
) -> tuple[list[tuple[str, str]], str]:
    """
    Return (cards, model) where cards is a list of (front, back) tuples.
    Raises AIFlashcardError if the AI call fails or is not configured.
    """
    settings = get_settings()

    if not settings.AI_API_KEY:
        raise AIFlashcardError("AI is not configured. Please set an API key.")

    correct_key = question.correct_answer
    correct_text = question.choices.get(correct_key, "")

    payload = {
        "model": settings.AI_MODEL,
        "temperature": 0.4,
        "max_tokens": 1000,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a USMLE Step 2 CK flashcard author.\n\n"
                    "Your job: given a clinical vignette, extract the FUNDAMENTAL CONCEPTS "
                    "it tests and turn each into a standalone flashcard.\n\n"
                    "STRICT RULES:\n"
                    f"1. Create {num_cards} cards. Each tests ONE discrete concept (a diagnosis, "
                    "mechanism, pathophysiology, risk factor, lab finding, treatment, "
                    "next step, or distinguishing feature).\n"
                    "2. FRONT — a short, direct question about the concept. "
                    "Max 1-2 sentences. NEVER copy the vignette. Ask about the "
                    "underlying medical fact, not \"what would you do for this patient.\"\n"
                    "   Good: \"What enzyme is deficient in 21-hydroxylase CAH?\"\n"
                    "   Bad: \"A 32-year-old woman presents with hirsutism...\"\n"
                    "3. BACK — a concise factual answer. Max 1-2 sentences. "
                    "State the key fact clearly. Use **bold** for the most important term.\n"
                    "   Good: \"**21-hydroxylase** deficiency → ↑ 17-OH progesterone, "
                    "↓ cortisol, ± ↓ aldosterone.\"\n"
                    "   Bad: (entire paragraph of explanation)\n"
                    "4. Cards must be useful INDEPENDENTLY. A student should learn a "
                    "discrete fact from each card without seeing the original question.\n"
                    "5. Cover DIFFERENT concepts — do not repeat.\n\n"
                    "OUTPUT FORMAT (exactly):\n"
                    "FRONT: <question>\n"
                    "BACK: <answer>\n\n"
                    "FRONT: <question>\n"
                    "BACK: <answer>\n"
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Section: {question.section}\n"
                    f"System: {question.system or 'General'}\n\n"
                    f"Stem:\n{question.question_stem}\n\n"
                    f"Choices:\n{_format_choices(question.choices)}\n\n"
                    f"Correct answer: {correct_key}. {correct_text}\n"
                    f"User selected: {selected_answer or 'N/A'}\n\n"
                    f"Explanation: {question.correct_explanation or 'N/A'}\n"
                    f"Why others are wrong: {question.incorrect_explanation or 'N/A'}"
                ),
            },
        ],
    }
    headers = {
        "Authorization": f"Bearer {settings.AI_API_KEY}",
        "Content-Type": "application/json",
    }
    url = f"{settings.AI_BASE_URL.rstrip('/')}/chat/completions"

    try:
        with httpx.Client(timeout=settings.AI_TIMEOUT_SECONDS) as client:
            res = client.post(url, headers=headers, json=payload)
            res.raise_for_status()
    except httpx.HTTPStatusError as exc:
        logger.warning("AI flashcard API error %s: %s", exc.response.status_code, exc)
        raise AIFlashcardError(
            "AI service returned an error. Please check your API key and try again."
        ) from exc
    except Exception as exc:
        logger.warning("AI flashcard request failed: %s", exc)
        raise AIFlashcardError(
            "Could not reach the AI service. Please try again later."
        ) from exc

    data = res.json()
    content = (
        data.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "")
        .strip()
    )
    if not content:
        raise AIFlashcardError("AI returned an empty response. Please try again.")

    cards = _parse_multi_flashcard_response(content)
    if not cards:
        raise AIFlashcardError("Could not parse AI response into flashcards. Please try again.")

    return cards, settings.AI_MODEL


def _parse_multi_flashcard_response(raw: str) -> list[tuple[str, str]]:
    """Parse multiple FRONT:/BACK: pairs from the AI response."""
    cards: list[tuple[str, str]] = []
    lines = raw.strip().split("\n")
    front_lines: list[str] = []
    back_lines: list[str] = []
    current: list[str] | None = None

    def _flush() -> None:
        f = "\n".join(front_lines).strip()
        b = "\n".join(back_lines).strip()
        if f and b:
            cards.append((f, b))
        front_lines.clear()
        back_lines.clear()

    for line in lines:
        upper = line.strip().upper()
        if upper.startswith("FRONT:"):
            if front_lines or back_lines:
                _flush()
            current = front_lines
            remainder = line.strip()[6:].strip()
            if remainder:
                current.append(remainder)
        elif upper.startswith("BACK:"):
            current = back_lines
            remainder = line.strip()[5:].strip()
            if remainder:
                current.append(remainder)
        elif current is not None:
            current.append(line)

    _flush()
    return cards


def generate_ai_explanation(
    question: Question,
    selected_answer: Optional[str] = None,
    selection_text: Optional[str] = None,
) -> tuple[str, str, bool]:
    """
    Return explanation text, model label, and fallback flag.
    Falls back to local explanations when API key is missing or remote call fails.
    """
    settings = get_settings()
    if not settings.AI_API_KEY:
        return (
            _fallback_explanation(question, selected_answer, selection_text),
            "fallback",
            True,
        )

    payload = {
        "model": settings.AI_MODEL,
        "temperature": 0.3,
        "max_tokens": 800,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a concise USMLE Step 2 CK tutor. "
                    "Respond in well-structured markdown. "
                    "Use **bold** for key terms, bullet lists for differentials, "
                    "and keep paragraphs short. "
                    "Explain clearly with clinical reasoning. "
                    "Stay grounded in the provided question context."
                ),
            },
            {
                "role": "user",
                "content": _build_user_prompt(question, selected_answer, selection_text),
            },
        ],
    }
    headers = {
        "Authorization": f"Bearer {settings.AI_API_KEY}",
        "Content-Type": "application/json",
    }
    url = f"{settings.AI_BASE_URL.rstrip('/')}/chat/completions"

    try:
        with httpx.Client(timeout=settings.AI_TIMEOUT_SECONDS) as client:
            res = client.post(url, headers=headers, json=payload)
            res.raise_for_status()
        data = res.json()
        content = (
            data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
            .strip()
        )
        if content:
            return content, settings.AI_MODEL, False
        logger.warning("AI response had empty content; using fallback")
    except Exception as exc:
        logger.warning("AI request failed; using fallback: %s", exc)

    return (
        _fallback_explanation(question, selected_answer, selection_text),
        "fallback",
        True,
    )

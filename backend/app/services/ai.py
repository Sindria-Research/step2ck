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

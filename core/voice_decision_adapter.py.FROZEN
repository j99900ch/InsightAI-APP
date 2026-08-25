"""
InsightAI - Voice Decision Adapter

Connects the tested voice-input layer with the
business decision workflow.

This module does not modify the existing voice,
forecasting, decision, or Streamlit modules.
"""

from __future__ import annotations

from typing import Any, Callable

from config.logging_config import get_logger
from core.voice_input import normalize_transcript

logger = get_logger(__name__)


def validate_voice_question(
    question: str,
) -> str:
    """Validate and normalize a spoken business question."""

    if not isinstance(question, str):
        raise TypeError(
            "question must be a string."
        )

    normalized = normalize_transcript(question)

    if not normalized:
        raise ValueError(
            "Voice question cannot be empty."
        )

    return normalized


def prepare_voice_question(
    transcript: str,
) -> dict[str, Any]:
    """
    Convert a speech transcript into a structured
    business-question payload.
    """

    question = validate_voice_question(
        transcript
    )

    return {
        "source": "voice",
        "question": question,
        "valid": True,
    }


def prepare_text_question(
    question: str,
) -> dict[str, Any]:
    """
    Convert a typed question into the same structure
    used by the voice workflow.
    """

    if not isinstance(question, str):
        raise TypeError(
            "question must be a string."
        )

    normalized = normalize_transcript(
        question
    )

    if not normalized:
        raise ValueError(
            "Business question cannot be empty."
        )

    return {
        "source": "text",
        "question": normalized,
        "valid": True,
    }


def run_question_handler(
    question_payload: dict[str, Any],
    handler: Callable[
        [str],
        Any,
    ],
) -> Any:
    """
    Send a validated question to an existing
    business-decision handler.

    The existing handler is injected so this adapter
    does not modify the decision engine.
    """

    if not isinstance(
        question_payload,
        dict,
    ):
        raise TypeError(
            "question_payload must be a dictionary."
        )

    if not callable(handler):
        raise TypeError(
            "handler must be callable."
        )

    question = question_payload.get(
        "question"
    )

    if not isinstance(
        question,
        str,
    ) or not question.strip():
        raise ValueError(
            "question_payload contains no valid question."
        )

    result = handler(
        question.strip()
    )

    logger.info(
        "Business question processed from %s input.",
        question_payload.get(
            "source",
            "unknown",
        ),
    )

    return result


def build_question_payload(
    question: str,
    source: str = "text",
) -> dict[str, Any]:
    """
    Build a normalized question payload.

    Supported sources:
    - text
    - voice
    """

    if not isinstance(
        source,
        str,
    ):
        raise TypeError(
            "source must be a string."
        )

    normalized_source = (
        source.strip().lower()
    )

    if normalized_source == "voice":
        return prepare_voice_question(
            question
        )

    if normalized_source == "text":
        return prepare_text_question(
            question
        )

    raise ValueError(
        "source must be either 'text' or 'voice'."
    )
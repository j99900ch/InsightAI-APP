"""
Tests for InsightAI voice decision adapter.
"""

from unittest.mock import MagicMock

import pytest

from core.voice_decision_adapter import (
    validate_voice_question,
    prepare_voice_question,
    prepare_text_question,
    run_question_handler,
    build_question_payload,
)


def test_validate_voice_question():

    result = validate_voice_question(
        "  Should I increase investment?  "
    )

    assert result == (
        "Should I increase investment?"
    )


def test_validate_voice_question_empty():

    with pytest.raises(ValueError):

        validate_voice_question("")


def test_validate_voice_question_none():

    with pytest.raises(TypeError):

        validate_voice_question(None)


def test_prepare_voice_question():

    result = prepare_voice_question(
        "Should I expand the business?"
    )

    assert result["source"] == "voice"
    assert result["valid"] is True
    assert (
        result["question"]
        == "Should I expand the business?"
    )


def test_prepare_text_question():

    result = prepare_text_question(
        "Should I increase investment?"
    )

    assert result["source"] == "text"
    assert result["valid"] is True
    assert (
        result["question"]
        == "Should I increase investment?"
    )


def test_prepare_text_question_invalid():

    with pytest.raises(ValueError):

        prepare_text_question("")


def test_run_question_handler():

    handler = MagicMock(
        return_value={
            "decision": "recommended"
        }
    )

    payload = prepare_voice_question(
        "Should I invest more?"
    )

    result = run_question_handler(
        payload,
        handler,
    )

    handler.assert_called_once_with(
        "Should I invest more?"
    )

    assert result["decision"] == (
        "recommended"
    )


def test_run_question_handler_invalid_payload():

    handler = MagicMock()

    with pytest.raises(TypeError):

        run_question_handler(
            "invalid",
            handler,
        )


def test_run_question_handler_invalid_handler():

    payload = prepare_text_question(
        "Should I expand?"
    )

    with pytest.raises(TypeError):

        run_question_handler(
            payload,
            None,
        )


def test_build_voice_payload():

    result = build_question_payload(
        "Should I expand?",
        source="voice",
    )

    assert result["source"] == "voice"
    assert result["valid"] is True


def test_build_text_payload():

    result = build_question_payload(
        "Should I expand?",
        source="text",
    )

    assert result["source"] == "text"
    assert result["valid"] is True


def test_invalid_source():

    with pytest.raises(ValueError):

        build_question_payload(
            "Should I expand?",
            source="email",
        )
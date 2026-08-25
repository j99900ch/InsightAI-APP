"""
===========================================================
InsightAI - Voice Input Tests
-----------------------------------------------------------
Tests the isolated voice input engine.

These tests do not access the physical microphone and do
not modify the existing InsightAI analytical pipeline.
===========================================================
"""

from unittest.mock import MagicMock

import pytest

from core.voice_input import (
    normalize_transcript,
    create_recognizer,
    recognize_speech,
)


# ===========================================================
# NORMALIZATION
# ===========================================================

def test_normalize_transcript():

    result = normalize_transcript(
        "   Should   I   increase   investment?   "
    )

    assert result == (
        "Should I increase investment?"
    )


def test_normalize_empty_transcript():

    result = normalize_transcript("")

    assert result == ""


def test_normalize_none():

    result = normalize_transcript(None)

    assert result == ""


# ===========================================================
# RECOGNIZER
# ===========================================================

def test_create_recognizer():

    recognizer = create_recognizer()

    assert recognizer is not None

    assert hasattr(
        recognizer,
        "listen",
    )

    assert hasattr(
        recognizer,
        "recognize_google",
    )


# ===========================================================
# INVALID LANGUAGE
# ===========================================================

def test_invalid_language_type():

    with pytest.raises(TypeError):

        recognize_speech(
            recognizer=MagicMock(),
            language=123,
        )


def test_empty_language():

    with pytest.raises(ValueError):

        recognize_speech(
            recognizer=MagicMock(),
            language="",
        )


# ===========================================================
# SPEECH RECOGNITION MOCK
# ===========================================================

def test_recognize_speech_success(
    monkeypatch,
):

    import core.voice_input as voice_input

    recognizer = MagicMock()

    audio = MagicMock()

    recognizer.listen.return_value = audio

    recognizer.recognize_google.return_value = (
        "Should I increase investment for future growth?"
    )

    microphone = MagicMock()

    microphone.__enter__.return_value = (
        microphone
    )

    microphone.__exit__.return_value = False

    monkeypatch.setattr(
        voice_input.sr,
        "Microphone",
        lambda: microphone,
    )

    result = recognize_speech(
        recognizer=recognizer,
        language="en-IN",
    )

    assert result == (
        "Should I increase investment "
        "for future growth?"
    )

    recognizer.adjust_for_ambient_noise.assert_called_once()

    recognizer.listen.assert_called_once()

    recognizer.recognize_google.assert_called_once_with(
        audio,
        language="en-IN",
    )


# ===========================================================
# SPEECH NOT UNDERSTOOD
# ===========================================================

def test_recognize_speech_unknown_value(
    monkeypatch,
):

    import core.voice_input as voice_input

    recognizer = MagicMock()

    audio = MagicMock()

    recognizer.listen.return_value = audio

    recognizer.recognize_google.side_effect = (
        voice_input.sr.UnknownValueError()
    )

    microphone = MagicMock()

    microphone.__enter__.return_value = (
        microphone
    )

    microphone.__exit__.return_value = False

    monkeypatch.setattr(
        voice_input.sr,
        "Microphone",
        lambda: microphone,
    )

    with pytest.raises(RuntimeError) as exc:

        recognize_speech(
            recognizer=recognizer,
            language="en-IN",
        )

    assert "understand" in str(
        exc.value
    ).lower()


# ===========================================================
# NO SPEECH
# ===========================================================

def test_recognize_speech_timeout(
    monkeypatch,
):

    import core.voice_input as voice_input

    recognizer = MagicMock()

    recognizer.listen.side_effect = (
        voice_input.sr.WaitTimeoutError()
    )

    microphone = MagicMock()

    microphone.__enter__.return_value = (
        microphone
    )

    microphone.__exit__.return_value = False

    monkeypatch.setattr(
        voice_input.sr,
        "Microphone",
        lambda: microphone,
    )

    with pytest.raises(RuntimeError) as exc:

        recognize_speech(
            recognizer=recognizer,
            language="en-IN",
        )

    assert "speech" in str(
        exc.value
    ).lower()


# ===========================================================
# REQUEST ERROR
# ===========================================================

def test_recognize_speech_request_error(
    monkeypatch,
):

    import core.voice_input as voice_input

    recognizer = MagicMock()

    audio = MagicMock()

    recognizer.listen.return_value = audio

    recognizer.recognize_google.side_effect = (
        voice_input.sr.RequestError(
            "service unavailable"
        )
    )

    microphone = MagicMock()

    microphone.__enter__.return_value = (
        microphone
    )

    microphone.__exit__.return_value = False

    monkeypatch.setattr(
        voice_input.sr,
        "Microphone",
        lambda: microphone,
    )

    with pytest.raises(RuntimeError) as exc:

        recognize_speech(
            recognizer=recognizer,
            language="en-IN",
        )

    assert "service" in str(
        exc.value
    ).lower()

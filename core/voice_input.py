"""
===========================================================
InsightAI - Voice Input Engine
-----------------------------------------------------------
Provides isolated microphone-based speech recognition.

This module:
- Converts spoken business questions into text.
- Uses SpeechRecognition.
- Uses the system microphone.
- Does not modify the existing decision pipeline.
- Does not call any paid API.
- Can be connected to Streamlit later.

The module is intentionally isolated so the existing
InsightAI analytical engines remain unchanged.
===========================================================
"""

from __future__ import annotations

from typing import Any

from config.logging_config import get_logger

logger = get_logger(__name__)


# ===========================================================
# OPTIONAL DEPENDENCY
# ===========================================================

try:
    import speech_recognition as sr
except ImportError:
    sr = None


# ===========================================================
# CONSTANTS
# ===========================================================

DEFAULT_LANGUAGE = "en-IN"
DEFAULT_TIMEOUT = 5
DEFAULT_PHRASE_TIME_LIMIT = 15


# ===========================================================
# DEPENDENCY VALIDATION
# ===========================================================

def _validate_dependency() -> None:
    """
    Ensure SpeechRecognition is installed.
    """

    if sr is None:
        raise ImportError(
            "SpeechRecognition is not installed. "
            "Install it with: "
            "pip install SpeechRecognition"
        )


# ===========================================================
# RECOGNIZER CREATION
# ===========================================================

def create_recognizer():
    """
    Create and return a SpeechRecognition recognizer.

    Returns
    -------
    speech_recognition.Recognizer
        Configured recognizer instance.
    """

    _validate_dependency()

    recognizer = sr.Recognizer()

    logger.info(
        "Speech recognizer created."
    )

    return recognizer


# ===========================================================
# MICROPHONE VALIDATION
# ===========================================================

def check_microphone() -> bool:
    """
    Check whether a microphone can be accessed.

    Returns
    -------
    bool
        True when microphone access is available.
    """

    _validate_dependency()

    try:
        with sr.Microphone():
            pass

        logger.info(
            "Microphone is available."
        )

        return True

    except Exception as exc:
        logger.warning(
            "Microphone is not available: %s",
            exc,
        )

        return False


# ===========================================================
# LIST MICROPHONES
# ===========================================================

def list_microphones() -> list[str]:
    """
    Return the available microphone device names.

    Returns
    -------
    list[str]
        Available microphone names.
    """

    _validate_dependency()

    try:
        names = sr.Microphone.list_microphone_names()

        return [
            str(name).strip()
            for name in names
            if str(name).strip()
        ]

    except Exception as exc:
        logger.warning(
            "Unable to list microphones: %s",
            exc,
        )

        return []


# ===========================================================
# TEXT NORMALIZATION
# ===========================================================

def normalize_transcript(
    text: Any,
) -> str:
    """
    Normalize recognized speech text.

    Parameters
    ----------
    text : Any
        Raw speech recognition output.

    Returns
    -------
    str
        Cleaned transcript.
    """

    if text is None:
        return ""

    normalized = " ".join(
        str(text).strip().split()
    )

    return normalized


# ===========================================================
# SPEECH RECOGNITION
# ===========================================================

def recognize_speech(
    recognizer=None,
    language: str = DEFAULT_LANGUAGE,
    timeout: int | None = DEFAULT_TIMEOUT,
    phrase_time_limit: int | None = DEFAULT_PHRASE_TIME_LIMIT,
) -> str:
    """
    Capture speech from the microphone and convert it to text.

    Parameters
    ----------
    recognizer :
        Optional SpeechRecognition recognizer.

    language : str
        Recognition language.

        Default:
        "en-IN"

        This supports Indian English reasonably well.

    timeout : int | None
        Maximum time to wait for speech to begin.

    phrase_time_limit : int | None
        Maximum duration of the spoken phrase.

    Returns
    -------
    str
        Recognized speech text.

    Raises
    ------
    RuntimeError
        When speech could not be understood or processed.
    """

    _validate_dependency()

    if recognizer is None:
        recognizer = create_recognizer()

    if not isinstance(language, str):
        raise TypeError(
            "language must be a string."
        )

    if not language.strip():
        raise ValueError(
            "language cannot be empty."
        )

    try:

        with sr.Microphone() as source:

            logger.info(
                "Listening for business question."
            )

            recognizer.adjust_for_ambient_noise(
                source,
                duration=0.5,
            )

            audio = recognizer.listen(
                source,
                timeout=timeout,
                phrase_time_limit=phrase_time_limit,
            )

        logger.info(
            "Speech captured successfully."
        )

    except sr.WaitTimeoutError as exc:

        logger.warning(
            "No speech detected within timeout."
        )

        raise RuntimeError(
            "No speech detected. "
            "Please try speaking again."
        ) from exc

    except Exception as exc:

        logger.exception(
            "Microphone capture failed."
        )

        raise RuntimeError(
            "Unable to access the microphone. "
            "Check your microphone permissions "
            "and microphone connection."
        ) from exc

    try:

        text = recognizer.recognize_google(
            audio,
            language=language,
        )

    except sr.UnknownValueError as exc:

        logger.warning(
            "Speech could not be understood."
        )

        raise RuntimeError(
            "I could not understand the speech. "
            "Please speak clearly and try again."
        ) from exc

    except sr.RequestError as exc:

        logger.warning(
            "Speech recognition service unavailable: %s",
            exc,
        )

        raise RuntimeError(
            "Speech recognition service is unavailable. "
            "Please check your internet connection "
            "and try again."
        ) from exc

    except Exception as exc:

        logger.exception(
            "Speech recognition failed."
        )

        raise RuntimeError(
            "Speech recognition failed. "
            "Please try again."
        ) from exc

    transcript = normalize_transcript(
        text
    )

    if not transcript:
        raise RuntimeError(
            "No usable speech was recognized."
        )

    logger.info(
        "Speech converted to text successfully."
    )

    return transcript


# ===========================================================
# BUSINESS QUESTION HELPER
# ===========================================================

def capture_business_question(
    language: str = DEFAULT_LANGUAGE,
    timeout: int | None = DEFAULT_TIMEOUT,
    phrase_time_limit: int | None = DEFAULT_PHRASE_TIME_LIMIT,
) -> str:
    """
    Capture a spoken business decision question.

    This function is the future integration point for
    the Streamlit interface.

    Example spoken question:

        "Should I increase my investment
        in this business next year?"

    Returns
    -------
    str
        Transcribed business question.
    """

    return recognize_speech(
        language=language,
        timeout=timeout,
        phrase_time_limit=phrase_time_limit,
    )
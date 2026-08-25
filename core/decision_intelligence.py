"""
===========================================================
InsightAI - Decision Intelligence Orchestrator
-----------------------------------------------------------
Combines existing analytical signals into one structured
business decision analysis.

This module is isolated and does not modify existing
InsightAI engines or Streamlit components.
===========================================================
"""

from __future__ import annotations

from typing import Any

import pandas as pd

from config.logging_config import get_logger

logger = get_logger(__name__)


# ===========================================================
# SIGNAL WEIGHTS
# ===========================================================

SIGNAL_WEIGHTS = {
    "trend": 0.25,
    "forecast": 0.30,
    "risk": 0.20,
    "model": 0.25,
}


# ===========================================================
# VALIDATION
# ===========================================================

def _validate_score(
    value: float,
    name: str,
) -> float:
    """Validate a score between 0 and 100."""

    try:
        value = float(value)
    except (TypeError, ValueError) as exc:
        raise TypeError(
            f"{name} must be numeric."
        ) from exc

    if not 0 <= value <= 100:
        raise ValueError(
            f"{name} must be between 0 and 100."
        )

    return value


# ===========================================================
# TREND SCORE
# ===========================================================

def trend_score(
    trend: str,
) -> float:
    """Convert historical trend into a 0-100 score."""

    mapping = {
        "strong_growth": 100.0,
        "moderate_growth": 80.0,
        "stable": 60.0,
        "moderate_decline": 35.0,
        "strong_decline": 10.0,
    }

    key = str(trend).strip().lower()

    if key not in mapping:
        raise ValueError(
            f"Unsupported trend: {trend}"
        )

    return mapping[key]


# ===========================================================
# FORECAST SCORE
# ===========================================================

def forecast_score(
    direction: str,
) -> float:
    """Convert forecast direction into a 0-100 score."""

    mapping = {
        "strong_growth": 100.0,
        "growth": 80.0,
        "moderate_growth": 80.0,
        "stable": 60.0,
        "decline": 35.0,
        "moderate_decline": 35.0,
        "strong_decline": 10.0,
    }

    key = str(direction).strip().lower()

    if key not in mapping:
        raise ValueError(
            f"Unsupported forecast direction: {direction}"
        )

    return mapping[key]


# ===========================================================
# RISK SCORE
# ===========================================================

def risk_score(
    risk_level: str,
) -> float:
    """
    Convert business risk into a positive decision score.

    Lower risk = higher score.
    """

    mapping = {
        "low": 100.0,
        "medium": 60.0,
        "moderate": 60.0,
        "high": 25.0,
        "critical": 5.0,
    }

    key = str(risk_level).strip().lower()

    if key not in mapping:
        raise ValueError(
            f"Unsupported risk level: {risk_level}"
        )

    return mapping[key]


# ===========================================================
# DECISION SCORE
# ===========================================================

def calculate_decision_score(
    trend: str,
    forecast: str,
    risk: str,
    model_confidence: float,
) -> float:
    """
    Calculate the weighted business decision score.

    Trend       = 25%
    Forecast    = 30%
    Risk        = 20%
    Model       = 25%
    """

    confidence = _validate_score(
        model_confidence,
        "model_confidence",
    )

    score = (
        trend_score(trend)
        * SIGNAL_WEIGHTS["trend"]
        + forecast_score(forecast)
        * SIGNAL_WEIGHTS["forecast"]
        + risk_score(risk)
        * SIGNAL_WEIGHTS["risk"]
        + confidence
        * SIGNAL_WEIGHTS["model"]
    )

    return round(float(score), 2)


# ===========================================================
# DECISION CLASSIFICATION
# ===========================================================

def classify_decision(
    score: float,
) -> str:
    """Classify the final decision score."""

    score = _validate_score(
        score,
        "score",
    )

    if score >= 80:
        return "strongly_recommended"

    if score >= 65:
        return "recommended"

    if score >= 50:
        return "cautious"

    if score >= 30:
        return "not_recommended"

    return "high_risk"


# ===========================================================
# OVERALL RISK
# ===========================================================

def classify_risk(
    score: float,
) -> str:
    """Classify overall decision risk."""

    score = _validate_score(
        score,
        "score",
    )

    if score >= 80:
        return "Low"

    if score >= 60:
        return "Moderate"

    if score >= 40:
        return "High"

    return "Critical"


# ===========================================================
# RECOMMENDATION
# ===========================================================

def generate_recommendation(
    decision: str,
    risk: str,
) -> dict[str, str]:
    """Generate a practical business recommendation."""

    recommendations = {
        "strongly_recommended": (
            "Proceed with the decision while scaling "
            "execution according to available resources."
        ),
        "recommended": (
            "Proceed with controlled investment and "
            "regular performance monitoring."
        ),
        "cautious": (
            "Use a phased approach, validate results, "
            "and avoid aggressive expansion."
        ),
        "not_recommended": (
            "Delay or reduce the decision until stronger "
            "business evidence becomes available."
        ),
        "high_risk": (
            "Avoid aggressive action and reassess the "
            "decision using additional evidence."
        ),
    }

    key = str(decision).strip().lower()

    if key not in recommendations:
        raise ValueError(
            f"Unsupported decision: {decision}"
        )

    recommendation = recommendations[key]

    risk_key = str(risk).strip().lower()

    if risk_key in {"high", "critical"}:
        recommendation += (
            " Risk is elevated, so maintain strict "
            "controls and monitoring."
        )

    return {
        "decision": key,
        "recommendation": recommendation,
    }


# ===========================================================
# SIGNAL TABLE
# ===========================================================

def build_signal_table(
    trend: str,
    forecast: str,
    risk: str,
    model_confidence: float,
) -> pd.DataFrame:
    """Build a transparent decision signal table."""

    confidence = _validate_score(
        model_confidence,
        "model_confidence",
    )

    rows = [
        {
            "Signal": "Historical Trend",
            "Assessment": str(trend),
            "Score": trend_score(trend),
            "Weight": SIGNAL_WEIGHTS["trend"],
        },
        {
            "Signal": "Forecast Direction",
            "Assessment": str(forecast),
            "Score": forecast_score(forecast),
            "Weight": SIGNAL_WEIGHTS["forecast"],
        },
        {
            "Signal": "Business Risk",
            "Assessment": str(risk),
            "Score": risk_score(risk),
            "Weight": SIGNAL_WEIGHTS["risk"],
        },
        {
            "Signal": "Model Confidence",
            "Assessment": f"{confidence:.2f}%",
            "Score": confidence,
            "Weight": SIGNAL_WEIGHTS["model"],
        },
    ]

    table = pd.DataFrame(rows)

    table["Weighted Score"] = (
        table["Score"]
        * table["Weight"]
    ).round(2)

    table["Weight"] = (
        table["Weight"] * 100
    ).round(0)

    return table


# ===========================================================
# COMPLETE ANALYSIS
# ===========================================================

def analyze_decision_intelligence(
    trend: str,
    forecast: str,
    risk: str,
    model_confidence: float,
    business_question: str | None = None,
) -> dict[str, Any]:
    """
    Produce complete business decision intelligence.
    """

    if (
        business_question is not None
        and not str(business_question).strip()
    ):
        raise ValueError(
            "business_question cannot be empty."
        )

    logger.info(
        "Running decision intelligence analysis."
    )

    score = calculate_decision_score(
        trend=trend,
        forecast=forecast,
        risk=risk,
        model_confidence=model_confidence,
    )

    decision = classify_decision(score)

    overall_risk = classify_risk(score)

    recommendation = generate_recommendation(
        decision,
        overall_risk,
    )

    signals = build_signal_table(
        trend=trend,
        forecast=forecast,
        risk=risk,
        model_confidence=model_confidence,
    )

    result = {
        "business_question": business_question,
        "decision_score": score,
        "decision": decision,
        "risk_level": overall_risk,
        "trend": trend,
        "forecast": forecast,
        "input_risk": risk,
        "model_confidence": round(
            float(model_confidence),
            2,
        ),
        "signals": signals,
        "recommendation": recommendation[
            "recommendation"
        ],
    }

    logger.info(
        "Decision intelligence analysis completed "
        "(score=%s, decision=%s).",
        score,
        decision,
    )

    return result
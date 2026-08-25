"""
===========================================================
InsightAI - Decision Orchestrator
-----------------------------------------------------------
Connects forecasting, business decision analysis, and
decision intelligence into one deterministic pipeline.
===========================================================
"""

from __future__ import annotations

from typing import Any

import pandas as pd

from config.logging_config import get_logger
from core.utils import validate_dataframe
from core.forecasting import complete_forecast_analysis
from core.business_decision_engine import analyze_business_decision
from core.decision_intelligence import analyze_decision_intelligence

logger = get_logger(__name__)


# ===========================================================
# INPUT VALIDATION
# ===========================================================

def validate_decision_input(
    df: pd.DataFrame,
    date_column: str,
    target_column: str,
    business_question: str = "",
    years_ahead: int = 5,
) -> None:
    """
    Validate all inputs required by the decision pipeline.
    """

    validate_dataframe(df)

    if date_column not in df.columns:
        raise ValueError(
            f"Date column '{date_column}' not found."
        )

    if target_column not in df.columns:
        raise ValueError(
            f"Target column '{target_column}' not found."
        )

    if not isinstance(
        business_question,
        str,
    ):
        raise TypeError(
            "business_question must be a string."
        )

    if not isinstance(
        years_ahead,
        int,
    ):
        raise TypeError(
            "years_ahead must be an integer."
        )

    if years_ahead <= 0:
        raise ValueError(
            "years_ahead must be greater than zero."
        )


# ===========================================================
# FORECAST LAYER
# ===========================================================

def run_forecast_layer(
    df: pd.DataFrame,
    date_column: str,
    target_column: str,
    years_ahead: int = 5,
) -> dict[str, Any]:
    """
    Run the forecasting layer.
    """

    logger.info(
        "Running forecast layer for '%s'.",
        target_column,
    )

    return complete_forecast_analysis(
        df,
        date_column=date_column,
        target_column=target_column,
        years_ahead=years_ahead,
    )


# ===========================================================
# BUSINESS DECISION LAYER
# ===========================================================

def run_business_decision_layer(
    forecast_result: dict[str, Any],
    business_question: str = "",
) -> dict[str, Any]:
    """
    Convert forecast results into a deterministic
    business decision.
    """

    logger.info(
        "Running business decision layer."
    )

    if not isinstance(
        forecast_result,
        dict,
    ):
        raise TypeError(
            "forecast_result must be a dictionary."
        )

    required_keys = {
        "forecast",
        "trend",
        "summary",
        "recommendation",
    }

    missing = (
        required_keys
        - set(forecast_result.keys())
    )

    if missing:
        raise ValueError(
            "Forecast result is missing required "
            f"keys: {sorted(missing)}"
        )

    trend_data = forecast_result.get(
        "trend",
        {},
    )

    summary_data = forecast_result.get(
        "summary",
        {},
    )

    trend = trend_data.get(
        "trend",
        "stable",
    )

    growth_rate = float(
        summary_data.get(
            "historical_growth_rate",
            0.0,
        )
    )

    return analyze_business_decision(
        trend=trend,
        growth_rate=growth_rate,
        forecast=forecast_result["forecast"],
    )


# ===========================================================
# FORECAST DIRECTION
# ===========================================================

def _derive_forecast_direction(
    forecast_result: dict[str, Any],
) -> str:
    """
    Convert forecast movement into a standardized
    direction used by the decision-intelligence layer.
    """

    forecast = forecast_result.get(
        "forecast"
    )

    if not isinstance(
        forecast,
        pd.DataFrame,
    ):
        raise TypeError(
            "forecast must be a pandas DataFrame."
        )

    if forecast.empty:
        raise ValueError(
            "forecast cannot be empty."
        )

    required_columns = {
        "Year",
        "Forecast",
    }

    missing = (
        required_columns
        - set(forecast.columns)
    )

    if missing:
        raise ValueError(
            "Forecast is missing required "
            f"columns: {sorted(missing)}"
        )

    values = pd.to_numeric(
        forecast["Forecast"],
        errors="coerce",
    ).dropna()

    if values.empty:
        raise ValueError(
            "Forecast must contain numeric values."
        )

    first_value = float(
        values.iloc[0]
    )

    last_value = float(
        values.iloc[-1]
    )

    if first_value == 0:

        if last_value > 0:
            return "growth"

        if last_value < 0:
            return "decline"

        return "stable"

    change = (
        (last_value - first_value)
        / abs(first_value)
        * 100
    )

    if change >= 20:
        return "strong_growth"

    if change > 5:
        return "growth"

    if change <= -20:
        return "strong_decline"

    if change < -5:
        return "decline"

    return "stable"


# ===========================================================
# RISK DERIVATION
# ===========================================================

def _derive_risk(
    business_decision: dict[str, Any],
) -> str:
    """
    Derive a risk level from the business decision layer.
    """

    recommendation = business_decision.get(
        "recommendation",
        {},
    )

    if not isinstance(
        recommendation,
        dict,
    ):
        return "low"

    priority = str(
        recommendation.get(
            "priority",
            "",
        )
    ).strip().lower()

    outlook = str(
        recommendation.get(
            "outlook",
            "",
        )
    ).strip().lower()

    if priority == "critical":
        return "critical"

    if priority == "high":

        if outlook in {
            "negative",
            "caution",
        }:
            return "high"

        return "medium"

    if priority == "medium":
        return "medium"

    return "low"


# ===========================================================
# MODEL CONFIDENCE
# ===========================================================

def _derive_model_confidence(
    forecast_result: dict[str, Any],
) -> float:
    """
    Derive a deterministic confidence estimate from
    available historical and forecast information.
    """

    trend = forecast_result.get(
        "trend",
        {},
    )

    trend_name = str(
        trend.get(
            "trend",
            "stable",
        )
    ).strip().lower()

    growth_rate = abs(
        float(
            forecast_result
            .get("summary", {})
            .get(
                "historical_growth_rate",
                0.0,
            )
        )
    )

    confidence = 60.0

    if trend_name in {
        "strong_growth",
        "strong_decline",
    }:
        confidence += 15.0

    elif trend_name in {
        "moderate_growth",
        "moderate_decline",
    }:
        confidence += 8.0

    if growth_rate >= 20:
        confidence += 10.0

    elif growth_rate >= 5:
        confidence += 5.0

    forecast = forecast_result.get(
        "forecast"
    )

    if (
        isinstance(
            forecast,
            pd.DataFrame,
        )
        and len(forecast) >= 3
    ):
        confidence += 5.0

    return round(
        min(
            95.0,
            max(
                50.0,
                confidence,
            ),
        ),
        2,
    )


# ===========================================================
# DECISION INTELLIGENCE LAYER
# ===========================================================

def run_decision_intelligence_layer(
    forecast_result: dict[str, Any],
    business_decision: dict[str, Any],
    business_question: str = "",
) -> dict[str, Any]:
    """
    Run the decision-intelligence layer using the
    existing business decision and forecast signals.
    """

    logger.info(
        "Running decision intelligence layer."
    )

    trend = (
        forecast_result
        .get("trend", {})
        .get(
            "trend",
            "stable",
        )
    )

    forecast_direction = (
        _derive_forecast_direction(
            forecast_result
        )
    )

    risk = _derive_risk(
        business_decision
    )

    model_confidence = (
        _derive_model_confidence(
            forecast_result
        )
    )

    return analyze_decision_intelligence(
        trend=trend,
        forecast=forecast_direction,
        risk=risk,
        model_confidence=model_confidence,
        business_question=business_question,
    )


# ===========================================================
# FINAL DECISION
# ===========================================================

def build_final_decision(
    forecast_result: dict[str, Any],
    decision_result: dict[str, Any],
    business_question: Any = "",
    intelligence_result: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Combine forecast, business decision, and intelligence
    results into one final structured response.

    Supports the older test calling convention where the
    third positional argument may contain the intelligence
    dictionary.
    """

    if isinstance(
        business_question,
        dict,
    ):

        if intelligence_result is None:
            intelligence_result = business_question

        question_text = ""

    else:

        question_text = (
            business_question.strip()
            if isinstance(
                business_question,
                str,
            )
            else ""
        )

    result = {
        "business_question": question_text,
        "forecast": forecast_result,
        "decision": decision_result,
        "summary": {
            "decision_status": (
                decision_result.get(
                    "decision_status"
                )
            ),
            "growth_rate": (
                decision_result.get(
                    "growth_rate"
                )
            ),
            "forecast_direction": (
                decision_result
                .get("forecast", {})
                .get("direction")
            ),
            "recommendation": (
                decision_result
                .get("recommendation", {})
            ),
        },
    }

    if intelligence_result is not None:

        result["intelligence"] = (
            intelligence_result
        )

        result["business_decision"] = (
            decision_result
        )

        result["decision"] = (
            intelligence_result.get(
                "decision",
                decision_result.get(
                    "decision_status",
                    "cautious",
                ),
            )
        )

        result["risk"] = (
            intelligence_result.get(
                "risk",
                intelligence_result.get(
                    "risk_level",
                    decision_result.get(
                        "risk",
                        "Moderate",
                    ),
                ),
            )
        )

        result["decision_score"] = (
            intelligence_result.get(
                "decision_score",
                0,
            )
        )

        result["confidence"] = (
            intelligence_result.get(
                "confidence",
                intelligence_result.get(
                    "model_confidence",
                    0,
                ),
            )
        )

        result["recommendation"] = (
            intelligence_result.get(
                "recommendation",
                "",
            )
        )

    return result


# ===========================================================
# COMPLETE ORCHESTRATION
# ===========================================================

def orchestrate_business_decision(
    df: pd.DataFrame,
    date_column: str,
    target_column: str,
    business_question: str = "",
    years_ahead: int = 5,
) -> dict[str, Any]:
    """
    Execute the complete deterministic decision pipeline.

    Pipeline:

        Dataset
            ↓
        Validation
            ↓
        Forecasting
            ↓
        Business Decision
            ↓
        Decision Intelligence
            ↓
        Final Decision
    """

    logger.info(
        "Starting complete decision orchestration."
    )

    validate_decision_input(
        df=df,
        date_column=date_column,
        target_column=target_column,
        business_question=business_question,
        years_ahead=years_ahead,
    )

    forecast_result = run_forecast_layer(
        df=df,
        date_column=date_column,
        target_column=target_column,
        years_ahead=years_ahead,
    )

    business_decision = (
        run_business_decision_layer(
            forecast_result,
            business_question=business_question,
        )
    )

    intelligence_result = (
        run_decision_intelligence_layer(
            forecast_result=forecast_result,
            business_decision=business_decision,
            business_question=business_question,
        )
    )

    final_result = build_final_decision(
        forecast_result=forecast_result,
        decision_result=business_decision,
        business_question=business_question,
        intelligence_result=intelligence_result,
    )

    logger.info(
        "Business decision orchestration completed."
    )

    return final_result
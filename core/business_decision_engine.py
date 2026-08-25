"""
===========================================================
InsightAI - Business Decision Engine
-----------------------------------------------------------
Combines existing Decision Tree explainability and
forecasting outputs into one business-oriented result.

This module is isolated and does not modify:
- core/ml.py
- core/prediction.py
- core/decision_tree.py
- core/forecasting.py
===========================================================
"""

from __future__ import annotations

from typing import Any

import pandas as pd

from config.logging_config import get_logger
from core.utils import validate_dataframe

logger = get_logger(__name__)


# ===========================================================
# DECISION STATUS
# ===========================================================

def classify_decision_status(
    trend: str,
    growth_rate: float,
) -> str:
    """
    Classify the overall business outlook.

    Returns one of:
    - Strong Opportunity
    - Growth Opportunity
    - Stable
    - Caution
    - High Risk
    """

    normalized_trend = str(
        trend
    ).strip().lower()

    if normalized_trend == "strong_growth" or growth_rate >= 20:
        return "Strong Opportunity"

    if normalized_trend == "moderate_growth" or growth_rate > 0:
        return "Growth Opportunity"

    if normalized_trend == "stable" or growth_rate == 0:
        return "Stable"

    if normalized_trend == "moderate_decline" or growth_rate > -20:
        return "Caution"

    return "High Risk"


# ===========================================================
# FORECAST DIRECTION
# ===========================================================

def analyze_forecast_direction(
    forecast: pd.DataFrame,
) -> dict[str, Any]:
    """
    Analyze the direction of a forecast dataframe.

    Expected columns:
    - Year
    - Forecast
    """

    if not isinstance(
        forecast,
        pd.DataFrame,
    ):
        raise TypeError(
            "forecast must be a pandas DataFrame."
        )

    if forecast.empty:
        raise ValueError(
            "Forecast dataframe cannot be empty."
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
    )

    if values.isna().all():
        raise ValueError(
            "Forecast values must contain "
            "at least one numeric value."
        )

    values = values.dropna()

    first_value = float(values.iloc[0])
    last_value = float(values.iloc[-1])

    if first_value == 0:
        change_percent = (
            100.0
            if last_value > 0
            else 0.0
        )
    else:
        change_percent = (
            (last_value - first_value)
            / abs(first_value)
            * 100
        )

    if change_percent > 5:
        direction = "increasing"

    elif change_percent < -5:
        direction = "decreasing"

    else:
        direction = "stable"

    return {
        "first_forecast": first_value,
        "last_forecast": last_value,
        "change_percent": round(
            change_percent,
            2,
        ),
        "direction": direction,
    }


# ===========================================================
# RECOMMENDATION
# ===========================================================

def generate_decision_recommendation(
    status: str,
    forecast_direction: str,
) -> dict[str, str]:
    """
    Generate a business-oriented recommendation.

    This is a deterministic recommendation layer.
    It does not use an LLM or external API.
    """

    normalized_status = str(
        status
    ).strip().lower()

    normalized_direction = str(
        forecast_direction
    ).strip().lower()

    if normalized_status == "strong opportunity":

        if normalized_direction == "increasing":
            action = (
                "Consider controlled expansion, "
                "capacity investment, and growth-focused "
                "resource allocation."
            )
        else:
            action = (
                "Validate demand carefully before making "
                "large expansion investments."
            )

        return {
            "priority": "High",
            "outlook": "Positive",
            "recommendation": action,
        }

    if normalized_status == "growth opportunity":

        return {
            "priority": "Medium",
            "outlook": "Positive",
            "recommendation": (
                "Continue growth initiatives while "
                "monitoring costs, demand, and operational capacity."
            ),
        }

    if normalized_status == "stable":

        return {
            "priority": "Medium",
            "outlook": "Stable",
            "recommendation": (
                "Maintain the current strategy while "
                "identifying opportunities for measured improvement."
            ),
        }

    if normalized_status == "caution":

        return {
            "priority": "High",
            "outlook": "Caution",
            "recommendation": (
                "Review costs, demand, operational performance, "
                "and risk factors before increasing investment."
            ),
        }

    return {
        "priority": "Critical",
        "outlook": "Negative",
        "recommendation": (
            "Avoid aggressive expansion until the underlying "
            "decline is investigated and corrective actions "
            "are evaluated."
        ),
    }


# ===========================================================
# BUSINESS DECISION ANALYSIS
# ===========================================================

def analyze_business_decision(
    trend: str,
    growth_rate: float,
    forecast: pd.DataFrame,
) -> dict[str, Any]:
    """
    Combine historical trend and future forecast into
    a single deterministic business decision analysis.
    """

    if not isinstance(
        growth_rate,
        (int, float),
    ):
        raise TypeError(
            "growth_rate must be numeric."
        )

    forecast_analysis = (
        analyze_forecast_direction(
            forecast
        )
    )

    status = classify_decision_status(
        trend,
        float(growth_rate),
    )

    recommendation = (
        generate_decision_recommendation(
            status,
            forecast_analysis["direction"],
        )
    )

    result = {
        "decision_status": status,
        "growth_rate": round(
            float(growth_rate),
            2,
        ),
        "forecast": forecast_analysis,
        "recommendation": recommendation,
    }

    logger.info(
        "Business decision analysis completed."
    )

    return result


# ===========================================================
# DATASET VALIDATION HELPER
# ===========================================================

def validate_business_dataset(
    df: pd.DataFrame,
) -> dict[str, Any]:
    """
    Validate a business dataset before it enters the
    decision-analysis pipeline.

    This function does not modify the dataframe.
    """

    validate_dataframe(df)

    numeric_columns = (
        df.select_dtypes(
            include="number"
        )
        .columns
        .tolist()
    )

    categorical_columns = (
        df.select_dtypes(
            include=[
                "object",
                "category",
                "string",
                "bool",
            ]
        )
        .columns
        .tolist()
    )

    return {
        "rows": int(df.shape[0]),
        "columns": int(df.shape[1]),
        "numeric_columns": numeric_columns,
        "categorical_columns": categorical_columns,
        "missing_values": int(
            df.isna().sum().sum()
        ),
        "duplicates": int(
            df.duplicated().sum()
        ),
    }
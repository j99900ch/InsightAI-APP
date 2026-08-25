"""
===========================================================
InsightAI - Forecasting & Business Recommendation Engine
-----------------------------------------------------------
Provides isolated forecasting utilities for future trend
analysis and business recommendations.

This module does NOT modify the existing ML or Statistics
engines.

Current scope:
- Historical trend analysis
- Numeric time-series preparation
- Five-year baseline forecasting
- Growth calculation
- Trend classification
- Business recommendation generation

===========================================================
"""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd

from sklearn.linear_model import LinearRegression

from config.logging_config import get_logger
from core.utils import validate_dataframe


logger = get_logger(__name__)


# ===========================================================
# TYPES
# ===========================================================

SUPPORTED_TREND_TYPES = {
    "strong_growth",
    "moderate_growth",
    "stable",
    "moderate_decline",
    "strong_decline",
}


# ===========================================================
# VALIDATION
# ===========================================================

def _validate_numeric_series(
    series: pd.Series,
) -> None:
    """Validate that a forecast target is numeric."""

    if not isinstance(series, pd.Series):
        raise TypeError(
            "Target must be a pandas Series."
        )

    if not pd.api.types.is_numeric_dtype(series):
        raise TypeError(
            "Forecast target must be numeric."
        )

    if series.dropna().empty:
        raise ValueError(
            "Forecast target contains no usable values."
        )


# ===========================================================
# DATE DETECTION
# ===========================================================

def detect_datetime_column(
    df: pd.DataFrame,
) -> str | None:
    """
    Detect a suitable datetime column.

    Existing datetime columns are preferred.

    Object/string columns are tested conservatively.
    """

    validate_dataframe(df)

    datetime_columns = (
        df.select_dtypes(
            include=["datetime", "datetimetz"]
        ).columns.tolist()
    )

    if datetime_columns:
        return datetime_columns[0]

    for column in df.columns:

        if pd.api.types.is_numeric_dtype(
            df[column]
        ):
            continue

        converted = pd.to_datetime(
            df[column],
            errors="coerce",
        )

        valid_ratio = (
            converted.notna().mean()
        )

        if valid_ratio >= 0.80:
            return column

    return None


# ===========================================================
# NUMERIC TARGET DETECTION
# ===========================================================

def get_numeric_targets(
    df: pd.DataFrame,
    exclude: str | None = None,
) -> list[str]:
    """
    Return numeric columns suitable for forecasting.
    """

    validate_dataframe(df)

    columns = (
        df.select_dtypes(
            include="number"
        ).columns.tolist()
    )

    if exclude in columns:
        columns.remove(exclude)

    return columns


# ===========================================================
# TIME SERIES PREPARATION
# ===========================================================

def prepare_time_series(
    df: pd.DataFrame,
    date_column: str,
    target_column: str,
) -> pd.DataFrame:
    """
    Prepare historical date/value observations.

    Multiple observations belonging to the same year are
    aggregated using their mean.

    Returns:
        DataFrame containing Year and Value.
    """

    validate_dataframe(df)

    if date_column not in df.columns:
        raise ValueError(
            f"Column '{date_column}' not found."
        )

    if target_column not in df.columns:
        raise ValueError(
            f"Column '{target_column}' not found."
        )

    if not pd.api.types.is_numeric_dtype(
        df[target_column]
    ):
        raise TypeError(
            "Forecast target must be numeric."
        )

    dates = pd.to_datetime(
        df[date_column],
        errors="coerce",
    )

    values = pd.to_numeric(
        df[target_column],
        errors="coerce",
    )

    prepared = pd.DataFrame(
        {
            "Date": dates,
            "Value": values,
        }
    ).dropna()

    if prepared.empty:
        raise ValueError(
            "No valid date/value observations found."
        )

    prepared["Year"] = (
        prepared["Date"].dt.year
    )

    yearly = (
        prepared
        .groupby("Year", as_index=False)["Value"]
        .mean()
        .sort_values("Year")
        .reset_index(drop=True)
    )

    if len(yearly) < 2:
        raise ValueError(
            "At least two years of historical data "
            "are required for forecasting."
        )

    return yearly


# ===========================================================
# TREND ANALYSIS
# ===========================================================

def calculate_growth_rate(
    values: pd.Series | list[float],
) -> float:
    """
    Calculate total percentage growth between the first
    and last usable observations.
    """

    values = pd.Series(values).dropna()

    if len(values) < 2:
        raise ValueError(
            "At least two values are required."
        )

    first = float(values.iloc[0])
    last = float(values.iloc[-1])

    if first == 0:
        if last == 0:
            return 0.0

        return float("inf")

    return (
        (last - first)
        / abs(first)
        * 100
    )


def classify_trend(
    growth_rate: float,
) -> str:
    """
    Classify the overall historical trend.
    """

    if np.isinf(growth_rate):
        return "strong_growth"

    if growth_rate >= 20:
        return "strong_growth"

    if growth_rate >= 5:
        return "moderate_growth"

    if growth_rate > -5:
        return "stable"

    if growth_rate > -20:
        return "moderate_decline"

    return "strong_decline"


def analyze_trend(
    yearly_data: pd.DataFrame,
) -> dict[str, Any]:
    """
    Analyze historical yearly trend.
    """

    if not isinstance(
        yearly_data,
        pd.DataFrame,
    ):
        raise TypeError(
            "yearly_data must be a DataFrame."
        )

    required = {
        "Year",
        "Value",
    }

    if not required.issubset(
        yearly_data.columns
    ):
        raise ValueError(
            "yearly_data must contain "
            "'Year' and 'Value' columns."
        )

    values = yearly_data["Value"]

    growth = calculate_growth_rate(
        values
    )

    trend = classify_trend(
        growth
    )

    years = yearly_data["Year"]

    return {
        "start_year": int(years.iloc[0]),
        "end_year": int(years.iloc[-1]),
        "start_value": float(values.iloc[0]),
        "end_value": float(values.iloc[-1]),
        "growth_rate": (
            round(growth, 2)
            if np.isfinite(growth)
            else growth
        ),
        "trend": trend,
    }


# ===========================================================
# FIVE-YEAR FORECAST
# ===========================================================

def forecast_five_years(
    yearly_data: pd.DataFrame,
    years_ahead: int = 5,
) -> pd.DataFrame:
    """
    Generate a baseline five-year forecast.

    Uses a simple Linear Regression trend model.

    This is intentionally an isolated baseline forecasting
    method. It does not replace the existing ML engine.
    """

    if years_ahead < 1:
        raise ValueError(
            "years_ahead must be at least 1."
        )

    if not isinstance(
        yearly_data,
        pd.DataFrame,
    ):
        raise TypeError(
            "yearly_data must be a DataFrame."
        )

    required = {
        "Year",
        "Value",
    }

    if not required.issubset(
        yearly_data.columns
    ):
        raise ValueError(
            "yearly_data must contain "
            "'Year' and 'Value' columns."
        )

    clean = (
        yearly_data[
            ["Year", "Value"]
        ]
        .dropna()
        .copy()
    )

    if len(clean) < 2:
        raise ValueError(
            "At least two historical observations "
            "are required."
        )

    X = clean[
        ["Year"]
    ]

    y = clean["Value"]

    model = LinearRegression()

    model.fit(
        X,
        y,
    )

    last_year = int(
        clean["Year"].max()
    )

    future_years = np.arange(
        last_year + 1,
        last_year + years_ahead + 1,
    )

    predictions = model.predict(
        future_years.reshape(-1, 1)
    )

    forecast = pd.DataFrame(
        {
            "Year": future_years.astype(int),
            "Forecast": predictions.astype(float),
        }
    )

    forecast["Forecast"] = (
        forecast["Forecast"]
        .round(2)
    )

    return forecast


# ===========================================================
# FORECAST SUMMARY
# ===========================================================

def forecast_summary(
    yearly_data: pd.DataFrame,
    forecast: pd.DataFrame,
) -> dict[str, Any]:
    """
    Generate a combined historical and forecast summary.
    """

    trend = analyze_trend(
        yearly_data
    )

    if forecast.empty:
        raise ValueError(
            "Forecast dataframe is empty."
        )

    first_forecast = float(
        forecast["Forecast"].iloc[0]
    )

    last_forecast = float(
        forecast["Forecast"].iloc[-1]
    )

    forecast_growth = (
        calculate_growth_rate(
            forecast["Forecast"]
        )
    )

    return {
        "historical_trend": trend["trend"],
        "historical_growth_rate": trend[
            "growth_rate"
        ],
        "first_forecast_year": int(
            forecast["Year"].iloc[0]
        ),
        "last_forecast_year": int(
            forecast["Year"].iloc[-1]
        ),
        "first_forecast_value": round(
            first_forecast,
            2,
        ),
        "last_forecast_value": round(
            last_forecast,
            2,
        ),
        "forecast_growth_rate": round(
            forecast_growth,
            2,
        ),
    }


# ===========================================================
# BUSINESS RECOMMENDATION
# ===========================================================

def generate_business_recommendation(
    trend: str,
    forecast_growth_rate: float,
) -> dict[str, str]:
    """
    Generate a rule-based business recommendation from
    historical and forecast trends.

    This intentionally uses deterministic business logic,
    not an LLM, so the result is reproducible and testable.
    """

    if trend not in SUPPORTED_TREND_TYPES:
        raise ValueError(
            f"Unsupported trend type: {trend}"
        )

    if forecast_growth_rate >= 20:

        return {
            "outlook": "Strong Growth",
            "risk_level": "Low to Moderate",
            "recommendation": (
                "Consider controlled expansion, "
                "capacity planning, and investment "
                "to capture expected growth."
            ),
        }

    if forecast_growth_rate >= 5:

        return {
            "outlook": "Moderate Growth",
            "risk_level": "Moderate",
            "recommendation": (
                "Maintain the current growth strategy "
                "while selectively investing in "
                "high-performing areas."
            ),
        }

    if forecast_growth_rate > -5:

        return {
            "outlook": "Stable",
            "risk_level": "Moderate",
            "recommendation": (
                "Focus on operational efficiency, "
                "customer retention, and identifying "
                "new growth opportunities."
            ),
        }

    if forecast_growth_rate > -20:

        return {
            "outlook": "Moderate Decline",
            "risk_level": "High",
            "recommendation": (
                "Review declining drivers, control costs, "
                "and prioritize corrective actions before "
                "committing to major expansion."
            ),
        }

    return {
        "outlook": "Strong Decline",
        "risk_level": "Very High",
        "recommendation": (
            "Prioritize risk reduction, investigate the "
            "root causes of decline, and avoid aggressive "
            "expansion until the trend improves."
        ),
    }


# ===========================================================
# COMPLETE FORECAST ANALYSIS
# ===========================================================

def complete_forecast_analysis(
    df: pd.DataFrame,
    date_column: str,
    target_column: str,
    years_ahead: int = 5,
) -> dict[str, Any]:
    """
    Run the complete forecasting and recommendation
    workflow.
    """

    validate_dataframe(df)

    yearly_data = prepare_time_series(
        df,
        date_column,
        target_column,
    )

    trend = analyze_trend(
        yearly_data
    )

    forecast = forecast_five_years(
        yearly_data,
        years_ahead=years_ahead,
    )

    summary = forecast_summary(
        yearly_data,
        forecast,
    )

    recommendation = (
        generate_business_recommendation(
            trend=trend["trend"],
            forecast_growth_rate=summary[
                "forecast_growth_rate"
            ],
        )
    )

    logger.info(
        "Five-year forecast generated successfully."
    )

    return {
        "historical": yearly_data,
        "forecast": forecast,
        "trend": trend,
        "summary": summary,
        "recommendation": recommendation,
    }
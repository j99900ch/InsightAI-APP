"""
===========================================================
InsightAI - Business Decision Engine Tests
-----------------------------------------------------------
Tests the isolated business decision layer.
===========================================================
"""

import pandas as pd
import pytest

from core.business_decision_engine import (
    analyze_business_decision,
    analyze_forecast_direction,
    classify_decision_status,
    generate_decision_recommendation,
    validate_business_dataset,
)


# ===========================================================
# FIXTURE
# ===========================================================

@pytest.fixture
def forecast_df():

    return pd.DataFrame(
        {
            "Year": [
                2026,
                2027,
                2028,
                2029,
                2030,
            ],
            "Forecast": [
                170000,
                185000,
                200000,
                220000,
                245000,
            ],
        }
    )


@pytest.fixture
def business_df():

    return pd.DataFrame(
        {
            "Revenue": [
                100000,
                120000,
                150000,
            ],
            "Customers": [
                100,
                120,
                150,
            ],
            "Department": [
                "A",
                "B",
                "A",
            ],
        }
    )


# ===========================================================
# STATUS
# ===========================================================

def test_classify_strong_growth():

    result = classify_decision_status(
        "strong_growth",
        25,
    )

    assert result == "Strong Opportunity"


def test_classify_growth():

    result = classify_decision_status(
        "moderate_growth",
        10,
    )

    assert result == "Growth Opportunity"


def test_classify_stable():

    result = classify_decision_status(
        "stable",
        0,
    )

    assert result == "Stable"


def test_classify_caution():

    result = classify_decision_status(
        "moderate_decline",
        -10,
    )

    assert result == "Caution"


def test_classify_high_risk():

    result = classify_decision_status(
        "strong_decline",
        -30,
    )

    assert result == "High Risk"


# ===========================================================
# FORECAST ANALYSIS
# ===========================================================

def test_analyze_forecast_direction(
    forecast_df,
):

    result = analyze_forecast_direction(
        forecast_df
    )

    assert result["direction"] == "increasing"

    assert (
        result["first_forecast"]
        == 170000
    )

    assert (
        result["last_forecast"]
        == 245000
    )

    assert (
        result["change_percent"] > 0
    )


# ===========================================================
# RECOMMENDATION
# ===========================================================

def test_generate_recommendation():

    result = generate_decision_recommendation(
        "Strong Opportunity",
        "increasing",
    )

    assert isinstance(
        result,
        dict,
    )

    assert result["priority"] == "High"

    assert result["outlook"] == "Positive"

    assert (
        "recommendation"
        in result
    )


# ===========================================================
# COMPLETE DECISION
# ===========================================================

def test_analyze_business_decision(
    forecast_df,
):

    result = analyze_business_decision(
        trend="strong_growth",
        growth_rate=25,
        forecast=forecast_df,
    )

    assert isinstance(
        result,
        dict,
    )

    assert (
        result["decision_status"]
        == "Strong Opportunity"
    )

    assert (
        result["growth_rate"]
        == 25
    )

    assert (
        "forecast"
        in result
    )

    assert (
        "recommendation"
        in result
    )


# ===========================================================
# DATASET VALIDATION
# ===========================================================

def test_validate_business_dataset(
    business_df,
):

    result = validate_business_dataset(
        business_df
    )

    assert isinstance(
        result,
        dict,
    )

    assert result["rows"] == 3

    assert result["columns"] == 3

    assert "Revenue" in (
        result["numeric_columns"]
    )

    assert "Department" in (
        result["categorical_columns"]
    )

    assert result["missing_values"] == 0

    assert result["duplicates"] == 0


# ===========================================================
# INVALID FORECAST
# ===========================================================

def test_invalid_forecast_type():

    with pytest.raises(TypeError):

        analyze_forecast_direction(
            [1, 2, 3]
        )


# ===========================================================
# EMPTY FORECAST
# ===========================================================

def test_empty_forecast():

    with pytest.raises(ValueError):

        analyze_forecast_direction(
            pd.DataFrame(
                columns=[
                    "Year",
                    "Forecast",
                ]
            )
        )


# ===========================================================
# INVALID FORECAST COLUMNS
# ===========================================================

def test_invalid_forecast_columns():

    with pytest.raises(ValueError):

        analyze_forecast_direction(
            pd.DataFrame(
                {
                    "Year": [2026],
                    "Value": [100],
                }
            )
        )
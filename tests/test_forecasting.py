"""
===========================================================
InsightAI - Forecasting Engine Tests
-----------------------------------------------------------
Tests the isolated forecasting and business recommendation
layer without modifying existing InsightAI functionality.
===========================================================
"""

import pandas as pd
import pytest

from core.forecasting import (
    analyze_trend,
    calculate_growth_rate,
    classify_trend,
    complete_forecast_analysis,
    detect_datetime_column,
    forecast_five_years,
    generate_business_recommendation,
    get_numeric_targets,
    prepare_time_series,
)


# ===========================================================
# FIXTURE
# ===========================================================

@pytest.fixture
def historical_df():

    return pd.DataFrame(
        {
            "Date": pd.to_datetime(
                [
                    "2021-01-01",
                    "2022-01-01",
                    "2023-01-01",
                    "2024-01-01",
                    "2025-01-01",
                ]
            ),
            "Revenue": [
                100000,
                110000,
                125000,
                140000,
                160000,
            ],
            "Customers": [
                100,
                110,
                125,
                140,
                160,
            ],
            "Department": [
                "A",
                "A",
                "B",
                "B",
                "C",
            ],
        }
    )


# ===========================================================
# DATE DETECTION
# ===========================================================

def test_detect_datetime_column(
    historical_df,
):

    result = detect_datetime_column(
        historical_df
    )

    assert result == "Date"


# ===========================================================
# NUMERIC TARGETS
# ===========================================================

def test_get_numeric_targets(
    historical_df,
):

    result = get_numeric_targets(
        historical_df,
        exclude="Date",
    )

    assert "Revenue" in result
    assert "Customers" in result
    assert "Department" not in result


# ===========================================================
# TIME SERIES PREPARATION
# ===========================================================

def test_prepare_time_series(
    historical_df,
):

    result = prepare_time_series(
        historical_df,
        "Date",
        "Revenue",
    )

    assert not result.empty
    assert list(
        result.columns
    ) == [
        "Year",
        "Value",
    ]

    assert len(result) == 5


# ===========================================================
# GROWTH
# ===========================================================

def test_calculate_growth_rate():

    result = calculate_growth_rate(
        [100, 110, 120]
    )

    assert round(result, 2) == 20.00


# ===========================================================
# TREND CLASSIFICATION
# ===========================================================

def test_classify_trend():

    assert (
        classify_trend(30)
        == "strong_growth"
    )

    assert (
        classify_trend(10)
        == "moderate_growth"
    )

    assert (
        classify_trend(0)
        == "stable"
    )

    assert (
        classify_trend(-10)
        == "moderate_decline"
    )

    assert (
        classify_trend(-30)
        == "strong_decline"
    )


# ===========================================================
# TREND ANALYSIS
# ===========================================================

def test_analyze_trend(
    historical_df,
):

    yearly = prepare_time_series(
        historical_df,
        "Date",
        "Revenue",
    )

    result = analyze_trend(
        yearly
    )

    assert result["start_year"] == 2021
    assert result["end_year"] == 2025
    assert result["end_value"] == 160000
    assert result["trend"] == "strong_growth"


# ===========================================================
# FIVE-YEAR FORECAST
# ===========================================================

def test_forecast_five_years(
    historical_df,
):

    yearly = prepare_time_series(
        historical_df,
        "Date",
        "Revenue",
    )

    result = forecast_five_years(
        yearly,
        years_ahead=5,
    )

    assert len(result) == 5

    assert list(
        result.columns
    ) == [
        "Year",
        "Forecast",
    ]

    assert result["Year"].tolist() == [
        2026,
        2027,
        2028,
        2029,
        2030,
    ]


# ===========================================================
# BUSINESS RECOMMENDATION
# ===========================================================

def test_business_recommendation():

    result = generate_business_recommendation(
        "strong_growth",
        25,
    )

    assert isinstance(
        result,
        dict,
    )

    assert (
        result["outlook"]
        == "Strong Growth"
    )

    assert (
        "recommendation"
        in result
    )


# ===========================================================
# COMPLETE ANALYSIS
# ===========================================================

def test_complete_forecast_analysis(
    historical_df,
):

    result = complete_forecast_analysis(
        historical_df,
        date_column="Date",
        target_column="Revenue",
        years_ahead=5,
    )

    assert isinstance(
        result,
        dict,
    )

    assert (
        "historical"
        in result
    )

    assert (
        "forecast"
        in result
    )

    assert (
        "trend"
        in result
    )

    assert (
        "summary"
        in result
    )

    assert (
        "recommendation"
        in result
    )

    assert len(
        result["forecast"]
    ) == 5


# ===========================================================
# INVALID TARGET
# ===========================================================

def test_invalid_target(
    historical_df,
):

    with pytest.raises(
        ValueError
    ):

        prepare_time_series(
            historical_df,
            "Date",
            "WrongColumn",
        )


# ===========================================================
# INVALID NUMERIC TARGET
# ===========================================================

def test_invalid_numeric_target(
    historical_df,
):

    with pytest.raises(
        TypeError
    ):

        prepare_time_series(
            historical_df,
            "Date",
            "Department",
        )


# ===========================================================
# INSUFFICIENT DATA
# ===========================================================

def test_insufficient_data():

    df = pd.DataFrame(
        {
            "Date": pd.to_datetime(
                ["2025-01-01"]
            ),
            "Revenue": [100],
        }
    )

    with pytest.raises(
        ValueError
    ):

        prepare_time_series(
            df,
            "Date",
            "Revenue",
        )
"""
===========================================================
InsightAI - Decision Orchestrator Tests
===========================================================
"""

import pandas as pd
import pytest

from core.decision_orchestrator import (
    validate_decision_input,
    run_forecast_layer,
    build_final_decision,
    orchestrate_business_decision,
)


@pytest.fixture
def business_df():

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
        }
    )


def test_validate_decision_input(
    business_df,
):

    validate_decision_input(
        business_df,
        date_column="Date",
        target_column="Revenue",
        business_question=(
            "Should we continue investing?"
        ),
        years_ahead=5,
    )


def test_invalid_date_column(
    business_df,
):

    with pytest.raises(ValueError):

        validate_decision_input(
            business_df,
            date_column="WrongDate",
            target_column="Revenue",
        )


def test_invalid_target_column(
    business_df,
):

    with pytest.raises(ValueError):

        validate_decision_input(
            business_df,
            date_column="Date",
            target_column="WrongTarget",
        )


def test_run_forecast_layer(
    business_df,
):

    result = run_forecast_layer(
        business_df,
        date_column="Date",
        target_column="Revenue",
        years_ahead=5,
    )

    assert isinstance(
        result,
        dict,
    )

    assert "forecast" in result
    assert "trend" in result
    assert "summary" in result
    assert "recommendation" in result

    assert len(
        result["forecast"]
    ) == 5


def test_build_final_decision():

    forecast = {
        "forecast": pd.DataFrame(
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
                    180000,
                    190000,
                    200000,
                    210000,
                ],
            }
        ),
        "trend": {
            "trend": "strong_growth",
        },
        "summary": {
            "start_year": 2021,
            "end_year": 2025,
        },
        "recommendation": {
            "recommendation": "Expand",
        },
    }

    business_decision = {
        "decision": "Invest",
        "risk": "Low",
        "confidence": 0.85,
        "recommendation": (
            "Continue growth strategy"
        ),
    }

    intelligence = {
        "decision": "Invest",
        "risk": "Low",
        "decision_score": 82,
        "confidence": 0.85,
        "recommendation": (
            "Continue growth strategy"
        ),
    }

    result = build_final_decision(
        forecast,
        business_decision,
        intelligence,
    )

    assert isinstance(
        result,
        dict,
    )

    assert result["decision"] == "Invest"
    assert result["risk"] == "Low"
    assert result["decision_score"] == 82
    assert result["confidence"] == 0.85

    assert (
        result["recommendation"]
        == "Continue growth strategy"
    )

    assert "forecast" in result
    assert "business_decision" in result
    assert "intelligence" in result


def test_orchestrate_business_decision(
    business_df,
):

    result = orchestrate_business_decision(
        business_df,
        date_column="Date",
        target_column="Revenue",
        business_question=(
            "Should the business continue investing "
            "for future growth?"
        ),
        years_ahead=5,
    )

    assert isinstance(
        result,
        dict,
    )

    assert "decision" in result
    assert "risk" in result
    assert "decision_score" in result
    assert "confidence" in result
    assert "recommendation" in result

    assert "forecast" in result
    assert "business_decision" in result
    assert "intelligence" in result


def test_invalid_years(
    business_df,
):

    with pytest.raises(ValueError):

        validate_decision_input(
            business_df,
            date_column="Date",
            target_column="Revenue",
            years_ahead=0,
        )


def test_invalid_question_type(
    business_df,
):

    with pytest.raises(TypeError):

        validate_decision_input(
            business_df,
            date_column="Date",
            target_column="Revenue",
            business_question=123,
        )
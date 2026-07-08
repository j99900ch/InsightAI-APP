"""
===========================================================
InsightAI - Unit Tests for Insights Module
-----------------------------------------------------------
Tests the business insight generation functions.
===========================================================
"""

import pandas as pd
import pytest

from core.insights import (
    generate_dataset_quality_insights,
    generate_feature_insights,
    generate_business_insights,
    generate_summary,
)


@pytest.fixture
def sample_df():
    """Sample DataFrame for testing."""
    return pd.DataFrame(
        {
            "Age": [20, 25, None, 25],
            "Salary": [30000, 40000, 50000, 40000],
            "Department": ["HR", "IT", "HR", "IT"],
            "JoinDate": pd.to_datetime(
                [
                    "2024-01-01",
                    "2024-02-01",
                    "2024-03-01",
                    "2024-02-01",
                ]
            ),
        }
    )


@pytest.fixture
def duplicate_df(sample_df):
    """Return dataframe with one duplicate row."""
    return pd.concat(
        [sample_df, sample_df.iloc[[1]]],
        ignore_index=True,
    )


# ===========================================================
# Dataset Quality Insights
# ===========================================================

def test_dataset_quality_insights(duplicate_df):
    insights = generate_dataset_quality_insights(duplicate_df)

    assert isinstance(insights, list)
    assert len(insights) > 0


# ===========================================================
# Feature Insights
# ===========================================================

def test_feature_insights(sample_df):
    insights = generate_feature_insights(sample_df)

    assert isinstance(insights, list)
    assert len(insights) >= 3


# ===========================================================
# Business Insights
# ===========================================================

def test_business_insights(sample_df):
    insights = generate_business_insights(sample_df)

    assert isinstance(insights, list)
    assert len(insights) > 0


# ===========================================================
# Summary
# ===========================================================

def test_summary(sample_df):
    summary = generate_summary(sample_df)

    assert isinstance(summary, dict)

    assert "dataset_overview" in summary
    assert "dataset_quality" in summary
    assert "feature_insights" in summary
    assert "business_insights" in summary


# ===========================================================
# Invalid DataFrame
# ===========================================================

def test_invalid_dataframe():
    with pytest.raises(TypeError):
        generate_summary([1, 2, 3])


def test_empty_dataframe():
    with pytest.raises(ValueError):
        generate_summary(pd.DataFrame())
"""
===========================================================
InsightAI - Business Insights Engine
-----------------------------------------------------------
Generates rule-based business insights from datasets.

This module does NOT use AI models.
It provides deterministic insights that can later be
enhanced by an LLM.

Author : Jyoti Chaudhary
Project : InsightAI
===========================================================
"""

from __future__ import annotations

from typing import Any

import pandas as pd

from analysis import (
    dataset_profile,
    get_duplicate_count,
    get_total_missing,
)
from config.logging_config import get_logger
from core.utils import validate_dataframe

logger = get_logger(__name__)


# ===========================================================
# DATASET QUALITY INSIGHTS
# ===========================================================

def generate_dataset_quality_insights(
    df: pd.DataFrame,
) -> list[str]:
    """
    Generate insights related to overall dataset quality.

    Parameters
    ----------
    df : pd.DataFrame
        Input dataset.

    Returns
    -------
    list[str]
        List of quality-related insights.
    """
    validate_dataframe(df)

    logger.info("Generating dataset quality insights.")

    insights: list[str] = []

    missing = get_total_missing(df)
    duplicates = get_duplicate_count(df)

    if missing == 0:
        insights.append(
            "No missing values detected."
        )
    else:
        insights.append(
            f"Dataset contains {missing} missing value(s)."
        )
        insights.append(
            "Cleaning missing values is recommended before analysis."
        )

    if duplicates == 0:
        insights.append(
            "No duplicate rows detected."
        )
    else:
        insights.append(
            f"Dataset contains {duplicates} duplicate row(s)."
        )
        insights.append(
            "Removing duplicate records may improve data quality."
        )

    return insights


# ===========================================================
# FEATURE INSIGHTS
# ===========================================================

def generate_feature_insights(
    df: pd.DataFrame,
) -> list[str]:
    """
    Generate insights about dataset features.

    Parameters
    ----------
    df : pd.DataFrame
        Input dataset.

    Returns
    -------
    list[str]
        Feature-related insights.
    """
    validate_dataframe(df)

    logger.info("Generating feature insights.")

    profile = dataset_profile(df)

    numeric = len(profile["numeric_columns"])
    categorical = len(profile["categorical_columns"])
    datetime = len(profile["datetime_columns"])

    insights: list[str] = []

    insights.append(
        f"Dataset contains {numeric} numeric feature(s)."
    )

    insights.append(
        f"Dataset contains {categorical} categorical feature(s)."
    )

    insights.append(
        f"Dataset contains {datetime} datetime feature(s)."
    )

    if numeric > categorical:
        insights.append(
            "Numeric features dominate the dataset."
        )

    elif categorical > numeric:
        insights.append(
            "Categorical features dominate the dataset."
        )

    else:
        insights.append(
            "Dataset contains a balanced mix of feature types."
        )

    return insights
# ===========================================================
# BUSINESS INSIGHTS
# ===========================================================

def generate_business_insights(
    df: pd.DataFrame,
) -> list[str]:
    """
    Generate high-level business insights based on the dataset.

    Parameters
    ----------
    df : pd.DataFrame
        Input dataset.

    Returns
    -------
    list[str]
        List of business-oriented insights.
    """
    validate_dataframe(df)

    logger.info("Generating business insights.")

    profile = dataset_profile(df)

    insights: list[str] = []

    # -------------------------------------------------------
    # Dataset Size
    # -------------------------------------------------------
    if profile["rows"] >= 1000:
        insights.append(
            "Dataset is sufficiently large for most machine learning tasks."
        )
    else:
        insights.append(
            "Dataset is relatively small; model performance should be validated carefully."
        )

    # -------------------------------------------------------
    # Missing Values
    # -------------------------------------------------------
    if profile["total_missing"] > 0:
        insights.append(
            "Handle missing values before building predictive models."
        )
    else:
        insights.append(
            "Dataset is complete with no missing values."
        )

    # -------------------------------------------------------
    # Duplicate Rows
    # -------------------------------------------------------
    if profile["duplicates"] > 0:
        insights.append(
            "Duplicate records should be reviewed before analysis."
        )

    # -------------------------------------------------------
    # Numeric Features
    # -------------------------------------------------------
    if len(profile["numeric_columns"]) >= 2:
        insights.append(
            "Dataset is suitable for statistical analysis and visualization."
        )

    # -------------------------------------------------------
    # Categorical Features
    # -------------------------------------------------------
    if len(profile["categorical_columns"]) > 0:
        insights.append(
            "Categorical variables may require encoding before machine learning."
        )

    # -------------------------------------------------------
    # Datetime Features
    # -------------------------------------------------------
    if len(profile["datetime_columns"]) > 0:
        insights.append(
            "Datetime features can support trend and time-series analysis."
        )

    return insights


# ===========================================================
# SUMMARY
# ===========================================================

def generate_summary(
    df: pd.DataFrame,
) -> dict[str, Any]:
    """
    Generate a complete summary of dataset insights.

    Parameters
    ----------
    df : pd.DataFrame
        Input dataset.

    Returns
    -------
    dict[str, Any]
        Dictionary containing all generated insights.
    """
    validate_dataframe(df)

    logger.info("Generating complete insight summary.")

    profile = dataset_profile(df)

    summary = {
        "dataset_overview": (
            f"Dataset contains "
            f"{profile['rows']} rows and "
            f"{profile['columns']} columns."
        ),
        "dataset_quality": generate_dataset_quality_insights(df),
        "feature_insights": generate_feature_insights(df),
        "business_insights": generate_business_insights(df),
    }

    logger.info("Insight summary generated successfully.")

    return summary
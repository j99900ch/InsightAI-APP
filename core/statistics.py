"""
===========================================================
InsightAI - Statistics Engine
-----------------------------------------------------------
Reusable statistical utilities for dataset analysis.

This module contains no Streamlit code and can be reused
by the CLI, API and web application.
===========================================================
"""

from __future__ import annotations

from typing import Any

import pandas as pd

from config.logging_config import get_logger
from core.utils import validate_dataframe

logger = get_logger(__name__)

# ===========================================================
# NUMERIC DATA
# ===========================================================


def numeric_dataframe(
    df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Return only numeric columns.
    """

    validate_dataframe(df)

    logger.info(
        "Selecting numeric columns."
    )

    return df.select_dtypes(
        include="number"
    )


# ===========================================================
# SUMMARY STATISTICS
# ===========================================================


def summary_statistics(
    df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Generate descriptive statistics.
    """

    validate_dataframe(df)

    logger.info(
        "Generating summary statistics."
    )

    try:

        statistics = df.describe(
            include="all",
            datetime_is_numeric=True,
        )

    except TypeError:

        statistics = df.describe(
            include="all",
        )

    return statistics.fillna("")


# ===========================================================
# CORRELATION MATRIX
# ===========================================================


def correlation_matrix(
    df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Calculate correlation matrix.
    """

    numeric = numeric_dataframe(df)

    logger.info(
        "Calculating correlation matrix."
    )

    if numeric.empty:

        return pd.DataFrame()

    return numeric.corr(
        numeric_only=True,
    )


# ===========================================================
# COVARIANCE MATRIX
# ===========================================================


def covariance_matrix(
    df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Calculate covariance matrix.
    """

    numeric = numeric_dataframe(df)

    logger.info(
        "Calculating covariance matrix."
    )

    if numeric.empty:

        return pd.DataFrame()

    return numeric.cov()


# ===========================================================
# MISSING VALUE SUMMARY
# ===========================================================


def missing_value_summary(
    df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Return missing value statistics.
    """

    validate_dataframe(df)

    logger.info(
        "Calculating missing values."
    )

    total = df.isna().sum()

    percent = (
        total / len(df) * 100
    ).round(2)

    return pd.DataFrame(
        {
            "Missing": total,
            "Percentage": percent,
        }
    )
# ===========================================================
# SKEWNESS
# ===========================================================

def skewness(
    df: pd.DataFrame,
) -> pd.Series:
    """
    Calculate skewness for numeric columns.
    """

    numeric = numeric_dataframe(df)

    logger.info(
        "Calculating skewness."
    )

    if numeric.empty:
        return pd.Series(dtype=float)

    return numeric.skew()


# ===========================================================
# KURTOSIS
# ===========================================================

def kurtosis(
    df: pd.DataFrame,
) -> pd.Series:
    """
    Calculate kurtosis for numeric columns.
    """

    numeric = numeric_dataframe(df)

    logger.info(
        "Calculating kurtosis."
    )

    if numeric.empty:
        return pd.Series(dtype=float)

    return numeric.kurt()


# ===========================================================
# PERCENTILES
# ===========================================================

def percentiles(
    df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Calculate selected percentiles.
    """

    numeric = numeric_dataframe(df)

    logger.info(
        "Calculating percentiles."
    )

    if numeric.empty:
        return pd.DataFrame()

    return numeric.quantile(
        [
            0.25,
            0.50,
            0.75,
        ]
    )


# ===========================================================
# OUTLIER SUMMARY (IQR)
# ===========================================================

def outlier_summary(
    df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Detect outliers using the IQR method.
    """

    numeric = numeric_dataframe(df)

    logger.info(
        "Detecting outliers."
    )

    if numeric.empty:
        return pd.DataFrame()

    rows = []

    for column in numeric.columns:

        q1 = numeric[column].quantile(0.25)
        q3 = numeric[column].quantile(0.75)

        iqr = q3 - q1

        lower = q1 - 1.5 * iqr
        upper = q3 + 1.5 * iqr

        count = (
            (
                (numeric[column] < lower)
                |
                (numeric[column] > upper)
            )
        ).sum()

        rows.append(
            {
                "Column": column,
                "Outliers": int(count),
            }
        )

    return pd.DataFrame(rows)


# ===========================================================
# FREQUENCY TABLE
# ===========================================================

def frequency_table(
    df: pd.DataFrame,
    column: str,
) -> pd.DataFrame:
    """
    Generate a frequency table.
    """

    validate_dataframe(df)

    if column not in df.columns:
        raise ValueError(
            f"Column '{column}' not found."
        )

    logger.info(
        "Generating frequency table."
    )

    frequency = (
        df[column]
        .value_counts(
            dropna=False,
        )
        .rename("Count")
        .to_frame()
    )

    frequency["Percentage"] = (
        frequency["Count"]
        / len(df)
        * 100
    ).round(2)

    return frequency


# ===========================================================
# COMPLETE STATISTICS
# ===========================================================

def complete_statistics(
    df: pd.DataFrame,
) -> dict[str, Any]:
    """
    Generate a complete statistical summary.
    """

    validate_dataframe(df)

    logger.info(
        "Generating complete statistics."
    )

    return {
        "summary": summary_statistics(df),
        "correlation": correlation_matrix(df),
        "covariance": covariance_matrix(df),
        "missing": missing_value_summary(df),
        "skewness": skewness(df),
        "kurtosis": kurtosis(df),
        "percentiles": percentiles(df),
        "outliers": outlier_summary(df),
    }
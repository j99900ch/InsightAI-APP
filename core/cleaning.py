"""
===========================================================
InsightAI - Data Cleaning Utilities
-----------------------------------------------------------
Reusable data cleaning functions.

Rules:
- Never modify original DataFrame
- Always return a cleaned copy
- Validate inputs
- Log all cleaning operations
===========================================================
"""

from __future__ import annotations

import pandas as pd

from config.logging_config import get_logger
from core.utils import validate_dataframe

logger = get_logger(__name__)


# ===========================================================
# REMOVE DUPLICATES
# ===========================================================

def remove_duplicates(df: pd.DataFrame) -> pd.DataFrame:
    """
    Remove duplicate rows.

    Args:
        df:
            Input DataFrame.

    Returns:
        DataFrame with duplicates removed.
    """

    validate_dataframe(df)

    cleaned_df = df.copy()

    before = len(cleaned_df)

    cleaned_df = cleaned_df.drop_duplicates()

    removed = before - len(cleaned_df)

    logger.info(
        "Removed %s duplicate rows.",
        removed,
    )

    return cleaned_df


# ===========================================================
# FILL NUMERIC MISSING VALUES
# ===========================================================

def fill_missing_numeric(
    df: pd.DataFrame,
    strategy: str = "mean",
) -> pd.DataFrame:
    """
    Fill missing values in numeric columns.

    Strategies:
        mean
        median
        mode
    """

    validate_dataframe(df)

    cleaned_df = df.copy()

    numeric_columns = cleaned_df.select_dtypes(
        include="number"
    ).columns

    for column in numeric_columns:

        if strategy == "mean":
            value = cleaned_df[column].mean()

        elif strategy == "median":
            value = cleaned_df[column].median()

        elif strategy == "mode":
            value = cleaned_df[column].mode().iloc[0]

        else:
            raise ValueError(
                "Strategy must be "
                "'mean', 'median', or 'mode'."
            )

        cleaned_df[column] = (
            cleaned_df[column]
            .fillna(value)
        )

    logger.info(
        "Numeric missing values filled using %s strategy.",
        strategy,
    )

    return cleaned_df


# ===========================================================
# FILL CATEGORICAL MISSING VALUES
# ===========================================================

def fill_missing_categorical(
    df: pd.DataFrame,
    strategy: str = "mode",
    value: str = "Unknown",
) -> pd.DataFrame:
    """
    Fill missing values in categorical columns.

    Strategies:
        mode
        constant
    """

    validate_dataframe(df)

    cleaned_df = df.copy()

    categorical_columns = cleaned_df.select_dtypes(
        include=[
            "object",
            "string",
            "category",
            "bool",
        ]
    ).columns

    for column in categorical_columns:

        if strategy == "mode":

            fill_value = (
                cleaned_df[column]
                .mode()
                .iloc[0]
            )

        elif strategy == "constant":

            fill_value = value

        else:
            raise ValueError(
                "Strategy must be "
                "'mode' or 'constant'."
            )

        cleaned_df[column] = (
            cleaned_df[column]
            .fillna(fill_value)
        )

    logger.info(
        "Categorical missing values filled using %s strategy.",
        strategy,
    )

    return cleaned_df


# ===========================================================
# DROP MISSING ROWS
# ===========================================================

def drop_missing_rows(
    df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Remove rows containing missing values.
    """

    validate_dataframe(df)

    cleaned_df = df.dropna().copy()

    logger.info(
        "Dropped rows containing missing values."
    )

    return cleaned_df


# ===========================================================
# DROP MISSING COLUMNS
# ===========================================================

def drop_missing_columns(
    df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Remove columns containing missing values.
    """

    validate_dataframe(df)

    cleaned_df = df.dropna(
        axis=1
    ).copy()

    logger.info(
        "Dropped columns containing missing values."
    )

    return cleaned_df


# ===========================================================
# STANDARDIZE COLUMN NAMES
# ===========================================================

def standardize_column_names(
    df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Convert column names into a consistent format.

    Example:
        Customer Name
        ->
        customer_name
    """

    validate_dataframe(df)

    cleaned_df = df.copy()

    cleaned_df.columns = [
        str(col)
        .strip()
        .lower()
        .replace(" ", "_")
        for col in cleaned_df.columns
    ]

    logger.info(
        "Column names standardized."
    )

    return cleaned_df
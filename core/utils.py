"""
===========================================================
InsightAI - Utility Functions
-----------------------------------------------------------
Reusable helper functions shared across the project.
===========================================================
"""

from __future__ import annotations

from typing import Any

import pandas as pd

from config.logging_config import get_logger

logger = get_logger(__name__)


def validate_dataframe(df: pd.DataFrame) -> None:
    """
    Validate that the object is a non-empty pandas DataFrame.

    Args:
        df:
            Input dataframe.

    Raises:
        TypeError:
            If input is not a pandas DataFrame.

        ValueError:
            If dataframe is empty.
    """
    if not isinstance(df, pd.DataFrame):
        logger.error("Input object is not a pandas DataFrame.")
        raise TypeError("Input must be a pandas DataFrame.")

    if df.empty:
        logger.error("Received an empty DataFrame.")
        raise ValueError("DataFrame is empty.")


def safe_copy(df: pd.DataFrame) -> pd.DataFrame:
    """
    Return a deep copy of a dataframe.

    Args:
        df:
            Input dataframe.

    Returns:
        Deep copied dataframe.
    """
    validate_dataframe(df)

    logger.debug("Creating dataframe copy.")

    return df.copy(deep=True)


def get_numeric_columns(df: pd.DataFrame) -> list[str]:
    """
    Return numeric columns.

    Args:
        df:
            Input dataframe.

    Returns:
        List of numeric column names.
    """
    validate_dataframe(df)

    return df.select_dtypes(include="number").columns.tolist()


def get_categorical_columns(df: pd.DataFrame) -> list[str]:
    """
    Return categorical columns.

    Args:
        df:
            Input dataframe.

    Returns:
        List of categorical column names.
    """
    validate_dataframe(df)

    return df.select_dtypes(
        include=["object", "string", "category", "bool"]
    ).columns.tolist()


def get_datetime_columns(df: pd.DataFrame) -> list[str]:
    """
    Return datetime columns.

    Args:
        df:
            Input dataframe.

    Returns:
        List of datetime columns.
    """
    validate_dataframe(df)

    return df.select_dtypes(
        include=["datetime", "datetimetz"]
    ).columns.tolist()


def column_exists(df: pd.DataFrame, column: str) -> bool:
    """
    Check whether a column exists.

    Args:
        df:
            Input dataframe.

        column:
            Column name.

    Returns:
        True if column exists.
    """
    validate_dataframe(df)

    return column in df.columns


def memory_usage_mb(df: pd.DataFrame) -> float:
    """
    Calculate dataframe memory usage.

    Args:
        df:
            Input dataframe.

    Returns:
        Memory usage in MB.
    """
    validate_dataframe(df)

    bytes_used = df.memory_usage(deep=True).sum()

    return round(bytes_used / (1024 ** 2), 4)


def dataframe_info(df: pd.DataFrame) -> dict[str, Any]:
    """
    Return basic dataframe metadata.

    Args:
        df:
            Input dataframe.

    Returns:
        Dictionary containing dataframe metadata.
    """
    validate_dataframe(df)

    return {
        "rows": df.shape[0],
        "columns": df.shape[1],
        "memory_mb": memory_usage_mb(df),
        "numeric_columns": get_numeric_columns(df),
        "categorical_columns": get_categorical_columns(df),
        "datetime_columns": get_datetime_columns(df),
    }
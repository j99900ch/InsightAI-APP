"""
===========================================================
InsightAI - Dataset Analysis
-----------------------------------------------------------
Public API for dataset profiling and exploratory analysis.
===========================================================
"""

from __future__ import annotations

from typing import Any

import pandas as pd

from config.logging_config import get_logger
from core.utils import (
    dataframe_info,
    validate_dataframe,
)

logger = get_logger(__name__)


def get_shape(df: pd.DataFrame) -> tuple[int, int]:
    """
    Return the shape of the dataset.

    Args:
        df:
            Input DataFrame.

    Returns:
        Tuple containing (rows, columns).
    """
    validate_dataframe(df)

    logger.info("Calculating dataset shape.")

    return df.shape


def get_total_missing(df: pd.DataFrame) -> int:
    """
    Return the total number of missing values.

    Args:
        df:
            Input DataFrame.

    Returns:
        Total number of missing values.
    """
    validate_dataframe(df)

    logger.info("Calculating total missing values.")

    return int(df.isna().sum().sum())


def get_missing_by_column(df: pd.DataFrame) -> dict[str, int]:
    """
    Return missing value count for every column.

    Args:
        df:
            Input DataFrame.

    Returns:
        Dictionary mapping column names to missing counts.
    """
    validate_dataframe(df)

    logger.info("Calculating missing values by column.")

    return (
        df.isna()
        .sum()
        .astype(int)
        .to_dict()
    )


def get_duplicate_count(df: pd.DataFrame) -> int:
    """
    Return the number of duplicate rows.

    Args:
        df:
            Input DataFrame.

    Returns:
        Number of duplicate rows.
    """
    validate_dataframe(df)

    logger.info("Calculating duplicate rows.")

    return int(df.duplicated().sum())


def get_column_dtypes(df: pd.DataFrame) -> dict[str, str]:
    """
    Return data types for each column.

    Args:
        df:
            Input DataFrame.

    Returns:
        Dictionary mapping column names to their data types.
    """
    validate_dataframe(df)

    logger.info("Collecting column data types.")

    return {
        column: str(dtype)
        for column, dtype in df.dtypes.items()
    }


def dataset_profile(df: pd.DataFrame) -> dict[str, Any]:
    """
    Generate a complete dataset profile.

    Args:
        df:
            Input DataFrame.

    Returns:
        Dictionary containing dataset metadata.
    """
    validate_dataframe(df)

    logger.info("Generating dataset profile.")

    info = dataframe_info(df)

    profile = {
        "rows": info["rows"],
        "columns": info["columns"],
        "memory_mb": info["memory_mb"],
        "numeric_columns": info["numeric_columns"],
        "categorical_columns": info["categorical_columns"],
        "datetime_columns": info["datetime_columns"],
        "total_missing": get_total_missing(df),
        "duplicates": get_duplicate_count(df),
        "column_dtypes": get_column_dtypes(df),
    }

    logger.info("Dataset profile generated successfully.")

    return profile


def business_summary(df: pd.DataFrame) -> dict[str, Any]:
    """
    Generate a business-friendly summary of the dataset.

    Args:
        df:
            Input DataFrame.

    Returns:
        Dictionary containing high-level dataset information.
    """
    profile = dataset_profile(df)

    logger.info("Generating business summary.")

    return {
        "dataset_size": f"{profile['rows']} x {profile['columns']}",
        "duplicates": profile["duplicates"],
        "missing_values": profile["total_missing"],
        "numeric_features": len(profile["numeric_columns"]),
        "categorical_features": len(profile["categorical_columns"]),
        "datetime_features": len(profile["datetime_columns"]),
    }

# ===========================================================
# PROFESSIONAL STATISTICS
# ===========================================================

def descriptive_statistics(df: pd.DataFrame) -> pd.DataFrame:
    """
    Return descriptive statistics for all columns.
    """
    validate_dataframe(df)

    logger.info("Generating descriptive statistics.")

    return df.describe(include="all").transpose()


def numeric_summary(df: pd.DataFrame) -> pd.DataFrame:
    """
    Return statistics for numeric columns only.
    """
    validate_dataframe(df)

    logger.info("Generating numeric summary.")

    numeric_df = df.select_dtypes(include="number")

    if numeric_df.empty:
        return pd.DataFrame()

    return numeric_df.describe().transpose()


def categorical_summary(df: pd.DataFrame) -> pd.DataFrame:
    """
    Return summary for categorical columns.
    """
    validate_dataframe(df)

    logger.info("Generating categorical summary.")

    categorical_df = df.select_dtypes(
        include=["object", "category", "string", "bool"]
    )

    if categorical_df.empty:
        return pd.DataFrame()

    summary = pd.DataFrame({
        "Unique": categorical_df.nunique(),
        "Missing": categorical_df.isna().sum(),
        "Most Frequent": categorical_df.mode().iloc[0],
        "Frequency": categorical_df.apply(
            lambda column: column.value_counts(dropna=True).iloc[0]
            if not column.value_counts(dropna=True).empty
            else 0
        ),
    })

    return summary
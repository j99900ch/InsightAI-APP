"""
===========================================================
InsightAI - Unit Tests for Cleaning Module
===========================================================
"""

import pandas as pd
import pytest

from core.cleaning import (
    remove_duplicates,
    fill_missing_numeric,
    fill_missing_categorical,
    drop_missing_rows,
    drop_missing_columns,
    standardize_column_names,
)


@pytest.fixture
def sample_df():
    return pd.DataFrame(
        {
            "Age": [20, None, 30, 30],
            "Salary": [1000, 2000, None, None],
            "Department": ["HR", None, "IT", "IT"],
        }
    )


@pytest.fixture
def duplicate_df():
    return pd.DataFrame(
        {
            "A": [1, 2, 2],
            "B": [10, 20, 20],
        }
    )


# ===========================================================
# remove_duplicates
# ===========================================================

def test_remove_duplicates(duplicate_df):
    cleaned = remove_duplicates(duplicate_df)

    assert len(cleaned) == 2


# ===========================================================
# fill_missing_numeric
# ===========================================================

def test_fill_missing_numeric_mean(sample_df):
    cleaned = fill_missing_numeric(sample_df)

    assert cleaned["Age"].isna().sum() == 0
    assert cleaned["Salary"].isna().sum() == 0


def test_fill_missing_numeric_median(sample_df):
    cleaned = fill_missing_numeric(sample_df, strategy="median")

    assert cleaned["Age"].isna().sum() == 0


def test_fill_missing_numeric_mode(sample_df):
    cleaned = fill_missing_numeric(sample_df, strategy="mode")

    assert cleaned["Salary"].isna().sum() == 0


# ===========================================================
# fill_missing_categorical
# ===========================================================

def test_fill_missing_categorical_mode(sample_df):
    cleaned = fill_missing_categorical(sample_df)

    assert cleaned["Department"].isna().sum() == 0


def test_fill_missing_categorical_constant(sample_df):
    cleaned = fill_missing_categorical(
        sample_df,
        strategy="constant",
        value="Unknown",
    )

    assert "Unknown" in cleaned["Department"].values


# ===========================================================
# drop_missing_rows
# ===========================================================

def test_drop_missing_rows(sample_df):
    cleaned = drop_missing_rows(sample_df)

    assert len(cleaned) < len(sample_df)


# ===========================================================
# drop_missing_columns
# ===========================================================

def test_drop_missing_columns():
    df = pd.DataFrame(
        {
            "A": [1, 2],
            "B": [None, None],
        }
    )

    cleaned = drop_missing_columns(df)

    assert "B" not in cleaned.columns


# ===========================================================
# standardize_column_names
# ===========================================================

def test_standardize_column_names():
    df = pd.DataFrame(
        {
            " First Name ": ["A"],
            "Last Name": ["B"],
        }
    )

    cleaned = standardize_column_names(df)

    assert "first_name" in cleaned.columns
    assert "last_name" in cleaned.columns


# ===========================================================
# Invalid Strategy
# ===========================================================

def test_invalid_numeric_strategy(sample_df):
    with pytest.raises(ValueError):
        fill_missing_numeric(
            sample_df,
            strategy="invalid",
        )


def test_invalid_categorical_strategy(sample_df):
    with pytest.raises(ValueError):
        fill_missing_categorical(
            sample_df,
            strategy="invalid",
        )


# ===========================================================
# Invalid DataFrame
# ===========================================================

def test_invalid_dataframe():
    with pytest.raises(TypeError):
        remove_duplicates([1, 2, 3])


def test_empty_dataframe():
    with pytest.raises(ValueError):
        remove_duplicates(pd.DataFrame())
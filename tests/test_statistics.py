import pandas as pd
import pytest

from core.statistics import (
    complete_statistics,
    correlation_matrix,
    covariance_matrix,
    frequency_table,
    kurtosis,
    missing_value_summary,
    numeric_dataframe,
    outlier_summary,
    percentiles,
    skewness,
    summary_statistics,
)


# ===========================================================
# FIXTURE
# ===========================================================

@pytest.fixture
def sample_df():
    return pd.DataFrame(
        {
            "Age": [20, 25, 30, 35, 40],
            "Salary": [
                30000,
                35000,
                40000,
                45000,
                500000,
            ],
            "Department": [
                "HR",
                "IT",
                "HR",
                "Sales",
                "IT",
            ],
        }
    )


# ===========================================================
# NUMERIC DATAFRAME
# ===========================================================

def test_numeric_dataframe(sample_df):

    numeric = numeric_dataframe(sample_df)

    assert "Age" in numeric.columns
    assert "Salary" in numeric.columns
    assert "Department" not in numeric.columns


# ===========================================================
# SUMMARY
# ===========================================================

def test_summary_statistics(sample_df):

    stats = summary_statistics(sample_df)

    assert not stats.empty


# ===========================================================
# CORRELATION
# ===========================================================

def test_correlation_matrix(sample_df):

    corr = correlation_matrix(sample_df)

    assert not corr.empty


# ===========================================================
# COVARIANCE
# ===========================================================

def test_covariance_matrix(sample_df):

    cov = covariance_matrix(sample_df)

    assert not cov.empty


# ===========================================================
# MISSING VALUES
# ===========================================================

def test_missing_value_summary(sample_df):

    missing = missing_value_summary(sample_df)

    assert "Missing" in missing.columns
    assert "Percentage" in missing.columns


# ===========================================================
# SKEWNESS
# ===========================================================

def test_skewness(sample_df):

    result = skewness(sample_df)

    assert not result.empty


# ===========================================================
# KURTOSIS
# ===========================================================

def test_kurtosis(sample_df):

    result = kurtosis(sample_df)

    assert not result.empty


# ===========================================================
# PERCENTILES
# ===========================================================

def test_percentiles(sample_df):

    result = percentiles(sample_df)

    assert not result.empty


# ===========================================================
# OUTLIERS
# ===========================================================

def test_outlier_summary(sample_df):

    result = outlier_summary(sample_df)

    assert not result.empty


# ===========================================================
# FREQUENCY TABLE
# ===========================================================

def test_frequency_table(sample_df):

    table = frequency_table(
        sample_df,
        "Department",
    )

    assert not table.empty


# ===========================================================
# COMPLETE STATISTICS
# ===========================================================

def test_complete_statistics(sample_df):

    stats = complete_statistics(sample_df)

    assert isinstance(stats, dict)

    assert "summary" in stats
    assert "correlation" in stats
    assert "covariance" in stats
    assert "missing" in stats
    assert "skewness" in stats
    assert "kurtosis" in stats
    assert "percentiles" in stats
    assert "outliers" in stats
import pandas as pd
import pytest

from analysis import (
    business_summary,
    dataset_profile,
    get_column_dtypes,
    get_duplicate_count,
    get_missing_by_column,
    get_shape,
    get_total_missing,
)


@pytest.fixture
def sample_df():
    """Create a sample DataFrame for testing."""
    return pd.DataFrame(
        {
            "age": [20, 21, None, 21],
            "salary": [1000.0, 1200.0, 1300.0, 1200.0],
            "city": ["A", "B", "C", "B"],
            "joined": pd.to_datetime(
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
    """Return a DataFrame with one duplicate row."""
    return pd.concat(
        [sample_df, sample_df.iloc[[1]]],
        ignore_index=True,
    )


def test_get_shape(sample_df):
    assert get_shape(sample_df) == (4, 4)


def test_total_missing(sample_df):
    assert get_total_missing(sample_df) == 1


def test_missing_by_column(sample_df):
    missing = get_missing_by_column(sample_df)

    assert missing["age"] == 1
    assert missing["salary"] == 0


def test_duplicate_count(duplicate_df):
    assert get_duplicate_count(duplicate_df) == 2


def test_column_dtypes(sample_df):
    dtypes = get_column_dtypes(sample_df)

    assert dtypes["age"] == "float64"
    assert dtypes["city"] in ("object", "str", "string")

def test_dataset_profile(sample_df):
    profile = dataset_profile(sample_df)

    assert profile["rows"] == 4
    assert profile["columns"] == 4
    assert profile["total_missing"] == 1
    assert "memory_mb" in profile


def test_business_summary(sample_df):
    summary = business_summary(sample_df)

    assert summary["dataset_size"] == "4 x 4"
    assert summary["missing_values"] == 1


def test_invalid_dataframe():
    with pytest.raises(TypeError):
        get_shape([1, 2, 3])


def test_empty_dataframe():
    with pytest.raises(ValueError):
        get_shape(pd.DataFrame())
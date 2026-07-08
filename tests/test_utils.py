import pandas as pd
import pytest

from core.utils import (
    validate_dataframe,
    safe_copy,
    get_numeric_columns,
    get_categorical_columns,
    get_datetime_columns,
    column_exists,
    memory_usage_mb,
    dataframe_info,
)


@pytest.fixture
def sample_df():
    return pd.DataFrame(
        {
            "age": [20, 21, 22],
            "salary": [1000.0, 1200.0, 1300.0],
            "city": ["A", "B", "C"],
            "active": [True, False, True],
            "joined": pd.to_datetime(
                ["2024-01-01", "2024-02-01", "2024-03-01"]
            ),
        }
    )


def test_validate_dataframe(sample_df):
    validate_dataframe(sample_df)


def test_validate_dataframe_invalid():
    with pytest.raises(TypeError):
        validate_dataframe([1, 2, 3])


def test_validate_dataframe_empty():
    with pytest.raises(ValueError):
        validate_dataframe(pd.DataFrame())


def test_safe_copy(sample_df):
    copied = safe_copy(sample_df)

    assert copied.equals(sample_df)
    assert copied is not sample_df


def test_numeric_columns(sample_df):
    assert get_numeric_columns(sample_df) == ["age", "salary"]


def test_categorical_columns(sample_df):
    assert get_categorical_columns(sample_df) == ["city", "active"]


def test_datetime_columns(sample_df):
    assert get_datetime_columns(sample_df) == ["joined"]


def test_column_exists(sample_df):
    assert column_exists(sample_df, "age")
    assert not column_exists(sample_df, "abc")


def test_memory_usage(sample_df):
    assert memory_usage_mb(sample_df) > 0


def test_dataframe_info(sample_df):
    info = dataframe_info(sample_df)

    assert info["rows"] == 3
    assert info["columns"] == 5
    assert "numeric_columns" in info
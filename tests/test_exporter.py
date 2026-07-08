import pandas as pd

from core.exporter import (
    ensure_directory,
    export_all,
    export_csv,
    export_excel,
    export_json,
)


# ===========================================================
# FIXTURE
# ===========================================================

def sample_dataframe():
    return pd.DataFrame(
        {
            "Name": [
                "Alice",
                "Bob",
                "Charlie",
            ],
            "Age": [
                25,
                30,
                35,
            ],
            "Salary": [
                50000,
                60000,
                70000,
            ],
        }
    )


# ===========================================================
# DIRECTORY
# ===========================================================

def test_ensure_directory(
    tmp_path,
):

    directory = tmp_path / "exports"

    ensure_directory(directory)

    assert directory.exists()
    assert directory.is_dir()


# ===========================================================
# CSV EXPORT
# ===========================================================

def test_export_csv(
    tmp_path,
):

    df = sample_dataframe()

    file = tmp_path / "sample.csv"

    result = export_csv(
        df,
        file,
    )

    assert result.exists()

    loaded = pd.read_csv(result)

    assert loaded.shape == df.shape


# ===========================================================
# EXCEL EXPORT
# ===========================================================

def test_export_excel(
    tmp_path,
):

    df = sample_dataframe()

    file = tmp_path / "sample.xlsx"

    result = export_excel(
        df,
        file,
    )

    assert result.exists()

    loaded = pd.read_excel(result)

    assert loaded.shape == df.shape


# ===========================================================
# JSON EXPORT
# ===========================================================

def test_export_json(
    tmp_path,
):

    df = sample_dataframe()

    file = tmp_path / "sample.json"

    result = export_json(
        df,
        file,
    )

    assert result.exists()

    loaded = pd.read_json(
        result,
    )

    assert loaded.shape == df.shape


# ===========================================================
# EXPORT ALL
# ===========================================================

def test_export_all(
    tmp_path,
):

    df = sample_dataframe()

    exports = export_all(
        df,
        tmp_path,
        "dataset",
    )

    assert exports["csv"].exists()

    assert exports["excel"].exists()

    assert exports["json"].exists()


# ===========================================================
# INVALID DATAFRAME
# ===========================================================

def test_invalid_dataframe():

    import pytest

    with pytest.raises(TypeError):

        export_csv(
            [1, 2, 3],
            "dummy.csv",
        )
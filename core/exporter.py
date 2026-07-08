"""
===========================================================
InsightAI - Data Export Utilities
-----------------------------------------------------------
Provides reusable functions for exporting datasets.

Supported Formats
-----------------
• CSV
• Excel
• JSON

This module contains no Streamlit UI and can be reused
by the CLI, API and web application.
===========================================================
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd

from config.logging_config import get_logger
from core.utils import validate_dataframe

logger = get_logger(__name__)


# ===========================================================
# DIRECTORY HELPER
# ===========================================================

def ensure_directory(
    directory: Path,
) -> None:
    """
    Create the destination directory if it does
    not already exist.
    """

    directory.mkdir(
        parents=True,
        exist_ok=True,
    )


# ===========================================================
# CSV EXPORT
# ===========================================================

def export_csv(
    df: pd.DataFrame,
    filepath: str | Path,
    index: bool = False,
) -> Path:
    """
    Export a DataFrame to CSV.

    Returns
    -------
    Path
        Path of the exported file.
    """

    validate_dataframe(df)

    path = Path(filepath)

    ensure_directory(path.parent)

    df.to_csv(
        path,
        index=index,
        encoding="utf-8-sig",
    )

    logger.info(
        "CSV exported successfully -> %s",
        path,
    )

    return path


# ===========================================================
# EXCEL EXPORT
# ===========================================================

def export_excel(
    df: pd.DataFrame,
    filepath: str | Path,
    index: bool = False,
) -> Path:
    """
    Export a DataFrame to Excel.

    Returns
    -------
    Path
        Path of the exported file.
    """

    validate_dataframe(df)

    path = Path(filepath)

    ensure_directory(path.parent)

    df.to_excel(
        path,
        index=index,
    )

    logger.info(
        "Excel exported successfully -> %s",
        path,
    )

    return path


# ===========================================================
# JSON EXPORT
# ===========================================================

def export_json(
    df: pd.DataFrame,
    filepath: str | Path,
    orient: str = "records",
) -> Path:
    """
    Export a DataFrame to JSON.

    Returns
    -------
    Path
        Path of the exported file.
    """

    validate_dataframe(df)

    path = Path(filepath)

    ensure_directory(path.parent)

    df.to_json(
        path,
        orient=orient,
        indent=4,
        force_ascii=False,
    )

    logger.info(
        "JSON exported successfully -> %s",
        path,
    )

    return path


# ===========================================================
# EXPORT ALL
# ===========================================================

def export_all(
    df: pd.DataFrame,
    output_directory: str | Path,
    filename: str,
) -> dict[str, Path]:
    """
    Export a dataset to all supported formats.

    Parameters
    ----------
    df
        Input DataFrame.

    output_directory
        Destination folder.

    filename
        File name without extension.

    Returns
    -------
    dict
        Dictionary containing exported file paths.
    """

    validate_dataframe(df)

    directory = Path(output_directory)

    ensure_directory(directory)

    logger.info(
        "Exporting dataset to all formats."
    )

    exports = {
        "csv": export_csv(
            df,
            directory / f"{filename}.csv",
        ),
        "excel": export_excel(
            df,
            directory / f"{filename}.xlsx",
        ),
        "json": export_json(
            df,
            directory / f"{filename}.json",
        ),
    }

    logger.info(
        "All dataset exports completed."
    )

    return exports
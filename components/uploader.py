"""
===========================================================
InsightAI - Dataset Uploader
-----------------------------------------------------------
Streamlit uploader component with reusable file-reading
utilities.

Supported formats:
    CSV
    XLSX
    XLS
    JSON
===========================================================
"""

from __future__ import annotations

from io import BytesIO
from pathlib import Path
from typing import Any

import pandas as pd
import streamlit as st

from analysis import (
    business_summary,
    dataset_profile,
)
from config.logging_config import get_logger

logger = get_logger(__name__)


# ===========================================================
# CONSTANTS
# ===========================================================

SUPPORTED_EXTENSIONS = (
    ".csv",
    ".xlsx",
    ".xls",
    ".json",
)


# ===========================================================
# FILE BYTES
# ===========================================================

def _get_bytes(uploaded_file: Any) -> bytes:
    """
    Return uploaded file contents as bytes.

    The function supports Streamlit UploadedFile objects
    and compatible file-like test objects.
    """

    if uploaded_file is None:
        raise ValueError("No uploaded file was provided.")

    if not hasattr(uploaded_file, "getvalue"):
        raise TypeError(
            "Uploaded file must provide getvalue()."
        )

    data = uploaded_file.getvalue()

    if not isinstance(data, bytes):
        data = bytes(data)

    return data


# ===========================================================
# READ UPLOADED FILE
# ===========================================================

def _read_uploaded_file(
    uploaded_file: Any,
) -> pd.DataFrame:
    """
    Read a supported uploaded file into a DataFrame.

    Supported:
        CSV
        XLSX
        XLS
        JSON

    Raises:
        ValueError:
            If the file extension is unsupported or the file
            cannot be read.
    """

    if uploaded_file is None:
        raise ValueError("No uploaded file was provided.")

    if not hasattr(uploaded_file, "name"):
        raise TypeError(
            "Uploaded file must provide a name."
        )

    filename = str(uploaded_file.name)
    suffix = Path(filename).suffix.lower()

    if suffix not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file type: {suffix or 'unknown'}"
        )

    data = _get_bytes(uploaded_file)

    if not data:
        raise ValueError(
            "The uploaded file is empty."
        )

    buffer = BytesIO(data)

    try:

        if suffix == ".csv":

            df = pd.read_csv(buffer)

        elif suffix in (".xlsx", ".xls"):

            df = pd.read_excel(buffer)

        elif suffix == ".json":

            df = pd.read_json(buffer)

        else:
            raise ValueError(
                f"Unsupported file type: {suffix}"
            )

    except ValueError:
        raise

    except Exception as exc:

        logger.exception(
            "Unable to read uploaded file: %s",
            filename,
        )

        raise ValueError(
            f"Unable to read uploaded file: {filename}"
        ) from exc

    if not isinstance(df, pd.DataFrame):
        raise ValueError(
            "Uploaded file did not produce a DataFrame."
        )

    if df.empty:
        raise ValueError(
            "The uploaded dataset is empty."
        )

    logger.info(
        "Uploaded dataset read successfully: %s "
        "(rows=%s, columns=%s)",
        filename,
        len(df),
        len(df.columns),
    )

    return df


# ===========================================================
# HANDLE UPLOAD
# ===========================================================

def handle_upload(
    uploaded_file: Any,
) -> pd.DataFrame | None:
    """
    Read an uploaded file and initialize the application's
    dataset-related session state.

    Returns:
        DataFrame when successful.

    Raises:
        ValueError:
            If the uploaded file is invalid.
    """

    if uploaded_file is None:
        return None

    df = _read_uploaded_file(uploaded_file)

    filename = str(uploaded_file.name)

    profile = dataset_profile(df)
    summary = business_summary(df)

    st.session_state.data_loaded = True
    st.session_state.filename = filename
    st.session_state.df = df
    st.session_state.profile = profile
    st.session_state.summary = summary

    # Keep compatibility with the main application state.
    st.session_state.dataframe = df
    st.session_state.uploaded_filename = filename
    st.session_state.clean_dataframe = None

    logger.info(
        "Upload handled successfully: %s",
        filename,
    )

    return df


# ===========================================================
# STREAMLIT UI
# ===========================================================

def render_uploader() -> pd.DataFrame | None:
    """
    Render the Streamlit dataset uploader.

    Returns:
        Uploaded DataFrame or None.
    """

    st.subheader("Upload Data")

    uploaded = st.file_uploader(
        "Upload CSV, Excel, or JSON",
        type=[
            "csv",
            "xlsx",
            "xls",
            "json",
        ],
        accept_multiple_files=False,
    )

    if uploaded is None:
        st.info(
            "Please upload a file to continue."
        )
        return None

    try:

        df = handle_upload(uploaded)

        st.success(
            f"Loaded {uploaded.name}"
        )

        return df

    except ValueError as exc:

        logger.warning(
            "Upload rejected: %s",
            exc,
        )

        st.error(str(exc))

        return None

    except Exception as exc:

        logger.exception(
            "Unexpected upload error."
        )

        st.error(
            "An unexpected error occurred while "
            "processing the uploaded file."
        )

        return None
"""
===========================================================
InsightAI - Export UI
-----------------------------------------------------------
Professional dataset export dashboard.

Responsibilities
-----------------
- Display export options
- Export current dataset as CSV
- Export current dataset as Excel
- Export current dataset as JSON
- Provide Streamlit download buttons
- Keep export logic separated from UI

This module does NOT modify core.exporter.py.
===========================================================
"""

from __future__ import annotations

from io import BytesIO
from pathlib import Path
import re

import pandas as pd
import streamlit as st

from core.exporter import export_all


# ===========================================================
# SESSION STATE
# ===========================================================

def init_export_state() -> None:
    """Initialize export-related session state."""

    defaults = {
        "export_ready": False,
        "export_filename": "InsightAI_Dataset",
    }

    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value


# ===========================================================
# DATA VALIDATION
# ===========================================================

def get_current_dataframe() -> pd.DataFrame | None:
    """
    Return the currently loaded dataframe.

    Returns
    -------
    pandas.DataFrame | None
        Current dataset if available.
    """

    df = st.session_state.get("df")

    if not isinstance(df, pd.DataFrame):
        return None

    if df.empty:
        return None

    return df


# ===========================================================
# FILE NAME
# ===========================================================

def sanitize_filename(filename: str) -> str:
    """Return a filesystem-safe filename."""

    filename = str(filename).strip()

    filename = re.sub(
        r'[<>:"/\\|?*]',
        "_",
        filename,
    )

    filename = re.sub(
        r"\s+",
        "_",
        filename,
    )

    filename = filename.strip(" ._")

    if not filename:
        return "InsightAI_Dataset"

    return filename


def build_export_filename() -> str:
    """Build a safe default export filename."""

    original_name = st.session_state.get(
        "uploaded_file_name"
    )

    if original_name:
        name = Path(str(original_name)).stem
        name = sanitize_filename(name)

        if name:
            return f"{name}_InsightAI"

    return "InsightAI_Dataset"


# ===========================================================
# CSV BUFFER
# ===========================================================

def dataframe_to_csv_bytes(
    df: pd.DataFrame,
) -> bytes:
    """Convert dataframe to UTF-8 CSV bytes."""

    return df.to_csv(
        index=False,
    ).encode("utf-8-sig")


# ===========================================================
# EXCEL BUFFER
# ===========================================================

def dataframe_to_excel_bytes(
    df: pd.DataFrame,
) -> bytes:
    """Convert dataframe to Excel bytes."""

    buffer = BytesIO()

    with pd.ExcelWriter(
        buffer,
        engine="openpyxl",
    ) as writer:

        df.to_excel(
            writer,
            index=False,
            sheet_name="InsightAI Data",
        )

    buffer.seek(0)

    return buffer.getvalue()


# ===========================================================
# JSON BUFFER
# ===========================================================

def dataframe_to_json_bytes(
    df: pd.DataFrame,
) -> bytes:
    """Convert dataframe to JSON bytes."""

    return df.to_json(
        orient="records",
        indent=4,
        force_ascii=False,
    ).encode("utf-8")


# ===========================================================
# EXPORT ALL TO LOCAL OUTPUT
# ===========================================================

def prepare_export_files(
    df: pd.DataFrame,
    filename: str,
) -> dict[str, Path]:
    """
    Prepare CSV, Excel and JSON exports.

    Uses the existing core exporter without modifying it.
    """

    safe_filename = sanitize_filename(filename)

    exports = export_all(
        df,
        "exports",
        safe_filename,
    )

    return exports


# ===========================================================
# UI HEADER
# ===========================================================

def render_export_header() -> None:
    """Render professional export header."""

    st.title("Export Center")

    st.caption(
        "Download your analyzed dataset in "
        "professional, business-ready formats."
    )

    st.divider()


# ===========================================================
# DATASET STATUS
# ===========================================================

def render_dataset_status(
    df: pd.DataFrame,
) -> None:
    """Render current dataset status."""

    filename = st.session_state.get(
        "uploaded_file_name"
    )

    rows, columns = df.shape

    st.subheader("Current Dataset")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.metric(
            "Rows",
            f"{rows:,}",
        )

    with col2:
        st.metric(
            "Columns",
            f"{columns:,}",
        )

    with col3:
        st.metric(
            "File",
            filename or "Dataset",
        )

    st.divider()


# ===========================================================
# DOWNLOAD SECTION
# ===========================================================

def render_download_section(
    df: pd.DataFrame,
    filename: str,
) -> None:
    """Render download buttons."""

    st.subheader("Download Dataset")

    st.caption(
        "Choose a format below. Your original dataset "
        "remains unchanged."
    )

    csv_data = dataframe_to_csv_bytes(df)

    excel_data = dataframe_to_excel_bytes(df)

    json_data = dataframe_to_json_bytes(df)

    col1, col2, col3 = st.columns(3)

    with col1:

        st.markdown("### CSV")

        st.caption(
            "Universal tabular format"
        )

        st.download_button(
            label="Download CSV",
            data=csv_data,
            file_name=f"{filename}.csv",
            mime="text/csv",
            use_container_width=True,
        )

    with col2:

        st.markdown("### Excel")

        st.caption(
            "Business spreadsheet format"
        )

        st.download_button(
            label="Download Excel",
            data=excel_data,
            file_name=f"{filename}.xlsx",
            mime=(
                "application/vnd.openxmlformats-"
                "officedocument.spreadsheetml.sheet"
            ),
            use_container_width=True,
        )

    with col3:

        st.markdown("### JSON")

        st.caption(
            "Application and API friendly format"
        )

        st.download_button(
            label="Download JSON",
            data=json_data,
            file_name=f"{filename}.json",
            mime="application/json",
            use_container_width=True,
        )


# ===========================================================
# LOCAL EXPORT SECTION
# ===========================================================

def render_local_export_section(
    df: pd.DataFrame,
    filename: str,
) -> None:
    """Export files into the application's exports folder."""

    st.divider()

    st.subheader("Export Package")

    st.caption(
        "Create CSV, Excel and JSON files together "
        "inside the application's exports folder."
    )

    if st.button(
        "Generate Complete Export Package",
        use_container_width=True,
        type="primary",
    ):

        try:

            exports = prepare_export_files(
                df,
                filename,
            )

            st.session_state.export_ready = True

            st.success(
                "Export package generated successfully."
            )

            st.write("Generated files:")

            for format_name, path in exports.items():

                st.write(
                    f"**{format_name.upper()}** -> `{path}`"
                )

        except Exception as exc:

            st.session_state.export_ready = False

            st.error(
                "Unable to generate the export package."
            )

            st.exception(exc)


# ===========================================================
# DATA PREVIEW
# ===========================================================

def render_export_preview(
    df: pd.DataFrame,
) -> None:
    """Display a compact preview before export."""

    st.divider()

    with st.expander(
        "Preview Dataset Before Export",
        expanded=False,
    ):

        st.dataframe(
            df.head(10),
            use_container_width=True,
            hide_index=True,
        )

        st.caption(
            f"Showing first "
            f"{min(len(df), 10):,} rows "
            f"of {len(df):,} total rows."
        )


# ===========================================================
# FORMAT INFORMATION
# ===========================================================

def render_format_information() -> None:
    """Explain supported export formats."""

    st.divider()

    st.subheader("Export Format Guide")

    col1, col2, col3 = st.columns(3)

    with col1:

        st.markdown(
            """
**CSV**

Best for:

- Data analysis
- Sharing datasets
- Importing into other tools
"""
        )

    with col2:

        st.markdown(
            """
**Excel**

Best for:

- Business reporting
- Manual analysis
- Spreadsheet workflows
"""
        )

    with col3:

        st.markdown(
            """
**JSON**

Best for:

- APIs
- Applications
- Machine-readable data
"""
        )


# ===========================================================
# MAIN UI
# ===========================================================

def render_export_ui() -> None:
    """Render the complete Export Center."""

    init_export_state()

    render_export_header()

    df = get_current_dataframe()

    if df is None:

        st.warning(
            "No dataset is currently loaded."
        )

        st.info(
            "Go to **Dataset Overview** and upload "
            "a CSV or Excel dataset first."
        )

        return

    render_dataset_status(df)

    default_filename = build_export_filename()

    filename = st.text_input(
        "Export File Name",
        value=default_filename,
        help=(
            "Enter the name to use for downloaded "
            "CSV, Excel and JSON files."
        ),
    )

    filename = sanitize_filename(filename)

    for extension in (
        ".csv",
        ".xlsx",
        ".json",
    ):

        if filename.lower().endswith(extension):

            filename = filename[
                : -len(extension)
            ]

    if not filename:
        filename = "InsightAI_Dataset"

    st.session_state.export_filename = filename

    render_download_section(
        df,
        filename,
    )

    render_local_export_section(
        df,
        filename,
    )

    render_export_preview(
        df,
    )

    render_format_information()

    st.divider()

    st.caption(
        "InsightAI Export Center | Version 2.0"
    )
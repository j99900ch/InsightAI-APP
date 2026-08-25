"""
===========================================================
InsightAI - Data Cleaning UI
-----------------------------------------------------------
Professional Data Cleaning Dashboard
===========================================================
"""

from __future__ import annotations

import pandas as pd
import streamlit as st


def render_cleaning_ui() -> None:
    """Render professional data cleaning dashboard."""

    st.title("🧹 Data Cleaning Dashboard")

    if (
        "df" not in st.session_state
        or st.session_state.df is None
    ):
        st.warning("Please upload a dataset first.")
        return

    df = st.session_state.df.copy()

    st.success(
        f"Dataset : {st.session_state.uploaded_file_name}"
    )

    st.divider()

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric(
            "Rows",
            df.shape[0],
        )

    with col2:
        st.metric(
            "Columns",
            df.shape[1],
        )

    with col3:
        st.metric(
            "Missing Values",
            int(df.isna().sum().sum()),
        )

    with col4:
        st.metric(
            "Duplicates",
            int(df.duplicated().sum()),
        )

    st.divider()

    st.subheader("Cleaning Options")

    remove_duplicates = st.checkbox(
        "Remove Duplicate Rows"
    )

    remove_unnamed = st.checkbox(
        "Delete Unnamed Columns"
    )

    remove_empty_rows = st.checkbox(
        "Remove Empty Rows"
    )

    remove_empty_columns = st.checkbox(
        "Remove Empty Columns"
    )

    fill_numeric = st.selectbox(
        "Fill Numeric Missing Values",
        [
            "Do Nothing",
            "Mean",
            "Median",
            "Zero",
        ],
    )

    fill_categorical = st.selectbox(
        "Fill Categorical Missing Values",
        [
            "Do Nothing",
            "Mode",
            "Unknown",
        ],
    )

    st.divider()

    if st.button(
        "🚀 Clean Dataset",
        width="stretch",
    ):

        cleaned = df.copy()

        if remove_duplicates:
            cleaned = cleaned.drop_duplicates()

        if remove_unnamed:
            cleaned = cleaned.loc[
                :,
                ~cleaned.columns.str.contains(
                    "^Unnamed"
                ),
            ]

        if remove_empty_rows:
            cleaned = cleaned.dropna(
                how="all"
            )

        if remove_empty_columns:
            cleaned = cleaned.dropna(
                axis=1,
                how="all",
            )

        numeric = cleaned.select_dtypes(
            include="number"
        ).columns

        categorical = cleaned.select_dtypes(
            include=[
                "object",
                "category",
                "string",
            ]
        ).columns

        if fill_numeric == "Mean":
            cleaned[numeric] = cleaned[
                numeric
            ].fillna(
                cleaned[numeric].mean()
            )

        elif fill_numeric == "Median":
            cleaned[numeric] = cleaned[
                numeric
            ].fillna(
                cleaned[numeric].median()
            )

        elif fill_numeric == "Zero":
            cleaned[numeric] = cleaned[
                numeric
            ].fillna(0)

        if (
            fill_categorical == "Mode"
            and len(categorical) > 0
        ):
            for column in categorical:
                cleaned[column] = cleaned[
                    column
                ].fillna(
                    cleaned[column].mode()[0]
                )

        elif fill_categorical == "Unknown":
            cleaned[categorical] = cleaned[
                categorical
            ].fillna(
                "Unknown"
            )

        st.session_state.df = cleaned

        st.success(
            "Dataset cleaned successfully."
        )

        st.subheader("Preview")

        st.dataframe(
            cleaned.head(),
            width="stretch",
        )

        csv = cleaned.to_csv(
            index=False
        ).encode("utf-8")

        st.download_button(
            "⬇ Download Cleaned Dataset",
            csv,
            "cleaned_dataset.csv",
            "text/csv",
            width="stretch",
        )
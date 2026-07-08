"""
===========================================================
InsightAI - Statistics UI
-----------------------------------------------------------
Professional descriptive statistics dashboard.
===========================================================
"""

from __future__ import annotations

import pandas as pd
import streamlit as st

from analysis import (
    descriptive_statistics,
    numeric_summary,
    categorical_summary,
)


def render_statistics_ui() -> None:

    st.title("📊 Statistics Dashboard")

    if st.session_state.df is None:
        st.warning("Upload a dataset first.")
        return

    df = st.session_state.df

    st.success(
        f"Dataset : {st.session_state.uploaded_file_name}"
    )

    st.divider()

    rows, cols = df.shape

    missing = int(df.isna().sum().sum())

    duplicates = int(df.duplicated().sum())

    numeric = len(
        df.select_dtypes(include="number").columns
    )

    categorical = len(
        df.select_dtypes(
            include=["object", "category", "bool"]
        ).columns
    )

    c1, c2, c3, c4, c5, c6 = st.columns(6)

    c1.metric("Rows", rows)

    c2.metric("Columns", cols)

    c3.metric("Missing", missing)

    c4.metric("Duplicates", duplicates)

    c5.metric("Numeric", numeric)

    c6.metric("Categorical", categorical)

    st.divider()

    st.subheader("Overall Statistics")

    stats = descriptive_statistics(df)

    st.dataframe(
        stats,
        use_container_width=True,
    )

    st.divider()

    st.subheader("Numeric Summary")

    numeric_stats = numeric_summary(df)

    if numeric_stats.empty:

        st.info("No numeric columns found.")

    else:

        st.dataframe(
            numeric_stats,
            use_container_width=True,
        )

    st.divider()

    st.subheader("Categorical Summary")

    cat = categorical_summary(df)

    if cat.empty:

        st.info("No categorical columns found.")

    else:

        st.dataframe(
            cat,
            use_container_width=True,
        )

    st.divider()

    st.subheader("Missing Values")

    missing_table = (
        df.isna()
        .sum()
        .reset_index()
    )

    missing_table.columns = [
        "Column",
        "Missing Values",
    ]

    missing_table["Percentage"] = (
        missing_table["Missing Values"]
        / len(df)
        * 100
    ).round(2)

    st.dataframe(
        missing_table,
        use_container_width=True,
    )
"""
===========================================================
InsightAI - Statistics UI
-----------------------------------------------------------
Modern descriptive statistics dashboard.

Responsibilities:
- Display dataset health KPIs
- Display descriptive statistics
- Display numeric analysis
- Display categorical analysis
- Display missing-value analysis
- Provide a professional Streamlit presentation layer

This module does not modify existing analysis engines.
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


# ===========================================================
# UI HELPERS
# ===========================================================

def _inject_statistics_styles() -> None:
    """Inject isolated styling for the statistics dashboard."""

    st.markdown(
        """
        <style>
        .insight-section {
            padding: 0.35rem 0 0.75rem 0;
        }

        .insight-section-title {
            font-size: 1.35rem;
            font-weight: 700;
            margin-bottom: 0.15rem;
        }

        .insight-section-subtitle {
            color: #6b7280;
            font-size: 0.88rem;
            margin-bottom: 1rem;
        }

        .dataset-banner {
            padding: 0.85rem 1rem;
            border-radius: 12px;
            border: 1px solid rgba(99, 102, 241, 0.20);
            background: linear-gradient(
                135deg,
                rgba(99, 102, 241, 0.08),
                rgba(59, 130, 246, 0.04)
            );
            margin-bottom: 1rem;
        }

        .dataset-banner-title {
            font-size: 0.95rem;
            font-weight: 700;
        }

        .dataset-banner-subtitle {
            font-size: 0.80rem;
            color: #6b7280;
            margin-top: 0.15rem;
        }

        .stat-card {
            padding: 1rem;
            border-radius: 14px;
            border: 1px solid rgba(128, 128, 128, 0.18);
            background: rgba(255, 255, 255, 0.035);
            min-height: 112px;
        }

        .stat-icon {
            font-size: 1.35rem;
            margin-bottom: 0.25rem;
        }

        .stat-label {
            font-size: 0.78rem;
            color: #6b7280;
            font-weight: 600;
        }

        .stat-value {
            font-size: 1.45rem;
            font-weight: 750;
            margin-top: 0.15rem;
        }

        .stat-description {
            font-size: 0.72rem;
            color: #6b7280;
            margin-top: 0.15rem;
        }

        .health-good {
            border-color: rgba(34, 197, 94, 0.35);
        }

        .health-warning {
            border-color: rgba(245, 158, 11, 0.40);
        }

        .health-critical {
            border-color: rgba(239, 68, 68, 0.40);
        }

        .table-note {
            font-size: 0.78rem;
            color: #6b7280;
            margin-bottom: 0.55rem;
        }

        .metric-spacer {
            height: 0.15rem;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def _section_header(
    icon: str,
    title: str,
    description: str,
) -> None:
    """Render a consistent professional section header."""

    st.markdown(
        f"""
        <div class="insight-section">
            <div class="insight-section-title">
                {icon}&nbsp;&nbsp;{title}
            </div>
            <div class="insight-section-subtitle">
                {description}
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def _stat_card(
    container,
    icon: str,
    label: str,
    value: str,
    description: str,
    state: str = "",
) -> None:
    """Render a modern KPI card."""

    css_state = f" {state}" if state else ""

    container.markdown(
        f"""
        <div class="stat-card{css_state}">
            <div class="stat-icon">{icon}</div>
            <div class="stat-label">{label}</div>
            <div class="stat-value">{value}</div>
            <div class="stat-description">{description}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def _format_number(value: int | float) -> str:
    """Format large numbers for dashboard presentation."""

    try:
        value = float(value)
    except (TypeError, ValueError):
        return str(value)

    if value.is_integer():
        return f"{int(value):,}"

    return f"{value:,.2f}"


# ===========================================================
# MAIN RENDERER
# ===========================================================

def render_statistics_ui() -> None:
    """Render the modern statistics dashboard."""

    _inject_statistics_styles()

    # -------------------------------------------------------
    # Header
    # -------------------------------------------------------

    st.title("📊 Statistics Intelligence")

    st.caption(
        "A structured view of dataset quality, distributions, "
        "numeric behavior, categorical patterns, and missing data."
    )

    # -------------------------------------------------------
    # Dataset validation
    # -------------------------------------------------------

    if st.session_state.df is None:
        st.warning(
            "Upload a dataset first to activate statistics analysis."
        )
        return

    df = st.session_state.df

    filename = (
        st.session_state.uploaded_file_name
        or "Current dataset"
    )

    # -------------------------------------------------------
    # Dataset banner
    # -------------------------------------------------------

    st.markdown(
        f"""
        <div class="dataset-banner">
            <div class="dataset-banner-title">
                📁 {filename}
            </div>
            <div class="dataset-banner-subtitle">
                Statistical analysis is running on the currently loaded dataset.
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # -------------------------------------------------------
    # Dataset metrics
    # -------------------------------------------------------

    rows, cols = df.shape

    missing = int(
        df.isna()
        .sum()
        .sum()
    )

    duplicates = int(
        df.duplicated()
        .sum()
    )

    numeric = len(
        df.select_dtypes(
            include="number"
        ).columns
    )

    categorical = len(
        df.select_dtypes(
            include=[
                "object",
                "category",
                "bool",
            ]
        ).columns
    )

    missing_percentage = (
        (missing / (rows * cols)) * 100
        if rows > 0 and cols > 0
        else 0.0
    )

    # -------------------------------------------------------
    # KPI section
    # -------------------------------------------------------

    _section_header(
        "◈",
        "Dataset Snapshot",
        "High-level structural and data-quality indicators.",
    )

    c1, c2, c3 = st.columns(3)

    _stat_card(
        c1,
        "▦",
        "Rows",
        _format_number(rows),
        "Total observations",
    )

    _stat_card(
        c2,
        "▤",
        "Columns",
        _format_number(cols),
        "Available features",
    )

    missing_state = (
        "health-good"
        if missing == 0
        else (
            "health-warning"
            if missing_percentage < 10
            else "health-critical"
        )
    )

    _stat_card(
        c3,
        "◌",
        "Missing Values",
        _format_number(missing),
        f"{missing_percentage:.2f}% of all cells",
        missing_state,
    )

    c4, c5, c6 = st.columns(3)

    duplicate_state = (
        "health-good"
        if duplicates == 0
        else "health-warning"
    )

    _stat_card(
        c4,
        "◇",
        "Duplicates",
        _format_number(duplicates),
        "Repeated complete rows",
        duplicate_state,
    )

    _stat_card(
        c5,
        "⌁",
        "Numeric Features",
        _format_number(numeric),
        "Quantitative columns",
    )

    _stat_card(
        c6,
        "◫",
        "Categorical Features",
        _format_number(categorical),
        "Categorical or boolean columns",
    )

    st.divider()

    # -------------------------------------------------------
    # Overall statistics
    # -------------------------------------------------------

    _section_header(
        "◉",
        "Overall Statistics",
        "Complete descriptive statistics generated by the existing analysis engine.",
    )

    stats = descriptive_statistics(df)

    if stats is None or stats.empty:
        st.info(
            "No descriptive statistics are available for this dataset."
        )
    else:
        st.dataframe(
            stats,
            use_container_width=True,
            hide_index=True,
        )

    st.divider()

    # -------------------------------------------------------
    # Numeric statistics
    # -------------------------------------------------------

    _section_header(
        "∿",
        "Numeric Intelligence",
        "Distribution-oriented statistics for quantitative variables.",
    )

    numeric_stats = numeric_summary(df)

    if numeric_stats is None or numeric_stats.empty:

        st.info(
            "No numeric columns were detected in the current dataset."
        )

    else:

        st.dataframe(
            numeric_stats,
            use_container_width=True,
            hide_index=True,
        )

    st.divider()

    # -------------------------------------------------------
    # Categorical statistics
    # -------------------------------------------------------

    _section_header(
        "◈",
        "Categorical Intelligence",
        "Frequency-oriented analysis for categorical and boolean variables.",
    )

    cat = categorical_summary(df)

    if cat is None or cat.empty:

        st.info(
            "No categorical columns were detected in the current dataset."
        )

    else:

        st.dataframe(
            cat,
            use_container_width=True,
            hide_index=True,
        )

    st.divider()

    # -------------------------------------------------------
    # Missing values
    # -------------------------------------------------------

    _section_header(
        "△",
        "Missing-Value Intelligence",
        "Column-level visibility into incomplete observations.",
    )

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

    missing_table = missing_table.sort_values(
        by="Missing Values",
        ascending=False,
    ).reset_index(
        drop=True
    )

    if missing_table["Missing Values"].sum() == 0:

        st.success(
            "✓ Excellent data completeness — no missing values detected."
        )

    else:

        st.dataframe(
            missing_table,
            use_container_width=True,
            hide_index=True,
        )

    # -------------------------------------------------------
    # Footer
    # -------------------------------------------------------

    st.divider()

    st.caption(
        "InsightAI • Statistics Intelligence • "
        "Analysis layer preserved"
    )
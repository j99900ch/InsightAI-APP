"""
===========================================================
InsightAI - Charts UI
-----------------------------------------------------------
Professional Charts Dashboard

Features
--------
- Histogram
- Box Plot
- Scatter Plot
- Correlation Heatmap
- Count Plot
- Bar Plot
- Pie Chart
- Line Chart
- Area Chart

This module only renders charts.
===========================================================
"""

from __future__ import annotations

import pandas as pd
import plotly.express as px
import plotly.figure_factory as ff
import streamlit as st


# ===========================================================
# Session State
# ===========================================================

def init_charts_state() -> None:
    """Initialize missing session state values."""

    defaults = {
        "df": None,
        "uploaded_file_name": None,
        "dataset_summary": {},
        "charts_message": "Charts ready.",
    }

    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value


# ===========================================================
# Sample Dataset
# ===========================================================

def build_sample_dataframe() -> pd.DataFrame:
    """Return a small dataframe when no data is uploaded."""

    return pd.DataFrame(
        {
            "Sales": [120, 210, 180, 300, 250],
            "Profit": [22, 41, 35, 60, 48],
            "Quantity": [5, 8, 6, 12, 9],
            "Category": [
                "Electronics",
                "Furniture",
                "Electronics",
                "Office",
                "Furniture",
            ],
        }
    )


# ===========================================================
# Helpers
# ===========================================================

def get_numeric_columns(df: pd.DataFrame) -> list[str]:
    """Return numeric columns."""

    return (
        df.select_dtypes(include="number")
        .columns
        .tolist()
    )


def get_categorical_columns(df: pd.DataFrame) -> list[str]:
    """Return categorical columns."""

    return (
        df.select_dtypes(
            include=["object", "category", "string"]
        )
        .columns
        .tolist()
    )


# ===========================================================
# Main UI
# ===========================================================

def render_charts_ui() -> None:
    """Render professional charts."""

    init_charts_state()

    st.title("📈 Charts Dashboard")

    # -------------------------------------------------------
    # Dataset Selection
    # -------------------------------------------------------

    if (
        st.session_state.df is not None
        and not st.session_state.df.empty
    ):
        df = st.session_state.df

        st.success(
            f"Dataset : {st.session_state.uploaded_file_name}"
        )

    else:

        df = build_sample_dataframe()

        st.warning(
            "No dataset uploaded. Showing sample dataset."
        )

    numeric_columns = get_numeric_columns(df)

    categorical_columns = get_categorical_columns(df)

    if not numeric_columns:

        st.error("No numeric columns available.")

        return

    st.divider()

    chart_type = st.selectbox(
        "Select Chart",
        (
            "Histogram",
            "Box Plot",
            "Scatter Plot",
            "Correlation Heatmap",
            "Count Plot",
            "Bar Plot",
            "Pie Chart",
            "Line Chart",
            "Area Chart",
        ),
    )

    st.divider()

    # =======================================================
    # Histogram
    # =======================================================

    if chart_type == "Histogram":

        column = st.selectbox(
            "Numeric Column",
            numeric_columns,
        )

        fig = px.histogram(
            df,
            x=column,
            nbins=30,
            title=f"Histogram - {column}",
        )

        st.plotly_chart(
            fig,
            width="stretch",
        )

    # =======================================================
    # Box Plot
    # =======================================================

    elif chart_type == "Box Plot":

        column = st.selectbox(
            "Numeric Column",
            numeric_columns,
            key="box_column",
        )

        fig = px.box(
            df,
            y=column,
            title=f"Box Plot - {column}",
            points="outliers",
        )

        st.plotly_chart(
            fig,
            width="stretch",
        )

    # =======================================================
    # Scatter Plot
    # =======================================================

    elif chart_type == "Scatter Plot":

        x_axis = st.selectbox(
            "X Axis",
            numeric_columns,
            key="scatter_x",
        )

        y_axis = st.selectbox(
            "Y Axis",
            numeric_columns,
            index=min(1, len(numeric_columns) - 1),
            key="scatter_y",
        )

        fig = px.scatter(
            df,
            x=x_axis,
            y=y_axis,
            title=f"{x_axis} vs {y_axis}",
        )

        st.plotly_chart(
            fig,
            width="stretch",
        )

    # =======================================================
    # Correlation Heatmap
    # =======================================================

    elif chart_type == "Correlation Heatmap":

        correlation = (
            df[numeric_columns]
            .corr()
            .round(2)
        )

        fig = ff.create_annotated_heatmap(
            z=correlation.values,
            x=list(correlation.columns),
            y=list(correlation.index),
            annotation_text=correlation.values.astype(str),
            colorscale="Viridis",
            showscale=True,
        )

        fig.update_layout(
            title="Correlation Heatmap"
        )

        st.plotly_chart(
            fig,
            width="stretch",
        )

    # =======================================================
    # Count Plot
    # =======================================================

    elif chart_type == "Count Plot":

        if not categorical_columns:

            st.warning(
                "No categorical columns available."
            )

        else:

            column = st.selectbox(
                "Categorical Column",
                categorical_columns,
                key="count_column",
            )

            fig = px.histogram(
                df,
                x=column,
                title=f"Count Plot - {column}",
            )

            st.plotly_chart(
                fig,
                width="stretch",
            )

    # =======================================================
    # Bar Plot
    # =======================================================

    elif chart_type == "Bar Plot":

        if not categorical_columns:

            st.warning(
                "No categorical columns available."
            )

        else:

            category = st.selectbox(
                "Category",
                categorical_columns,
                key="bar_category",
            )

            value = st.selectbox(
                "Value",
                numeric_columns,
                key="bar_value",
            )

            grouped = (
                df.groupby(category)[value]
                .sum()
                .reset_index()
            )

            fig = px.bar(
                grouped,
                x=category,
                y=value,
                title=f"{value} by {category}",
            )

            st.plotly_chart(
                fig,
                width="stretch",
            )

    # =======================================================
    # Pie Chart
    # =======================================================

    elif chart_type == "Pie Chart":

        if not categorical_columns:

            st.warning(
                "No categorical columns available."
            )

        else:

            category = st.selectbox(
                "Category",
                categorical_columns,
                key="pie_category",
            )

            pie_data = (
                df[category]
                .value_counts()
                .reset_index()
            )

            pie_data.columns = [
                category,
                "Count",
            ]

            fig = px.pie(
                pie_data,
                names=category,
                values="Count",
                title=f"Pie Chart - {category}",
            )

            st.plotly_chart(
                fig,
                width="stretch",
            )

    # =======================================================
    # Line Chart
    # =======================================================

    elif chart_type == "Line Chart":

        x_axis = st.selectbox(
            "X Axis",
            df.columns,
            key="line_x",
        )

        y_axis = st.selectbox(
            "Y Axis",
            numeric_columns,
            key="line_y",
        )

        fig = px.line(
            df,
            x=x_axis,
            y=y_axis,
            title=f"{y_axis} over {x_axis}",
        )

        st.plotly_chart(
            fig,
            width="stretch",
        )

    # =======================================================
    # Area Chart
    # =======================================================

    elif chart_type == "Area Chart":

        x_axis = st.selectbox(
            "X Axis",
            df.columns,
            key="area_x",
        )

        y_axis = st.selectbox(
            "Y Axis",
            numeric_columns,
            key="area_y",
        )

        fig = px.area(
            df,
            x=x_axis,
            y=y_axis,
            title=f"{y_axis} over {x_axis}",
        )

        st.plotly_chart(
            fig,
            width="stretch",
        )
    
        # =======================================================
    # Dataset Summary
    # =======================================================

    st.divider()

    if st.session_state.dataset_summary:

        st.subheader("📋 Dataset Summary")

        col1, col2 = st.columns(2)

        items = list(
            st.session_state.dataset_summary.items()
        )

        midpoint = (
            len(items) + 1
        ) // 2

        with col1:

            for key, value in items[:midpoint]:

                st.metric(
                    label=key.replace("_", " ").title(),
                    value=value,
                )

        with col2:

            for key, value in items[midpoint:]:

                st.metric(
                    label=key.replace("_", " ").title(),
                    value=value,
                )

    else:

        st.info(
            "Dataset summary is not available yet."
        )

    # =======================================================
    # Chart Information
    # =======================================================

    st.divider()

    with st.expander(
        "📖 About the Selected Chart",
        expanded=False,
    ):

        descriptions = {
            "Histogram":
                "Shows the distribution of numeric values.",

            "Box Plot":
                "Shows quartiles, spread and outliers.",

            "Scatter Plot":
                "Shows relationship between two numeric variables.",

            "Correlation Heatmap":
                "Displays correlation between numeric columns.",

            "Count Plot":
                "Shows frequency of each category.",

            "Bar Plot":
                "Compares values across categories.",

            "Pie Chart":
                "Shows percentage contribution of categories.",

            "Line Chart":
                "Shows trend across ordered values.",

            "Area Chart":
                "Shows cumulative trend over an axis.",
        }

        st.write(
            descriptions.get(
                chart_type,
                "Professional visualization.",
            )
        )

    # =======================================================
    # Footer
    # =======================================================

    st.divider()

    st.caption(
        "InsightAI Professional Charts • Version 2.0"
    )
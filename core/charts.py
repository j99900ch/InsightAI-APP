"""
===========================================================
InsightAI - Chart Utilities
-----------------------------------------------------------
Reusable visualization functions for exploratory
data analysis.

This module:
- validates input data
- returns matplotlib Figure objects
- contains no Streamlit code
===========================================================
"""

from __future__ import annotations

import matplotlib

# Use a non-GUI backend suitable for testing and Streamlit
matplotlib.use("Agg")

import matplotlib.pyplot as plt
from matplotlib.figure import Figure

import pandas as pd
import seaborn as sns

from config.logging_config import get_logger
from core.utils import (
    column_exists,
    validate_dataframe,
)

logger = get_logger(__name__)


# ===========================================================
# Internal Helper
# ===========================================================

def _create_figure(
    width: int = 10,
    height: int = 5,
) -> tuple[Figure, plt.Axes]:
    """
    Create and return a matplotlib figure and axes.
    """

    fig, ax = plt.subplots(figsize=(width, height))

    return fig, ax


# ===========================================================
# Histogram
# ===========================================================

def plot_histogram(
    df: pd.DataFrame,
    column: str,
    bins: int = 30,
) -> Figure:
    """
    Plot histogram of a numeric column.
    """

    validate_dataframe(df)

    if not column_exists(df, column):
        raise ValueError(f"Column '{column}' not found.")

    fig, ax = _create_figure()

    sns.histplot(
        data=df,
        x=column,
        bins=bins,
        kde=True,
        ax=ax,
    )

    ax.set_title(f"Distribution of {column}")

    logger.info("Histogram created for %s", column)

    return fig


# ===========================================================
# Box Plot
# ===========================================================

def plot_boxplot(df: pd.DataFrame, column: str) -> Figure:
    validate_dataframe(df)

    if not column_exists(df, column):
        raise ValueError(f"Column '{column}' not found.")

    fig, ax = _create_figure()
    ax.boxplot(df[column].dropna(), orientation="vertical")
    ax.set_title(f"Box Plot - {column}")

    logger.info("Box plot created for %s", column)
    return fig


# ===========================================================
# Bar Chart
# ===========================================================

def plot_bar_chart(
    df: pd.DataFrame,
    column: str,
) -> Figure:
    """
    Plot value counts as a bar chart.
    """

    validate_dataframe(df)

    if not column_exists(df, column):
        raise ValueError(f"Column '{column}' not found.")

    fig, ax = _create_figure()

    df[column].value_counts().plot(
        kind="bar",
        ax=ax,
    )

    ax.set_title(column)

    logger.info("Bar chart created for %s", column)

    return fig


# ===========================================================
# Line Chart
# ===========================================================

def plot_line_chart(
    df: pd.DataFrame,
    x: str,
    y: str,
) -> Figure:
    """
    Plot line chart.
    """

    validate_dataframe(df)

    if not column_exists(df, x):
        raise ValueError(f"Column '{x}' not found.")

    if not column_exists(df, y):
        raise ValueError(f"Column '{y}' not found.")

    fig, ax = _create_figure()

    ax.plot(
        df[x],
        df[y],
    )

    ax.set_xlabel(x)
    ax.set_ylabel(y)
    ax.set_title(f"{y} vs {x}")

    logger.info("Line chart created.")

    return fig


# ===========================================================
# Scatter Plot
# ===========================================================

def plot_scatter_plot(
    df: pd.DataFrame,
    x: str,
    y: str,
) -> Figure:
    """
    Plot scatter plot.
    """

    validate_dataframe(df)

    if not column_exists(df, x):
        raise ValueError(f"Column '{x}' not found.")

    if not column_exists(df, y):
        raise ValueError(f"Column '{y}' not found.")

    fig, ax = _create_figure()

    sns.scatterplot(
        data=df,
        x=x,
        y=y,
        ax=ax,
    )

    ax.set_title(f"{y} vs {x}")

    logger.info("Scatter plot created.")

    return fig


# ===========================================================
# Correlation Heatmap
# ===========================================================

def plot_correlation_heatmap(
    df: pd.DataFrame,
) -> Figure:
    """
    Plot correlation heatmap of numeric columns.
    """

    validate_dataframe(df)

    numeric_df = df.select_dtypes(include="number")

    if numeric_df.shape[1] < 2:
        raise ValueError(
            "At least two numeric columns are required."
        )

    correlation = numeric_df.corr()

    fig, ax = _create_figure(8, 6)

    sns.heatmap(
        correlation,
        annot=True,
        cmap="Blues",
        ax=ax,
    )

    ax.set_title("Correlation Heatmap")

    logger.info("Correlation heatmap created.")

    return fig
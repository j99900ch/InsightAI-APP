"""
===========================================================
InsightAI - Unit Tests for Charts
===========================================================
"""

import matplotlib.figure
import pandas as pd
import pytest

from core.charts import (
    plot_bar_chart,
    plot_boxplot,
    plot_correlation_heatmap,
    plot_histogram,
    plot_line_chart,
    plot_scatter_plot,
)


@pytest.fixture
def sample_df():
    """Create a sample DataFrame."""

    return pd.DataFrame(
        {
            "Age": [20, 22, 25, 30, 35],
            "Salary": [30000, 40000, 50000, 60000, 70000],
            "Department": [
                "HR",
                "IT",
                "IT",
                "Sales",
                "HR",
            ],
        }
    )


# ===========================================================
# Histogram
# ===========================================================

def test_histogram(sample_df):
    fig = plot_histogram(sample_df, "Age")

    assert isinstance(fig, matplotlib.figure.Figure)


# ===========================================================
# Box Plot
# ===========================================================

def test_boxplot(sample_df):
    fig = plot_boxplot(sample_df, "Salary")

    assert isinstance(fig, matplotlib.figure.Figure)


# ===========================================================
# Bar Chart
# ===========================================================

def test_bar_chart(sample_df):
    fig = plot_bar_chart(sample_df, "Department")

    assert isinstance(fig, matplotlib.figure.Figure)


# ===========================================================
# Line Chart
# ===========================================================

def test_line_chart(sample_df):
    fig = plot_line_chart(
        sample_df,
        "Age",
        "Salary",
    )

    assert isinstance(fig, matplotlib.figure.Figure)


# ===========================================================
# Scatter Plot
# ===========================================================

def test_scatter_plot(sample_df):
    fig = plot_scatter_plot(
        sample_df,
        "Age",
        "Salary",
    )

    assert isinstance(fig, matplotlib.figure.Figure)


# ===========================================================
# Heatmap
# ===========================================================

def test_heatmap(sample_df):
    fig = plot_correlation_heatmap(sample_df)

    assert isinstance(fig, matplotlib.figure.Figure)


# ===========================================================
# Invalid Column
# ===========================================================

def test_invalid_column(sample_df):
    with pytest.raises(ValueError):
        plot_histogram(sample_df, "UnknownColumn")


# ===========================================================
# Invalid DataFrame
# ===========================================================

def test_invalid_dataframe():
    with pytest.raises(TypeError):
        plot_histogram([1, 2, 3], "Age")


# ===========================================================
# Empty DataFrame
# ===========================================================

def test_empty_dataframe():
    with pytest.raises(ValueError):
        plot_histogram(pd.DataFrame(), "Age")
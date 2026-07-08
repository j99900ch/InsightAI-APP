"""
===========================================================
InsightAI - Report Generator
-----------------------------------------------------------
Generate reusable business reports for InsightAI.

This module contains no Streamlit code and can be reused
by the CLI, API and web application.
===========================================================
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

import pandas as pd

from analysis import (
    business_summary,
    dataset_profile,
)
from config.logging_config import get_logger
from core.statistics import (
    complete_statistics,
)
from core.utils import (
    validate_dataframe,
)

logger = get_logger(__name__)

# ===========================================================
# REPORT HEADER
# ===========================================================


def report_header() -> dict[str, str]:
    """
    Generate report metadata.
    """

    return {
        "application": "InsightAI",
        "generated_at": datetime.now().strftime(
            "%Y-%m-%d %H:%M:%S"
        ),
        "version": "1.0",
    }


# ===========================================================
# DATASET SECTION
# ===========================================================


def dataset_section(
    df: pd.DataFrame,
) -> dict[str, Any]:
    """
    Generate dataset information.
    """

    validate_dataframe(df)

    logger.info(
        "Generating dataset section."
    )

    return {
        "profile": dataset_profile(df),
        "business_summary": business_summary(df),
    }


# ===========================================================
# STATISTICS SECTION
# ===========================================================


def statistics_section(
    df: pd.DataFrame,
) -> dict[str, Any]:
    """
    Generate statistics section.
    """

    validate_dataframe(df)

    logger.info(
        "Generating statistics section."
    )

    return complete_statistics(df)


# ===========================================================
# MACHINE LEARNING SECTION
# ===========================================================


def machine_learning_section(
    problem_type: str | None = None,
    best_model: str | None = None,
    score: float | None = None,
) -> dict[str, Any]:
    """
    Generate machine learning section.
    """

    logger.info(
        "Generating ML section."
    )

    return {
        "problem_type": problem_type
        if problem_type
        else "Not Available",

        "best_model": best_model
        if best_model
        else "Not Trained",

        "score": score,
    }


# ===========================================================
# INSIGHTS SECTION
# ===========================================================


def insights_section(
    insights: list[str] | None = None,
) -> dict[str, Any]:
    """
    Generate insights section.
    """

    logger.info(
        "Generating insights section."
    )

    return {
        "insights": insights
        if insights
        else [],
    }
# ===========================================================
# COMPLETE REPORT
# ===========================================================

def generate_report(
    df: pd.DataFrame,
    *,
    problem_type: str | None = None,
    best_model: str | None = None,
    score: float | None = None,
    insights: list[str] | None = None,
) -> dict[str, Any]:
    """
    Generate a complete InsightAI report.
    """

    validate_dataframe(df)

    logger.info(
        "Generating complete report."
    )

    return {
        "header": report_header(),
        "dataset": dataset_section(df),
        "statistics": statistics_section(df),
        "machine_learning": machine_learning_section(
            problem_type=problem_type,
            best_model=best_model,
            score=score,
        ),
        "insights": insights_section(
            insights,
        ),
    }


# ===========================================================
# MARKDOWN REPORT
# ===========================================================

def report_to_markdown(
    report: dict[str, Any],
) -> str:
    """
    Convert a report dictionary into Markdown.
    """

    header = report["header"]
    dataset = report["dataset"]["business_summary"]
    ml = report["machine_learning"]
    insights = report["insights"]["insights"]

    lines = [
        "# InsightAI Report",
        "",
        f"**Generated:** {header['generated_at']}",
        f"**Version:** {header['version']}",
        "",
        "## Dataset Summary",
        "",
        f"- Dataset Size: {dataset['dataset_size']}",
        f"- Missing Values: {dataset['missing_values']}",
        f"- Duplicate Rows: {dataset['duplicates']}",
        f"- Numeric Features: {dataset['numeric_features']}",
        f"- Categorical Features: {dataset['categorical_features']}",
        f"- Datetime Features: {dataset['datetime_features']}",
        "",
        "## Machine Learning",
        "",
        f"- Problem Type: {ml['problem_type']}",
        f"- Best Model: {ml['best_model']}",
        f"- Score: {ml['score']}",
        "",
        "## Insights",
        "",
    ]

    if insights:
        for item in insights:
            lines.append(f"- {item}")
    else:
        lines.append("- No insights available.")

    return "\n".join(lines)


# ===========================================================
# SAVE MARKDOWN
# ===========================================================

def save_markdown_report(
    report: dict[str, Any],
    filepath: str,
) -> str:
    """
    Save a report as a Markdown (.md) file.
    """

    markdown = report_to_markdown(report)

    with open(
        filepath,
        "w",
        encoding="utf-8",
    ) as file:
        file.write(markdown)

    logger.info(
        "Markdown report saved -> %s",
        filepath,
    )

    return filepath                                                                            
import pandas as pd
import pytest
from pathlib import Path

from core.report import (
    report_header,
    dataset_section,
    statistics_section,
    machine_learning_section,
    insights_section,
    generate_report,
    report_to_markdown,
    save_markdown_report,
)


# ===========================================================
# FIXTURE
# ===========================================================

@pytest.fixture
def sample_df():
    return pd.DataFrame(
        {
            "Age": [21, 22, 23, 24],
            "Salary": [40000, 50000, 60000, 70000],
            "Department": [
                "HR",
                "IT",
                "Finance",
                "IT",
            ],
        }
    )


# ===========================================================
# HEADER
# ===========================================================

def test_report_header():

    header = report_header()

    assert header["application"] == "InsightAI"
    assert header["version"] == "1.0"
    assert "generated_at" in header


# ===========================================================
# DATASET SECTION
# ===========================================================

def test_dataset_section(sample_df):

    report = dataset_section(sample_df)

    assert "profile" in report
    assert "business_summary" in report


# ===========================================================
# STATISTICS SECTION
# ===========================================================

def test_statistics_section(sample_df):

    report = statistics_section(sample_df)

    assert isinstance(report, dict)


# ===========================================================
# ML SECTION
# ===========================================================

def test_machine_learning_section():

    report = machine_learning_section(
        problem_type="Regression",
        best_model="Random Forest",
        score=0.95,
    )

    assert report["problem_type"] == "Regression"
    assert report["best_model"] == "Random Forest"
    assert report["score"] == 0.95


# ===========================================================
# INSIGHTS
# ===========================================================

def test_insights_section():

    report = insights_section(
        [
            "Sales increased.",
            "Profit improved.",
        ]
    )

    assert len(report["insights"]) == 2


# ===========================================================
# COMPLETE REPORT
# ===========================================================

def test_generate_report(sample_df):

    report = generate_report(sample_df)

    assert "header" in report
    assert "dataset" in report
    assert "statistics" in report
    assert "machine_learning" in report
    assert "insights" in report


# ===========================================================
# MARKDOWN
# ===========================================================

def test_report_to_markdown(sample_df):

    report = generate_report(sample_df)

    markdown = report_to_markdown(report)

    assert isinstance(markdown, str)
    assert "# InsightAI Report" in markdown


# ===========================================================
# SAVE REPORT
# ===========================================================

def test_save_markdown_report(
    sample_df,
    tmp_path,
):

    report = generate_report(sample_df)

    file = tmp_path / "report.md"

    result = save_markdown_report(
        report,
        file,
    )

    assert Path(result).exists()


# ===========================================================
# INVALID DATAFRAME
# ===========================================================

def test_invalid_dataframe():

    with pytest.raises(TypeError):

        generate_report(
            [1, 2, 3],
        )
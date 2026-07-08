import pytest

from core.session_manager import (
    SessionData,
    create_session,
    reset_session,
    update_data_info,
    update_model_info,
    update_insights,
    update_report,
    get_session_summary,
)


def test_session_data_defaults():
    session = SessionData()

    assert session.uploaded_filename is None
    assert session.dataframe_rows == 0
    assert session.dataframe_columns == 0
    assert session.problem_type is None
    assert session.best_model is None
    assert session.score is None
    assert session.insights == []
    assert session.report == {}
    assert session.is_data_loaded is False
    assert session.is_model_trained is False
    assert isinstance(session.created_at, str)
    assert len(session.created_at) > 0


def test_create_session():
    session = create_session()

    assert isinstance(session, SessionData)
    assert session.is_data_loaded is False
    assert session.is_model_trained is False


def test_reset_session():
    session = SessionData(
        uploaded_filename="data.csv",
        dataframe_rows=10,
        dataframe_columns=5,
        problem_type="Regression",
        best_model="Random Forest",
        score=0.91,
        insights=["A"],
        report={"x": 1},
        is_data_loaded=True,
        is_model_trained=True,
    )

    reset = reset_session()

    assert isinstance(reset, SessionData)
    assert reset.uploaded_filename is None
    assert reset.dataframe_rows == 0
    assert reset.dataframe_columns == 0
    assert reset.problem_type is None
    assert reset.best_model is None
    assert reset.score is None
    assert reset.insights == []
    assert reset.report == {}
    assert reset.is_data_loaded is False
    assert reset.is_model_trained is False


def test_update_data_info():
    session = SessionData()

    updated = update_data_info(
        session,
        filename="sample.csv",
        rows=100,
        columns=12,
    )

    assert updated.uploaded_filename == "sample.csv"
    assert updated.dataframe_rows == 100
    assert updated.dataframe_columns == 12
    assert updated.is_data_loaded is True


def test_update_model_info():
    session = SessionData()

    updated = update_model_info(
        session,
        problem_type="Classification",
        best_model="XGBoost",
        score=0.97,
    )

    assert updated.problem_type == "Classification"
    assert updated.best_model == "XGBoost"
    assert updated.score == 0.97
    assert updated.is_model_trained is True


def test_update_insights():
    session = SessionData()

    updated = update_insights(
        session,
        ["Revenue grew.", "Churn decreased."],
    )

    assert updated.insights == ["Revenue grew.", "Churn decreased."]


def test_update_report():
    session = SessionData()

    updated = update_report(
        session,
        {"header": {"application": "InsightAI"}},
    )

    assert updated.report["header"]["application"] == "InsightAI"


def test_get_session_summary():
    session = SessionData(
        uploaded_filename="data.csv",
        dataframe_rows=50,
        dataframe_columns=8,
        problem_type="Regression",
        best_model="Random Forest",
        score=0.88,
        insights=["A", "B"],
        report={"ok": True},
        is_data_loaded=True,
        is_model_trained=True,
    )

    summary = get_session_summary(session)

    assert summary["uploaded_filename"] == "data.csv"
    assert summary["dataframe_rows"] == 50
    assert summary["dataframe_columns"] == 8
    assert summary["problem_type"] == "Regression"
    assert summary["best_model"] == "Random Forest"
    assert summary["score"] == 0.88
    assert summary["insights_count"] == 2
    assert summary["has_report"] is True
    assert summary["is_data_loaded"] is True
    assert summary["is_model_trained"] is True
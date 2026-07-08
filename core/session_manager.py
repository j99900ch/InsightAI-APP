"""
===========================================================
InsightAI - Session Manager
-----------------------------------------------------------
Manages session state for the application.

This module contains no Streamlit UI code and can be reused
by the CLI, API and web application.
===========================================================
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from config.logging_config import get_logger

logger = get_logger(__name__)


@dataclass
class SessionData:
    """
    Container for application session data.
    """

    created_at: str = field(
        default_factory=lambda: datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
    uploaded_filename: str | None = None
    dataframe_rows: int = 0
    dataframe_columns: int = 0
    problem_type: str | None = None
    best_model: str | None = None
    score: float | None = None
    insights: list[str] = field(default_factory=list)
    report: dict[str, Any] = field(default_factory=dict)
    is_data_loaded: bool = False
    is_model_trained: bool = False


def create_session() -> SessionData:
    """
    Create a fresh session container.
    """
    logger.info("Creating new session.")
    return SessionData()


def reset_session() -> SessionData:
    """
    Reset session to a clean state.
    """
    logger.info("Resetting session.")
    return SessionData()


def update_data_info(
    session: SessionData,
    *,
    filename: str | None = None,
    rows: int = 0,
    columns: int = 0,
) -> SessionData:
    """
    Update dataset-related session fields.
    """
    logger.info("Updating session data info.")
    if filename is not None:
        session.uploaded_filename = filename
    session.dataframe_rows = rows
    session.dataframe_columns = columns
    session.is_data_loaded = True
    return session


def update_model_info(
    session: SessionData,
    *,
    problem_type: str | None = None,
    best_model: str | None = None,
    score: float | None = None,
) -> SessionData:
    """
    Update model-related session fields.
    """
    logger.info("Updating session model info.")
    session.problem_type = problem_type
    session.best_model = best_model
    session.score = score
    session.is_model_trained = True
    return session


def update_insights(
    session: SessionData,
    insights: list[str] | None = None,
) -> SessionData:
    """
    Update session insights.
    """
    logger.info("Updating session insights.")
    session.insights = insights or []
    return session


def update_report(
    session: SessionData,
    report: dict[str, Any] | None = None,
) -> SessionData:
    """
    Update session report data.
    """
    logger.info("Updating session report.")
    session.report = report or {}
    return session


def get_session_summary(session: SessionData) -> dict[str, Any]:
    """
    Return a summary of the session state.
    """
    logger.info("Generating session summary.")
    return {
        "created_at": session.created_at,
        "uploaded_filename": session.uploaded_filename,
        "dataframe_rows": session.dataframe_rows,
        "dataframe_columns": session.dataframe_columns,
        "problem_type": session.problem_type,
        "best_model": session.best_model,
        "score": session.score,
        "insights_count": len(session.insights),
        "has_report": bool(session.report),
        "is_data_loaded": session.is_data_loaded,
        "is_model_trained": session.is_model_trained,
    }
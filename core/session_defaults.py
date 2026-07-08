"""
===========================================================
InsightAI - Session Defaults
-----------------------------------------------------------
Defines the default Streamlit session state values.

This module contains no Streamlit UI code.
It provides a single source of truth for all
session state keys used throughout the project.
===========================================================
"""

from __future__ import annotations

SESSION_DEFAULTS = {
    # -------------------------------------------------------
    # Navigation
    # -------------------------------------------------------
    "page": "Home",
    "dark_mode": False,

    # -------------------------------------------------------
    # Dataset
    # -------------------------------------------------------
    "data_loaded": False,
    "uploaded_file_name": None,
    "filename": None,
    "df": None,
    "dataset_summary": {},
    "profile": None,
    "summary": {},

    # -------------------------------------------------------
    # Analysis
    # -------------------------------------------------------
    "statistics": None,
    "charts": None,
    "insights": None,

    # -------------------------------------------------------
    # Machine Learning
    # -------------------------------------------------------
    "ml_result": None,
    "prediction_result": None,

    # -------------------------------------------------------
    # Reporting
    # -------------------------------------------------------
    "report": None,

    # -------------------------------------------------------
    # Application
    # -------------------------------------------------------
    "reset_requested": False,
}
"""
===========================================================
InsightAI - Application Settings
-----------------------------------------------------------
Central application configuration.

Rules
-----
- Store configuration values only.
- Do not write business logic here.
- Import these settings throughout the project.
===========================================================
"""

from __future__ import annotations

from pathlib import Path

# ===========================================================
# APPLICATION
# ===========================================================

APP_NAME = "InsightAI"
APP_VERSION = "2.0.0"

AUTHOR = "Jyoti Chaudhary"
ROLE = "Gen AI Model Developer"

# ===========================================================
# STREAMLIT
# ===========================================================

PAGE_TITLE = "InsightAI"

# Use Streamlit emoji shortcode to avoid encoding issues.
PAGE_ICON = ":bar_chart:"

LAYOUT = "wide"

INITIAL_SIDEBAR_STATE = "expanded"

# ===========================================================
# PROJECT PATHS
# ===========================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

ASSETS_DIR = PROJECT_ROOT / "assets"
EXPORTS_DIR = PROJECT_ROOT / "exports"
REPORTS_DIR = PROJECT_ROOT / "reports"
MODELS_DIR = PROJECT_ROOT / "models"
SAMPLE_DATA_DIR = PROJECT_ROOT / "sample_data"
TEMP_DIR = PROJECT_ROOT / "temp"
LOGS_DIR = PROJECT_ROOT / "logs"

# ===========================================================
# FILES
# ===========================================================

SUPPORTED_FILE_TYPES = (
    "csv",
    "xlsx",
    "xls",
    "json",
)

DEFAULT_ENCODING = "utf-8"
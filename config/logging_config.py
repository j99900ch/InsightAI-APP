"""
===========================================================
InsightAI - Logging Configuration
-----------------------------------------------------------
Provides a centralized logger for the entire application.

Features:
- Creates the logs directory automatically
- Logs to both file and console
- Prevents duplicate log handlers
===========================================================
"""

from pathlib import Path
import logging

# ===========================================================
# PROJECT PATHS
# ===========================================================

# Root folder of the project (InsightAI/)
PROJECT_ROOT = Path(__file__).resolve().parent.parent

# Logs directory
LOGS_DIR = PROJECT_ROOT / "logs"

# Log file path
LOG_FILE = LOGS_DIR / "insightai.log"

# ===========================================================
# CREATE LOGS DIRECTORY
# ===========================================================

LOGS_DIR.mkdir(parents=True, exist_ok=True)

# ===========================================================
# LOG FORMAT
# ===========================================================

LOG_FORMAT = (
    "%(asctime)s | "
    "%(levelname)-8s | "
    "%(name)s | "
    "%(message)s"
)

DATE_FORMAT = "%Y-%m-%d %H:%M:%S"

# ===========================================================
# LOGGER FACTORY
# ===========================================================

def get_logger(name: str) -> logging.Logger:
    """
    Returns a configured logger instance.

    Parameters
    ----------
    name : str
        Usually __name__ from the calling module.

    Returns
    -------
    logging.Logger
        Configured logger object.
    """

    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    # Prevent duplicate handlers
    if logger.handlers:
        return logger

    # -------------------------
    # File Handler
    # -------------------------
    file_handler = logging.FileHandler(LOG_FILE, encoding="utf-8")
    file_handler.setLevel(logging.INFO)

    # -------------------------
    # Console Handler
    # -------------------------
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)

    # -------------------------
    # Formatter
    # -------------------------
    formatter = logging.Formatter(
        fmt=LOG_FORMAT,
        datefmt=DATE_FORMAT
    )

    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)

    logger.addHandler(file_handler)
    logger.addHandler(console_handler)

    logger.propagate = False

    return logger
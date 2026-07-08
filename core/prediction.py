"""
===========================================================
InsightAI - Prediction Engine
-----------------------------------------------------------
Utilities for generating predictions using trained
machine learning models.

This module is independent of Streamlit and can be reused
by the web application, API or CLI.
===========================================================
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import pandas as pd

from config.logging_config import get_logger
from core.ml import prepare_features
from core.utils import validate_dataframe

logger = get_logger(__name__)

# ===========================================================
# MODEL LOADING
# ===========================================================


def load_saved_model(
    model_path: str | Path,
):
    """
    Load a previously saved machine learning model.

    Parameters
    ----------
    model_path : str | Path
        Path to the saved model.

    Returns
    -------
    object
        Loaded machine learning model.
    """

    model_path = Path(model_path)

    if not model_path.exists():
        raise FileNotFoundError(
            f"Model not found: {model_path}"
        )

    logger.info(
        "Loading model from %s",
        model_path,
    )

    return joblib.load(model_path)


# ===========================================================
# PREPROCESS NEW DATA
# ===========================================================


def preprocess_prediction_data(
    df: pd.DataFrame,
    preprocessor,
):
    """
    Transform new data using a fitted preprocessor.

    Parameters
    ----------
    df : pd.DataFrame
        Dataset for prediction.

    preprocessor
        Previously fitted preprocessing pipeline.

    Returns
    -------
    Any
        Transformed feature matrix.
    """

    validate_dataframe(df)

    logger.info(
        "Preparing prediction dataset."
    )

    return preprocessor.transform(df)


# ===========================================================
# PREDICT FROM DATAFRAME
# ===========================================================


def predict_dataframe(
    model,
    df: pd.DataFrame,
    preprocessor=None,
) -> pd.DataFrame:
    """
    Generate predictions from a dataframe.

    Parameters
    ----------
    model
        Trained estimator.

    df : pd.DataFrame
        Input dataframe.

    preprocessor
        Optional fitted preprocessing object.

    Returns
    -------
    pd.DataFrame
        Original dataframe with predictions.
    """

    validate_dataframe(df)

    logger.info(
        "Generating predictions."
    )

    if preprocessor is not None:

        features = preprocess_prediction_data(
            df,
            preprocessor,
        )

    else:

        features, _ = prepare_features(df)

    predictions = model.predict(features)

    result = df.copy()

    result["Prediction"] = predictions

    logger.info(
        "Prediction completed."
    )

    return result
# ===========================================================
# PREDICT PROBABILITIES
# ===========================================================

def predict_probabilities(
    model,
    df: pd.DataFrame,
    preprocessor=None,
) -> pd.DataFrame:
    """
    Predict class probabilities for classification models.

    Parameters
    ----------
    model
        Trained classification model.

    df : pd.DataFrame
        Dataset for prediction.

    preprocessor
        Optional fitted preprocessing pipeline.

    Returns
    -------
    pd.DataFrame
        Prediction probabilities.
    """

    validate_dataframe(df)

    if not hasattr(model, "predict_proba"):
        raise ValueError(
            "Selected model does not support "
            "probability prediction."
        )

    logger.info(
        "Generating prediction probabilities."
    )

    if preprocessor is not None:

        features = preprocess_prediction_data(
            df,
            preprocessor,
        )

    else:

        features, _ = prepare_features(df)

    probabilities = model.predict_proba(
        features
    )

    columns = [
        f"Class_{index}"
        for index in range(
            probabilities.shape[1]
        )
    ]

    return pd.DataFrame(
        probabilities,
        columns=columns,
    )


# ===========================================================
# PREDICTION SUMMARY
# ===========================================================

def prediction_summary(
    predictions: pd.DataFrame,
) -> dict[str, Any]:
    """
    Generate a summary of prediction results.

    Parameters
    ----------
    predictions : pd.DataFrame

    Returns
    -------
    dict
    """

    validate_dataframe(predictions)

    if "Prediction" not in predictions.columns:
        raise ValueError(
            "'Prediction' column not found."
        )

    logger.info(
        "Creating prediction summary."
    )

    summary = {
        "total_predictions": len(
            predictions
        ),
    }

    counts = (
        predictions["Prediction"]
        .value_counts(dropna=False)
        .to_dict()
    )

    summary["prediction_counts"] = counts

    return summary


# ===========================================================
# SAVE PREDICTIONS
# ===========================================================

def save_predictions(
    predictions: pd.DataFrame,
    filepath: str,
) -> None:
    """
    Save predictions to CSV.

    Parameters
    ----------
    predictions : pd.DataFrame

    filepath : str
    """

    validate_dataframe(predictions)

    predictions.to_csv(
        filepath,
        index=False,
    )

    logger.info(
        "Predictions saved to %s",
        filepath,
    )


# ===========================================================
# LOAD PREDICTION DATA
# ===========================================================

def load_prediction_data(
    filepath: str,
) -> pd.DataFrame:
    """
    Load prediction dataset.

    Parameters
    ----------
    filepath : str

    Returns
    -------
    pd.DataFrame
    """

    logger.info(
        "Loading prediction dataset."
    )

    return pd.read_csv(filepath)
"""
===========================================================
InsightAI - Machine Learning Engine
-----------------------------------------------------------
Reusable machine learning utilities for classification
and regression tasks.

This module contains no Streamlit code and can be reused
by the CLI, API and web application.
===========================================================
"""

from __future__ import annotations

from typing import Any, Literal

import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import (
    RandomForestClassifier,
    RandomForestRegressor,
)
from sklearn.impute import SimpleImputer
from sklearn.linear_model import (
    LinearRegression,
    LogisticRegression,
)
from sklearn.model_selection import train_test_split
from sklearn.base import clone
from sklearn.metrics import (
    accuracy_score,
    r2_score,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import (
    OneHotEncoder,
    StandardScaler,
)
from sklearn.tree import (
    DecisionTreeClassifier,
    DecisionTreeRegressor,
)

from config.constants import (
    DEFAULT_RANDOM_STATE,
    DEFAULT_TEST_SIZE,
)
from config.logging_config import get_logger
from core.utils import (
    column_exists,
    validate_dataframe,
)

logger = get_logger(__name__)

# ===========================================================
# TYPES
# ===========================================================

ProblemType = Literal[
    "classification",
    "regression",
]

# ===========================================================
# MODEL REGISTRY
# ===========================================================

CLASSIFICATION_MODELS = {
    "Logistic Regression": LogisticRegression(
        random_state=DEFAULT_RANDOM_STATE,
        max_iter=1000,
    ),
    "Decision Tree": DecisionTreeClassifier(
        random_state=DEFAULT_RANDOM_STATE,
    ),
    "Random Forest": RandomForestClassifier(
        random_state=DEFAULT_RANDOM_STATE,
    ),
}

REGRESSION_MODELS = {
    "Linear Regression": LinearRegression(),
    "Decision Tree": DecisionTreeRegressor(
        random_state=DEFAULT_RANDOM_STATE,
    ),
    "Random Forest": RandomForestRegressor(
        random_state=DEFAULT_RANDOM_STATE,
    ),
}

# ===========================================================
# PROBLEM TYPE DETECTION
# ===========================================================


def detect_problem_type(
    df: pd.DataFrame,
    target_column: str,
) -> ProblemType:
    """
    Detect whether the target column represents a
    classification or regression problem.
    """
    validate_dataframe(df)

    if not column_exists(df, target_column):
        raise ValueError(
            f"Column '{target_column}' not found."
        )

    logger.info(
        "Detecting ML problem type for '%s'.",
        target_column,
    )

    target = df[target_column]

    if (
        pd.api.types.is_object_dtype(target)
        or pd.api.types.is_string_dtype(target)
        or pd.api.types.is_bool_dtype(target)
        or str(target.dtype) == "category"
    ):
        logger.info("Classification problem detected.")
        return "classification"

    if target.nunique(dropna=True) <= 10:
        logger.info(
            "Classification problem detected "
            "(numeric target)."
        )
        return "classification"

    logger.info("Regression problem detected.")

    return "regression"


# ===========================================================
# TRAIN / TEST SPLIT
# ===========================================================


def split_dataset(
    df: pd.DataFrame,
    target_column: str,
    test_size: float = DEFAULT_TEST_SIZE,
    random_state: int = DEFAULT_RANDOM_STATE,
):
    """
    Split dataset into training and testing sets.
    """
    validate_dataframe(df)

    if not column_exists(df, target_column):
        raise ValueError(
            f"Column '{target_column}' not found."
        )

    logger.info(
        "Splitting dataset "
        "(test_size=%s).",
        test_size,
    )

    X = df.drop(columns=[target_column])
    y = df[target_column]

    return train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=random_state,
    )
# ===========================================================
# FEATURE PREPROCESSING
# ===========================================================


def prepare_features(
    X: pd.DataFrame,
) -> tuple[Any, ColumnTransformer]:
    """
    Prepare features for machine learning.

    The preprocessing pipeline automatically:

    - imputes missing numeric values
    - scales numeric features
    - imputes missing categorical values
    - one-hot encodes categorical features

    Parameters
    ----------
    X : pd.DataFrame
        Feature dataframe.

    Returns
    -------
    tuple
        (transformed_features, fitted_preprocessor)
    """

    validate_dataframe(X)

    logger.info("Preparing features for ML.")

    numeric_features = (
        X.select_dtypes(include="number")
        .columns
        .tolist()
    )

    categorical_features = (
        X.select_dtypes(
            include=[
                "object",
                "category",
                "string",
                "bool",
            ]
        )
        .columns
        .tolist()
    )

    numeric_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(strategy="median"),
            ),
            (
                "scaler",
                StandardScaler(),
            ),
        ]
    )

    categorical_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(
                    strategy="most_frequent",
                ),
            ),
            (
                "encoder",
                OneHotEncoder(
                    handle_unknown="ignore",
                ),
            ),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "numeric",
                numeric_pipeline,
                numeric_features,
            ),
            (
                "categorical",
                categorical_pipeline,
                categorical_features,
            ),
        ]
    )

    transformed = preprocessor.fit_transform(X)

    logger.info(
        "Feature preprocessing completed."
    )

    return transformed, preprocessor

# ===========================================================
# AVAILABLE MODELS
# ===========================================================

def get_available_models(
    problem_type: ProblemType,
) -> dict[str, object]:
    """
    Return the available models for the selected
    machine learning problem type.
    """

    logger.info(
        "Fetching available %s models.",
        problem_type,
    )

    if problem_type == "classification":
        return CLASSIFICATION_MODELS.copy()

    if problem_type == "regression":
        return REGRESSION_MODELS.copy()

    raise ValueError(
        f"Unsupported problem type: {problem_type}"
    )


# ===========================================================
# TRAIN MODELS
# ===========================================================

def train_models(
    X_train,
    y_train,
    problem_type: ProblemType,
) -> dict[str, object]:
    """
    Train every available model.
    """

    models = get_available_models(problem_type)

    trained_models = {}

    logger.info(
        "Training %d models.",
        len(models),
    )

    for name, model in models.items():

        estimator = clone(model)

        estimator.fit(
            X_train,
            y_train,
        )

        trained_models[name] = estimator

        logger.info(
            "%s trained successfully.",
            name,
        )

    return trained_models


# ===========================================================
# COMPARE MODELS
# ===========================================================

def compare_models(
    models: dict[str, object],
    X_test,
    y_test,
    problem_type: ProblemType,
) -> pd.DataFrame:
    """
    Compare trained machine learning models.
    """

    rows = []

    logger.info(
        "Comparing trained models."
    )

    for name, model in models.items():

        predictions = model.predict(X_test)

        if problem_type == "classification":

            score = accuracy_score(
                y_test,
                predictions,
            )

            metric = "Accuracy"

        else:

            score = r2_score(
                y_test,
                predictions,
            )

            metric = "R² Score"

        rows.append(
            {
                "Model": name,
                "Metric": metric,
                "Score": round(score, 4),
            }
        )

    comparison = (
        pd.DataFrame(rows)
        .sort_values(
            by="Score",
            ascending=False,
        )
        .reset_index(drop=True)
    )

    logger.info(
        "Model comparison completed."
    )

    return comparison

# ===========================================================
# EVALUATE MODEL
# ===========================================================

def evaluate_model(
    model,
    X_test,
    y_test,
    problem_type: ProblemType,
) -> dict[str, float]:
    """
    Evaluate a trained machine learning model.
    """

    logger.info("Evaluating model.")

    predictions = model.predict(X_test)

    if problem_type == "classification":

        score = accuracy_score(
            y_test,
            predictions,
        )

        logger.info(
            "Accuracy: %.4f",
            score,
        )

        return {
            "Accuracy": round(score, 4),
        }

    score = r2_score(
        y_test,
        predictions,
    )

    logger.info(
        "R² Score: %.4f",
        score,
    )

    return {
        "R² Score": round(score, 4),
    }


# ===========================================================
# PREDICT
# ===========================================================

def predict(
    model,
    X,
):
    """
    Generate predictions using a trained model.
    """

    logger.info("Generating predictions.")

    return model.predict(X)


# ===========================================================
# SAVE MODEL
# ===========================================================

def save_model(
    model,
    filepath: str,
) -> None:
    """
    Save a trained model to disk.
    """

    import joblib

    joblib.dump(
        model,
        filepath,
    )

    logger.info(
        "Model saved to %s",
        filepath,
    )


# ===========================================================
# LOAD MODEL
# ===========================================================

def load_model(
    filepath: str,
):
    """
    Load a trained model from disk.
    """

    import joblib

    logger.info(
        "Loading model from %s",
        filepath,
    )

    return joblib.load(filepath)
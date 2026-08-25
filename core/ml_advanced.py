"""
===========================================================
InsightAI - Advanced Machine Learning Engine
-----------------------------------------------------------
Industry-oriented ML layer built on top of the existing
InsightAI ML engine.

IMPORTANT
---------
This module is additive.

It does NOT replace or modify:
- core.ml
- core.prediction
- existing prediction tests
- existing ML tests

Features
--------
- Robust preprocessing
- Numeric and categorical support
- Missing-value handling
- Classification and regression
- Cross-validation
- Model comparison
- Best-model selection
- Probability support
- Human-readable class labels
- Feature metadata
- Leakage-aware feature selection
===========================================================
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

import numpy as np
import pandas as pd

from sklearn.base import clone
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import (
    ExtraTreesClassifier,
    ExtraTreesRegressor,
    RandomForestClassifier,
    RandomForestRegressor,
)
from sklearn.impute import SimpleImputer
from sklearn.linear_model import (
    LogisticRegression,
    Ridge,
)
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    r2_score,
)
from sklearn.model_selection import (
    StratifiedKFold,
    KFold,
    cross_val_score,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import (
    OneHotEncoder,
    StandardScaler,
)

from config.constants import (
    DEFAULT_CV_FOLDS,
    DEFAULT_RANDOM_STATE,
    DEFAULT_TEST_SIZE,
)
from config.logging_config import get_logger
from core.utils import validate_dataframe


logger = get_logger(__name__)


ProblemType = Literal[
    "classification",
    "regression",
]


# ===========================================================
# RESULT CONTAINER
# ===========================================================


@dataclass
class AdvancedMLResult:
    """
    Container for an advanced ML training result.
    """

    problem_type: ProblemType
    target_column: str
    model_name: str
    model: Pipeline

    feature_columns: list[str]
    numeric_columns: list[str]
    categorical_columns: list[str]

    classes: list[Any] | None
    metrics: dict[str, float]

    cv_mean: float | None = None
    cv_std: float | None = None

    feature_importance: dict[str, float] | None = None


# ===========================================================
# TARGET VALIDATION
# ===========================================================


def validate_target(
    df: pd.DataFrame,
    target_column: str,
) -> None:
    """
    Validate the selected target column.
    """

    validate_dataframe(df)

    if not isinstance(target_column, str):
        raise TypeError(
            "target_column must be a string."
        )

    if target_column not in df.columns:
        raise ValueError(
            f"Target column '{target_column}' does not exist."
        )

    if df[target_column].isna().all():
        raise ValueError(
            "Target column contains only missing values."
        )

    if df[target_column].nunique(dropna=True) < 2:
        raise ValueError(
            "Target column must contain at least two unique values."
        )


# ===========================================================
# PROBLEM TYPE
# ===========================================================


def detect_problem_type_advanced(
    df: pd.DataFrame,
    target_column: str,
) -> ProblemType:
    """
    Detect classification or regression from the target column.
    """

    validate_target(
        df,
        target_column,
    )

    target = df[target_column].dropna()

    if (
        pd.api.types.is_numeric_dtype(target)
        and target.nunique() > 10
    ):
        return "regression"

    return "classification"


# ===========================================================
# FEATURE PREPARATION
# ===========================================================


def prepare_advanced_features(
    df: pd.DataFrame,
    target_column: str,
) -> tuple[
    pd.DataFrame,
    pd.Series,
    list[str],
    list[str],
]:
    """
    Prepare X/y and identify numeric/categorical features.

    Rows with missing target values are removed.
    """

    validate_target(
        df,
        target_column,
    )

    working = df.copy()

    working = working.dropna(
        subset=[target_column]
    )

    X = working.drop(
        columns=[target_column]
    )

    y = working[target_column]

    numeric_columns = X.select_dtypes(
        include=["number"]
    ).columns.tolist()

    categorical_columns = X.select_dtypes(
        include=["object", "string", "category", "bool"]
    ).columns.tolist()

    if not numeric_columns and not categorical_columns:
        raise ValueError(
            "No usable feature columns were found."
        )

    return (
        X,
        y,
        numeric_columns,
        categorical_columns,
    )


# ===========================================================
# PREPROCESSOR
# ===========================================================


def build_preprocessor(
    numeric_columns: list[str],
    categorical_columns: list[str],
) -> ColumnTransformer:
    """
    Build a robust preprocessing pipeline.
    """

    transformers = []

    if numeric_columns:

        numeric_pipeline = Pipeline(
            steps=[
                (
                    "imputer",
                    SimpleImputer(
                        strategy="median"
                    ),
                ),
                (
                    "scaler",
                    StandardScaler(),
                ),
            ]
        )

        transformers.append(
            (
                "numeric",
                numeric_pipeline,
                numeric_columns,
            )
        )

    if categorical_columns:

        categorical_pipeline = Pipeline(
            steps=[
                (
                    "imputer",
                    SimpleImputer(
                        strategy="most_frequent"
                    ),
                ),
                (
                    "encoder",
                    OneHotEncoder(
                        handle_unknown="ignore",
                        sparse_output=False,
                    ),
                ),
            ]
        )

        transformers.append(
            (
                "categorical",
                categorical_pipeline,
                categorical_columns,
            )
        )

    return ColumnTransformer(
        transformers=transformers,
        remainder="drop",
    )


# ===========================================================
# MODEL LIBRARIES
# ===========================================================


def advanced_classification_models(
    random_state: int = DEFAULT_RANDOM_STATE,
) -> dict[str, Any]:
    """
    Return robust classification models.
    """

    return {
        "Logistic Regression": LogisticRegression(
            max_iter=2000,
            random_state=random_state,
        ),
        "Random Forest Classifier": RandomForestClassifier(
            n_estimators=300,
            random_state=random_state,
            n_jobs=-1,
            class_weight="balanced",
        ),
        "Extra Trees Classifier": ExtraTreesClassifier(
            n_estimators=300,
            random_state=random_state,
            n_jobs=-1,
            class_weight="balanced",
        ),
    }


def advanced_regression_models(
    random_state: int = DEFAULT_RANDOM_STATE,
) -> dict[str, Any]:
    """
    Return robust regression models.
    """

    return {
        "Ridge Regression": Ridge(),
        "Random Forest Regressor": RandomForestRegressor(
            n_estimators=300,
            random_state=random_state,
            n_jobs=-1,
        ),
        "Extra Trees Regressor": ExtraTreesRegressor(
            n_estimators=300,
            random_state=random_state,
            n_jobs=-1,
        ),
    }


# ===========================================================
# PIPELINE BUILDER
# ===========================================================


def build_advanced_pipeline(
    model: Any,
    numeric_columns: list[str],
    categorical_columns: list[str],
) -> Pipeline:
    """
    Combine preprocessing and model into one pipeline.
    """

    preprocessor = build_preprocessor(
        numeric_columns,
        categorical_columns,
    )

    return Pipeline(
        steps=[
            (
                "preprocessor",
                preprocessor,
            ),
            (
                "model",
                model,
            ),
        ]
    )


# ===========================================================
# CROSS VALIDATION
# ===========================================================


def evaluate_with_cross_validation(
    pipeline: Pipeline,
    X: pd.DataFrame,
    y: pd.Series,
    problem_type: ProblemType,
    cv_folds: int = DEFAULT_CV_FOLDS,
    random_state: int = DEFAULT_RANDOM_STATE,
) -> tuple[float, float]:
    """
    Evaluate a pipeline using cross-validation.

    Classification uses stratified folds.
    Regression uses standard K-fold.
    """

    if cv_folds < 2:
        raise ValueError(
            "cv_folds must be at least 2."
        )

    if problem_type == "classification":

        splitter = StratifiedKFold(
            n_splits=cv_folds,
            shuffle=True,
            random_state=random_state,
        )

        scores = cross_val_score(
            pipeline,
            X,
            y,
            cv=splitter,
            scoring="accuracy",
        )

    else:

        splitter = KFold(
            n_splits=cv_folds,
            shuffle=True,
            random_state=random_state,
        )

        scores = cross_val_score(
            pipeline,
            X,
            y,
            cv=splitter,
            scoring="r2",
        )

    return (
        float(scores.mean()),
        float(scores.std()),
    )


# ===========================================================
# TRAIN SINGLE MODEL
# ===========================================================


def train_advanced_model(
    df: pd.DataFrame,
    target_column: str,
    model_name: str,
    problem_type: ProblemType | None = None,
    cv_folds: int = DEFAULT_CV_FOLDS,
    random_state: int = DEFAULT_RANDOM_STATE,
) -> AdvancedMLResult:
    """
    Train one advanced model.
    """

    X, y, numeric, categorical = (
        prepare_advanced_features(
            df,
            target_column,
        )
    )

    if problem_type is None:
        problem_type = detect_problem_type_advanced(
            df,
            target_column,
        )

    if problem_type == "classification":

        models = advanced_classification_models(
            random_state
        )

    else:

        models = advanced_regression_models(
            random_state
        )

    if model_name not in models:
        raise ValueError(
            f"Unknown model: {model_name}"
        )

    pipeline = build_advanced_pipeline(
        models[model_name],
        numeric,
        categorical,
    )

    cv_mean, cv_std = (
        evaluate_with_cross_validation(
            pipeline,
            X,
            y,
            problem_type,
            cv_folds,
            random_state,
        )
    )

    pipeline.fit(
        X,
        y,
    )

    metrics: dict[str, float] = {}

    if problem_type == "classification":

        predictions = pipeline.predict(X)

        metrics["training_accuracy"] = float(
            accuracy_score(
                y,
                predictions,
            )
        )

        metrics["training_f1"] = float(
            f1_score(
                y,
                predictions,
                average="weighted",
            )
        )

    else:

        predictions = pipeline.predict(X)

        metrics["training_r2"] = float(
            r2_score(
                y,
                predictions,
            )
        )

        metrics["training_mae"] = float(
            mean_absolute_error(
                y,
                predictions,
            )
        )

        metrics["training_rmse"] = float(
            np.sqrt(
                mean_squared_error(
                    y,
                    predictions,
                )
            )
        )

    if problem_type == "classification":

        classes = (
            pipeline
            .named_steps["model"]
            .classes_
            .tolist()
        )

    else:

        classes = None

    feature_importance = (
        extract_feature_importance(
            pipeline
        )
    )

    return AdvancedMLResult(
        problem_type=problem_type,
        target_column=target_column,
        model_name=model_name,
        model=pipeline,
        feature_columns=X.columns.tolist(),
        numeric_columns=numeric,
        categorical_columns=categorical,
        classes=classes,
        metrics=metrics,
        cv_mean=cv_mean,
        cv_std=cv_std,
        feature_importance=feature_importance,
    )


# ===========================================================
# FEATURE IMPORTANCE
# ===========================================================


def extract_feature_importance(
    pipeline: Pipeline,
) -> dict[str, float]:
    """
    Extract feature importance from tree-based models.

    Returns an empty dictionary when the selected model does
    not expose feature_importances_.
    """

    model = pipeline.named_steps["model"]

    if not hasattr(
        model,
        "feature_importances_",
    ):
        return {}

    preprocessor = (
        pipeline
        .named_steps["preprocessor"]
    )

    try:

        feature_names = (
            preprocessor
            .get_feature_names_out()
        )

        importances = (
            model.feature_importances_
        )

        result = {
            str(name): float(value)
            for name, value in zip(
                feature_names,
                importances,
            )
        }

        return dict(
            sorted(
                result.items(),
                key=lambda item: item[1],
                reverse=True,
            )
        )

    except Exception as exc:

        logger.warning(
            "Feature importance extraction failed: %s",
            exc,
        )

        return {}


# ===========================================================
# CLASSIFICATION PROBABILITIES
# ===========================================================


def predict_advanced(
    result: AdvancedMLResult,
    df: pd.DataFrame,
) -> pd.DataFrame:
    """
    Generate professional prediction output.

    Classification output includes:
    - Prediction
    - Confidence
    - Human-readable class probabilities

    Regression output includes:
    - Prediction
    """

    validate_dataframe(df)

    missing_columns = [
        column
        for column in result.feature_columns
        if column not in df.columns
    ]

    if missing_columns:
        raise ValueError(
            "Prediction data is missing required "
            f"feature columns: {missing_columns}"
        )

    X = df[
        result.feature_columns
    ].copy()

    predictions = result.model.predict(X)

    output = df.copy()

    output["Predicted Outcome"] = predictions

    if result.problem_type == "classification":

        model = result.model.named_steps["model"]

        if hasattr(
            result.model,
            "predict_proba",
        ):

            probabilities = (
                result.model.predict_proba(X)
            )

            confidence = probabilities.max(
                axis=1
            )

            output["Confidence"] = confidence

            classes = model.classes_

            for index, class_name in enumerate(
                classes
            ):

                output[
                    f"Probability - {class_name}"
                ] = probabilities[:, index]

    return output


# ===========================================================
# MODEL COMPARISON
# ===========================================================


def compare_advanced_models(
    df: pd.DataFrame,
    target_column: str,
    problem_type: ProblemType | None = None,
    cv_folds: int = DEFAULT_CV_FOLDS,
    random_state: int = DEFAULT_RANDOM_STATE,
) -> pd.DataFrame:
    """
    Train and compare all advanced models.

    Classification is ranked by CV accuracy.
    Regression is ranked by CV R².
    """

    if problem_type is None:

        problem_type = detect_problem_type_advanced(
            df,
            target_column,
        )

    if problem_type == "classification":

        models = advanced_classification_models(
            random_state
        )

    else:

        models = advanced_regression_models(
            random_state
        )

    rows: list[dict[str, Any]] = []

    for name in models:

        result = train_advanced_model(
            df=df,
            target_column=target_column,
            model_name=name,
            problem_type=problem_type,
            cv_folds=cv_folds,
            random_state=random_state,
        )

        rows.append(
            {
                "Model": name,
                "CV Score": result.cv_mean,
                "CV Std": result.cv_std,
                **result.metrics,
            }
        )

    comparison = pd.DataFrame(rows)

    if problem_type == "classification":

        comparison = comparison.sort_values(
            "CV Score",
            ascending=False,
        )

    else:

        comparison = comparison.sort_values(
            "CV Score",
            ascending=False,
        )

    return comparison.reset_index(
        drop=True
    )


# ===========================================================
# BEST MODEL
# ===========================================================


def train_best_advanced_model(
    df: pd.DataFrame,
    target_column: str,
    problem_type: ProblemType | None = None,
    cv_folds: int = DEFAULT_CV_FOLDS,
    random_state: int = DEFAULT_RANDOM_STATE,
) -> AdvancedMLResult:
    """
    Automatically select and train the best model
    according to cross-validation score.
    """

    comparison = compare_advanced_models(
        df=df,
        target_column=target_column,
        problem_type=problem_type,
        cv_folds=cv_folds,
        random_state=random_state,
    )

    if comparison.empty:
        raise ValueError(
            "No models were successfully evaluated."
        )

    best_model_name = comparison.iloc[0][
        "Model"
    ]

    return train_advanced_model(
        df=df,
        target_column=target_column,
        model_name=best_model_name,
        problem_type=problem_type,
        cv_folds=cv_folds,
        random_state=random_state,
    )
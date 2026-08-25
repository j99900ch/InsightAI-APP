"""
===========================================================
InsightAI - Decision Tree Explainer
-----------------------------------------------------------
Provides human-readable explanations for a fitted
Decision Tree model.

This module is isolated from:
- core/ml.py
- core/prediction.py
- Streamlit UI
- existing InsightAI workflows

It converts learned tree information into:
- feature importance
- learned split rules
- prediction decision path
- human-readable explanation
===========================================================
"""

from __future__ import annotations

from typing import Any

import pandas as pd

from config.logging_config import get_logger
from core.decision_tree import (
    get_decision_path,
    get_feature_importance,
    get_tree_splits,
)

logger = get_logger(__name__)


# ===========================================================
# VALIDATION
# ===========================================================

def _validate_fitted_tree(model) -> None:
    """Validate that the supplied model is a fitted tree."""

    if not hasattr(model, "tree_"):
        raise ValueError(
            "Model is not a fitted Decision Tree."
        )


# ===========================================================
# FEATURE IMPORTANCE
# ===========================================================

def explain_feature_importance(
    model,
    feature_names: list[str],
) -> pd.DataFrame:
    """
    Return sorted feature importance for a fitted tree.
    """

    _validate_fitted_tree(model)

    result = get_feature_importance(
        model,
        feature_names,
    )

    if result.empty:
        return result

    result = result.copy()

    result["Importance (%)"] = (
        result["Importance"] * 100
    ).round(2)

    return result


# ===========================================================
# LEARNED RULES
# ===========================================================

def explain_tree_rules(
    model,
    feature_names: list[str],
) -> pd.DataFrame:
    """
    Return the actual feature/threshold rules learned
    by the Decision Tree.
    """

    _validate_fitted_tree(model)

    return get_tree_splits(
        model,
        feature_names,
    )


# ===========================================================
# DECISION PATH
# ===========================================================

def explain_prediction_path(
    model,
    X: pd.DataFrame,
    row_index: int = 0,
) -> list[dict[str, Any]]:
    """
    Return the decision path used by the tree for one row.
    """

    _validate_fitted_tree(model)

    if not isinstance(X, pd.DataFrame):
        raise TypeError(
            "X must be a pandas DataFrame."
        )

    return get_decision_path(
        model,
        X,
        row_index=row_index,
    )


# ===========================================================
# HUMAN-READABLE DECISION PATH
# ===========================================================

def build_decision_explanation(
    model,
    X: pd.DataFrame,
    feature_names: list[str],
    row_index: int = 0,
) -> list[str]:
    """
    Convert the model's decision path into human-readable
    statements.

    Example:

    Income <= 40000
    Age > 35
    """

    _validate_fitted_tree(model)

    if not isinstance(X, pd.DataFrame):
        raise TypeError(
            "X must be a pandas DataFrame."
        )

    if len(feature_names) != X.shape[1]:
        raise ValueError(
            "Number of feature names does not match "
            "the input feature count."
        )

    path = get_decision_path(
        model,
        X,
        row_index=row_index,
    )

    if not path:
        return []

    explanations: list[str] = []

    row = X.iloc[row_index]

    for step in path:

        feature_index = step["FeatureIndex"]
        threshold = step["Threshold"]

        if feature_index < 0:
            continue

        if feature_index >= len(feature_names):
            raise ValueError(
                "Feature index is outside feature names."
            )

        feature_name = feature_names[
            feature_index
        ]

        value = row.iloc[feature_index]

        if pd.isna(value):
            continue

        if value <= threshold:

            explanations.append(
                f"{feature_name} "
                f"({value:g}) <= "
                f"{threshold:.4g}"
            )

        else:

            explanations.append(
                f"{feature_name} "
                f"({value:g}) > "
                f"{threshold:.4g}"
            )

    return explanations


# ===========================================================
# PREDICTION SUMMARY
# ===========================================================

def explain_prediction(
    model,
    X: pd.DataFrame,
    feature_names: list[str],
    row_index: int = 0,
) -> dict[str, Any]:
    """
    Generate a complete explanation for one prediction.

    Returns:
        prediction
        confidence
        decision_path
        explanation
    """

    _validate_fitted_tree(model)

    if not isinstance(X, pd.DataFrame):
        raise TypeError(
            "X must be a pandas DataFrame."
        )

    if row_index < 0 or row_index >= len(X):
        raise IndexError(
            "row_index is outside the input data."
        )

    prediction = model.predict(
        X.iloc[[row_index]]
    )[0]

    confidence = None

    if hasattr(model, "predict_proba"):

        probabilities = model.predict_proba(
            X.iloc[[row_index]]
        )

        confidence = float(
            probabilities.max()
        )

    decision_path = explain_prediction_path(
        model,
        X,
        row_index=row_index,
    )

    explanation = build_decision_explanation(
        model,
        X,
        feature_names,
        row_index=row_index,
    )

    return {
        "prediction": prediction,
        "confidence": confidence,
        "decision_path": decision_path,
        "explanation": explanation,
    }


# ===========================================================
# COMPLETE TREE EXPLANATION
# ===========================================================

def complete_tree_explanation(
    model,
    X: pd.DataFrame,
    feature_names: list[str],
    row_index: int = 0,
) -> dict[str, Any]:
    """
    Generate the complete explainability package.

    This is the main public function that can later be
    connected to the InsightAI prediction UI.
    """

    _validate_fitted_tree(model)

    logger.info(
        "Generating complete Decision Tree explanation."
    )

    return {
        "feature_importance": (
            explain_feature_importance(
                model,
                feature_names,
            )
        ),
        "tree_rules": (
            explain_tree_rules(
                model,
                feature_names,
            )
        ),
        "prediction": explain_prediction(
            model,
            X,
            feature_names,
            row_index=row_index,
        ),
    }
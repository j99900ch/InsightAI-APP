"""
===========================================================
InsightAI - Decision Tree Engine
-----------------------------------------------------------
Provides isolated Decision Tree utilities for classification
and regression.

This module does not modify the existing ML engine.
It can be integrated later after all tests pass.
===========================================================
"""

from __future__ import annotations

from typing import Any, Literal

import pandas as pd

from sklearn.tree import (
    DecisionTreeClassifier,
    DecisionTreeRegressor,
)

from config.constants import DEFAULT_RANDOM_STATE
from config.logging_config import get_logger
from core.utils import validate_dataframe

logger = get_logger(__name__)


ProblemType = Literal[
    "classification",
    "regression",
]


# ===========================================================
# MODEL CREATION
# ===========================================================

def create_decision_tree(
    problem_type: ProblemType,
    max_depth: int | None = None,
    min_samples_split: int = 2,
    min_samples_leaf: int = 1,
    random_state: int = DEFAULT_RANDOM_STATE,
):
    """
    Create a Decision Tree model.

    The Decision Tree automatically determines:
    - which feature to split on
    - which threshold to use
    - the best split at each node

    Parameters
    ----------
    problem_type:
        "classification" or "regression"

    max_depth:
        Maximum tree depth.

    min_samples_split:
        Minimum samples required to split a node.

    min_samples_leaf:
        Minimum samples required in a leaf.

    random_state:
        Reproducibility seed.
    """

    if problem_type == "classification":

        model = DecisionTreeClassifier(
            max_depth=max_depth,
            min_samples_split=min_samples_split,
            min_samples_leaf=min_samples_leaf,
            random_state=random_state,
        )

    elif problem_type == "regression":

        model = DecisionTreeRegressor(
            max_depth=max_depth,
            min_samples_split=min_samples_split,
            min_samples_leaf=min_samples_leaf,
            random_state=random_state,
        )

    else:
        raise ValueError(
            f"Unsupported problem type: {problem_type}"
        )

    logger.info(
        "Decision Tree created for %s.",
        problem_type,
    )

    return model


# ===========================================================
# FEATURE IMPORTANCE
# ===========================================================

def get_feature_importance(
    model,
    feature_names: list[str],
) -> pd.DataFrame:
    """
    Return Decision Tree feature importance.

    The importance values indicate how much each feature
    contributed to the tree's splitting decisions.
    """

    if not hasattr(model, "feature_importances_"):
        raise ValueError(
            "Model does not provide feature importance."
        )

    importances = model.feature_importances_

    if len(feature_names) != len(importances):
        raise ValueError(
            "Number of feature names does not match "
            "the model feature count."
        )

    result = pd.DataFrame(
        {
            "Feature": feature_names,
            "Importance": importances,
        }
    )

    result = (
        result
        .sort_values(
            "Importance",
            ascending=False,
        )
        .reset_index(drop=True)
    )

    return result


# ===========================================================
# TREE SPLIT INFORMATION
# ===========================================================

def get_tree_splits(
    model,
    feature_names: list[str],
) -> pd.DataFrame:
    """
    Extract the feature and threshold used at each
    Decision Tree split.

    This exposes the actual decisions learned by the tree.
    """

    if not hasattr(model, "tree_"):
        raise ValueError(
            "Model is not a fitted Decision Tree."
        )

    tree = model.tree_

    rows: list[dict[str, Any]] = []

    for node_id in range(tree.node_count):

        feature_index = tree.feature[node_id]

        # Leaf node
        if feature_index < 0:
            continue

        if feature_index >= len(feature_names):
            raise ValueError(
                "Feature index is outside feature names."
            )

        rows.append(
            {
                "Node": node_id,
                "Feature": feature_names[feature_index],
                "Threshold": float(
                    tree.threshold[node_id]
                ),
            }
        )

    return pd.DataFrame(
        rows,
        columns=[
            "Node",
            "Feature",
            "Threshold",
        ],
    )


# ===========================================================
# DECISION PATH
# ===========================================================

def get_decision_path(
    model,
    X,
    row_index: int = 0,
) -> list[dict[str, Any]]:
    """
    Return the decision path for one prediction row.

    This shows the feature/threshold decisions used by the
    fitted tree for that particular prediction.
    """

    if not hasattr(model, "tree_"):
        raise ValueError(
            "Model is not a fitted Decision Tree."
        )

    if row_index < 0 or row_index >= len(X):
        raise IndexError(
            "row_index is outside the input data."
        )

    decision_path = model.decision_path(X)

    node_ids = decision_path[row_index].indices

    rows: list[dict[str, Any]] = []

    tree = model.tree_

    for node_id in node_ids:

        feature_index = tree.feature[node_id]

        # Leaf node
        if feature_index < 0:
            continue

        threshold = tree.threshold[node_id]

        rows.append(
            {
                "Node": int(node_id),
                "FeatureIndex": int(feature_index),
                "Threshold": float(threshold),
            }
        )

    return rows
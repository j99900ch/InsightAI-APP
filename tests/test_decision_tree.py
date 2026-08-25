"""
===========================================================
InsightAI - Unit Tests for Decision Tree Engine
-----------------------------------------------------------
Tests the isolated Decision Tree functionality.

This module does not modify the existing ML engine.
===========================================================
"""

import pandas as pd
import pytest

from core.decision_tree import (
    create_decision_tree,
    get_feature_importance,
    get_tree_splits,
    get_decision_path,
)


# ===========================================================
# FIXTURE
# ===========================================================

@pytest.fixture
def trained_tree():

    X = pd.DataFrame(
        {
            "Age": [20, 25, 30, 35, 40, 45, 50, 55],
            "Salary": [
                25000,
                30000,
                35000,
                40000,
                50000,
                60000,
                70000,
                80000,
            ],
            "Experience": [
                1,
                2,
                3,
                5,
                7,
                10,
                12,
                15,
            ],
        }
    )

    y = pd.Series(
        [
            "No",
            "No",
            "No",
            "Yes",
            "Yes",
            "Yes",
            "Yes",
            "Yes",
        ],
        name="Purchased",
    )

    feature_names = list(X.columns)

    model = create_decision_tree(
        problem_type="classification",
        random_state=42,
    )

    model.fit(X, y)

    return model, X, y, feature_names


# ===========================================================
# MODEL CREATION
# ===========================================================

def test_create_classification_tree():

    model = create_decision_tree(
        problem_type="classification",
    )

    assert model is not None
    assert hasattr(model, "fit")
    assert hasattr(model, "predict")


def test_create_regression_tree():

    model = create_decision_tree(
        problem_type="regression",
    )

    assert model is not None
    assert hasattr(model, "fit")
    assert hasattr(model, "predict")


def test_invalid_problem_type():

    with pytest.raises(ValueError):

        create_decision_tree(
            problem_type="invalid",
        )


# ===========================================================
# TREE TRAINING
# ===========================================================

def test_tree_training(trained_tree):

    model, X, y, _ = trained_tree

    assert hasattr(model, "tree_")
    assert model.tree_.node_count > 0
    assert model.tree_.max_depth >= 0


# ===========================================================
# PREDICTION
# ===========================================================

def test_tree_prediction(trained_tree):

    model, X, _, _ = trained_tree

    predictions = model.predict(X)

    assert len(predictions) == len(X)
    assert all(
        prediction in ["Yes", "No"]
        for prediction in predictions
    )


# ===========================================================
# FEATURE IMPORTANCE
# ===========================================================

def test_feature_importance(trained_tree):

    model, _, _, feature_names = trained_tree

    importance = get_feature_importance(
        model,
        feature_names,
    )

    assert isinstance(
        importance,
        pd.DataFrame,
    )

    assert not importance.empty

    assert "Feature" in importance.columns
    assert "Importance" in importance.columns

    assert len(importance) == len(
        feature_names
    )

    assert (
        importance["Importance"]
        .between(0, 1)
        .all()
    )


# ===========================================================
# TREE SPLITS
# ===========================================================

def test_tree_splits(trained_tree):

    model, _, _, feature_names = trained_tree

    splits = get_tree_splits(
        model,
        feature_names,
    )

    assert isinstance(
        splits,
        pd.DataFrame,
    )

    assert list(splits.columns) == [
        "Node",
        "Feature",
        "Threshold",
    ]

    if not splits.empty:

        assert splits["Feature"].isin(
            feature_names
        ).all()

        assert pd.api.types.is_numeric_dtype(
            splits["Threshold"]
        )


# ===========================================================
# DECISION PATH
# ===========================================================

def test_decision_path(trained_tree):

    model, X, _, _ = trained_tree

    path = get_decision_path(
        model,
        X,
        row_index=0,
    )

    assert isinstance(path, list)

    for step in path:

        assert "Node" in step
        assert "FeatureIndex" in step
        assert "Threshold" in step


# ===========================================================
# INVALID DECISION PATH INDEX
# ===========================================================

def test_invalid_decision_path_index(
    trained_tree,
):

    model, X, _, _ = trained_tree

    with pytest.raises(IndexError):

        get_decision_path(
            model,
            X,
            row_index=len(X),
        )


# ===========================================================
# INVALID FEATURE NAMES
# ===========================================================

def test_invalid_feature_names(
    trained_tree,
):

    model, _, _, _ = trained_tree

    with pytest.raises(ValueError):

        get_feature_importance(
            model,
            ["WrongFeature"],
        )


# ===========================================================
# UNFITTED TREE SPLITS
# ===========================================================

def test_unfitted_tree_splits():

    model = create_decision_tree(
        problem_type="classification",
    )

    with pytest.raises(ValueError):

        get_tree_splits(
            model,
            ["Age"],
        )
"""
===========================================================
InsightAI - Decision Tree Explainer Tests
-----------------------------------------------------------
Tests the isolated explainability layer.

These tests must not modify the existing ML engine,
prediction engine, UI or application routing.
===========================================================
"""

import pandas as pd
import pytest

from core.decision_tree import create_decision_tree

from core.decision_tree_explainer import (
    explain_feature_importance,
    explain_tree_rules,
    explain_prediction_path,
    build_decision_explanation,
    explain_prediction,
    complete_tree_explanation,
)


# ===========================================================
# FIXTURE
# ===========================================================

@pytest.fixture
def trained_tree():

    X = pd.DataFrame(
        {
            "Age": [
                20,
                25,
                30,
                35,
                40,
                45,
                50,
                55,
            ],
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
# FEATURE IMPORTANCE
# ===========================================================

def test_explain_feature_importance(
    trained_tree,
):

    model, _, _, feature_names = trained_tree

    result = explain_feature_importance(
        model,
        feature_names,
    )

    assert isinstance(
        result,
        pd.DataFrame,
    )

    assert not result.empty

    assert "Feature" in result.columns

    assert "Importance" in result.columns

    assert "Importance (%)" in result.columns

    assert len(result) == len(
        feature_names
    )


# ===========================================================
# TREE RULES
# ===========================================================

def test_explain_tree_rules(
    trained_tree,
):

    model, _, _, feature_names = trained_tree

    result = explain_tree_rules(
        model,
        feature_names,
    )

    assert isinstance(
        result,
        pd.DataFrame,
    )

    assert list(result.columns) == [
        "Node",
        "Feature",
        "Threshold",
    ]


# ===========================================================
# DECISION PATH
# ===========================================================

def test_explain_prediction_path(
    trained_tree,
):

    model, X, _, _ = trained_tree

    result = explain_prediction_path(
        model,
        X,
        row_index=0,
    )

    assert isinstance(
        result,
        list,
    )


# ===========================================================
# HUMAN READABLE EXPLANATION
# ===========================================================

def test_build_decision_explanation(
    trained_tree,
):

    model, X, _, feature_names = trained_tree

    result = build_decision_explanation(
        model,
        X,
        feature_names,
        row_index=0,
    )

    assert isinstance(
        result,
        list,
    )

    for item in result:
        assert isinstance(
            item,
            str,
        )


# ===========================================================
# SINGLE PREDICTION EXPLANATION
# ===========================================================

def test_explain_prediction(
    trained_tree,
):

    model, X, _, feature_names = trained_tree

    result = explain_prediction(
        model,
        X,
        feature_names,
        row_index=0,
    )

    assert isinstance(
        result,
        dict,
    )

    assert "prediction" in result

    assert "confidence" in result

    assert "decision_path" in result

    assert "explanation" in result

    assert result["prediction"] in [
        "Yes",
        "No",
    ]

    assert result["confidence"] is not None

    assert 0 <= result["confidence"] <= 1


# ===========================================================
# COMPLETE EXPLANATION
# ===========================================================

def test_complete_tree_explanation(
    trained_tree,
):

    model, X, _, feature_names = trained_tree

    result = complete_tree_explanation(
        model,
        X,
        feature_names,
        row_index=0,
    )

    assert isinstance(
        result,
        dict,
    )

    assert "feature_importance" in result

    assert "tree_rules" in result

    assert "prediction" in result

    assert isinstance(
        result["feature_importance"],
        pd.DataFrame,
    )

    assert isinstance(
        result["tree_rules"],
        pd.DataFrame,
    )

    assert isinstance(
        result["prediction"],
        dict,
    )


# ===========================================================
# INVALID INPUT
# ===========================================================

def test_invalid_dataframe(
    trained_tree,
):

    model, _, _, feature_names = trained_tree

    with pytest.raises(TypeError):

        explain_prediction(
            model,
            [[20, 25000, 1]],
            feature_names,
        )


# ===========================================================
# INVALID ROW INDEX
# ===========================================================

def test_invalid_row_index(
    trained_tree,
):

    model, X, _, feature_names = trained_tree

    with pytest.raises(IndexError):

        explain_prediction(
            model,
            X,
            feature_names,
            row_index=len(X),
        )


# ===========================================================
# INVALID FEATURE NAMES
# ===========================================================

def test_invalid_feature_names(
    trained_tree,
):

    model, X, _, _ = trained_tree

    with pytest.raises(ValueError):

        build_decision_explanation(
            model,
            X,
            ["WrongFeature"],
        )


# ===========================================================
# UNFITTED MODEL
# ===========================================================

def test_unfitted_model():

    model = create_decision_tree(
        problem_type="classification",
    )

    X = pd.DataFrame(
        {
            "Age": [20, 30],
        }
    )

    with pytest.raises(ValueError):

        explain_feature_importance(
            model,
            ["Age"],
        )
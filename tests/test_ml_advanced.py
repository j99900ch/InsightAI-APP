"""
===========================================================
InsightAI - Tests for Advanced ML Engine
===========================================================
"""

import pandas as pd
import pytest

from core.ml_advanced import (
    advanced_classification_models,
    advanced_regression_models,
    build_preprocessor,
    detect_problem_type_advanced,
    evaluate_with_cross_validation,
    prepare_advanced_features,
    train_advanced_model,
    train_best_advanced_model,
    compare_advanced_models,
    predict_advanced,
)


@pytest.fixture
def classification_df():
    return pd.DataFrame(
        {
            "Age": [
                22, 25, 28, 31, 35,
                40, 45, 50, 55, 60,
                24, 29, 33, 38, 43,
                48, 53, 58, 27, 36,
            ],
            "Income": [
                25000, 30000, 35000, 40000, 45000,
                50000, 55000, 60000, 65000, 70000,
                28000, 36000, 42000, 48000, 52000,
                58000, 62000, 68000, 32000, 46000,
            ],
            "Department": [
                "HR", "IT", "Sales", "HR", "IT",
                "Sales", "HR", "IT", "Sales", "HR",
                "IT", "Sales", "HR", "IT", "Sales",
                "HR", "IT", "Sales", "HR", "IT",
            ],
            "Outcome": [
                "Low", "Low", "Low", "Medium", "Medium",
                "Medium", "High", "High", "High", "High",
                "Low", "Medium", "Medium", "Medium", "High",
                "High", "High", "High", "Low", "Medium",
            ],
        }
    )


@pytest.fixture
def regression_df():
    return pd.DataFrame(
        {
            "Age": [
                22, 25, 28, 31, 35,
                40, 45, 50, 55, 60,
                24, 29, 33, 38, 43,
                48, 53, 58, 27, 36,
            ],
            "Experience": [
                1, 2, 3, 4, 5,
                6, 7, 8, 9, 10,
                2, 3, 4, 5, 6,
                7, 8, 9, 2, 5,
            ],
            "Department": [
                "HR", "IT", "Sales", "HR", "IT",
                "Sales", "HR", "IT", "Sales", "HR",
                "IT", "Sales", "HR", "IT", "Sales",
                "HR", "IT", "Sales", "HR", "IT",
            ],
            "Salary": [
                30000, 34000, 38000, 42000, 46000,
                50000, 55000, 60000, 65000, 70000,
                33000, 39000, 43000, 47000, 52000,
                57000, 62000, 68000, 36000, 48000,
            ],
        }
    )


# ===========================================================
# Problem Detection
# ===========================================================


def test_advanced_classification_detection(
    classification_df,
):
    assert (
        detect_problem_type_advanced(
            classification_df,
            "Outcome",
        )
        == "classification"
    )


def test_advanced_regression_detection(
    regression_df,
):
    assert (
        detect_problem_type_advanced(
            regression_df,
            "Salary",
        )
        == "regression"
    )


# ===========================================================
# Feature Preparation
# ===========================================================


def test_prepare_advanced_features(
    classification_df,
):
    X, y, numeric, categorical = (
        prepare_advanced_features(
            classification_df,
            "Outcome",
        )
    )

    assert "Outcome" not in X.columns
    assert len(X) == len(y)
    assert "Age" in numeric
    assert "Department" in categorical


# ===========================================================
# Model Libraries
# ===========================================================


def test_classification_models():
    models = advanced_classification_models()

    assert len(models) >= 3
    assert "Random Forest Classifier" in models


def test_regression_models():
    models = advanced_regression_models()

    assert len(models) >= 3
    assert "Random Forest Regressor" in models


# ===========================================================
# Preprocessor
# ===========================================================


def test_preprocessor():
    preprocessor = build_preprocessor(
        ["Age"],
        ["Department"],
    )

    assert preprocessor is not None


# ===========================================================
# Training
# ===========================================================


def test_train_advanced_classification(
    classification_df,
):
    result = train_advanced_model(
        classification_df,
        "Outcome",
        "Random Forest Classifier",
    )

    assert result.problem_type == "classification"
    assert result.target_column == "Outcome"
    assert result.model is not None
    assert result.classes is not None
    assert result.cv_mean is not None
    assert result.cv_std is not None


def test_train_advanced_regression(
    regression_df,
):
    result = train_advanced_model(
        regression_df,
        "Salary",
        "Random Forest Regressor",
    )

    assert result.problem_type == "regression"
    assert result.target_column == "Salary"
    assert result.model is not None
    assert result.cv_mean is not None


# ===========================================================
# Prediction
# ===========================================================


def test_advanced_classification_prediction(
    classification_df,
):
    result = train_advanced_model(
        classification_df,
        "Outcome",
        "Random Forest Classifier",
    )

    prediction_df = predict_advanced(
        result,
        classification_df.drop(
            columns=["Outcome"]
        ),
    )

    assert (
        "Predicted Outcome"
        in prediction_df.columns
    )

    assert "Confidence" in prediction_df.columns


# ===========================================================
# Comparison
# ===========================================================


def test_compare_advanced_models(
    classification_df,
):
    comparison = compare_advanced_models(
        classification_df,
        "Outcome",
        cv_folds=3,
    )

    assert not comparison.empty
    assert "Model" in comparison.columns
    assert "CV Score" in comparison.columns


# ===========================================================
# Best Model
# ===========================================================


def test_train_best_advanced_model(
    classification_df,
):
    result = train_best_advanced_model(
        classification_df,
        "Outcome",
        cv_folds=3,
    )

    assert result.model is not None
    assert result.model_name
    assert result.cv_mean is not None


# ===========================================================
# Validation
# ===========================================================


def test_invalid_target(
    classification_df,
):
    with pytest.raises(ValueError):
        detect_problem_type_advanced(
            classification_df,
            "DoesNotExist",
        )
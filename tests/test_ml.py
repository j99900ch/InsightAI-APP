import pandas as pd
import pytest

from core.ml import (
    detect_problem_type,
    split_dataset,
    prepare_features,
    get_available_models,
    train_models,
    compare_models,
)


# ===========================================================
# FIXTURES
# ===========================================================

@pytest.fixture
def classification_df():
    return pd.DataFrame(
        {
            "Age": [20, 25, 30, 35, 40, 45],
            "Salary": [30, 40, 50, 60, 70, 80],
            "Department": [
                "HR",
                "IT",
                "HR",
                "Sales",
                "IT",
                "Sales",
            ],
            "Target": [
                "Yes",
                "No",
                "Yes",
                "No",
                "Yes",
                "No",
            ],
        }
    )


@pytest.fixture
def regression_df():
    return pd.DataFrame(
        {
            "Age": list(range(20, 40)),
            "Experience": list(range(20)),
            "Salary": list(range(30000, 30020)),
        }
    )


# ===========================================================
# PROBLEM TYPE
# ===========================================================

def test_detect_classification(classification_df):
    assert (
        detect_problem_type(
            classification_df,
            "Target",
        )
        == "classification"
    )


def test_detect_regression(regression_df):
    assert (
        detect_problem_type(
            regression_df,
            "Salary",
        )
        == "regression"
    )


# ===========================================================
# SPLIT DATASET
# ===========================================================

def test_split_dataset(classification_df):

    X_train, X_test, y_train, y_test = split_dataset(
        classification_df,
        "Target",
    )

    assert len(X_train) > 0
    assert len(X_test) > 0
    assert len(y_train) > 0
    assert len(y_test) > 0


# ===========================================================
# PREPROCESSING
# ===========================================================

def test_prepare_features(classification_df):

    X = classification_df.drop(columns=["Target"])

    transformed, preprocessor = prepare_features(X)

    assert transformed.shape[0] == len(X)
    assert preprocessor is not None


# ===========================================================
# MODEL REGISTRY
# ===========================================================

def test_available_classification_models():

    models = get_available_models(
        "classification"
    )

    assert isinstance(models, dict)
    assert len(models) >= 3


def test_available_regression_models():

    models = get_available_models(
        "regression"
    )

    assert isinstance(models, dict)
    assert len(models) >= 3


# ===========================================================
# TRAINING
# ===========================================================

def test_train_models(classification_df):

    X = classification_df.drop(columns=["Target"])

    X, _ = prepare_features(X)

    y = classification_df["Target"]

    models = train_models(
        X,
        y,
        "classification",
    )

    assert isinstance(models, dict)
    assert len(models) >= 3


# ===========================================================
# COMPARISON
# ===========================================================

def test_compare_models(classification_df):

    X_train, X_test, y_train, y_test = split_dataset(
        classification_df,
        "Target",
    )

    X_train, preprocessor = prepare_features(
        X_train
    )

    X_test = preprocessor.transform(X_test)

    models = train_models(
        X_train,
        y_train,
        "classification",
    )

    comparison = compare_models(
        models,
        X_test,
        y_test,
        "classification",
    )

    assert not comparison.empty
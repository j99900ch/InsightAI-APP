import tempfile

import pandas as pd
import pytest
from sklearn.linear_model import LogisticRegression

from core.ml import prepare_features
from core.prediction import (
    load_prediction_data,
    load_saved_model,
    predict_dataframe,
    prediction_summary,
    predict_probabilities,
    save_predictions,
)
from core.ml import save_model


# ===========================================================
# FIXTURES
# ===========================================================

@pytest.fixture
def sample_df():
    return pd.DataFrame(
        {
            "Age": [20, 25, 30, 35],
            "Department": [
                "HR",
                "IT",
                "HR",
                "Sales",
            ],
        }
    )


@pytest.fixture
def trained_model(sample_df):

    X, preprocessor = prepare_features(
        sample_df
    )

    y = ["Yes", "No", "Yes", "No"]

    model = LogisticRegression(
        max_iter=1000,
    )

    model.fit(
        X,
        y,
    )

    return model, preprocessor


# ===========================================================
# PREDICT DATAFRAME
# ===========================================================

def test_predict_dataframe(
    sample_df,
    trained_model,
):

    model, preprocessor = trained_model

    predictions = predict_dataframe(
        model,
        sample_df,
        preprocessor,
    )

    assert "Prediction" in predictions.columns
    assert len(predictions) == len(sample_df)


# ===========================================================
# PREDICT PROBABILITIES
# ===========================================================

def test_predict_probabilities(
    sample_df,
    trained_model,
):

    model, preprocessor = trained_model

    probabilities = predict_probabilities(
        model,
        sample_df,
        preprocessor,
    )

    assert not probabilities.empty


# ===========================================================
# PREDICTION SUMMARY
# ===========================================================

def test_prediction_summary():

    df = pd.DataFrame(
        {
            "Prediction": [
                "Yes",
                "No",
                "Yes",
            ]
        }
    )

    summary = prediction_summary(df)

    assert summary["total_predictions"] == 3


# ===========================================================
# SAVE / LOAD PREDICTIONS
# ===========================================================

def test_save_and_load_predictions():

    df = pd.DataFrame(
        {
            "Prediction": [
                "A",
                "B",
            ]
        }
    )

    with tempfile.NamedTemporaryFile(
        suffix=".csv",
        delete=False,
    ) as file:

        save_predictions(
            df,
            file.name,
        )

        loaded = load_prediction_data(
            file.name,
        )

    assert len(loaded) == 2


# ===========================================================
# SAVE / LOAD MODEL
# ===========================================================

def test_save_and_load_model(
    trained_model,
):

    model, _ = trained_model

    with tempfile.NamedTemporaryFile(
        suffix=".joblib",
        delete=False,
    ) as file:

        save_model(
            model,
            file.name,
        )

        loaded = load_saved_model(
            file.name,
        )

    assert loaded is not None
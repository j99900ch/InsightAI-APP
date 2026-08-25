"""
===========================================================
InsightAI - Prediction Explainability UI Tests
-----------------------------------------------------------
Tests the isolated prediction explainability UI.
===========================================================
"""

import pandas as pd
import pytest

from core.decision_tree import create_decision_tree

from core.decision_tree_explainer import (
    explain_prediction,
)

from components.prediction_explainability_ui import (
    render_prediction_explanation,
)


# ===========================================================
# FIXTURE
# ===========================================================

@pytest.fixture
def explanation():

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

    model = create_decision_tree(
        problem_type="classification",
        random_state=42,
    )

    model.fit(X, y)

    return explain_prediction(
        model,
        X,
        list(X.columns),
        row_index=0,
    )


# ===========================================================
# UI RENDER TEST
# ===========================================================

def test_prediction_explanation_ui_runs(
    explanation,
):

    render_prediction_explanation(
        explanation
    )


# ===========================================================
# INVALID INPUT
# ===========================================================

def test_prediction_explanation_ui_invalid_input():

    with pytest.raises(TypeError):

        render_prediction_explanation(
            None
        )
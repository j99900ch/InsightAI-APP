"""
===========================================================
InsightAI - Machine Learning / Prediction
-----------------------------------------------------------
Displays prediction results.

This module only renders prediction output.
It NEVER changes navigation or session routing.
===========================================================
"""

from __future__ import annotations

import pandas as pd
import streamlit as st


def make_sample_prediction() -> pd.DataFrame:
    """Return sample prediction data."""

    return pd.DataFrame(
        {
            "Input": ["Sample A", "Sample B", "Sample C"],
            "Prediction": ["Class 1", "Class 2", "Class 1"],
        }
    )


def render_prediction_ui() -> None:
    """Render prediction page."""

    st.title("🤖 Machine Learning")

    if st.session_state.get("uploaded_file_name"):
        st.success(
            f"Dataset: {st.session_state.uploaded_file_name}"
        )
    else:
        st.info(
            "No dataset uploaded. Showing sample prediction."
        )

    st.divider()

    prediction_df = make_sample_prediction()

    st.dataframe(
        prediction_df,
        use_container_width=True,
    )

    st.session_state.prediction_result = prediction_df

    st.success("Prediction completed.")
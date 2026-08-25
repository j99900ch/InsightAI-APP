"""
===========================================================
InsightAI - Business Insights UI
-----------------------------------------------------------
Streamlit UI for the existing Business Insights Engine.

This module contains presentation logic only.
Business calculations remain inside core.insights.
===========================================================
"""

from __future__ import annotations

import streamlit as st

from core.insights import generate_summary


# ===========================================================
# MAIN UI
# ===========================================================

def render_insights_ui() -> None:
    """
    Render the Business Insights page.
    """

    st.title("💡 Business Insights")

    st.caption(
        "Automated dataset quality, feature and business analysis."
    )

    # -------------------------------------------------------
    # Dataset check
    # -------------------------------------------------------

    df = st.session_state.get("df")

    if df is None:
        st.info(
            "Please upload a dataset before generating "
            "business insights."
        )
        return

    # -------------------------------------------------------
    # Generate insights
    # -------------------------------------------------------

    try:
        summary = generate_summary(df)

    except Exception as exc:

        st.error(
            f"Unable to generate business insights: {exc}"
        )

        return

    # -------------------------------------------------------
    # Dataset Overview
    # -------------------------------------------------------

    st.divider()

    st.subheader("📊 Dataset Overview")

    st.info(
        summary.get(
            "dataset_overview",
            "Dataset overview is unavailable.",
        )
    )

    # -------------------------------------------------------
    # Insight counts
    # -------------------------------------------------------

    quality = summary.get(
        "dataset_quality",
        [],
    )

    features = summary.get(
        "feature_insights",
        [],
    )

    business = summary.get(
        "business_insights",
        [],
    )

    col1, col2, col3 = st.columns(3)

    with col1:
        st.metric(
            "Quality Insights",
            len(quality),
        )

    with col2:
        st.metric(
            "Feature Insights",
            len(features),
        )

    with col3:
        st.metric(
            "Business Insights",
            len(business),
        )

    # -------------------------------------------------------
    # Dataset Quality
    # -------------------------------------------------------

    st.divider()

    st.subheader("🛡️ Dataset Quality")

    if quality:

        for insight in quality:
            st.markdown(f"- {insight}")

    else:

        st.info(
            "No dataset quality insights are available."
        )

    # -------------------------------------------------------
    # Feature Insights
    # -------------------------------------------------------

    st.divider()

    st.subheader("🔎 Feature Insights")

    if features:

        for insight in features:
            st.markdown(f"- {insight}")

    else:

        st.info(
            "No feature insights are available."
        )

    # -------------------------------------------------------
    # Business Recommendations
    # -------------------------------------------------------

    st.divider()

    st.subheader("💼 Business Recommendations")

    if business:

        for insight in business:
            st.markdown(f"- {insight}")

    else:

        st.info(
            "No business recommendations are available."
        )

    # -------------------------------------------------------
    # Refresh
    # -------------------------------------------------------

    st.divider()

    if st.button(
        "🔄 Refresh Insights",
        use_container_width=True,
    ):
        st.rerun()
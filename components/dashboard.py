"""
===========================================================
InsightAI - Dashboard Component
-----------------------------------------------------------
Displays the application dashboard.

This module only renders the dashboard.
It NEVER changes navigation or page routing.
===========================================================
"""

from __future__ import annotations

import streamlit as st


def render_dashboard() -> None:
    """Render the dashboard page."""

    st.title("🏠 InsightAI Dashboard")

    st.markdown(
        """
Welcome to **InsightAI**.

Use the navigation panel on the left to:

- 📂 Upload a dataset
- 📊 View statistics
- 📈 Create charts
- 🤖 Run machine learning
- 📄 Generate reports
- 📤 Export results
"""
    )

    st.divider()

    if st.session_state.get("uploaded_file_name"):
        st.success(
            f"Current Dataset: **{st.session_state.uploaded_file_name}**"
        )
    else:
        st.info("No dataset has been uploaded.")

    st.divider()

    summary = st.session_state.get("dataset_summary", {})

    if summary:
        st.subheader("Dataset Summary")

        for key, value in summary.items():
            st.write(f"**{key}:** {value}")
    else:
        st.warning("Dataset summary is not available yet.")
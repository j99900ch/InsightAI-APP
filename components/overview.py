"""
===========================================================
InsightAI - Dataset Overview
-----------------------------------------------------------
Displays uploaded dataset information.

This module ONLY displays information.
It NEVER changes navigation or session routing.
===========================================================
"""

from __future__ import annotations

import streamlit as st


def render_overview() -> None:
    """Render the dataset overview page."""

    st.title("📂 Dataset Overview")

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
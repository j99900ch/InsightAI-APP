"""
===========================================================
InsightAI - Report UI
-----------------------------------------------------------
PDF report page.

This module renders the Report page only.
===========================================================
"""

from __future__ import annotations

import streamlit as st


def render_report_ui() -> None:
    """Render the PDF Report page."""

    st.title(":page_facing_up: PDF Report")

    if st.session_state.get("uploaded_file_name"):
        st.success(
            f"Dataset: {st.session_state.uploaded_file_name}"
        )
    else:
        st.info("No dataset uploaded.")

    st.divider()

    st.info("PDF Report module will be connected here.")
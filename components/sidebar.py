"""
===========================================================
InsightAI - Sidebar
-----------------------------------------------------------
Centralized application sidebar.

Responsibilities:
- Initialize Streamlit session state
- Display navigation
- Display application status
- Reset application state
===========================================================
"""

from __future__ import annotations

import streamlit as st

from config.constants import (
    PAGES,
    DEFAULT_PAGE,
)

from core.session_defaults import SESSION_DEFAULTS


# ===========================================================
# Session Initialization
# ===========================================================

def init_sidebar_state() -> None:
    """Initialize Streamlit session state."""

    for key, value in SESSION_DEFAULTS.items():
        if key not in st.session_state:
            st.session_state[key] = value

    if st.session_state.page not in PAGES:
        st.session_state.page = DEFAULT_PAGE


# ===========================================================
# Reset
# ===========================================================

def reset_app_state() -> None:
    """Reset application state."""

    st.session_state.clear()

    for key, value in SESSION_DEFAULTS.items():
        st.session_state[key] = value

    st.session_state.page = DEFAULT_PAGE


# ===========================================================
# Sidebar
# ===========================================================

def render_sidebar() -> str:
    """
    Render the application sidebar.

    Returns
    -------
    str
        Selected page.
    """

    init_sidebar_state()

    current_index = PAGES.index(st.session_state.page)

    with st.sidebar:

        st.title(":bar_chart: InsightAI")

        st.caption("Intelligent Data Analysis")

        st.divider()

        selected_page = st.radio(
            "Navigation",
            options=PAGES,
            index=current_index,
            key="nav_radio",
        )

        st.session_state.page = selected_page

        st.divider()

        st.checkbox(
            "Dark Mode",
            key="dark_mode",
        )

        st.divider()

        st.write(
            f"**Dataset Loaded:** {'Yes' if st.session_state.data_loaded else 'No'}"
        )

        st.write(
            f"**Current File:** {st.session_state.uploaded_file_name or 'None'}"
        )

        st.divider()

        if st.button(
            "Reset Application",
            use_container_width=True,
        ):
            reset_app_state()
            st.rerun()

        st.divider()

        st.caption("InsightAI v2.0")

    return selected_page
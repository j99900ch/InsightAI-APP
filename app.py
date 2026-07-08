"""
===========================================================
InsightAI - Main Application
-----------------------------------------------------------
Application entry point.

Responsibilities:
- Configure Streamlit
- Initialize session state
- Render sidebar
- Route pages to UI components
===========================================================
"""

from __future__ import annotations

import streamlit as st

import config.settings as settings

print("=" * 60)
print("DEBUG SETTINGS FILE:", settings.__file__)
print("DEBUG PAGE_ICON:", settings.PAGE_ICON)
print("DEBUG INITIAL_SIDEBAR_STATE:", settings.INITIAL_SIDEBAR_STATE)
print("=" * 60)

from config.settings import (
    PAGE_TITLE,
    PAGE_ICON,
    LAYOUT,
    INITIAL_SIDEBAR_STATE,
)

from core.session_defaults import SESSION_DEFAULTS

from components.sidebar import (
    init_sidebar_state,
    render_sidebar,
)

import components.dashboard as dashboard
import components.overview as overview
import components.uploader as uploader
import components.statistics_ui as statistics_ui
import components.charts_ui as charts_ui
import components.prediction_ui as prediction_ui
import components.report_ui as report_ui


# ===========================================================
# Streamlit Configuration
# ===========================================================

st.set_page_config(
    page_title=PAGE_TITLE,
    page_icon=PAGE_ICON,
    layout=LAYOUT,
    initial_sidebar_state=INITIAL_SIDEBAR_STATE,
)

# ===========================================================
# Initialize Session State
# ===========================================================

init_sidebar_state()

for key, value in SESSION_DEFAULTS.items():
    if key not in st.session_state:
        st.session_state[key] = value

# ===========================================================
# Sidebar
# ===========================================================

page = render_sidebar()

# ===========================================================
# Routing
# ===========================================================

if page == "Home":

    dashboard.render_dashboard()
elif page == "Dataset Overview":

    uploaded_df = uploader.render_uploader()

    if uploaded_df is not None:

        st.session_state.df = uploaded_df
        st.session_state.data_loaded = True
        st.session_state.filename = st.session_state.uploaded_file_name

        from analysis import (
            dataset_profile,
            business_summary,
        )

        st.session_state.profile = dataset_profile(uploaded_df)
        st.session_state.dataset_summary = business_summary(uploaded_df)

    overview.render_overview()

elif page == "Statistics":

    statistics_ui.render_statistics_ui()

elif page == "Charts":

    charts_ui.render_charts_ui()

elif page == "Data Cleaning":

    st.title(":broom: Data Cleaning")
    st.info("Data Cleaning module will be connected here.")

elif page == "Machine Learning":

    prediction_ui.render_prediction_ui()

elif page == "Business Insights":

    st.title(":bulb: Business Insights")
    st.info("Business Insights module will be connected here.")

elif page == "PDF Report":

    report_ui.render_report_ui()

elif page == "Export":

    st.title(":inbox_tray: Export")
    st.info("Export module will be connected here.")

else:

    st.error(f"Unknown page: {page}")
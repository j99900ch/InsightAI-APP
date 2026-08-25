import streamlit as st
import components.dashboard as dashboard

st.set_page_config(
    page_title="InsightAI Dashboard Isolation Test",
    layout="wide",
)

st.write("DASHBOARD ISOLATION TEST")

dashboard.render_dashboard()

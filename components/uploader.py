import streamlit as st
import pandas as pd

def render_uploader():
    st.subheader("Upload Data")
    uploaded = st.file_uploader(
        "Upload CSV, Excel, or JSON",
        type=["csv", "xlsx", "xls", "json"],
        accept_multiple_files=False,
    )

    if uploaded is None:
        st.info("Please upload a file to continue.")
        return None

    try:
        if uploaded.name.lower().endswith(".csv"):
            df = pd.read_csv(uploaded)
        elif uploaded.name.lower().endswith((".xlsx", ".xls")):
            df = pd.read_excel(uploaded)
        else:
            df = pd.read_json(uploaded)

        st.session_state.uploaded_file_name = uploaded.name
        st.success(f"Loaded {uploaded.name}")
        return df

    except Exception as e:
        st.error(f"Failed to load file: {e}")
        return None
from textwrap import dedent
import streamlit as st

print("Creating exact HTML rendering test...")

st.set_page_config(page_title="InsightAI HTML Test")

st.markdown(
    dedent(
        """
        <div style="
            padding: 20px;
            border: 2px solid #2563eb;
            border-radius: 15px;
            background: rgba(37,99,235,0.10);
        ">
            <h2>INSIGHTAI HTML TEST</h2>
            <p>This must render as a styled box.</p>
        </div>
        """
    ),
    unsafe_allow_html=True,
)

import streamlit as st

st.set_page_config(page_title="st.html Test")

st.html("""
<div style="
    padding: 25px;
    border: 2px solid #2563eb;
    border-radius: 18px;
">
    <div style="font-size: 14px; font-weight: 700;">
        ◆ INTELLIGENT ANALYTICS PLATFORM
    </div>

    <div style="font-size: 38px; font-weight: 800;">
        InsightAI
    </div>

    <div style="font-size: 17px;">
        Transform raw business data into meaningful
        statistics, visual intelligence, machine-learning
        predictions, business insights and decision support.
    </div>
</div>
""")

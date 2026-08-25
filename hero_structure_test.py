from textwrap import dedent
import streamlit as st

st.set_page_config(page_title="Hero Structure Test")

html = dedent("""
<div class="insight-hero">
    <div class="insight-hero-badge">
        &#9670; INTELLIGENT ANALYTICS PLATFORM
    </div>

    <div class="insight-hero-title">
        InsightAI
    </div>

    <div class="insight-hero-subtitle">
        Transform raw business data into meaningful
        statistics, visual intelligence, machine-learning
        predictions, business insights and decision support.
    </div>
</div>
""")

st.markdown(html, unsafe_allow_html=True)

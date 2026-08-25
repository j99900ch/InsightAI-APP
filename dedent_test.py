from textwrap import dedent
import streamlit as st

st.set_page_config(page_title="Dedent Test")

html = dedent("""
<div style="border:3px solid blue; padding:20px; border-radius:15px;">
    <h2>DEDUCE HTML TEST</h2>
    <p>If this is a styled box, dedent is fine.</p>
</div>
""")

st.markdown(html, unsafe_allow_html=True)

import streamlit as st

st.set_page_config(page_title="HTML Isolation")

st.markdown("### TEST 1")

st.markdown(
    '<div>Hello World</div>',
    unsafe_allow_html=True,
)

st.markdown("### TEST 2")

st.markdown(
    '<div class="test-box">Hello World</div>',
    unsafe_allow_html=True,
)

st.markdown("### TEST 3")

st.markdown(
    '<div class="insight-hero-badge">Hello World</div>',
    unsafe_allow_html=True,
)

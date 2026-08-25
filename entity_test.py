import streamlit as st

st.set_page_config(page_title="Entity Test")

st.markdown("### ENTITY TEST 1")

st.markdown(
    '<div class="test-box">&#9670;</div>',
    unsafe_allow_html=True,
)

st.markdown("### ENTITY TEST 2")

st.markdown(
    '<div class="test-box">&#9672;</div>',
    unsafe_allow_html=True,
)

st.markdown("### ENTITY TEST 3")

st.markdown(
    '<div class="test-box">&#9670; INTELLIGENT ANALYTICS PLATFORM</div>',
    unsafe_allow_html=True,
)

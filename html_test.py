import streamlit as st

st.set_page_config(page_title="HTML TEST")

st.title("HTML Rendering Test")

st.markdown(
    """
    <div style="padding:20px; border:2px solid red;">
        <h2>HTML TEST SUCCESS</h2>
        <p>This should appear inside a bordered box.</p>
    </div>
    """,
    unsafe_allow_html=True,
)

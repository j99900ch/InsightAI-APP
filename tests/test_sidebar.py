import streamlit as st

from components.sidebar import (
    init_sidebar_state,
    reset_app_state,
)


def test_init_sidebar_state():
    st.session_state.clear()
    init_sidebar_state()

    assert st.session_state.page == "Home"
    assert st.session_state.data_loaded is False
    assert st.session_state.filename is None
    assert st.session_state.reset_requested is False


def test_reset_app_state():
    st.session_state.clear()
    init_sidebar_state()

    st.session_state.data_loaded = True
    st.session_state.filename = "sample.csv"
    st.session_state.df = "dummy"

    reset_app_state()

    assert st.session_state.page == "Home"
    assert st.session_state.data_loaded is False
    assert st.session_state.filename is None
    assert st.session_state.df is None
    assert st.session_state.reset_requested is False
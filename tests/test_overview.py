from streamlit.testing.v1 import AppTest


def test_overview_page_runs():
    at = AppTest.from_file("components/overview.py")
    at.session_state["uploaded_file_name"] = None
    at.session_state["dataset_summary"] = {}
    at.run()
    assert len(at.exception) == 0
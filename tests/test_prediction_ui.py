from streamlit.testing.v1 import AppTest


def test_prediction_page_runs():
    at = AppTest.from_file("components/prediction_ui.py")
    at.session_state["uploaded_file_name"] = None
    at.run()
    assert len(at.exception) == 0
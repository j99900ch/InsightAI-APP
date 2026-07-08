from streamlit.testing.v1 import AppTest


def test_report_page_runs():
    at = AppTest.from_file("components/report_ui.py")
    at.session_state["uploaded_file_name"] = None
    at.session_state["dataset_summary"] = {}
    at.session_state["prediction_result"] = None
    at.run()
    assert len(at.exception) == 0
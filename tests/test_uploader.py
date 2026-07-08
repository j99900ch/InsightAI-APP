from io import BytesIO

import pandas as pd
import pytest
import streamlit as st

from components.uploader import _get_bytes, _read_uploaded_file, handle_upload


class DummyUpload:
    def __init__(self, name: str, data: bytes):
        self.name = name
        self._data = data

    def getvalue(self):
        return self._data


def test_get_bytes():
    uploaded = DummyUpload("sample.csv", b"Name,Age\nAlice,25\n")
    assert _get_bytes(uploaded) == b"Name,Age\nAlice,25\n"


def test_read_uploaded_csv():
    uploaded = DummyUpload("sample.csv", b"Name,Age\nAlice,25\nBob,30\n")

    df = _read_uploaded_file(uploaded)

    assert df.shape == (2, 2)
    assert list(df.columns) == ["Name", "Age"]


def test_read_uploaded_excel(tmp_path):
    df_in = pd.DataFrame({"Name": ["Alice"], "Age": [25]})
    file_path = tmp_path / "sample.xlsx"
    df_in.to_excel(file_path, index=False)

    class ExcelUpload:
        def __init__(self, path):
            self.name = "sample.xlsx"
            self._data = path.read_bytes()

        def getvalue(self):
            return self._data

    uploaded = ExcelUpload(file_path)
    df = _read_uploaded_file(uploaded)

    assert df.shape == (1, 2)
    assert list(df.columns) == ["Name", "Age"]


def test_handle_upload_csv():
    st.session_state.clear()
    uploaded = DummyUpload("sample.csv", b"Name,Age\nAlice,25\nBob,30\n")

    df = handle_upload(uploaded)

    assert df is not None
    assert st.session_state.data_loaded is True
    assert st.session_state.filename == "sample.csv"
    assert isinstance(st.session_state.df, pd.DataFrame)
    assert st.session_state.df.shape == (2, 2)
    assert isinstance(st.session_state.profile, dict)
    assert isinstance(st.session_state.summary, dict)


def test_invalid_extension():
    uploaded = DummyUpload("sample.txt", b"bad")

    with pytest.raises(ValueError):
        _read_uploaded_file(uploaded)
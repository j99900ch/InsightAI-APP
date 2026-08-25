"""
===========================================================
InsightAI - Report UI
-----------------------------------------------------------
PDF report page.

Connects the existing core.report engine to Streamlit
without modifying the core report-generation module.
===========================================================
"""

from __future__ import annotations

from io import BytesIO

import streamlit as st

from core.report import (
    generate_report,
    report_to_markdown,
)


# ===========================================================
# PDF GENERATION
# ===========================================================

def _build_pdf(
    markdown: str,
) -> bytes:
    """
    Convert the existing Markdown report into a PDF.

    Uses ReportLab locally.
    Does not require any external API.
    """

    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.enums import TA_CENTER
    from reportlab.platypus import (
        SimpleDocTemplate,
        Paragraph,
        Spacer,
    )

    buffer = BytesIO()

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
        title="InsightAI Report",
        author="InsightAI",
    )

    styles = getSampleStyleSheet()

    title_style = styles["Title"]
    title_style.alignment = TA_CENTER

    heading_style = styles["Heading2"]
    body_style = styles["BodyText"]

    story = []

    for raw_line in markdown.splitlines():

        line = raw_line.strip()

        if not line:
            story.append(
                Spacer(1, 8)
            )
            continue

        if line.startswith("# "):

            story.append(
                Paragraph(
                    line[2:],
                    title_style,
                )
            )

        elif line.startswith("## "):

            story.append(
                Paragraph(
                    line[3:],
                    heading_style,
                )
            )

        elif line.startswith("- "):

            text = line[2:]

            story.append(
                Paragraph(
                    f"• {text}",
                    body_style,
                )
            )

        else:

            story.append(
                Paragraph(
                    line,
                    body_style,
                )
            )

        story.append(
            Spacer(1, 4)
        )

    document.build(story)

    return buffer.getvalue()


# ===========================================================
# REPORT GENERATION
# ===========================================================

def _generate_current_report():
    """
    Generate a report from the currently loaded dataset.

    Uses the existing core.report.generate_report()
    function without changing its behavior.
    """

    df = st.session_state.get("df")

    if df is None:

        st.warning(
            "Please upload a dataset before generating "
            "a PDF report."
        )

        return None

    if df.empty:

        st.warning(
            "The current dataset is empty."
        )

        return None

    # -------------------------------------------------------
    # Existing ML information
    # -------------------------------------------------------

    prediction_result = st.session_state.get(
        "prediction_result"
    )

    problem_type = None
    best_model = None
    score = None

    if isinstance(
        prediction_result,
        dict,
    ):

        problem_type = (
            prediction_result.get(
                "problem_type"
            )
        )

        best_model = (
            prediction_result.get(
                "best_model_name"
            )
        )

        score = (
            prediction_result.get(
                "score"
            )
        )

    # -------------------------------------------------------
    # Existing insights
    # -------------------------------------------------------

    insights_result = st.session_state.get(
        "insights"
    )

    insights = []

    if isinstance(
        insights_result,
        list,
    ):

        insights = [
            str(item)
            for item in insights_result
        ]

    elif isinstance(
        insights_result,
        dict,
    ):

        possible = insights_result.get(
            "insights",
            [],
        )

        if isinstance(
            possible,
            list,
        ):

            insights = [
                str(item)
                for item in possible
            ]

    # -------------------------------------------------------
    # Existing report engine
    # -------------------------------------------------------

    return generate_report(
        df,
        problem_type=problem_type,
        best_model=best_model,
        score=score,
        insights=insights,
    )


# ===========================================================
# REPORT UI
# ===========================================================

def render_report_ui() -> None:
    """Render the connected PDF Report page."""

    st.title(
        "📄 PDF Report"
    )

    filename = st.session_state.get(
        "uploaded_file_name"
    )

    df = st.session_state.get(
        "df"
    )

    # -------------------------------------------------------
    # Dataset status
    # -------------------------------------------------------

    if filename:

        st.success(
            f"Dataset: {filename}"
        )

    else:

        st.info(
            "No dataset uploaded."
        )

        st.write(
            "Upload a dataset from "
            "**Dataset Overview** first."
        )

        return

    if df is None:

        st.warning(
            "Dataset information is not available "
            "in the current session."
        )

        return

    st.divider()

    # -------------------------------------------------------
    # Report information
    # -------------------------------------------------------

    st.subheader(
        "📊 InsightAI Business Report"
    )

    st.write(
        "Generate a report using InsightAI's existing "
        "dataset, statistics, machine-learning and "
        "business-insight analysis."
    )

    col1, col2, col3 = st.columns(3)

    with col1:

        st.metric(
            "Rows",
            f"{len(df):,}",
        )

    with col2:

        st.metric(
            "Columns",
            f"{len(df.columns):,}",
        )

    with col3:

        st.metric(
            "Missing Values",
            f"{int(df.isna().sum().sum()):,}",
        )

    # -------------------------------------------------------
    # Generate
    # -------------------------------------------------------

    if st.button(
        "📄 Generate PDF Report",
        type="primary",
        use_container_width=True,
        key="generate_pdf_report",
    ):

        with st.spinner(
            "Generating InsightAI report..."
        ):

            try:

                report = (
                    _generate_current_report()
                )

                if report is not None:

                    markdown = (
                        report_to_markdown(
                            report
                        )
                    )

                    pdf_bytes = _build_pdf(
                        markdown
                    )

                    st.session_state.report = (
                        report
                    )

                    st.session_state.report_markdown = (
                        markdown
                    )

                    st.session_state.report_pdf = (
                        pdf_bytes
                    )

                    st.success(
                        "PDF report generated successfully."
                    )

            except Exception as exc:

                st.session_state.report = None

                st.error(
                    f"PDF report generation failed: {exc}"
                )

    # -------------------------------------------------------
    # Existing generated report
    # -------------------------------------------------------

    pdf_bytes = st.session_state.get(
        "report_pdf"
    )

    markdown = st.session_state.get(
        "report_markdown"
    )

    if pdf_bytes:

        st.divider()

        st.subheader(
            "📥 Download Report"
        )

        st.download_button(
            label="⬇️ Download InsightAI PDF",
            data=pdf_bytes,
            file_name="InsightAI_Report.pdf",
            mime="application/pdf",
            use_container_width=True,
            key="download_insightai_pdf",
        )

        # ---------------------------------------------------
        # Report preview
        # ---------------------------------------------------

        if markdown:

            st.subheader(
                "👁️ Report Preview"
            )

            with st.expander(
                "View generated report",
                expanded=True,
            ):

                st.markdown(
                    markdown
                )


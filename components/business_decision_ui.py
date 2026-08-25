"""
===========================================================
InsightAI - Business Decision UI
-----------------------------------------------------------
Streamlit interface for the existing deterministic
business decision orchestrator.

This module does not modify the existing decision engine,
forecasting engine, or intelligence engine.
===========================================================
"""

from __future__ import annotations

import pandas as pd
import streamlit as st


# ===========================================================
# COLUMN DETECTION
# ===========================================================

def _get_candidate_columns(
    df: pd.DataFrame,
) -> tuple[list[str], list[str]]:
    """Return suitable date and numeric target columns."""

    date_columns: list[str] = []

    for column in df.columns:

        series = df[column]

        if pd.api.types.is_datetime64_any_dtype(series):
            date_columns.append(column)
            continue

        if pd.api.types.is_object_dtype(series):

            converted = pd.to_datetime(
                series,
                errors="coerce",
            )

            if len(series) > 0:

                valid_ratio = (
                    converted.notna().mean()
                )

                if valid_ratio >= 0.70:
                    date_columns.append(column)

    numeric_columns = (
        df.select_dtypes(
            include="number"
        )
        .columns
        .tolist()
    )

    return date_columns, numeric_columns


# ===========================================================
# RESULT DISPLAY
# ===========================================================

def _render_result(
    result: dict,
) -> None:
    """Display the existing orchestrator result."""

    st.divider()

    st.subheader(
        "💡 InsightAI Decision"
    )

    decision = result.get(
        "decision",
        "Unavailable",
    )

    risk = result.get(
        "risk",
        "Unavailable",
    )

    score = result.get(
        "decision_score",
        "—",
    )

    confidence = result.get(
        "confidence",
        "—",
    )

    recommendation = result.get(
        "recommendation",
        "",
    )

    if isinstance(
        recommendation,
        dict,
    ):
        recommendation = recommendation.get(
            "recommendation",
            "",
        )

    columns = st.columns(4)

    with columns[0]:
        st.metric(
            "🎯 Decision",
            str(decision),
        )

    with columns[1]:
        st.metric(
            "⚠️ Risk",
            str(risk),
        )

    with columns[2]:

        if isinstance(
            score,
            (int, float),
        ):
            score_display = f"{score:.1f}"
        else:
            score_display = str(score)

        st.metric(
            "📊 Decision Score",
            score_display,
        )

    with columns[3]:

        if isinstance(
            confidence,
            (int, float),
        ):
            confidence_display = (
                f"{confidence:.1f}%"
            )
        else:
            confidence_display = str(
                confidence
            )

        st.metric(
            "🎯 Confidence",
            confidence_display,
        )

    if recommendation:

        st.success(
            f"Recommended Action: {recommendation}"
        )

    forecast = result.get(
        "forecast",
        {},
    )

    if isinstance(
        forecast,
        dict,
    ):

        forecast_data = forecast.get(
            "forecast",
            {},
        )

        if isinstance(
            forecast_data,
            dict,
        ):

            direction = forecast_data.get(
                "direction",
                "Unavailable",
            )

            st.info(
                f"📈 Forecast Direction: {direction}"
            )

    with st.expander(
        "View detailed decision analysis"
    ):

        st.json(
            result,
            expanded=False,
        )


# ===========================================================
# MAIN UI
# ===========================================================

def render_business_decision_ui() -> None:
    """Render the Business Decision page."""

    st.title(
        "🎯 Business Decision"
    )

    st.write(
        "Use InsightAI's existing forecasting and "
        "decision-intelligence pipeline to evaluate "
        "a business question against your dataset."
    )

    df = st.session_state.get(
        "df"
    )

    if not isinstance(
        df,
        pd.DataFrame,
    ) or df.empty:

        st.warning(
            "No dataset uploaded. "
            "Upload a dataset from Dataset Overview first."
        )

        return

    filename = st.session_state.get(
        "uploaded_file_name",
        "Current Dataset",
    )

    st.success(
        f"Dataset loaded: {filename}"
    )

    date_candidates, target_candidates = (
        _get_candidate_columns(df)
    )

    if not date_candidates:

        st.error(
            "No suitable date column was detected."
        )

        return

    if not target_candidates:

        st.error(
            "No numeric target column was detected."
        )

        return

    st.subheader(
        "Configure Decision Analysis"
    )

    column1, column2 = st.columns(2)

    with column1:

        date_column = st.selectbox(
            "📅 Date Column",
            options=date_candidates,
            key="business_decision_date_column",
        )

    with column2:

        target_column = st.selectbox(
            "🎯 Target Column",
            options=target_candidates,
            key="business_decision_target_column",
        )

    business_question = st.text_area(
        "💬 Business Question",
        placeholder=(
            "Example: Should we continue investing "
            "for future growth?"
        ),
        height=120,
        key="business_decision_question",
    )

    years_ahead = st.number_input(
        "📅 Forecast Years",
        min_value=1,
        max_value=10,
        value=5,
        step=1,
        key="business_decision_years",
    )

    if st.button(
        "🧠 Analyze Business Decision",
        type="primary",
        use_container_width=True,
        key="business_decision_analyze",
    ):

        from core.decision_orchestrator import (
            orchestrate_business_decision,
        )

        with st.spinner(
            "Analyzing dataset and business question..."
        ):

            try:

                result = (
                    orchestrate_business_decision(
                        df=df,
                        date_column=date_column,
                        target_column=target_column,
                        business_question=business_question,
                        years_ahead=int(
                            years_ahead
                        ),
                    )
                )

                st.session_state.business_decision_result = (
                    result
                )

                st.success(
                    "Business decision analysis completed."
                )

            except Exception as exc:

                st.session_state.business_decision_result = (
                    None
                )

                st.error(
                    f"Decision analysis failed: {exc}"
                )

    result = st.session_state.get(
        "business_decision_result"
    )

    if isinstance(
        result,
        dict,
    ):

        _render_result(result)

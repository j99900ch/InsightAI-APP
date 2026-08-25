"""
===========================================================
InsightAI - Forecasting UI
-----------------------------------------------------------
UI wrapper for the existing tested forecasting engine.

Protected modules:
- core/forecasting.py
- core/decision_orchestrator.py
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

                valid_ratio = converted.notna().mean()

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

def _render_forecast_result(
    result: dict,
) -> None:
    """Display the existing forecast result."""

    st.divider()

    st.subheader("🔮 Forecast Results")

    forecast = result.get("forecast", pd.DataFrame())
    trend = result.get("trend", {})
    summary = result.get("summary", {})
    recommendation = result.get("recommendation", {})

    trend_name = "Unavailable"

    if isinstance(trend, dict):
        trend_name = trend.get(
            "trend",
            "Unavailable",
        )

    growth_rate = "Unavailable"

    if isinstance(summary, dict):

        growth_value = summary.get(
            "historical_growth_rate"
        )

        if isinstance(growth_value, (int, float)):
            growth_rate = f"{growth_value:.2f}%"

        elif growth_value is not None:
            growth_rate = str(growth_value)

    recommendation_text = "Unavailable"

    if isinstance(recommendation, dict):

        recommendation_text = recommendation.get(
            "recommendation",
            "Unavailable",
        )

    elif recommendation:

        recommendation_text = str(recommendation)

    columns = st.columns(3)

    with columns[0]:

        st.metric(
            "📈 Trend",
            str(trend_name),
        )

    with columns[1]:

        st.metric(
            "📊 Historical Growth",
            growth_rate,
        )

    with columns[2]:

        if isinstance(forecast, pd.DataFrame):
            st.metric(
                "🔮 Forecast Period",
                f"{len(forecast)} years",
            )
        else:
            st.metric(
                "🔮 Forecast Period",
                "Unavailable",
            )

    if recommendation_text:

        st.success(
            f"💡 Forecast Recommendation: "
            f"{recommendation_text}"
        )

    if isinstance(forecast, pd.DataFrame):

        st.subheader("📋 Forecasted Values")

        st.dataframe(
            forecast,
            use_container_width=True,
            hide_index=True,
        )

        if {"Year", "Forecast"}.issubset(
            forecast.columns
        ):

            chart_data = (
                forecast[
                    ["Year", "Forecast"]
                ]
                .copy()
                .set_index("Year")
            )

            st.subheader("📈 Forecast Trend")

            st.line_chart(
                chart_data,
                use_container_width=True,
            )

    else:

        st.warning(
            "Forecast data is not available."
        )

    with st.expander(
        "View detailed forecast analysis"
    ):

        st.write("Trend")
        st.json(
            trend,
            expanded=False,
        )

        st.write("Summary")
        st.json(
            summary,
            expanded=False,
        )

        st.write("Recommendation")
        st.json(
            recommendation,
            expanded=False,
        )


# ===========================================================
# MAIN UI
# ===========================================================

def render_forecasting_ui() -> None:
    """Render the Forecasting page."""

    st.title("🔮 Forecasting")

    st.write(
        "Use InsightAI's existing forecasting engine "
        "to estimate future business performance "
        "from your historical dataset."
    )

    df = st.session_state.get("df")

    if not isinstance(df, pd.DataFrame) or df.empty:

        st.warning(
            "No dataset uploaded. "
            "Upload a dataset from Dataset Overview first."
        )

        return

    filename = st.session_state.get(
        "filename",
        st.session_state.get(
            "uploaded_file_name",
            "Current Dataset",
        ),
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

        st.info(
            "Forecasting requires a date column "
            "containing historical time information."
        )

        return

    if not target_candidates:

        st.error(
            "No numeric target column was detected."
        )

        st.info(
            "Forecasting requires a numeric target "
            "column such as Revenue, Sales, or Customers."
        )

        return

    st.subheader(
        "⚙️ Configure Forecast"
    )

    column1, column2 = st.columns(2)

    with column1:

        date_column = st.selectbox(
            "📅 Date Column",
            options=date_candidates,
            key="forecasting_date_column",
        )

    with column2:

        target_column = st.selectbox(
            "🎯 Target Column",
            options=target_candidates,
            key="forecasting_target_column",
        )

    years_ahead = st.number_input(
        "🔮 Forecast Years",
        min_value=1,
        max_value=10,
        value=5,
        step=1,
        key="forecasting_years",
    )

    st.caption(
        f"Historical data: {len(df):,} rows × "
        f"{len(df.columns):,} columns"
    )

    if st.button(
        "🔮 Generate Forecast",
        type="primary",
        use_container_width=True,
        key="forecasting_generate",
    ):

        from core.decision_orchestrator import (
            run_forecast_layer,
        )

        with st.spinner(
            "Analyzing historical data and generating forecast..."
        ):

            try:

                result = run_forecast_layer(
                    df=df,
                    date_column=date_column,
                    target_column=target_column,
                    years_ahead=int(years_ahead),
                )

                st.session_state.forecasting_result = result

                st.success(
                    "Forecast generated successfully."
                )

            except Exception as exc:

                st.session_state.forecasting_result = None

                st.error(
                    f"Forecast generation failed: {exc}"
                )

    result = st.session_state.get(
        "forecasting_result"
    )

    if isinstance(result, dict):

        _render_forecast_result(result)

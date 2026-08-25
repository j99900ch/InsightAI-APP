"""
===========================================================
InsightAI - Prediction Explainability UI
-----------------------------------------------------------
Professional Decision Tree prediction explanation UI.

Preserves:
- Prediction result
- Confidence
- Top decision factors
- Decision path
- Tree structure
- Learned tree splits

Visual-only upgrade.
Core ML and explainability logic are untouched.
===========================================================
"""

from __future__ import annotations

import html

import pandas as pd
import streamlit as st


# ===========================================================
# VISUAL STYLING
# ===========================================================

def _inject_explainability_styles() -> None:
    """Inject isolated styling for prediction explanations."""

    st.html(
        """
        <style>

        /* =================================================
           PREDICTION HERO
           ================================================= */

        .explain-hero {
            padding: 22px;
            border-radius: 20px;
            border: 1px solid rgba(99, 102, 241, 0.25);
            background:
                linear-gradient(
                    135deg,
                    rgba(37, 99, 235, 0.13),
                    rgba(124, 58, 237, 0.10)
                );
            margin: 10px 0 18px 0;
        }

        .explain-eyebrow {
            font-size: 0.70rem;
            font-weight: 800;
            letter-spacing: 1.2px;
            text-transform: uppercase;
            opacity: 0.60;
            margin-bottom: 8px;
        }

        .explain-prediction {
            font-size: 2rem;
            font-weight: 850;
            line-height: 1.1;
            letter-spacing: -0.03em;
        }

        .explain-confidence {
            margin-top: 8px;
            font-size: 0.88rem;
            opacity: 0.70;
        }


        /* =================================================
           SECTION HEADERS
           ================================================= */

        .explain-section {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 20px 0 10px 0;
        }

        .explain-section-icon {
            width: 34px;
            height: 34px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 17px;
            font-weight: 800;
            background: rgba(99, 102, 241, 0.12);
        }

        .explain-section-title {
            font-size: 1.08rem;
            font-weight: 800;
        }

        .explain-section-subtitle {
            font-size: 0.76rem;
            opacity: 0.58;
            margin-top: 2px;
        }


        /* =================================================
           FEATURE CARD
           ================================================= */

        .feature-card {
            padding: 15px 16px;
            border-radius: 15px;
            border: 1px solid rgba(128, 128, 128, 0.18);
            background: rgba(128, 128, 128, 0.045);
            margin: 8px 0;
        }

        .feature-top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }

        .feature-name {
            font-size: 0.92rem;
            font-weight: 750;
        }

        .feature-rank {
            font-size: 0.68rem;
            font-weight: 800;
            opacity: 0.55;
            letter-spacing: 0.7px;
        }

        .feature-value {
            margin-top: 5px;
            font-size: 0.75rem;
            opacity: 0.60;
        }

        .importance-track {
            height: 7px;
            margin-top: 11px;
            border-radius: 999px;
            background: rgba(128, 128, 128, 0.16);
            overflow: hidden;
        }

        .importance-fill {
            height: 100%;
            border-radius: 999px;
            background:
                linear-gradient(
                    90deg,
                    #2563eb,
                    #7c3aed
                );
        }

        .importance-label {
            margin-top: 6px;
            font-size: 0.70rem;
            font-weight: 750;
            opacity: 0.70;
        }


        /* =================================================
           DECISION PATH
           ================================================= */

        .path-card {
            display: flex;
            gap: 13px;
            padding: 14px;
            border-radius: 15px;
            border: 1px solid rgba(128, 128, 128, 0.18);
            background: rgba(128, 128, 128, 0.045);
            margin: 8px 0;
        }

        .path-number {
            min-width: 30px;
            height: 30px;
            border-radius: 9px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.76rem;
            font-weight: 850;
            background:
                linear-gradient(
                    135deg,
                    #2563eb,
                    #7c3aed
                );
            color: white;
        }

        .path-label {
            font-size: 0.67rem;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            font-weight: 750;
            opacity: 0.55;
        }

        .path-expression {
            margin-top: 4px;
            font-size: 0.88rem;
            font-weight: 700;
        }

        .path-value {
            margin-top: 4px;
            font-size: 0.74rem;
            opacity: 0.62;
        }


        /* =================================================
           MODEL KPI CARDS
           ================================================= */

        .tree-kpi {
            padding: 17px;
            border-radius: 16px;
            border: 1px solid rgba(128, 128, 128, 0.18);
            background: rgba(128, 128, 128, 0.045);
            min-height: 95px;
        }

        .tree-kpi-label {
            font-size: 0.69rem;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            font-weight: 750;
            opacity: 0.55;
        }

        .tree-kpi-value {
            margin-top: 6px;
            font-size: 1.55rem;
            font-weight: 850;
        }


        /* =================================================
           EMPTY STATE
           ================================================= */

        .explain-empty {
            padding: 18px;
            border-radius: 15px;
            border: 1px dashed rgba(128, 128, 128, 0.30);
            opacity: 0.72;
        }

        </style>
        """
    )


# ===========================================================
# SECTION HEADER
# ===========================================================

def _render_section_header(
    icon: str,
    title: str,
    subtitle: str,
) -> None:
    """Render a professional explainability section header."""

    safe_icon = html.escape(str(icon))
    safe_title = html.escape(str(title))
    safe_subtitle = html.escape(str(subtitle))

    st.html(
        f"""
        <div class="explain-section">

            <div class="explain-section-icon">
                {safe_icon}
            </div>

            <div>
                <div class="explain-section-title">
                    {safe_title}
                </div>

                <div class="explain-section-subtitle">
                    {safe_subtitle}
                </div>
            </div>

        </div>
        """
    )


# ===========================================================
# PREDICTION HERO
# ===========================================================

def _render_prediction(
    prediction: object,
    confidence: object,
) -> None:
    """Render prediction and confidence."""

    prediction_text = html.escape(
        str(prediction)
    )

    confidence_text = ""

    if confidence is not None:

        try:

            confidence_value = float(
                confidence
            )

            confidence_value = max(
                0.0,
                min(
                    confidence_value,
                    1.0,
                ),
            )

            confidence_text = (
                f"Confidence: "
                f"{confidence_value * 100:.2f}%"
            )

        except (
            TypeError,
            ValueError,
        ):

            confidence_text = (
                f"Confidence: "
                f"{html.escape(str(confidence))}"
            )

    st.html(
        f"""
        <div class="explain-hero">

            <div class="explain-eyebrow">
                Decision Tree Prediction
            </div>

            <div class="explain-prediction">
                {prediction_text}
            </div>

            <div class="explain-confidence">
                {html.escape(confidence_text)}
            </div>

        </div>
        """
    )


# ===========================================================
# TOP FEATURES
# ===========================================================

def _render_top_features(
    top_features: pd.DataFrame | None,
) -> None:
    """Render feature importance as visual factor cards."""

    _render_section_header(
        "?",
        "Top Decision Factors",
        "Features contributing most strongly to the model decision.",
    )

    if not isinstance(
        top_features,
        pd.DataFrame,
    ) or top_features.empty:

        st.html(
            """
            <div class="explain-empty">
                Feature importance is not available.
            </div>
            """
        )

        return

    display_df = top_features.copy()

    importance_column = (
        "Importance"
        if "Importance" in display_df.columns
        else None
    )

    feature_column = None

    for candidate in [
        "Feature",
        "feature",
        "Feature Name",
        "FeatureName",
    ]:

        if candidate in display_df.columns:

            feature_column = candidate
            break

    if feature_column is None:

        feature_column = display_df.columns[0]

    importances = []

    if importance_column:

        for value in display_df[
            importance_column
        ]:

            try:
                importances.append(
                    float(value)
                )
            except (
                TypeError,
                ValueError,
            ):
                importances.append(0.0)

    else:

        importances = [
            0.0
            for _ in range(
                len(display_df)
            )
        ]

    max_importance = max(
        importances,
        default=1.0,
    )

    if max_importance <= 0:

        max_importance = 1.0

    for index, (
        (_, row),
        importance,
    ) in enumerate(
        zip(
            display_df.iterrows(),
            importances,
        ),
        start=1,
    ):

        feature_name = html.escape(
            str(
                row.get(
                    feature_column,
                    "Unknown",
                )
            )
        )

        percentage = (
            importance * 100
            if importance <= 1
            else importance
        )

        bar_width = (
            importance
            / max_importance
            * 100
        )

        bar_width = max(
            2.0,
            min(
                bar_width,
                100.0,
            ),
        )

        st.html(
            f"""
            <div class="feature-card">

                <div class="feature-top">

                    <div class="feature-name">
                        {feature_name}
                    </div>

                    <div class="feature-rank">
                        FACTOR #{index}
                    </div>

                </div>

                <div class="importance-track">
                    <div
                        class="importance-fill"
                        style="width:{bar_width:.1f}%"
                    ></div>
                </div>

                <div class="importance-label">
                    Importance: {percentage:.2f}%
                </div>

            </div>
            """
        )


# ===========================================================
# DECISION PATH
# ===========================================================

def _render_decision_path(
    decision_path: list,
) -> None:
    """Render the tree decision chain."""

    _render_section_header(
        "?",
        "Decision Path",
        "The sequence of rules followed by the tree for this prediction.",
    )

    if not decision_path:

        st.html(
            """
            <div class="explain-empty">
                No decision path available.
            </div>
            """
        )

        return

    for index, step in enumerate(
        decision_path,
        start=1,
    ):

        if not isinstance(
            step,
            dict,
        ):

            continue

        feature = html.escape(
            str(
                step.get(
                    "Feature",
                    "Unknown",
                )
            )
        )

        value = html.escape(
            str(
                step.get(
                    "FeatureValue",
                    "Unknown",
                )
            )
        )

        threshold = html.escape(
            str(
                step.get(
                    "Threshold",
                    "Unknown",
                )
            )
        )

        comparison = html.escape(
            str(
                step.get(
                    "Comparison",
                    "unknown",
                )
            )
        )

        st.html(
            f"""
            <div class="path-card">

                <div class="path-number">
                    {index}
                </div>

                <div>

                    <div class="path-label">
                        Decision Rule
                    </div>

                    <div class="path-expression">
                        {feature}
                        {comparison}
                        {threshold}
                    </div>

                    <div class="path-value">
                        Observed value:
                        <strong>{value}</strong>
                    </div>

                </div>

            </div>
            """
        )


# ===========================================================
# MODEL STRUCTURE
# ===========================================================

def _render_tree_structure(
    tree_info: dict,
) -> None:
    """Render Decision Tree structure KPIs."""

    _render_section_header(
        "?",
        "Model Structure",
        "Structural characteristics of the trained Decision Tree.",
    )

    col1, col2, col3 = st.columns(3)

    values = [
        (
            col1,
            "Tree Nodes",
            tree_info.get(
                "node_count",
                0,
            ),
        ),
        (
            col2,
            "Leaf Nodes",
            tree_info.get(
                "leaf_count",
                0,
            ),
        ),
        (
            col3,
            "Tree Depth",
            tree_info.get(
                "max_depth",
                0,
            ),
        ),
    ]

    for column, label, value in values:

        safe_label = html.escape(
            str(label)
        )

        safe_value = html.escape(
            str(value)
        )

        with column:

            st.html(
                f"""
                <div class="tree-kpi">

                    <div class="tree-kpi-label">
                        {safe_label}
                    </div>

                    <div class="tree-kpi-value">
                        {safe_value}
                    </div>

                </div>
                """
            )


# ===========================================================
# LEARNED SPLITS
# ===========================================================

def _render_learned_splits(
    splits: pd.DataFrame | None,
) -> None:
    """Render learned tree splits."""

    if not isinstance(
        splits,
        pd.DataFrame,
    ) or splits.empty:

        return

    st.divider()

    with st.expander(
        "?? View Learned Tree Splits",
        expanded=False,
    ):

        st.caption(
            "Detailed split rules learned by the Decision Tree."
        )

        st.dataframe(
            splits,
            use_container_width=True,
            hide_index=True,
        )


# ===========================================================
# MAIN RENDERER
# ===========================================================

def render_prediction_explanation(
    explanation: dict,
) -> None:
    """
    Render a complete professional Decision Tree explanation.

    The explanation dictionary is consumed exactly as
    provided by the existing explainability engine.
    """

    if not isinstance(
        explanation,
        dict,
    ):

        raise TypeError(
            "explanation must be a dictionary."
        )

    _inject_explainability_styles()

    prediction = explanation.get(
        "prediction_label",
        "Unknown",
    )

    confidence = explanation.get(
        "confidence"
    )

    _render_prediction(
        prediction,
        confidence,
    )

    _render_top_features(
        explanation.get(
            "top_features"
        )
    )

    _render_decision_path(
        explanation.get(
            "decision_path",
            [],
        )
    )

    tree_info = explanation.get(
        "tree_summary",
        {},
    )

    if isinstance(
        tree_info,
        dict,
    ):

        _render_tree_structure(
            tree_info
        )

    _render_learned_splits(
        explanation.get(
            "splits"
        )
    )

import pandas as pd
import pytest

from core.decision_intelligence import (
    trend_score,
    forecast_score,
    risk_score,
    calculate_decision_score,
    classify_decision,
    classify_risk,
    generate_recommendation,
    build_signal_table,
    analyze_decision_intelligence,
)


def test_trend_score():
    assert trend_score("strong_growth") == 100
    assert trend_score("stable") == 60
    assert trend_score("strong_decline") == 10


def test_forecast_score():
    assert forecast_score("strong_growth") == 100
    assert forecast_score("growth") == 80
    assert forecast_score("stable") == 60
    assert forecast_score("decline") == 35


def test_risk_score():
    assert risk_score("low") == 100
    assert risk_score("medium") == 60
    assert risk_score("high") == 25
    assert risk_score("critical") == 5


def test_calculate_decision_score():
    score = calculate_decision_score(
        trend="strong_growth",
        forecast="strong_growth",
        risk="low",
        model_confidence=95,
    )

    assert isinstance(score, float)
    assert score >= 90


def test_invalid_confidence():
    with pytest.raises(ValueError):
        calculate_decision_score(
            trend="strong_growth",
            forecast="growth",
            risk="low",
            model_confidence=120,
        )


def test_classify_decision():
    assert classify_decision(90) == "strongly_recommended"
    assert classify_decision(70) == "recommended"
    assert classify_decision(55) == "cautious"
    assert classify_decision(40) == "not_recommended"
    assert classify_decision(20) == "high_risk"


def test_classify_risk():
    assert classify_risk(90) == "Low"
    assert classify_risk(70) == "Moderate"
    assert classify_risk(50) == "High"
    assert classify_risk(20) == "Critical"


def test_generate_recommendation():
    result = generate_recommendation(
        "recommended",
        "Moderate",
    )

    assert isinstance(result, dict)
    assert result["decision"] == "recommended"
    assert "recommendation" in result


def test_build_signal_table():
    result = build_signal_table(
        trend="strong_growth",
        forecast="growth",
        risk="low",
        model_confidence=90,
    )

    assert isinstance(result, pd.DataFrame)
    assert len(result) == 4
    assert "Signal" in result.columns
    assert "Score" in result.columns
    assert "Weight" in result.columns
    assert "Weighted Score" in result.columns


def test_analyze_decision_intelligence():
    result = analyze_decision_intelligence(
        trend="strong_growth",
        forecast="growth",
        risk="low",
        model_confidence=90,
        business_question="Should the company expand?",
    )

    assert isinstance(result, dict)
    assert result["business_question"] == "Should the company expand?"
    assert "decision_score" in result
    assert "decision" in result
    assert "risk_level" in result
    assert "signals" in result
    assert "recommendation" in result
    assert result["decision_score"] > 0
    assert isinstance(result["signals"], pd.DataFrame)


def test_empty_business_question():
    with pytest.raises(ValueError):
        analyze_decision_intelligence(
            trend="stable",
            forecast="stable",
            risk="medium",
            model_confidence=70,
            business_question="   ",
        )


def test_invalid_trend():
    with pytest.raises(ValueError):
        trend_score("unknown_trend")
import { DecisionResult } from '../types';
import { runForecasting } from './forecastingEngine';
import { profileDataset } from './analysis';

export function evaluateBusinessDecision(
  data: Record<string, any>[],
  dateColumn: string,
  targetColumn: string,
  businessQuestion: string,
  yearsAhead: number = 5
): DecisionResult {
  const profile = profileDataset(data);
  const forecast = runForecasting(data, dateColumn, targetColumn, yearsAhead);

  // 1. Data Volume Score (0 - 100)
  const volumeScore = Math.min(100, Math.max(30, Math.round((profile.rows / 20) * 100)));

  // 2. Data Quality Score (0 - 100)
  const qualityScore = Math.max(20, Math.round(100 - profile.missingPercentage * 3 - (profile.duplicateRows / Math.max(1, profile.rows)) * 100));

  // 3. Growth Signal Score (0 - 100)
  let growthSignal = 50;
  if (forecast.compoundAnnualGrowthRate > 20) growthSignal = 95;
  else if (forecast.compoundAnnualGrowthRate > 10) growthSignal = 85;
  else if (forecast.compoundAnnualGrowthRate > 2) growthSignal = 70;
  else if (forecast.compoundAnnualGrowthRate > -5) growthSignal = 45;
  else growthSignal = 20;

  // 4. Trend Stability Score (0 - 100)
  const stabilityScore = Math.round(forecast.rSquared * 100);

  // 5. Variance Score (0 - 100)
  const varianceScore = Math.max(30, Math.min(100, Math.round(100 - (1 - forecast.rSquared) * 60)));

  // Composite Decision Score (0 - 100)
  const compositeScore = Number(
    (
      growthSignal * 0.40 +
      stabilityScore * 0.25 +
      qualityScore * 0.20 +
      volumeScore * 0.15
    ).toFixed(1)
  );

  // Confidence Score (0 - 100)
  const confidence = Number(
    (
      (qualityScore * 0.35 + volumeScore * 0.35 + stabilityScore * 0.30)
    ).toFixed(1)
  );

  // Determine Decision and Risk
  let decision: 'PROCEED & EXPAND' | 'PROCEED WITH CAUTION' | 'HOLD / MONITOR' | 'MITIGATE RISK';
  let risk: 'Low' | 'Moderate' | 'High' | 'Severe';

  if (compositeScore >= 75 && forecast.compoundAnnualGrowthRate > 0) {
    decision = 'PROCEED & EXPAND';
    risk = compositeScore >= 85 ? 'Low' : 'Moderate';
  } else if (compositeScore >= 55) {
    decision = 'PROCEED WITH CAUTION';
    risk = 'Moderate';
  } else if (compositeScore >= 40) {
    decision = 'HOLD / MONITOR';
    risk = 'High';
  } else {
    decision = 'MITIGATE RISK';
    risk = 'Severe';
  }

  // Question context analysis
  const qLower = businessQuestion.toLowerCase();
  let questionContext = '';
  if (qLower.includes('invest') || qLower.includes('spend') || qLower.includes('budget') || qLower.includes('expand')) {
    if (decision === 'PROCEED & EXPAND') {
      questionContext = `Financial momentum directly justifies strategic investment expansion across ${targetColumn}.`;
    } else {
      questionContext = `High variance or suboptimal growth indicators advise deferring major capital allocations until stability is verified.`;
    }
  } else if (qLower.includes('churn') || qLower.includes('attrition') || qLower.includes('risk') || qLower.includes('loss')) {
    questionContext = `Historical data signals indicate risk exposure is currently assessed at ${risk} level.`;
  } else {
    questionContext = `Based on empirical trajectory for ${targetColumn}, the model advocates a ${decision} strategic stance.`;
  }

  const recommendation = `${questionContext} ${forecast.recommendation}`;

  return {
    decision,
    risk,
    score: compositeScore,
    confidence,
    recommendation,
    forecastDirection: `${forecast.trend} (${forecast.compoundAnnualGrowthRate >= 0 ? '+' : ''}${forecast.compoundAnnualGrowthRate}% CAGR)`,
    businessQuestion: businessQuestion.trim() || 'General Business Growth Evaluation',
    dateColumn,
    targetColumn,
    auditMetrics: {
      dataVolumeScore: volumeScore,
      growthSignalScore: growthSignal,
      trendStabilityScore: stabilityScore,
      dataQualityScore: qualityScore,
      varianceScore,
    },
    generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

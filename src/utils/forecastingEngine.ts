import { ForecastResult, ForecastPoint } from '../types';
import { isNumeric } from './analysis';

export function runForecasting(
  data: Record<string, any>[],
  dateColumn: string,
  targetColumn: string,
  yearsAhead: number = 5
): ForecastResult {
  // Filter valid rows
  const validRows = data
    .filter((d) => d[dateColumn] !== null && d[targetColumn] !== null && isNumeric(d[targetColumn]))
    .map((d) => {
      const dateVal = new Date(d[dateColumn]);
      const targetVal = Number(d[targetColumn]);
      const year = !isNaN(dateVal.getTime()) ? dateVal.getFullYear() : parseInt(String(d[dateColumn])) || 2020;
      return {
        rawDate: String(d[dateColumn]),
        year,
        value: targetVal,
      };
    })
    .sort((a, b) => a.year - b.year);

  if (validRows.length < 2) {
    throw new Error('Forecasting requires at least 2 valid historical time observations.');
  }

  // Aggregate by year if multiple observations exist per year
  const yearMap = new Map<number, { sum: number; count: number }>();
  for (const row of validRows) {
    const existing = yearMap.get(row.year) || { sum: 0, count: 0 };
    yearMap.set(row.year, { sum: existing.sum + row.value, count: existing.count + 1 });
  }

  const yearlyData = Array.from(yearMap.entries())
    .map(([year, agg]) => ({ year, value: agg.sum / agg.count }))
    .sort((a, b) => a.year - b.year);

  const n = yearlyData.length;
  const values = yearlyData.map((d) => d.value);

  // Compute linear trend slope & intercept
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / (n || 1);

  // R-squared
  const meanY = sumY / n;
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const pred = intercept + slope * i;
    ssTot += Math.pow(values[i] - meanY, 2);
    ssRes += Math.pow(values[i] - pred, 2);
  }
  const rSquared = ssTot > 0 ? Math.max(0, Math.min(1, 1 - ssRes / ssTot)) : 0.85;

  // Historical growth rate & CAGR
  const firstVal = values[0];
  const lastVal = values[n - 1];
  const totalGrowth = firstVal !== 0 ? ((lastVal - firstVal) / Math.abs(firstVal)) * 100 : 0;
  const cagr = firstVal > 0 && lastVal > 0 && n > 1
    ? (Math.pow(lastVal / firstVal, 1 / (n - 1)) - 1) * 100
    : totalGrowth / (n || 1);

  // Determine trend category
  let trend: 'Strong Growth' | 'Moderate Growth' | 'Stable / Flat' | 'Declining' | 'Volatile' = 'Stable / Flat';
  if (slope > 0 && cagr > 12) trend = 'Strong Growth';
  else if (slope > 0 && cagr > 2) trend = 'Moderate Growth';
  else if (slope < 0 && cagr < -5) trend = 'Declining';
  else if (rSquared < 0.3) trend = 'Volatile';

  // Standard error for prediction intervals
  const stdError = Math.sqrt(ssRes / Math.max(1, n - 2)) || Math.abs(meanY * 0.08);

  const lastYear = yearlyData[n - 1].year;
  const forecasts: ForecastPoint[] = [];

  // Include historical data points
  const historicalPoints = yearlyData.map((d) => ({
    time: d.year,
    value: Number(d.value.toFixed(2)),
  }));

  for (let h = 1; h <= yearsAhead; h++) {
    const targetYear = lastYear + h;
    const futureIndex = (n - 1) + h;
    const baseForecast = Math.max(0, intercept + slope * futureIndex);
    const uncertaintyMultiplier = 1 + h * 0.15;
    const margin = stdError * uncertaintyMultiplier * 1.96;

    forecasts.push({
      year: targetYear,
      forecast: Number(baseForecast.toFixed(2)),
      lowerBound: Number(Math.max(0, baseForecast - margin).toFixed(2)),
      upperBound: Number((baseForecast + margin).toFixed(2)),
    });
  }

  // Generate actionable recommendation
  let recommendation = '';
  if (trend === 'Strong Growth') {
    recommendation = `Historical momentum is robust (CAGR: +${cagr.toFixed(1)}%, R²: ${rSquared.toFixed(2)}). Expanding operational capacity and increasing targeted capital investment is strongly advised.`;
  } else if (trend === 'Moderate Growth') {
    recommendation = `Steady upward trajectory detected (+${cagr.toFixed(1)}% annual rate). Maintain core operational rhythm while monitoring unit economics and conversion efficiency.`;
  } else if (trend === 'Declining') {
    recommendation = `Downward performance contraction observed (${cagr.toFixed(1)}% annual rate). Immediate cost optimization and strategic pivot towards higher-margin segments is recommended.`;
  } else {
    recommendation = `High volatility or non-linear oscillations detected across periods. Strengthen demand buffering, establish flexible resource allocation, and review outlier factors.`;
  }

  return {
    dateColumn,
    targetColumn,
    yearsAhead,
    trend,
    historicalGrowthRate: Number(totalGrowth.toFixed(2)),
    compoundAnnualGrowthRate: Number(cagr.toFixed(2)),
    rSquared: Number(rSquared.toFixed(3)),
    recommendation,
    forecasts,
    historicalPoints,
  };
}

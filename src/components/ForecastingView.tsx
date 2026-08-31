import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Sliders,
  CheckCircle2,
  Table as TableIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  ComposedChart,
} from 'recharts';
import { DatasetProfile, ForecastResult } from '../types';
import { runForecasting } from '../utils/forecastingEngine';

interface ForecastingViewProps {
  data: Record<string, any>[];
  profile: DatasetProfile;
  forecastResult: ForecastResult | null;
  setForecastResult: (res: ForecastResult | null) => void;
}

export const ForecastingView: React.FC<ForecastingViewProps> = ({
  data,
  profile,
  forecastResult,
  setForecastResult,
}) => {
  const [dateCol, setDateCol] = useState<string>(
    profile.datetimeColumns[0] || profile.columnMetas.find((c) => c.name.toLowerCase().includes('date') || c.name.toLowerCase().includes('year'))?.name || profile.columnMetas[0]?.name || ''
  );
  const [targetCol, setTargetCol] = useState<string>(
    profile.numericColumns[0] || ''
  );
  const [yearsAhead, setYearsAhead] = useState<number>(5);

  const forecast = useMemo(() => {
    if (!dateCol || !targetCol) return null;
    try {
      const res = runForecasting(data, dateCol, targetCol, yearsAhead);
      setForecastResult(res);
      return res;
    } catch (err) {
      console.warn('Forecasting computation failed:', err);
      return null;
    }
  }, [data, dateCol, targetCol, yearsAhead]);

  // Merge historical + forecast points for unified chart
  const chartData = useMemo(() => {
    if (!forecast) return [];
    const points: any[] = [];

    for (const h of forecast.historicalPoints) {
      points.push({
        time: String(h.time),
        actual: h.value,
        forecast: null,
        lowerBound: null,
        upperBound: null,
      });
    }

    // Connect the last historical point with forecast
    const lastHist = forecast.historicalPoints[forecast.historicalPoints.length - 1];
    if (lastHist && forecast.forecasts.length > 0) {
      // update the last hist point so line connects
      points[points.length - 1].forecast = lastHist.value;
      points[points.length - 1].lowerBound = lastHist.value;
      points[points.length - 1].upperBound = lastHist.value;
    }

    for (const f of forecast.forecasts) {
      points.push({
        time: String(f.year),
        actual: null,
        forecast: f.forecast,
        lowerBound: f.lowerBound,
        upperBound: f.upperBound,
      });
    }

    return points;
  }, [forecast]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            Empirical Trend Projection & Confidence Modeling
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Time-Series Forecasting</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Forecast forward periods with linear trend decomposition and probabilistic confidence intervals.
          </p>
        </div>

        {/* Column Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">Time Dimension</span>
            <select
              value={dateCol}
              onChange={(e) => setDateCol(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {profile.columnMetas.map((col) => (
                <option key={col.name} value={col.name}>
                  {col.name} ({col.type})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">Target Measure</span>
            <select
              value={targetCol}
              onChange={(e) => setTargetCol(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {profile.numericColumns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {forecast ? (
        <>
          {/* Growth & Trend Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="text-[10px] uppercase font-bold text-slate-400">Trend Trajectory</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg font-black text-white">{forecast.trend}</span>
                {forecast.compoundAnnualGrowthRate >= 0 ? (
                  <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-rose-400" />
                )}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Classification direction</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="text-[10px] uppercase font-bold text-slate-400">Annual CAGR</div>
              <div className={`text-2xl font-black mt-1 ${forecast.compoundAnnualGrowthRate >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {forecast.compoundAnnualGrowthRate >= 0 ? '+' : ''}
                {forecast.compoundAnnualGrowthRate}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Compound annual growth</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="text-[10px] uppercase font-bold text-slate-400">Trend Fit Quality (R²)</div>
              <div className="text-2xl font-black text-blue-400 mt-1">{forecast.rSquared}</div>
              <div className="text-[11px] text-slate-400 mt-1">Statistical variance explained</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
                <span>Forecast Horizon</span>
                <span className="text-blue-400 font-mono">{yearsAhead} Periods</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={yearsAhead}
                onChange={(e) => setYearsAhead(Number(e.target.value))}
                className="w-full accent-blue-500 mt-3"
              />
              <div className="text-[11px] text-slate-400 mt-1">Forward forecast duration</div>
            </div>
          </div>

          {/* Forecast Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Forward Projection: {targetCol} ({yearsAhead} Periods Ahead)
                </h3>
                <p className="text-xs text-slate-400">Solid line: Historical actuals; Dashed line: Projected trend with 95% confidence bands</p>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={3} name="Historical Actual" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="forecast" stroke="#10b981" strokeWidth={3} strokeDasharray="5 5" name="Forecast Prediction" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="upperBound" stroke="#10b981" strokeWidth={1} strokeDasharray="2 2" name="Upper 95% Bound" dot={false} />
                  <Line type="monotone" dataKey="lowerBound" stroke="#10b981" strokeWidth={1} strokeDasharray="2 2" name="Lower 95% Bound" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Strategic Guidance & Projections Table */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Guidance Box */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-blue-500/20 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Executive Strategic Recommendation
                </div>
                <p className="text-sm font-medium text-slate-200 leading-relaxed mt-2">
                  {forecast.recommendation}
                </p>
              </div>

              <div className="mt-6 p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-slate-400">
                Total Historical Growth: <span className="font-bold text-white font-mono">{forecast.historicalGrowthRate}%</span>
              </div>
            </div>

            {/* Projection Grid Table */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TableIcon className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Tabular Forecast Projections</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">95% Confidence Intervals</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5">Period (Year)</th>
                      <th className="px-4 py-2.5">Forecast Target</th>
                      <th className="px-4 py-2.5">Lower Confidence (95%)</th>
                      <th className="px-4 py-2.5">Upper Confidence (95%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {forecast.forecasts.map((pt) => (
                      <tr key={pt.year} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-white">{pt.year}</td>
                        <td className="px-4 py-2.5 font-bold text-emerald-400">{pt.forecast.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-slate-400">{pt.lowerBound.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-slate-400">{pt.upperBound.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 text-xs">
          Select valid time and numeric target columns above to compute forecast projections.
        </div>
      )}
    </div>
  );
};

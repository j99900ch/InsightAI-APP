import React, { useState, useMemo } from 'react';
import {
  PieChart as PieIcon,
  BarChart3,
  LineChart as LineIcon,
  ScatterChart as ScatterIcon,
  Layers,
  Sparkles,
  Grid,
  TrendingUp,
  Settings2,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { DatasetProfile, ChartRecommendation } from '../types';
import { isNumeric, computeCorrelationMatrix } from '../utils/analysis';

interface VisualizationStudioProps {
  data: Record<string, any>[];
  profile: DatasetProfile;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1'];

export const VisualizationStudio: React.FC<VisualizationStudioProps> = ({ data, profile }) => {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'scatter' | 'histogram' | 'pie' | 'heatmap' | 'area'>('bar');
  const [xAxisCol, setXAxisCol] = useState<string>(
    profile.categoricalColumns[0] || profile.datetimeColumns[0] || profile.numericColumns[0] || ''
  );
  const [yAxisCol, setYAxisCol] = useState<string>(
    profile.numericColumns[0] || ''
  );
  const [aggregation, setAggregation] = useState<'sum' | 'mean' | 'count'>('sum');
  const [histBins, setHistBins] = useState<number>(10);

  // Auto-generate AI Recommended Charts
  const recommendedCharts: ChartRecommendation[] = useMemo(() => {
    const recs: ChartRecommendation[] = [];

    // Rec 1: Time Series Line
    if (profile.datetimeColumns.length > 0 && profile.numericColumns.length > 0) {
      recs.push({
        id: 'rec-time-line',
        type: 'line',
        title: `${profile.numericColumns[0]} Trend over ${profile.datetimeColumns[0]}`,
        xAxis: profile.datetimeColumns[0],
        yAxis: profile.numericColumns[0],
        reason: 'Longitudinal progression detected across primary date column.',
      });
    }

    // Rec 2: Categorical Bar Aggregation
    if (profile.categoricalColumns.length > 0 && profile.numericColumns.length > 0) {
      recs.push({
        id: 'rec-cat-bar',
        type: 'bar',
        title: `${profile.numericColumns[0]} by ${profile.categoricalColumns[0]}`,
        xAxis: profile.categoricalColumns[0],
        yAxis: profile.numericColumns[0],
        reason: 'High-contrast distribution between distinct category segments.',
      });
    }

    // Rec 3: Correlation Scatter
    if (profile.numericColumns.length >= 2) {
      recs.push({
        id: 'rec-corr-scatter',
        type: 'scatter',
        title: `${profile.numericColumns[0]} vs. ${profile.numericColumns[1]} Correlation`,
        xAxis: profile.numericColumns[1],
        yAxis: profile.numericColumns[0],
        reason: 'Quantitative co-variance inspection for primary continuous variables.',
      });
    }

    return recs;
  }, [profile]);

  // Aggregated Bar/Pie/Line Data
  const aggregatedData = useMemo(() => {
    if (!xAxisCol || !data.length) return [];

    const groupMap = new Map<string, { sum: number; count: number; values: number[] }>();

    for (const row of data) {
      const rawX = row[xAxisCol];
      const key = rawX !== null && rawX !== undefined ? String(rawX) : 'Missing';
      const rawY = yAxisCol ? Number(row[yAxisCol]) : 1;
      const numY = isNaN(rawY) ? 0 : rawY;

      const current = groupMap.get(key) || { sum: 0, count: 0, values: [] };
      current.sum += numY;
      current.count += 1;
      current.values.push(numY);
      groupMap.set(key, current);
    }

    return Array.from(groupMap.entries())
      .map(([key, item]) => {
        let value = item.sum;
        if (aggregation === 'mean') value = Number((item.sum / item.count).toFixed(2));
        else if (aggregation === 'count') value = item.count;
        return {
          [xAxisCol]: key,
          [yAxisCol || 'count']: value,
          _rawCount: item.count,
        };
      })
      .slice(0, 20); // cap top 20 for readability
  }, [data, xAxisCol, yAxisCol, aggregation]);

  // Scatter plot data with Pearson r calculation
  const { scatterData, correlationR } = useMemo(() => {
    if (chartType !== 'scatter' || !xAxisCol || !yAxisCol) return { scatterData: [], correlationR: 0 };

    const pts: { x: number; y: number; name: string }[] = [];
    let sumX = 0, sumY = 0, count = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const x = Number(row[xAxisCol]);
      const y = Number(row[yAxisCol]);
      if (!isNaN(x) && !isNaN(y)) {
        pts.push({ x, y, name: `Record #${i + 1}` });
        sumX += x;
        sumY += y;
        count++;
      }
    }

    if (count < 2) return { scatterData: pts, correlationR: 0 };

    const meanX = sumX / count;
    const meanY = sumY / count;

    let num = 0, denX = 0, denY = 0;
    for (const p of pts) {
      const dx = p.x - meanX;
      const dy = p.y - meanY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }

    const den = Math.sqrt(denX * denY);
    const r = den > 0 ? Number((num / den).toFixed(3)) : 0;

    return { scatterData: pts, correlationR: r };
  }, [data, chartType, xAxisCol, yAxisCol]);

  // Histogram bins calculation
  const histogramData = useMemo(() => {
    if (chartType !== 'histogram' || !yAxisCol) return [];
    const nums = data.map((d) => Number(d[yAxisCol])).filter((n) => !isNaN(n));
    if (nums.length === 0) return [];

    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const range = max - min || 1;
    const binSize = range / histBins;

    const bins = Array.from({ length: histBins }, (_, i) => {
      const lower = min + i * binSize;
      const upper = lower + binSize;
      return {
        binLabel: `${lower.toFixed(1)} - ${upper.toFixed(1)}`,
        count: 0,
        lower,
        upper,
      };
    });

    for (const val of nums) {
      const binIdx = Math.min(histBins - 1, Math.floor((val - min) / binSize));
      if (binIdx >= 0 && binIdx < histBins) {
        bins[binIdx].count++;
      }
    }

    return bins;
  }, [data, chartType, yAxisCol, histBins]);

  // Correlation Matrix
  const correlationData = useMemo(() => {
    return computeCorrelationMatrix(data, profile.numericColumns);
  }, [data, profile.numericColumns]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
          <PieIcon className="w-4 h-4" />
          Interactive Visualization & Correlation Studio
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Visualization Studio</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Generate high-resolution distribution graphs, bivariate correlation scatter plots, and multi-factor matrices.
        </p>

        {/* AI Recommendations Bar */}
        {recommendedCharts.length > 0 && (
          <div className="mt-5 border-t border-slate-800 pt-4">
            <div className="text-[11px] uppercase font-bold tracking-wider text-blue-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              AI Recommended Visualizations
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {recommendedCharts.map((rec) => (
                <button
                  key={rec.id}
                  onClick={() => {
                    setChartType(rec.type as any);
                    setXAxisCol(rec.xAxis);
                    if (rec.yAxis) setYAxisCol(rec.yAxis);
                  }}
                  className="p-3 bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800/80 rounded-xl text-left transition-all group"
                >
                  <div className="text-xs font-bold text-slate-200 group-hover:text-blue-300 transition-colors">
                    {rec.title}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">{rec.reason}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Studio Layout: Left Controls + Right Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Column */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Settings2 className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Chart Configuration</h3>
          </div>

          {/* Chart Type Picker */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1.5">Chart Type</label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'bar', label: 'Bar Chart', icon: BarChart3 },
                { id: 'line', label: 'Line Chart', icon: LineIcon },
                { id: 'scatter', label: 'Scatter (OLS)', icon: ScatterIcon },
                { id: 'histogram', label: 'Histogram', icon: BarChart3 },
                { id: 'pie', label: 'Pie / Donut', icon: PieIcon },
                { id: 'area', label: 'Area Chart', icon: TrendingUp },
                { id: 'heatmap', label: 'Correlation', icon: Grid },
              ].map((c) => {
                const Icon = c.icon;
                const active = chartType === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setChartType(c.id as any)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      active
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Axis Selectors */}
          {chartType !== 'heatmap' && (
            <>
              {chartType !== 'histogram' && (
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1.5">
                    X-Axis (Dimension)
                  </label>
                  <select
                    value={xAxisCol}
                    onChange={(e) => setXAxisCol(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {profile.columnMetas.map((col) => (
                      <option key={col.name} value={col.name}>
                        {col.name} ({col.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1.5">
                  {chartType === 'histogram' ? 'Numeric Feature (Distribution)' : 'Y-Axis (Measure)'}
                </label>
                <select
                  value={yAxisCol}
                  onChange={(e) => setYAxisCol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  {profile.numericColumns.map((col) => (
                    <option key={col} value={col}>
                      {col} (numeric)
                    </option>
                  ))}
                </select>
              </div>

              {(chartType === 'bar' || chartType === 'pie') && (
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1.5">
                    Aggregation Mode
                  </label>
                  <select
                    value={aggregation}
                    onChange={(e) => setAggregation(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="sum">Sum of values</option>
                    <option value="mean">Average (Mean)</option>
                    <option value="count">Record Count (Frequency)</option>
                  </select>
                </div>
              )}

              {chartType === 'histogram' && (
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                    <span>Bin Count</span>
                    <span className="text-blue-400 font-mono">{histBins} bins</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={25}
                    value={histBins}
                    onChange={(e) => setHistBins(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
              )}
            </>
          )}

          {/* Contextual Info Card */}
          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 font-bold text-slate-300 mb-1">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              Dataset Signal
            </div>
            {chartType === 'scatter' ? (
              <p>
                Pearson Correlation <span className="font-mono text-blue-400 font-bold">r = {correlationR}</span>
                {Math.abs(correlationR) > 0.7
                  ? ' (Strong linear relationship)'
                  : Math.abs(correlationR) > 0.3
                  ? ' (Moderate correlation)'
                  : ' (Weak or non-linear co-variance)'}
              </p>
            ) : chartType === 'heatmap' ? (
              <p>Correlation matrix calculates all pairwise Pearson coefficients between quantitative variables.</p>
            ) : (
              <p>Aggregating across {data.length.toLocaleString()} records.</p>
            )}
          </div>
        </div>

        {/* Chart Canvas Area */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col min-h-[460px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">
                {chartType === 'heatmap'
                  ? 'Pairwise Correlation Matrix Heatmap'
                  : `${yAxisCol || 'Count'} by ${xAxisCol || 'Feature'}`}
              </h3>
              <p className="text-xs text-slate-400">Interactive SVG Visualizer</p>
            </div>
          </div>

          <div className="flex-1 w-full h-80 min-h-[360px]">
            {chartType === 'bar' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aggregatedData} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey={xAxisCol} stroke="#64748b" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey={yAxisCol || 'count'} fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {chartType === 'line' && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aggregatedData} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey={xAxisCol} stroke="#64748b" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Line type="monotone" dataKey={yAxisCol} stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            )}

            {chartType === 'area' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={aggregatedData} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey={xAxisCol} stroke="#64748b" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey={yAxisCol} stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#areaGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {chartType === 'scatter' && (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    name={xAxisCol}
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    label={{ value: xAxisCol, position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 11 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    name={yAxisCol}
                    stroke="#64748b"
                    tick={{ fontSize: 11 }}
                    label={{ value: yAxisCol, angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: '12px' }}
                  />
                  <Scatter name="Data Points" data={scatterData} fill="#3b82f6" />
                </ScatterChart>
              </ResponsiveContainer>
            )}

            {chartType === 'histogram' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={histogramData} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="binLabel" stroke="#64748b" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Frequency" />
                </BarChart>
              </ResponsiveContainer>
            )}

            {chartType === 'pie' && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={aggregatedData}
                    dataKey={yAxisCol || 'count'}
                    nameKey={xAxisCol}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    innerRadius={50}
                    paddingAngle={3}
                    label={(entry) => entry[xAxisCol]}
                  >
                    {aggregatedData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}

            {chartType === 'heatmap' && (
              <div className="overflow-x-auto py-4">
                {correlationData.columns.length < 2 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Need at least 2 numeric columns to render a correlation matrix.
                  </div>
                ) : (
                  <table className="w-full text-center border-collapse">
                    <thead>
                      <tr>
                        <th className="p-2"></th>
                        {correlationData.columns.map((c) => (
                          <th key={c} className="p-2 text-[11px] font-bold text-slate-300 font-mono truncate max-w-[100px]">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {correlationData.columns.map((rowName, rIdx) => (
                        <tr key={rowName}>
                          <td className="p-2 text-right text-[11px] font-bold text-slate-300 font-mono truncate max-w-[120px]">
                            {rowName}
                          </td>
                          {correlationData.columns.map((colName, cIdx) => {
                            const val = correlationData.matrix[rIdx][cIdx];
                            const absVal = Math.abs(val);
                            const bgColor =
                              val > 0
                                ? `rgba(59, 130, 246, ${absVal * 0.85})`
                                : `rgba(239, 68, 68, ${absVal * 0.85})`;
                            return (
                              <td
                                key={colName}
                                className="p-3 text-xs font-mono font-bold transition-transform hover:scale-105"
                                style={{
                                  backgroundColor: rIdx === cIdx ? 'rgba(59, 130, 246, 0.9)' : bgColor,
                                  color: absVal > 0.4 ? '#ffffff' : '#94a3b8',
                                }}
                              >
                                {val.toFixed(2)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

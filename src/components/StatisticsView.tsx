import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Calculator,
  Layers,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Table as TableIcon,
  HelpCircle,
} from 'lucide-react';
import { DatasetProfile, DescriptiveStatRow, CategoricalStatRow } from '../types';
import { computeDescriptiveStatistics, computeCategoricalSummary } from '../utils/analysis';

interface StatisticsViewProps {
  data: Record<string, any>[];
  profile: DatasetProfile;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({ data, profile }) => {
  const [activeSubTab, setActiveSubTab] = useState<'numeric' | 'categorical' | 'missing'>('numeric');

  const numericStats = useMemo(() => {
    return computeDescriptiveStatistics(data, profile.numericColumns);
  }, [data, profile.numericColumns]);

  const categoricalStats = useMemo(() => {
    return computeCategoricalSummary(data, profile.categoricalColumns);
  }, [data, profile.categoricalColumns]);

  const completenessScore = useMemo(() => {
    return Math.max(0, Math.round(100 - profile.missingPercentage));
  }, [profile.missingPercentage]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
          <BarChart3 className="w-4 h-4" />
          Descriptive Statistics & Exploratory Data Analysis
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Statistical Intelligence</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Mathematical moments, central tendencies, spreads, dispersion, and cardinality summaries.
        </p>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 mt-5 border-t border-slate-800 pt-4">
          <button
            onClick={() => setActiveSubTab('numeric')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeSubTab === 'numeric'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            Numeric Summary ({profile.numericColumns.length})
          </button>
          <button
            onClick={() => setActiveSubTab('categorical')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeSubTab === 'categorical'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Categorical Summary ({profile.categoricalColumns.length})
          </button>
          <button
            onClick={() => setActiveSubTab('missing')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              activeSubTab === 'missing'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Missingness & Completeness
          </button>
        </div>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-medium text-slate-400 uppercase">Completeness Score</div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-2xl font-bold ${completenessScore >= 95 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {completenessScore}%
            </span>
            {completenessScore >= 95 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Data hygiene rating</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-medium text-slate-400 uppercase">Numeric Features</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{profile.numericColumns.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Continuous/discrete vars</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-medium text-slate-400 uppercase">Categorical Features</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{profile.categoricalColumns.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Class/dimension vars</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-medium text-slate-400 uppercase">Sample Dimension</div>
          <div className="text-2xl font-bold text-white mt-1">
            {profile.rows} × {profile.columns}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Matrix shape</div>
        </div>
      </div>

      {/* Numeric Tab Content */}
      {activeSubTab === 'numeric' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Continuous Feature Moments</h3>
            </div>
            <span className="text-xs text-slate-400">Calculated via standard sample statistics</span>
          </div>

          {numericStats.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No numeric columns detected in this dataset.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Feature</th>
                    <th className="px-4 py-3">Count</th>
                    <th className="px-4 py-3">Mean</th>
                    <th className="px-4 py-3">Std Dev</th>
                    <th className="px-4 py-3">Min</th>
                    <th className="px-4 py-3">25% (Q1)</th>
                    <th className="px-4 py-3">Median</th>
                    <th className="px-4 py-3">75% (Q3)</th>
                    <th className="px-4 py-3">Max</th>
                    <th className="px-4 py-3">IQR</th>
                    <th className="px-4 py-3">Skewness</th>
                    <th className="px-4 py-3">Kurtosis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {numericStats.map((row) => (
                    <tr key={row.feature} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-200">{row.feature}</td>
                      <td className="px-4 py-3 text-slate-400">{row.count.toLocaleString()}</td>
                      <td className="px-4 py-3 text-blue-400 font-semibold">{row.mean !== null ? row.mean.toLocaleString() : '—'}</td>
                      <td className="px-4 py-3 text-slate-300">{row.std !== null ? row.std.toLocaleString() : '—'}</td>
                      <td className="px-4 py-3 text-slate-300">{row.min !== null ? row.min.toLocaleString() : '—'}</td>
                      <td className="px-4 py-3 text-slate-400">{row.q25 !== null ? row.q25.toLocaleString() : '—'}</td>
                      <td className="px-4 py-3 text-emerald-400 font-semibold">{row.median !== null ? row.median.toLocaleString() : '—'}</td>
                      <td className="px-4 py-3 text-slate-400">{row.q75 !== null ? row.q75.toLocaleString() : '—'}</td>
                      <td className="px-4 py-3 text-slate-300">{row.max !== null ? row.max.toLocaleString() : '—'}</td>
                      <td className="px-4 py-3 text-slate-400">{row.iqr !== null ? row.iqr.toLocaleString() : '—'}</td>
                      <td className="px-4 py-3 text-slate-400">
                        <span className={Math.abs(row.skewness || 0) > 1 ? 'text-amber-400' : 'text-slate-400'}>
                          {row.skewness !== null ? row.skewness : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{row.kurtosis !== null ? row.kurtosis : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Categorical Tab Content */}
      {activeSubTab === 'categorical' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Categorical Cardinality & Mode Distribution</h3>
            </div>
            <span className="text-xs text-slate-400">Discrete factor breakdowns</span>
          </div>

          {categoricalStats.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No categorical columns detected in this dataset.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Feature</th>
                    <th className="px-4 py-3">Unique Categories</th>
                    <th className="px-4 py-3">Dominant Category (Mode)</th>
                    <th className="px-4 py-3">Top Category Count</th>
                    <th className="px-4 py-3">Dominance %</th>
                    <th className="px-4 py-3">Cardinality Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {categoricalStats.map((row) => (
                    <tr key={row.feature} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-200">{row.feature}</td>
                      <td className="px-4 py-3 text-blue-400 font-semibold">{row.uniqueCount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-amber-400 font-medium">{row.topCategory}</td>
                      <td className="px-4 py-3 text-slate-300">{row.topFrequency.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-300">{row.topPercentage}%</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.cardinalityLevel === 'Low'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : row.cardinalityLevel === 'Medium'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {row.cardinalityLevel} Cardinality
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Missingness Tab Content */}
      {activeSubTab === 'missing' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Missing Value Heat Breakdown</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Column-by-column missing cell count and sparsity percentages.
              </p>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {profile.columnMetas.map((col) => (
                <div key={col.name} className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-slate-200 font-mono">{col.name}</div>
                    <div className="text-[11px] text-slate-400">{col.type} column</div>
                  </div>

                  <div className="text-right">
                    <div className={`text-xs font-bold font-mono ${col.missingCount === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {col.missingCount} missing ({col.missingPercentage.toFixed(1)}%)
                    </div>
                    <div className="w-28 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full ${col.missingCount === 0 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.max(col.missingPercentage, col.missingCount === 0 ? 0 : 5)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

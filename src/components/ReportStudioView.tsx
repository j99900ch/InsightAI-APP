import React, { useState } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  Layers,
  Sparkles,
  Printer,
  FileCheck,
} from 'lucide-react';
import { DatasetProfile, MLResult, DecisionResult, ForecastResult } from '../types';
import { computeDescriptiveStatistics } from '../utils/analysis';
import { generatePdfReport } from '../utils/pdfExport';

interface ReportStudioViewProps {
  data: Record<string, any>[];
  datasetName: string;
  profile: DatasetProfile;
  mlResult: MLResult | null;
  decisionResult: DecisionResult | null;
  forecastResult: ForecastResult | null;
}

export const ReportStudioView: React.FC<ReportStudioViewProps> = ({
  data,
  datasetName,
  profile,
  mlResult,
  decisionResult,
  forecastResult,
}) => {
  const [includeStats, setIncludeStats] = useState(true);
  const [includeMl, setIncludeMl] = useState(true);
  const [includeDecision, setIncludeDecision] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const stats = computeDescriptiveStatistics(data, profile.numericColumns);

  const handleDownloadPdf = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        generatePdfReport({
          datasetName,
          profile,
          stats: includeStats ? stats : [],
          mlResults:
            includeMl && mlResult
              ? {
                  target: mlResult.targetColumn,
                  bestModel: mlResult.bestModelName,
                  comparison: mlResult.comparison,
                }
              : undefined,
          decision: includeDecision && decisionResult ? decisionResult : undefined,
          forecast: forecastResult || undefined,
        });
      } catch (err) {
        console.error('PDF Generation Error:', err);
      } finally {
        setIsGenerating(false);
      }
    }, 250);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            Executive Intelligence PDF Compiler
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Report Studio</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Compile multi-page executive business intelligence reports with full audit logs and metrics.
          </p>
        </div>

        {/* Download PDF CTA */}
        <button
          id="btn-download-pdf-report"
          onClick={handleDownloadPdf}
          disabled={isGenerating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all"
        >
          <Download className="w-4 h-4" />
          {isGenerating ? 'Compiling PDF...' : 'Download PDF Report'}
        </button>
      </div>

      {/* Section Inclusion Toggles */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Configure Report Sections
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="flex items-center gap-3 p-3 bg-slate-950/70 border border-slate-800 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={includeStats}
              onChange={(e) => setIncludeStats(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-0"
            />
            <div>
              <div className="text-xs font-bold text-slate-200">Descriptive Statistics</div>
              <div className="text-[10px] text-slate-400">Mean, std, quantiles, skewness</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-950/70 border border-slate-800 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={includeMl}
              onChange={(e) => setIncludeMl(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-0"
            />
            <div>
              <div className="text-xs font-bold text-slate-200">Machine Learning Benchmarks</div>
              <div className="text-[10px] text-slate-400">Model leaderboard & scores</div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-950/70 border border-slate-800 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={includeDecision}
              onChange={(e) => setIncludeDecision(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-0"
            />
            <div>
              <div className="text-xs font-bold text-slate-200">Decision Intelligence</div>
              <div className="text-[10px] text-slate-400">Strategic recommendation & audit</div>
            </div>
          </label>
        </div>
      </div>

      {/* Live Document Preview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-4xl mx-auto space-y-6">
        {/* Document Header */}
        <div className="border-b border-slate-800 pb-5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">
              Executive Summary Report
            </div>
            <div className="text-xs text-slate-400 font-mono">InsightAI Engine v2.0</div>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Intelligence & Feasibility Brief</h1>
          <p className="text-xs text-slate-400 mt-1">
            Evaluated for <span className="text-slate-200 font-semibold">{datasetName}</span> on{' '}
            {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Section 1: Executive Overview */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">
            1. Dataset Architecture & Health
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase block">Observations</span>
              <span className="text-white font-bold">{profile.rows.toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase block">Dimensions</span>
              <span className="text-white font-bold">{profile.columns}</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase block">Missing Rate</span>
              <span className="text-emerald-400 font-bold">{profile.missingPercentage.toFixed(1)}%</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase block">Memory</span>
              <span className="text-slate-300 font-bold">~{profile.memoryEstimateKb} KB</span>
            </div>
          </div>
        </div>

        {/* Section 2: Stats Table Preview */}
        {includeStats && stats.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">
              2. Descriptive Moments Summary
            </h3>
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-[11px] font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-2">Feature</th>
                    <th className="p-2">Mean</th>
                    <th className="p-2">Std Dev</th>
                    <th className="p-2">Min</th>
                    <th className="p-2">Median</th>
                    <th className="p-2">Max</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {stats.slice(0, 5).map((s) => (
                    <tr key={s.feature}>
                      <td className="p-2 text-white font-bold">{s.feature}</td>
                      <td className="p-2 text-blue-400">{s.mean}</td>
                      <td className="p-2 text-slate-300">{s.std}</td>
                      <td className="p-2 text-slate-400">{s.min}</td>
                      <td className="p-2 text-emerald-400">{s.median}</td>
                      <td className="p-2 text-slate-400">{s.max}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 3: ML Champion Preview */}
        {includeMl && mlResult && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">
              3. Machine Learning Modeling
            </h3>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Top Benchmark Model:</span>
                <span className="font-bold text-white font-mono">{mlResult.bestModelName}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Primary Validation Score:</span>
                <span className="font-bold text-emerald-400 font-mono">{mlResult.bestModelScore}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Decision Preview */}
        {includeDecision && decisionResult && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">
              4. Strategic Guidance & Decision Verdict
            </h3>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Recommendation Status:</span>
                <span className="font-bold text-emerald-400 font-mono">{decisionResult.decision}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Assessed Risk Level:</span>
                <span className="font-bold text-blue-400 font-mono">{decisionResult.risk}</span>
              </div>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {decisionResult.recommendation}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

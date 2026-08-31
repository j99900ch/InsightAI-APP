import React, { useState, useEffect } from 'react';
import {
  Target,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  Zap,
  TrendingUp,
  Activity,
  CheckCircle2,
  ListFilter,
  FileCheck,
} from 'lucide-react';
import { DatasetProfile, DecisionResult } from '../types';
import { evaluateBusinessDecision } from '../utils/decisionEngine';

interface BusinessDecisionViewProps {
  data: Record<string, any>[];
  profile: DatasetProfile;
  decisionResult: DecisionResult | null;
  setDecisionResult: (res: DecisionResult | null) => void;
}

const PRESET_QUESTIONS = [
  'Should we increase capital and sales investment for next year?',
  'Is customer retention and revenue momentum expanding sustainably?',
  'Should we scale production and workforce based on current trajectory?',
  'Is operational expenditure creating high volatility or downside risk?',
];

export const BusinessDecisionView: React.FC<BusinessDecisionViewProps> = ({
  data,
  profile,
  decisionResult,
  setDecisionResult,
}) => {
  const [question, setQuestion] = useState<string>(
    'Should we increase capital and sales investment for next year?'
  );
  const [dateCol, setDateCol] = useState<string>(
    profile.datetimeColumns[0] || profile.columnMetas[0]?.name || ''
  );
  const [targetCol, setTargetCol] = useState<string>(
    profile.numericColumns[0] || ''
  );
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleEvaluate = () => {
    if (!dateCol || !targetCol) return;
    setIsEvaluating(true);

    setTimeout(() => {
      try {
        const result = evaluateBusinessDecision(data, dateCol, targetCol, question, 5);
        setDecisionResult(result);
      } catch (err) {
        console.error('Decision Engine Error:', err);
      } finally {
        setIsEvaluating(false);
      }
    }, 300);
  };

  useEffect(() => {
    if (!decisionResult && dateCol && targetCol) {
      handleEvaluate();
    }
  }, [dateCol, targetCol]);

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'PROCEED & EXPAND':
        return 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300';
      case 'PROCEED WITH CAUTION':
        return 'bg-blue-500/20 border-blue-500/40 text-blue-300';
      case 'HOLD / MONITOR':
        return 'bg-amber-500/20 border-amber-500/40 text-amber-300';
      default:
        return 'bg-rose-500/20 border-rose-500/40 text-rose-300';
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'Low':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'Moderate':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'High':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Target className="w-4 h-4" />
          Deterministic Strategic Scoring & Audit Trail
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Business Decision Engine</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Orchestrate multi-factor decisions fusing data hygiene, historical CAGR, trend stability, and sample confidence.
        </p>

        {/* Question Input */}
        <div className="mt-5 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your strategic business question..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium"
            />
            <button
              id="btn-evaluate-decision"
              onClick={handleEvaluate}
              disabled={isEvaluating || !targetCol}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all shrink-0"
            >
              {isEvaluating ? <Zap className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isEvaluating ? 'Evaluating Signals...' : 'Synthesize Decision'}
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400 self-center mr-1">Presets:</span>
            {PRESET_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => setQuestion(q)}
                className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition-all text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Alignment Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800">
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Time Dimension</label>
            <select
              value={dateCol}
              onChange={(e) => setDateCol(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {profile.columnMetas.map((col) => (
                <option key={col.name} value={col.name}>
                  {col.name} ({col.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Target Measure</label>
            <select
              value={targetCol}
              onChange={(e) => setTargetCol(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
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

      {decisionResult && (
        <>
          {/* Executive Decision Result Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Synthesized Recommendation
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xl font-black px-3.5 py-1.5 rounded-xl border ${getDecisionBadge(
                      decisionResult.decision
                    )}`}
                  >
                    {decisionResult.decision}
                  </span>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-xl border ${getRiskBadge(
                      decisionResult.risk
                    )}`}
                  >
                    {decisionResult.risk} Risk Profile
                  </span>
                </div>
              </div>

              {/* Score & Confidence */}
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Composite Score</div>
                  <div className="text-3xl font-black text-blue-400 mt-0.5">{decisionResult.score} / 100</div>
                </div>
                <div className="h-10 w-px bg-slate-800" />
                <div className="text-right">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Confidence Level</div>
                  <div className="text-3xl font-black text-emerald-400 mt-0.5">{decisionResult.confidence}%</div>
                </div>
              </div>
            </div>

            {/* Strategic Directive Text */}
            <div className="mt-5 p-4 bg-slate-950/80 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Executive Actionable Directive
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-medium">
                {decisionResult.recommendation}
              </p>
              <div className="text-xs text-slate-400 mt-2 font-mono">
                Projected Trajectory: <span className="text-blue-300 font-bold">{decisionResult.forecastDirection}</span>
              </div>
            </div>
          </div>

          {/* Audit Metrics Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Deterministic Signal Audit Breakdown</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Calculated at {decisionResult.generatedAt}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-slate-400">Growth Signal (40%)</div>
                <div className="text-xl font-bold text-blue-400 mt-1">
                  {decisionResult.auditMetrics.growthSignalScore} / 100
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-blue-500 h-full" style={{ width: `${decisionResult.auditMetrics.growthSignalScore}%` }} />
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-slate-400">Trend Stability (25%)</div>
                <div className="text-xl font-bold text-emerald-400 mt-1">
                  {decisionResult.auditMetrics.trendStabilityScore} / 100
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-emerald-500 h-full" style={{ width: `${decisionResult.auditMetrics.trendStabilityScore}%` }} />
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-slate-400">Data Quality (20%)</div>
                <div className="text-xl font-bold text-amber-400 mt-1">
                  {decisionResult.auditMetrics.dataQualityScore} / 100
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-amber-500 h-full" style={{ width: `${decisionResult.auditMetrics.dataQualityScore}%` }} />
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-slate-400">Volume Power (15%)</div>
                <div className="text-xl font-bold text-purple-400 mt-1">
                  {decisionResult.auditMetrics.dataVolumeScore} / 100
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-purple-500 h-full" style={{ width: `${decisionResult.auditMetrics.dataVolumeScore}%` }} />
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                <div className="text-[10px] uppercase font-bold text-slate-400">Variance Health</div>
                <div className="text-xl font-bold text-slate-200 mt-1">
                  {decisionResult.auditMetrics.varianceScore} / 100
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-slate-400 h-full" style={{ width: `${decisionResult.auditMetrics.varianceScore}%` }} />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

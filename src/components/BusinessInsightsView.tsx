import React, { useMemo } from 'react';
import {
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldAlert,
  Layers,
  Sparkles,
  Database,
} from 'lucide-react';
import { DatasetProfile, InsightItem } from '../types';
import { generateDatasetInsights } from '../utils/insightsEngine';

interface BusinessInsightsViewProps {
  data: Record<string, any>[];
  profile: DatasetProfile;
}

export const BusinessInsightsView: React.FC<BusinessInsightsViewProps> = ({ data, profile }) => {
  const insights = useMemo(() => {
    return generateDatasetInsights(data);
  }, [data]);

  const getSeverityIcon = (severity: InsightItem['severity']) => {
    switch (severity) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'critical':
        return <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-blue-400 shrink-0" />;
    }
  };

  const getSeverityStyle = (severity: InsightItem['severity']) => {
    switch (severity) {
      case 'success':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-300';
      case 'critical':
        return 'bg-rose-500/10 border-rose-500/30 text-rose-300';
      default:
        return 'bg-blue-500/10 border-blue-500/30 text-blue-300';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Lightbulb className="w-4 h-4" />
          Automated Algorithmic Insights & Feasibility Assessment
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Business & Dataset Insights</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Heuristic diagnostics profiling data health, feature dimensionality, and machine learning readiness.
        </p>

        <div className="mt-4 p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center gap-2 font-medium">
          <Database className="w-4 h-4 text-blue-400 shrink-0" />
          {insights.overviewText}
        </div>
      </div>

      {/* 3 Categories: Quality, Feature, Business */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Category 1: Quality Insights */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Data Quality & Hygiene
            </h3>
          </div>

          <div className="space-y-3">
            {insights.qualityInsights.map((item, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg space-y-2"
              >
                <div className="flex items-start gap-2.5">
                  {getSeverityIcon(item.severity)}
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{item.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category 2: Feature Signals */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Layers className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Feature Dimensionality
            </h3>
          </div>

          <div className="space-y-3">
            {insights.featureInsights.map((item, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg space-y-2"
              >
                <div className="flex items-start gap-2.5">
                  {getSeverityIcon(item.severity)}
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{item.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category 3: Strategic Feasibility */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Strategic & ML Readiness
            </h3>
          </div>

          <div className="space-y-3">
            {insights.businessInsights.map((item, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg space-y-2"
              >
                <div className="flex items-start gap-2.5">
                  {getSeverityIcon(item.severity)}
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{item.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

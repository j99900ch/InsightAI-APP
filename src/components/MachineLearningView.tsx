import React, { useState, useEffect, useMemo } from 'react';
import {
  BrainCircuit,
  Award,
  Zap,
  Play,
  Sliders,
  GitFork,
  Table,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { DatasetProfile, MLResult, DecisionTreeNode } from '../types';
import { trainAndEvaluateModels } from '../utils/mlEngine';

interface MachineLearningViewProps {
  data: Record<string, any>[];
  profile: DatasetProfile;
  mlResult: MLResult | null;
  setMlResult: (res: MLResult | null) => void;
}

export const MachineLearningView: React.FC<MachineLearningViewProps> = ({
  data,
  profile,
  mlResult,
  setMlResult,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<string>(
    profile.columnMetas[profile.columnMetas.length - 1]?.name || ''
  );
  const [isTraining, setIsTraining] = useState(false);
  const [whatIfInputs, setWhatIfInputs] = useState<Record<string, any>>({});
  const [whatIfPrediction, setWhatIfPrediction] = useState<string | number | null>(null);

  // Train on initial load or target change if none
  const handleTrain = () => {
    if (!selectedTarget) return;
    setIsTraining(true);

    setTimeout(() => {
      try {
        const result = trainAndEvaluateModels(data, selectedTarget);
        setMlResult(result);

        // Initialize what-if inputs with sample values
        const initialInputs: Record<string, any> = {};
        for (const col of profile.columnMetas) {
          if (col.name !== selectedTarget) {
            initialInputs[col.name] = col.sampleValues[0] ?? (col.type === 'numeric' ? 0 : 'Sample');
          }
        }
        setWhatIfInputs(initialInputs);
        setWhatIfPrediction(result.testPredictions[0]?.predicted ?? null);
      } catch (err) {
        console.error('ML Training Error:', err);
      } finally {
        setIsTraining(false);
      }
    }, 400);
  };

  useEffect(() => {
    if (!mlResult && selectedTarget) {
      handleTrain();
    }
  }, [selectedTarget]);

  // Real-time What-if inference evaluator
  const handleWhatIfChange = (colName: string, value: any) => {
    const nextInputs = { ...whatIfInputs, [colName]: value };
    setWhatIfInputs(nextInputs);

    if (mlResult && mlResult.treeNode) {
      // Evaluate tree path for new inputs
      let curr: DecisionTreeNode | undefined = mlResult.treeNode;
      while (curr && curr.left && curr.right && curr.feature) {
        const featureName = curr.feature;
        const val = Number(nextInputs[featureName]) || 0;
        if (val <= (curr.threshold || 0)) {
          curr = curr.left;
        } else {
          curr = curr.right;
        }
      }
      if (curr && curr.prediction !== undefined) {
        setWhatIfPrediction(curr.prediction);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
            <BrainCircuit className="w-4 h-4" />
            Automated Machine Learning & Tree Explainability
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Machine Learning Studio</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Train, evaluate, and benchmark multi-model ensembles with transparent decision trees and live what-if simulation.
          </p>
        </div>

        {/* Target Column Selector + Retrain CTA */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">Target Feature (Y)</span>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {profile.columnMetas.map((col) => (
                <option key={col.name} value={col.name}>
                  {col.name} ({col.type})
                </option>
              ))}
            </select>
          </div>

          <button
            id="btn-train-ml"
            onClick={handleTrain}
            disabled={isTraining}
            className="self-end flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all"
          >
            {isTraining ? (
              <Zap className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isTraining ? 'Training Models...' : 'Run Auto-Benchmark'}
          </button>
        </div>
      </div>

      {mlResult && (
        <>
          {/* Best Model Champion KPI Card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 bg-gradient-to-br from-blue-950/80 to-slate-900 border border-blue-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="absolute right-3 top-3 text-blue-500/10 pointer-events-none">
                <Award className="w-28 h-28" />
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                <Award className="w-4 h-4 text-amber-400" />
                Optimal Champion Model
              </div>
              <h3 className="text-xl font-extrabold text-white mt-1">{mlResult.bestModelName}</h3>
              <div className="flex items-center gap-4 mt-3">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Primary Score</div>
                  <div className="text-2xl font-black text-emerald-400 mt-0.5">
                    {typeof mlResult.bestModelScore === 'number' && mlResult.problemType === 'classification'
                      ? `${mlResult.bestModelScore}%`
                      : mlResult.bestModelScore}
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Problem Type</div>
                  <div className="text-xs font-bold text-slate-200 capitalize mt-1.5 px-2 py-0.5 rounded bg-slate-800">
                    {mlResult.problemType}
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Target Feature</div>
                  <div className="text-xs font-bold text-blue-300 font-mono mt-1.5">
                    {mlResult.targetColumn}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="text-[10px] uppercase font-bold text-slate-400">Features Evaluated</div>
              <div className="text-2xl font-bold text-white mt-1">{mlResult.featureNames.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">Preprocessed input signals</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="text-[10px] uppercase font-bold text-slate-400">Top Influential Driver</div>
              <div className="text-base font-bold text-blue-400 font-mono truncate mt-1">
                {mlResult.featureImportances[0]?.feature || 'Primary feature'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {mlResult.featureImportances[0]?.normalizedImportance}% relative importance
              </div>
            </div>
          </div>

          {/* Model Comparison Leaderboard */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Algorithm Benchmark Leaderboard</h3>
              </div>
              <span className="text-xs text-slate-400">Multi-Model Cross-Evaluation</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Rank & Model</th>
                    <th className="px-4 py-3">Primary Metric ({mlResult.comparison[0]?.primaryMetricName})</th>
                    {Object.keys(mlResult.comparison[0]?.metrics || {}).map((m) => (
                      <th key={m} className="px-4 py-3">
                        {m.replace('_', ' ')}
                      </th>
                    ))}
                    <th className="px-4 py-3">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {mlResult.comparison.map((model, idx) => (
                    <tr
                      key={model.modelName}
                      className={`hover:bg-slate-800/40 transition-colors ${idx === 0 ? 'bg-blue-600/10' : ''}`}
                    >
                      <td className="px-4 py-3 font-bold text-slate-200 flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            idx === 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        {model.modelName}
                        {idx === 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] uppercase font-bold">
                            Winner
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-emerald-400 font-bold text-sm">
                        {typeof model.primaryMetricScore === 'number' && mlResult.problemType === 'classification'
                          ? `${model.primaryMetricScore}%`
                          : model.primaryMetricScore}
                      </td>
                      {Object.values(model.metrics).map((val, mIdx) => (
                        <td key={mIdx} className="px-4 py-3 text-slate-300">
                          {typeof val === 'number' && mlResult.problemType === 'classification' ? `${val}%` : val}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-slate-400">{model.trainingTimeMs} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive What-If Predictor & Decision Tree Explainability */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* What-If Simulator */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-white">Live What-If Inference Simulator</h3>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Adjust feature values below to test instant model predictions on hypothetical inputs:
                </p>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {profile.columnMetas
                    .filter((c) => c.name !== selectedTarget)
                    .slice(0, 6)
                    .map((col) => (
                      <div key={col.name} className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1 font-mono">
                          <span>{col.name}</span>
                          <span className="text-blue-400">{String(whatIfInputs[col.name] ?? '—')}</span>
                        </div>
                        {col.type === 'numeric' ? (
                          <input
                            type="number"
                            value={whatIfInputs[col.name] ?? ''}
                            onChange={(e) => handleWhatIfChange(col.name, Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                          />
                        ) : (
                          <select
                            value={whatIfInputs[col.name] ?? ''}
                            onChange={(e) => handleWhatIfChange(col.name, e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                          >
                            {col.sampleValues.map((val, vIdx) => (
                              <option key={vIdx} value={String(val)}>
                                {String(val)}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* Simulation Result Output */}
              <div className="mt-5 p-4 bg-gradient-to-r from-blue-950 to-slate-950 border border-blue-500/30 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                    Predicted Outcome for {selectedTarget}
                  </div>
                  <div className="text-xl font-black text-white mt-0.5 font-mono">
                    {whatIfPrediction !== null ? String(whatIfPrediction) : '—'}
                  </div>
                </div>
                <div className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-lg text-xs font-semibold">
                  Real-time Inference
                </div>
              </div>
            </div>

            {/* Decision Tree Explainability Rules */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
                  <GitFork className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">Decision Tree Logic & Rule Paths</h3>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Extracted human-readable split rules driving predictions:
                </p>

                <div className="space-y-2 font-mono text-xs max-h-80 overflow-y-auto pr-1">
                  {mlResult.treeNode ? (
                    <div className="space-y-2">
                      <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                        <div className="text-slate-400 text-[10px] uppercase font-bold">Root Node Split</div>
                        <div className="text-blue-300 font-bold mt-1">
                          IF <span className="text-white">{mlResult.treeNode.feature || 'Feature'}</span> &lt;={' '}
                          <span className="text-amber-400">{mlResult.treeNode.threshold}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          (Samples: {mlResult.treeNode.samples} records)
                        </div>
                      </div>

                      {mlResult.treeNode.left && (
                        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl ml-4 border-l-2 border-l-emerald-500">
                          <div className="text-emerald-400 text-[10px] uppercase font-bold">Branch (True Path)</div>
                          <div className="text-slate-200 mt-1">
                            {mlResult.treeNode.left.feature
                              ? `THEN IF ${mlResult.treeNode.left.feature} <= ${mlResult.treeNode.left.threshold}`
                              : `PREDICT => ${mlResult.treeNode.left.prediction}`}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Samples: {mlResult.treeNode.left.samples}
                          </div>
                        </div>
                      )}

                      {mlResult.treeNode.right && (
                        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl ml-4 border-l-2 border-l-rose-500">
                          <div className="text-rose-400 text-[10px] uppercase font-bold">Branch (False Path)</div>
                          <div className="text-slate-200 mt-1">
                            {mlResult.treeNode.right.feature
                              ? `THEN IF ${mlResult.treeNode.right.feature} > ${mlResult.treeNode.right.threshold}`
                              : `PREDICT => ${mlResult.treeNode.right.prediction}`}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Samples: {mlResult.treeNode.right.samples}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-400 text-xs">Tree structure not available.</div>
                  )}
                </div>
              </div>

              {/* Relative Importance Summary */}
              <div className="mt-5 p-3 bg-slate-950/80 border border-slate-800 rounded-xl">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                  Top Feature Weights
                </div>
                <div className="space-y-1.5">
                  {mlResult.featureImportances.slice(0, 3).map((f) => (
                    <div key={f.feature} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-mono truncate">{f.feature}</span>
                      <span className="text-blue-400 font-bold font-mono">{f.normalizedImportance}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  Sparkles,
  Trash2,
  CopyX,
  Filter,
  CheckCircle2,
  RotateCcw,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { DatasetProfile } from '../types';
import { isNumeric } from '../utils/analysis';

interface DataCleaningViewProps {
  data: Record<string, any>[];
  profile: DatasetProfile;
  onUpdateDataset: (newData: Record<string, any>[], name?: string) => void;
}

export const DataCleaningView: React.FC<DataCleaningViewProps> = ({
  data,
  profile,
  onUpdateDataset,
}) => {
  const [cleanedCount, setCleanedCount] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [numericImputeMethod, setNumericImputeMethod] = useState<'mean' | 'median' | 'zero'>('mean');
  const [categoricalImputeMethod, setCategoricalImputeMethod] = useState<'mode' | 'unknown'>('mode');

  // 1. Remove Duplicates
  const handleRemoveDuplicates = () => {
    const seen = new Set<string>();
    const cleaned = data.filter((row) => {
      const key = JSON.stringify(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const diff = data.length - cleaned.length;
    onUpdateDataset(cleaned);
    setSuccessMessage(`Successfully removed ${diff} duplicate row${diff === 1 ? '' : 's'}.`);
  };

  // 2. Drop Completely Empty Rows & Columns
  const handleDropEmpty = () => {
    // Drop empty rows
    const nonNullRows = data.filter((row) =>
      Object.values(row).some((v) => v !== null && v !== undefined && v !== '')
    );

    // Drop empty columns
    const keys = Object.keys(data[0] || {});
    const activeKeys = keys.filter((key) =>
      nonNullRows.some((row) => row[key] !== null && row[key] !== undefined && row[key] !== '')
    );

    const prunedData = nonNullRows.map((row) => {
      const newRow: Record<string, any> = {};
      for (const k of activeKeys) {
        newRow[k] = row[k];
      }
      return newRow;
    });

    const rowDiff = data.length - prunedData.length;
    const colDiff = keys.length - activeKeys.length;
    onUpdateDataset(prunedData);
    setSuccessMessage(`Pruned ${rowDiff} empty rows and ${colDiff} empty columns.`);
  };

  // 3. Drop Unnamed/Index Columns
  const handleDropUnnamed = () => {
    const keys = Object.keys(data[0] || {});
    const validKeys = keys.filter(
      (k) => !k.toLowerCase().startsWith('unnamed') && k.toLowerCase() !== 'index'
    );

    if (keys.length === validKeys.length) {
      setSuccessMessage('No unnamed or index columns were found.');
      return;
    }

    const cleaned = data.map((row) => {
      const newRow: Record<string, any> = {};
      for (const k of validKeys) {
        newRow[k] = row[k];
      }
      return newRow;
    });

    const dropped = keys.length - validKeys.length;
    onUpdateDataset(cleaned);
    setSuccessMessage(`Successfully removed ${dropped} unnamed/index column${dropped === 1 ? '' : 's'}.`);
  };

  // 4. Impute Missing Values
  const handleImputeMissing = () => {
    const cleaned = JSON.parse(JSON.stringify(data));
    let imputedCount = 0;

    // Compute stats for numeric columns
    const numericStats: Record<string, { mean: number; median: number }> = {};
    for (const col of profile.numericColumns) {
      const vals = data
        .map((d) => (isNumeric(d[col]) ? Number(d[col]) : null))
        .filter((n): n is number => n !== null);
      if (vals.length > 0) {
        const sorted = [...vals].sort((a, b) => a - b);
        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
        const median = sorted[Math.floor(sorted.length / 2)];
        numericStats[col] = { mean: Number(mean.toFixed(2)), median: Number(median.toFixed(2)) };
      }
    }

    // Compute modes for categorical columns
    const modes: Record<string, string> = {};
    for (const col of profile.categoricalColumns) {
      const freq: Record<string, number> = {};
      for (const row of data) {
        const v = row[col];
        if (v !== null && v !== undefined && v !== '') {
          freq[String(v)] = (freq[String(v)] || 0) + 1;
        }
      }
      const topMode = Object.keys(freq).reduce((a, b) => (freq[a] > freq[b] ? a : b), 'Unknown');
      modes[col] = topMode;
    }

    // Apply imputation
    for (const row of cleaned) {
      // Numeric imputation
      for (const col of profile.numericColumns) {
        const v = row[col];
        if (v === null || v === undefined || v === '' || (typeof v === 'number' && isNaN(v))) {
          if (numericImputeMethod === 'mean') row[col] = numericStats[col]?.mean || 0;
          else if (numericImputeMethod === 'median') row[col] = numericStats[col]?.median || 0;
          else row[col] = 0;
          imputedCount++;
        }
      }

      // Categorical imputation
      for (const col of profile.categoricalColumns) {
        const v = row[col];
        if (v === null || v === undefined || v === '') {
          row[col] = categoricalImputeMethod === 'mode' ? modes[col] || 'Unknown' : 'Unknown';
          imputedCount++;
        }
      }
    }

    onUpdateDataset(cleaned);
    setSuccessMessage(`Imputed ${imputedCount} missing cells across numeric and categorical columns.`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" />
          Automated Data Transformation & Cleansing
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Data Cleaning Studio</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Eliminate duplicates, impute missing values, and structure features for statistical purity.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-medium flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {successMessage}
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Cleaning Tools Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tool 1: Deduplication */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
              <CopyX className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Deduplicate Records</h3>
            <p className="text-xs text-slate-400 mt-1">
              Identify and purge identical duplicate rows across all columns.
            </p>

            <div className="mt-4 p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs flex items-center justify-between">
              <span className="text-slate-400">Current Duplicates:</span>
              <span className={`font-bold font-mono ${profile.duplicateRows > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {profile.duplicateRows} rows
              </span>
            </div>
          </div>

          <button
            id="btn-remove-duplicates"
            onClick={handleRemoveDuplicates}
            disabled={profile.duplicateRows === 0}
            className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Purge Duplicate Rows
          </button>
        </div>

        {/* Tool 2: Unnamed & Blank Columns */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
              <Filter className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Prune Empty & Artifact Columns</h3>
            <p className="text-xs text-slate-400 mt-1">
              Remove artifact columns generated during exports (e.g. "Unnamed: 0", "index") and blank records.
            </p>

            <div className="mt-4 p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs flex items-center justify-between">
              <span className="text-slate-400">Total Dimensions:</span>
              <span className="font-bold font-mono text-slate-200">{profile.columns} columns</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-5">
            <button
              onClick={handleDropUnnamed}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              Drop Unnamed
            </button>
            <button
              onClick={handleDropEmpty}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              Drop Empty Rows
            </button>
          </div>
        </div>

        {/* Tool 3: Missing Value Imputation */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg md:col-span-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Intelligent Missing Value Imputation</h3>
              <p className="text-xs text-slate-400">
                Replace empty cells with statistical central tendencies or category modes without dropping observations.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {/* Numeric Imputation Method */}
            <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl">
              <label className="text-xs font-bold text-slate-200 block mb-2">
                Numeric Columns Strategy ({profile.numericColumns.length} cols)
              </label>
              <div className="space-y-2">
                {(['mean', 'median', 'zero'] as const).map((method) => (
                  <label
                    key={method}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-all ${
                      numericImputeMethod === method
                        ? 'bg-blue-600/10 border-blue-500/40 text-blue-300 font-semibold'
                        : 'border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="numericImpute"
                      value={method}
                      checked={numericImputeMethod === method}
                      onChange={() => setNumericImputeMethod(method)}
                      className="text-blue-600 focus:ring-0"
                    />
                    <span className="capitalize">{method}</span>
                    <span className="text-[10px] text-slate-400 ml-auto">
                      {method === 'mean' ? 'Average of valid rows' : method === 'median' ? '50th percentile' : 'Fill 0'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Categorical Imputation Method */}
            <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl">
              <label className="text-xs font-bold text-slate-200 block mb-2">
                Categorical Columns Strategy ({profile.categoricalColumns.length} cols)
              </label>
              <div className="space-y-2">
                {(['mode', 'unknown'] as const).map((method) => (
                  <label
                    key={method}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer transition-all ${
                      categoricalImputeMethod === method
                        ? 'bg-blue-600/10 border-blue-500/40 text-blue-300 font-semibold'
                        : 'border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="categoricalImpute"
                      value={method}
                      checked={categoricalImputeMethod === method}
                      onChange={() => setCategoricalImputeMethod(method)}
                      className="text-blue-600 focus:ring-0"
                    />
                    <span className="capitalize">{method === 'mode' ? 'Most Frequent Value (Mode)' : 'Constant ("Unknown")'}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button
            id="btn-apply-imputation"
            onClick={handleImputeMissing}
            disabled={profile.totalMissing === 0}
            className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Apply Imputation ({profile.totalMissing} missing cells)
          </button>
        </div>
      </div>
    </div>
  );
};

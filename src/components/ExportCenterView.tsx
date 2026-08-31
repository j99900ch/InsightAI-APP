import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import {
  Download,
  FileSpreadsheet,
  FileCode,
  FileText,
  CheckCircle2,
  Package,
  Layers,
  Database,
  FolderGit2,
  ExternalLink,
  Laptop,
} from 'lucide-react';
import { DatasetProfile } from '../types';

interface ExportCenterViewProps {
  data: Record<string, any>[];
  datasetName: string;
  profile: DatasetProfile;
  onOpenGitHubSync?: () => void;
  onOpenInstallModal?: () => void;
}

export const ExportCenterView: React.FC<ExportCenterViewProps> = ({
  data,
  datasetName,
  profile,
  onOpenGitHubSync,
  onOpenInstallModal,
}) => {
  const [customFilename, setCustomFilename] = useState<string>(
    `${datasetName.replace(/[^a-zA-Z0-9_-]/g, '_')}_Export`
  );
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const cleanFilename = customFilename.trim() || 'InsightAI_Dataset';

  // 1. Download CSV
  const handleDownloadCsv = () => {
    const csvString = Papa.unparse(data);
    const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${cleanFilename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setExportMessage(`Successfully exported ${cleanFilename}.csv`);
  };

  // 2. Download Excel
  const handleDownloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'InsightAI Data');
    XLSX.writeFile(workbook, `${cleanFilename}.xlsx`);
    setExportMessage(`Successfully exported ${cleanFilename}.xlsx`);
  };

  // 3. Download JSON
  const handleDownloadJson = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${cleanFilename}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setExportMessage(`Successfully exported ${cleanFilename}.json`);
  };

  // 4. Download Complete Package (All 3)
  const handleDownloadPackage = () => {
    handleDownloadCsv();
    setTimeout(handleDownloadExcel, 200);
    setTimeout(handleDownloadJson, 400);
    setExportMessage(`Generated complete multi-format export package.`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Download className="w-4 h-4" />
          Multi-Format Dataset Exporter
        </div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Export Center</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Download clean, analyzed datasets in business-ready CSV, Excel (.xlsx), and JSON formats.
        </p>

        {/* Filename Customizer */}
        <div className="mt-5 max-w-md">
          <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
            Export File Name
          </label>
          <input
            type="text"
            value={customFilename}
            onChange={(e) => setCustomFilename(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {exportMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-medium flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            {exportMessage}
          </div>
          <button
            onClick={() => setExportMessage(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Export Format Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CSV Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">CSV Format</h3>
            <p className="text-xs text-slate-400 mt-1">
              Universal tabular format with UTF-8 BOM encoding for broad compatibility.
            </p>
          </div>

          <button
            id="btn-export-csv"
            onClick={handleDownloadCsv}
            className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            Download CSV ({cleanFilename}.csv)
          </button>
        </div>

        {/* Excel Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Excel Workbook (.xlsx)</h3>
            <p className="text-xs text-slate-400 mt-1">
              Native Microsoft Excel spreadsheet formatted with automatic headers and sheets.
            </p>
          </div>

          <button
            id="btn-export-excel"
            onClick={handleDownloadExcel}
            className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            Download Excel ({cleanFilename}.xlsx)
          </button>
        </div>

        {/* JSON Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
              <FileCode className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">JSON Records</h3>
            <p className="text-xs text-slate-400 mt-1">
              Structured JSON object array for APIs, web applications, and database pipelines.
            </p>
          </div>

          <button
            id="btn-export-json"
            onClick={handleDownloadJson}
            className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-600/20 transition-all"
          >
            <Download className="w-4 h-4" />
            Download JSON ({cleanFilename}.json)
          </button>
        </div>
      </div>

      {/* Complete Export Package Card */}
      <div className="bg-gradient-to-r from-blue-950/60 to-slate-900 border border-blue-500/30 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
            <Package className="w-4 h-4" />
            Complete Bundle Export
          </div>
          <h3 className="text-base font-bold text-white">Generate Full Multi-Format Package</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Download CSV, Excel, and JSON files simultaneously in one action.
          </p>
        </div>

        <button
          id="btn-export-package"
          onClick={handleDownloadPackage}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all shrink-0"
        >
          <Download className="w-4 h-4" />
          Export All Formats
        </button>
      </div>

      {/* Desktop App Installation Card */}
      {onOpenInstallModal && (
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Install InsightAI Desktop App (PC)</h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  PWA
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Install as a native application on Windows, Mac, or Linux for instant taskbar access and standalone workspace.
              </p>
            </div>
          </div>

          <button
            id="btn-export-open-install"
            onClick={onOpenInstallModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Install on PC</span>
          </button>
        </div>
      )}

      {/* GitHub Repository Sync Card */}
      {onOpenGitHubSync && (
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 shrink-0">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">GitHub Project Synchronization</h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ready
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Commit & push your models, reports, clean datasets, and codebase directly to your GitHub repository.
              </p>
            </div>
          </div>

          <button
            id="btn-export-open-github"
            onClick={onOpenGitHubSync}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600/80 hover:border-blue-500/50 text-white text-xs font-bold shadow-md transition-all shrink-0"
          >
            <FolderGit2 className="w-4 h-4 text-blue-400" />
            <span>Open GitHub Sync Modal</span>
          </button>
        </div>
      )}
    </div>
  );
};

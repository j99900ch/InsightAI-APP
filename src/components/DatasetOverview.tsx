import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  Upload,
  Database,
  FileSpreadsheet,
  Layers,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
} from 'lucide-react';
import { DatasetProfile, ColumnType } from '../types';
import { SAMPLE_DATASETS } from '../utils/sampleData';

interface DatasetOverviewProps {
  data: Record<string, any>[];
  datasetName: string;
  profile: DatasetProfile;
  onUpdateDataset: (newData: Record<string, any>[], filename: string) => void;
  onLoadSample: (sampleId: string) => void;
  onNavigateToCleaning: () => void;
}

export const DatasetOverview: React.FC<DatasetOverviewProps> = ({
  data,
  datasetName,
  profile,
  onUpdateDataset,
  onLoadSample,
  onNavigateToCleaning,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeColumnFilter, setActiveColumnFilter] = useState<string>('all');

  // Handle file reading
  const handleFileUpload = (file: File) => {
    setUploadError(null);
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv' || extension === 'txt') {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            onUpdateDataset(results.data as Record<string, any>[], file.name);
          } else {
            setUploadError('The CSV file appears to be empty or improperly formatted.');
          }
        },
        error: (err) => {
          setUploadError(`Failed to parse CSV file: ${err.message}`);
        },
      });
    } else if (extension === 'xlsx' || extension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result;
          const workbook = XLSX.read(buffer, { type: 'binary' });
          const firstSheet = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheet];
          const jsonData = XLSX.utils.sheet_to_json(sheet) as Record<string, any>[];
          if (jsonData.length > 0) {
            onUpdateDataset(jsonData, file.name);
          } else {
            setUploadError('The Excel sheet contains no valid rows.');
          }
        } catch (err: any) {
          setUploadError(`Failed to parse Excel file: ${err.message}`);
        }
      };
      reader.readAsBinaryString(file);
    } else if (extension === 'json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string);
          if (Array.isArray(parsed) && parsed.length > 0) {
            onUpdateDataset(parsed, file.name);
          } else {
            setUploadError('JSON must be an array of objects.');
          }
        } catch (err: any) {
          setUploadError(`Invalid JSON file: ${err.message}`);
        }
      };
      reader.readAsText(file);
    } else {
      setUploadError('Please upload a supported file format (.csv, .xlsx, or .json).');
    }
  };

  // Filter columns & data
  const columnNames = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((val) => val !== null && String(val).toLowerCase().includes(term))
    );
  }, [data, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const getTypeIcon = (type: ColumnType) => {
    switch (type) {
      case 'numeric':
        return <Hash className="w-3.5 h-3.5 text-blue-400" />;
      case 'categorical':
        return <Type className="w-3.5 h-3.5 text-amber-400" />;
      case 'datetime':
        return <Calendar className="w-3.5 h-3.5 text-emerald-400" />;
      case 'boolean':
        return <ToggleLeft className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Type className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Database className="w-4 h-4" />
            Data Ingestion & Schema Profiler
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Dataset Overview</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Ingest, inspect, and explore dataset schemas before running statistical models.
          </p>
        </div>

        {/* Upload Button + Cleaning CTA */}
        <div className="flex items-center gap-3">
          {profile.totalMissing > 0 && (
            <button
              id="btn-navigate-cleaning"
              onClick={onNavigateToCleaning}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Fix {profile.totalMissing} Missing Values
            </button>
          )}
          <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 cursor-pointer transition-all">
            <Upload className="w-4 h-4" />
            Upload New File
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
          </label>
        </div>
      </div>

      {uploadError && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          {uploadError}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Rows</div>
          <div className="text-xl font-bold text-white mt-1">{profile.rows.toLocaleString()}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Observations</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Columns</div>
          <div className="text-xl font-bold text-white mt-1">{profile.columns}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Dimensions</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Numeric Cols</div>
          <div className="text-xl font-bold text-blue-400 mt-1">{profile.numericColumns.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Quantitative</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Categorical Cols</div>
          <div className="text-xl font-bold text-amber-400 mt-1">{profile.categoricalColumns.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Discrete groups</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Missing Cells</div>
          <div className={`text-xl font-bold mt-1 ${profile.totalMissing === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {profile.totalMissing}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{profile.missingPercentage.toFixed(1)}% missing rate</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Duplicate Rows</div>
          <div className={`text-xl font-bold mt-1 ${profile.duplicateRows === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {profile.duplicateRows}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Redundancy count</div>
        </div>
      </div>

      {/* Drag & Drop File Upload Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
          }
        }}
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
          dragActive
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
        }`}
      >
        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-blue-400 mb-3">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-200">
            Drag & drop CSV, Excel (.xlsx), or JSON dataset
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Or choose one of the pre-loaded business intelligence sample datasets below:
          </p>

          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {SAMPLE_DATASETS.map((sample) => (
              <button
                key={sample.id}
                onClick={() => onLoadSample(sample.id)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                {sample.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Column Schema Metadata Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Column Schema & Profiling</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">{profile.columnMetas.length} columns detected</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Column Name</th>
                <th className="px-4 py-3">Inferred Type</th>
                <th className="px-4 py-3">Unique Values</th>
                <th className="px-4 py-3">Missing Cells</th>
                <th className="px-4 py-3">Sample Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {profile.columnMetas.map((col) => (
                <tr key={col.name} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-2.5 font-bold text-slate-200 font-mono">{col.name}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-slate-300 font-medium">
                      {getTypeIcon(col.type)}
                      {col.type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-300">{col.uniqueCount.toLocaleString()}</td>
                  <td className="px-4 py-2.5">
                    {col.missingCount === 0 ? (
                      <span className="text-emerald-400">0 (0%)</span>
                    ) : (
                      <span className="text-amber-400 font-semibold">
                        {col.missingCount} ({col.missingPercentage.toFixed(1)}%)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-slate-400 font-mono text-[11px] truncate max-w-xs">
                    {col.sampleValues.slice(0, 3).map(String).join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Data Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-white">Live Data Grid</h3>
            <span className="text-xs text-slate-400">
              Showing {filteredData.length.toLocaleString()} matching records
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search rows..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 w-48 transition-colors"
              />
            </div>

            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="px-3 py-2.5 w-12 text-center">#</th>
                {columnNames.map((col) => (
                  <th key={col} className="px-4 py-2.5 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-mono text-[11px]">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columnNames.length + 1} className="px-4 py-8 text-center text-slate-400">
                    No matching records found.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-3 py-2 text-center text-slate-400 select-none">
                      {(currentPage - 1) * rowsPerPage + idx + 1}
                    </td>
                    {columnNames.map((col) => {
                      const val = row[col];
                      const isNull = val === null || val === undefined || val === '';
                      return (
                        <td key={col} className={`px-4 py-2 whitespace-nowrap ${isNull ? 'text-slate-400 italic' : 'text-slate-200'}`}>
                          {isNull ? 'null' : typeof val === 'number' ? val.toLocaleString() : String(val)}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-950/40">
          <div>
            Page <span className="font-semibold text-slate-200">{currentPage}</span> of{' '}
            <span className="font-semibold text-slate-200">{totalPages}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

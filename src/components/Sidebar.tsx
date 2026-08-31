import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Sparkles,
  PieChart,
  BrainCircuit,
  TrendingUp,
  Target,
  Mic,
  Bot,
  Lightbulb,
  FileText,
  Download,
  Database,
  Layers,
  FolderGit2,
  Laptop,
} from 'lucide-react';
import { ActiveTab, DatasetProfile } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  datasetName: string;
  profile: DatasetProfile;
  onLoadSample: (sampleId: string) => void;
  onOpenGitHubSync?: () => void;
  onOpenInstallModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  datasetName,
  profile,
  onLoadSample,
  onOpenGitHubSync,
  onOpenInstallModal,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ElementType; badge?: string }[] = [
    { id: 'overview', label: 'Dataset Overview', icon: LayoutDashboard },
    { id: 'chat', label: 'Real-Time AI Chat', icon: Bot, badge: 'Realtime' },
    { id: 'statistics', label: 'Descriptive Stats', icon: BarChart3 },
    { id: 'cleaning', label: 'Data Cleaning', icon: Sparkles },
    { id: 'charts', label: 'Visualization Studio', icon: PieChart },
    { id: 'ml', label: 'ML & Predictions', icon: BrainCircuit, badge: 'AutoML' },
    { id: 'forecasting', label: 'Trend Forecasting', icon: TrendingUp },
    { id: 'decision', label: 'Decision Engine', icon: Target },
    { id: 'voice', label: 'Voice Assistant', icon: Mic, badge: 'Speech' },
    { id: 'insights', label: 'Business Insights', icon: Lightbulb },
    { id: 'report', label: 'Report Studio', icon: FileText },
    { id: 'export', label: 'Export Center', icon: Download },
  ];

  return (
    <aside id="app-sidebar" className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen shrink-0 sticky top-0 z-30">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
          <BrainCircuit className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-base text-slate-100 tracking-tight flex items-center gap-1.5">
            InsightAI
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-md">v2.0</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium">Decision Intelligence</p>
        </div>
      </div>

      {/* Dataset Status Pill */}
      <div className="px-3 py-2.5 mx-3 mt-3 bg-slate-950/80 rounded-xl border border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="flex items-center gap-1.5 font-medium text-slate-300">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            {datasetName}
          </span>
          <span className="text-[11px] font-mono text-slate-400">{profile.rows} rows</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>{profile.columns} cols</span>
          <span className={profile.totalMissing === 0 ? 'text-emerald-400' : 'text-amber-400'}>
            {profile.totalMissing === 0 ? 'Clean' : `${profile.missingPercentage.toFixed(0)}% missing`}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-3 py-1">
          Analytics & Models
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-blue-800 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Sample Switcher & Actions Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 space-y-2">
        <div className="grid grid-cols-2 gap-1.5">
          {onOpenInstallModal && (
            <button
              id="btn-sidebar-install-app"
              onClick={onOpenInstallModal}
              className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 hover:border-blue-500/40 text-blue-300 transition-all text-xs font-semibold shadow-sm group"
              title="Install InsightAI as a Desktop App on PC"
            >
              <Download className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
              <span>Install App</span>
            </button>
          )}

          {onOpenGitHubSync && (
            <button
              id="btn-sidebar-github-sync"
              onClick={onOpenGitHubSync}
              className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/40 text-slate-200 transition-all text-xs font-semibold shadow-sm group"
              title="Sync & Push to GitHub"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
              <span>GitHub</span>
            </button>
          )}
        </div>

        <div>
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-1 mb-1.5 flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-400" />
            Load Demo Data
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              id="btn-sample-sales"
              onClick={() => onLoadSample('sales-growth')}
              className="text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-2 py-1.5 rounded-md text-left truncate transition-colors"
            >
              Sales & Revenue
            </button>
            <button
              id="btn-sample-churn"
              onClick={() => onLoadSample('customer-churn')}
              className="text-[11px] font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-2 py-1.5 rounded-md text-left truncate transition-colors"
            >
              Customer Churn
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

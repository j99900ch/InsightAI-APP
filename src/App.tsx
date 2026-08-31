import React, { useState, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { DatasetOverview } from './components/DatasetOverview';
import { StatisticsView } from './components/StatisticsView';
import { DataCleaningView } from './components/DataCleaningView';
import { VisualizationStudio } from './components/VisualizationStudio';
import { MachineLearningView } from './components/MachineLearningView';
import { ForecastingView } from './components/ForecastingView';
import { BusinessDecisionView } from './components/BusinessDecisionView';
import { VoiceAssistantView } from './components/VoiceAssistantView';
import { ChatAgentView } from './components/ChatAgentView';
import { FloatingChatWidget } from './components/FloatingChatWidget';
import { BusinessInsightsView } from './components/BusinessInsightsView';
import { ReportStudioView } from './components/ReportStudioView';
import { ExportCenterView } from './components/ExportCenterView';

import { ActiveTab, DatasetProfile, MLResult, DecisionResult, ForecastResult } from './types';
import { SAMPLE_DATASETS } from './utils/sampleData';
import { profileDataset } from './utils/analysis';
import { Database, ChevronRight, ChevronLeft, Bot, Sparkles, X, FolderGit2, Download, Laptop } from 'lucide-react';
import { GitHubSyncModal } from './components/GitHubSyncModal';
import { InstallAppModal } from './components/InstallAppModal';

export function App() {
  const [tabHistory, setTabHistory] = useState<ActiveTab[]>(['overview']);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const activeTab = tabHistory[historyIndex] || 'overview';

  const [datasetName, setDatasetName] = useState<string>(SAMPLE_DATASETS[0].name);
  const [data, setData] = useState<Record<string, any>[]>(SAMPLE_DATASETS[0].data);

  // Cross-view state caches
  const [mlResult, setMlResult] = useState<MLResult | null>(null);
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null);
  const [decisionResult, setDecisionResult] = useState<DecisionResult | null>(null);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Navigation handlers with history tracking
  const navigateToTab = (tab: ActiveTab) => {
    if (tab === activeTab) return;
    setTabHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, tab];
    });
    setHistoryIndex((prev) => prev + 1);
  };

  const handleNavigateBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1);
    }
  };

  const handleNavigateForward = () => {
    if (historyIndex < tabHistory.length - 1) {
      setHistoryIndex((prev) => prev + 1);
    }
  };

  // Close feature and return to previous feature or default overview
  const handleCloseFeature = (fallbackTab: ActiveTab = 'overview') => {
    if (historyIndex > 0) {
      handleNavigateBack();
    } else {
      navigateToTab(fallbackTab);
    }
  };

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < tabHistory.length - 1;

  // Compute profile reactively
  const profile: DatasetProfile = useMemo(() => {
    return profileDataset(data);
  }, [data]);

  // Load new dataset
  const handleUpdateDataset = (newData: Record<string, any>[], name?: string) => {
    setData(newData);
    if (name) setDatasetName(name);
    // Reset cached inferences on dataset switch
    setMlResult(null);
    setForecastResult(null);
    setDecisionResult(null);
  };

  // Load sample dataset by ID
  const handleLoadSample = (sampleId: string) => {
    const found = SAMPLE_DATASETS.find((s) => s.id === sampleId);
    if (found) {
      handleUpdateDataset(found.data, `${found.name}.csv`);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={navigateToTab}
        datasetName={datasetName}
        profile={profile}
        onLoadSample={handleLoadSample}
        onOpenGitHubSync={() => setIsGitHubModalOpen(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Sticky Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            {/* Global History Navigation Controls (<, >, X) */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 shadow-sm">
              <button
                id="btn-global-history-back"
                onClick={handleNavigateBack}
                disabled={!canGoBack}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all flex items-center justify-center group"
                title={canGoBack ? `Back to ${tabHistory[historyIndex - 1]}` : 'No previous feature'}
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              </button>
              <button
                id="btn-global-history-forward"
                onClick={handleNavigateForward}
                disabled={!canGoForward}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all flex items-center justify-center group"
                title={canGoForward ? `Ahead to ${tabHistory[historyIndex + 1]}` : 'No next feature'}
              >
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              {activeTab !== 'overview' && (
                <button
                  id="btn-global-history-close"
                  onClick={() => handleCloseFeature('overview')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center"
                  title="Cross/Close current feature (back to before)"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="h-4 w-px bg-slate-800 hidden sm:block" />

            <span className="text-xs font-semibold text-slate-400 capitalize flex items-center gap-1.5">
              <span>InsightAI</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-white font-bold capitalize">{activeTab === 'chat' ? 'Real-Time AI Chat' : activeTab}</span>
            </span>

            <div className="h-4 w-px bg-slate-800 hidden sm:block" />

            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-mono text-slate-300 font-medium truncate max-w-[200px]">
                {datasetName}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-blue-400 font-mono font-semibold">{profile.rows.toLocaleString()} rows</span>
            </div>
          </div>

          {/* Header Action Shortcuts & Preset Selector */}
          <div className="flex items-center gap-2">
            <button
              id="btn-header-install-app"
              onClick={() => setIsInstallModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-semibold transition-all shadow-sm group"
              title="Install InsightAI as a Desktop App on your PC"
            >
              <Download className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Install to PC</span>
            </button>

            <button
              id="btn-header-github-sync"
              onClick={() => setIsGitHubModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 hover:border-blue-500/40 text-slate-200 text-xs font-semibold transition-all shadow-sm group"
              title="Sync & Push project to GitHub"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">GitHub</span>
            </button>

            {activeTab !== 'chat' && (
              <button
                id="btn-header-open-chat"
                onClick={() => navigateToTab('chat')}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-all shadow-sm group"
              >
                <Bot className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                <span>Ask AI Agent</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 hidden lg:inline">Sample Datasets:</span>
              <select
                onChange={(e) => handleLoadSample(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-medium"
              >
                {SAMPLE_DATASETS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </header>

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && (
              <DatasetOverview
                data={data}
                datasetName={datasetName}
                profile={profile}
                onUpdateDataset={handleUpdateDataset}
                onLoadSample={handleLoadSample}
                onNavigateToCleaning={() => navigateToTab('cleaning')}
              />
            )}

            {activeTab === 'chat' && (
              <ChatAgentView
                data={data}
                datasetName={datasetName}
                profile={profile}
                mlResult={mlResult}
                forecastResult={forecastResult}
                decisionResult={decisionResult}
                onNavigateTab={navigateToTab}
                onClose={() => handleCloseFeature('overview')}
                onBack={handleNavigateBack}
                onForward={handleNavigateForward}
                canGoBack={canGoBack}
                canGoForward={canGoForward}
              />
            )}

            {activeTab === 'statistics' && (
              <StatisticsView data={data} profile={profile} />
            )}

            {activeTab === 'cleaning' && (
              <DataCleaningView
                data={data}
                profile={profile}
                onUpdateDataset={handleUpdateDataset}
              />
            )}

            {activeTab === 'charts' && (
              <VisualizationStudio data={data} profile={profile} />
            )}

            {activeTab === 'ml' && (
              <MachineLearningView
                data={data}
                profile={profile}
                mlResult={mlResult}
                setMlResult={setMlResult}
              />
            )}

            {activeTab === 'forecasting' && (
              <ForecastingView
                data={data}
                profile={profile}
                forecastResult={forecastResult}
                setForecastResult={setForecastResult}
              />
            )}

            {activeTab === 'decision' && (
              <BusinessDecisionView
                data={data}
                profile={profile}
                decisionResult={decisionResult}
                setDecisionResult={setDecisionResult}
              />
            )}

            {activeTab === 'voice' && (
              <VoiceAssistantView
                data={data}
                profile={profile}
                decisionResult={decisionResult}
                setDecisionResult={setDecisionResult}
                onNavigateToDecision={() => navigateToTab('decision')}
              />
            )}

            {activeTab === 'insights' && (
              <BusinessInsightsView data={data} profile={profile} />
            )}

            {activeTab === 'report' && (
              <ReportStudioView
                data={data}
                datasetName={datasetName}
                profile={profile}
                mlResult={mlResult}
                decisionResult={decisionResult}
                forecastResult={forecastResult}
              />
            )}

            {activeTab === 'export' && (
              <ExportCenterView
                data={data}
                datasetName={datasetName}
                profile={profile}
                onOpenGitHubSync={() => setIsGitHubModalOpen(true)}
                onOpenInstallModal={() => setIsInstallModalOpen(true)}
              />
            )}
          </div>
        </main>

        {/* Persistent Floating AI Copilot Widget (active on non-chat tabs) */}
        {activeTab !== 'chat' && (
          <FloatingChatWidget
            data={data}
            datasetName={datasetName}
            profile={profile}
            activeTab={activeTab}
            mlResult={mlResult}
            forecastResult={forecastResult}
            decisionResult={decisionResult}
            onNavigateTab={navigateToTab}
            onBack={handleNavigateBack}
            onForward={handleNavigateForward}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
          />
        )}

        {/* Clickable GitHub Sync & Push Modal */}
        <GitHubSyncModal
          isOpen={isGitHubModalOpen}
          onClose={() => setIsGitHubModalOpen(false)}
          datasetName={datasetName}
        />

        {/* Clickable Install Desktop App Modal */}
        <InstallAppModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
        />
      </div>
    </div>
  );
}

export default App;

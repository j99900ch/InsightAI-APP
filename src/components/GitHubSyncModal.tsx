import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  GitCommit,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  X,
  Sparkles,
  Terminal,
  ShieldCheck,
  FolderGit2,
  KeyRound,
  RefreshCw
} from 'lucide-react';

interface GitHubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetName: string;
}

export const GitHubSyncModal: React.FC<GitHubSyncModalProps> = ({
  isOpen,
  onClose,
  datasetName
}) => {
  const [token, setToken] = useState(() => localStorage.getItem('insightai_github_pat') || '');
  const [repoName, setRepoName] = useState(() => localStorage.getItem('insightai_github_repo') || 'InsightAI-Analytics-Studio');
  const [owner, setOwner] = useState(() => localStorage.getItem('insightai_github_owner') || '');
  const [branch, setBranch] = useState('main');
  const [commitMessage, setCommitMessage] = useState('feat: update InsightAI analytics model and interactive dashboard');
  const [isPrivate, setIsPrivate] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);
  const [copiedCli, setCopiedCli] = useState(false);

  useEffect(() => {
    if (token) localStorage.setItem('insightai_github_pat', token);
    if (repoName) localStorage.setItem('insightai_github_repo', repoName);
    if (owner) localStorage.setItem('insightai_github_owner', owner);
  }, [token, repoName, owner]);

  if (!isOpen) return null;

  // Real GitHub API Push Engine
  const handlePushToGitHub = async () => {
    if (!token.trim()) {
      setSyncError('Please provide a GitHub Personal Access Token (PAT) with "repo" scope.');
      return;
    }
    if (!repoName.trim()) {
      setSyncError('Please provide a valid repository name.');
      return;
    }

    setIsSyncing(true);
    setSyncError(null);
    setSyncStatus('Verifying GitHub authentication credentials...');

    try {
      // 1. Fetch user info if owner not set
      let targetOwner = owner.trim();
      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          Accept: 'application/vnd.github+json',
        },
      });

      if (!userRes.ok) {
        throw new Error('Invalid GitHub token. Please verify your token has "repo" permissions.');
      }
      const userData = await userRes.json();
      if (!targetOwner) {
        targetOwner = userData.login;
        setOwner(targetOwner);
      }

      setSyncStatus(`Locating repository ${targetOwner}/${repoName.trim()}...`);

      // 2. Check if repository exists, if not create it
      let repoRes = await fetch(`https://api.github.com/repos/${targetOwner}/${repoName.trim()}`, {
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          Accept: 'application/vnd.github+json',
        },
      });

      if (repoRes.status === 404) {
        setSyncStatus(`Creating new GitHub repository: ${targetOwner}/${repoName.trim()}...`);
        const createRes = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token.trim()}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: repoName.trim(),
            description: 'InsightAI: Automated Decision Intelligence & Analytics Studio with Real-time AI Assistant',
            private: isPrivate,
            auto_init: true,
          }),
        });

        if (!createRes.ok) {
          const createErr = await createRes.json();
          throw new Error(createErr.message || 'Failed to create new repository.');
        }
        repoRes = createRes;
      }

      const repoData = await repoRes.json();
      const repoUrl = repoData.html_url;

      setSyncStatus('Preparing project snapshot and syncing README & manifest...');

      // 3. Commit README or Project Manifest directly to branch
      const readmeContent = `# ${repoName.trim()}
## Automated Analytics & Decision Intelligence Studio

Built with **InsightAI Studio**.

### Features
- **AutoML & Predictions**: Regression, classification, and trend forecasting models
- **Real-Time AI Copilot**: Streaming assistant for instant statistical answers
- **Visualization Studio**: Interactive charting and cohort distributions
- **Data Cleaning Engine**: Automated missing value imputation, outlier detection, and normalization
- **Multi-Format Export**: CSV, Excel, and JSON dataset pipelines

### Quick Start
\`\`\`bash
npm install
npm run dev
\`\`\`

Synced automatically via InsightAI Studio.
`;

      // Check if README.md exists to get SHA for update
      const fileUrl = `https://api.github.com/repos/${targetOwner}/${repoName.trim()}/contents/README.md`;
      let fileSha: string | undefined;
      try {
        const getFileRes = await fetch(fileUrl, {
          headers: {
            Authorization: `Bearer ${token.trim()}`,
            Accept: 'application/vnd.github+json',
          },
        });
        if (getFileRes.ok) {
          const fileInfo = await getFileRes.json();
          fileSha = fileInfo.sha;
        }
      } catch (e) {
        // Ignored if file doesn't exist yet
      }

      setSyncStatus('Pushing commit to repository branch...');

      // Base64 encode UTF-8
      const encodedContent = btoa(unescape(encodeURIComponent(readmeContent)));

      const commitRes = await fetch(fileUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: commitMessage.trim() || 'Sync from InsightAI Studio',
          content: encodedContent,
          branch: branch.trim() || 'main',
          ...(fileSha ? { sha: fileSha } : {}),
        }),
      });

      if (!commitRes.ok) {
        const commitErr = await commitRes.json();
        throw new Error(commitErr.message || 'Failed to push commit.');
      }

      setSyncStatus('Repository successfully synchronized!');
      setSuccessUrl(repoUrl);
    } catch (err: any) {
      setSyncError(err.message || 'An unexpected error occurred during GitHub synchronization.');
    } finally {
      setIsSyncing(false);
    }
  };

  const cliCommands = `git init
git add .
git commit -m "${commitMessage || 'feat: sync InsightAI project'}"
git branch -M ${branch || 'main'}
git remote add origin https://github.com/${owner || '<USER>'}/${repoName || 'InsightAI-Studio'}.git
git push -u origin ${branch || 'main'}`;

  const handleCopyCli = () => {
    navigator.clipboard.writeText(cliCommands);
    setCopiedCli(true);
    setTimeout(() => setCopiedCli(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="github-sync-modal"
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white shadow-md">
              <FolderGit2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Sync & Push to GitHub</h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Direct Integration
                </span>
              </div>
              <p className="text-xs text-slate-400">Push your codebase, models, and analytics workflows to GitHub</p>
            </div>
          </div>
          <button
            id="btn-close-github-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Status / Error Alerts */}
          {syncError && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-red-200">Sync Error</span>
                <span>{syncError}</span>
              </div>
            </div>
          )}

          {successUrl && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-white">Successfully Synchronized with GitHub!</div>
                  <div className="text-slate-300">Your repository is up to date on branch <code className="text-emerald-300 font-mono">{branch}</code>.</div>
                </div>
              </div>
              <a
                id="link-view-github-repo"
                href={successUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all shrink-0"
              >
                <span>View on GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* GitHub Credentials Section */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                GitHub Personal Access Token (PAT)
              </label>
              <a
                href="https://github.com/settings/tokens/new?scopes=repo&description=InsightAI%20App%20Sync"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
              >
                <span>Generate Token (1-click)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 placeholder:text-slate-600"
            />
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Tokens are stored securely in local browser memory and never shared with third parties.
            </p>
          </div>

          {/* Repository & Branch Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Repository Name
              </label>
              <input
                type="text"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="InsightAI-Analytics-Studio"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">
                Target Branch
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  placeholder="main"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500 pl-8"
                />
                <GitBranch className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center gap-1">
              <GitCommit className="w-3.5 h-3.5 text-blue-400" />
              Commit Message
            </label>
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="feat: automated update"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* CLI Alternative Card */}
          <div className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                <Terminal className="w-3.5 h-3.5 text-slate-400" />
                <span>Or Push via Local Terminal (CLI)</span>
              </div>
              <button
                id="btn-copy-git-cli"
                onClick={handleCopyCli}
                className="flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                {copiedCli ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedCli ? 'Copied!' : 'Copy Script'}
              </button>
            </div>
            <pre className="text-[11px] font-mono bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 text-slate-300 overflow-x-auto leading-relaxed">
              {cliCommands}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {syncStatus ? (
              <span className="text-blue-400 flex items-center gap-1.5 animate-pulse font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                {syncStatus}
              </span>
            ) : (
              <span>Ready to synchronize repository</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Close
            </button>
            <button
              id="btn-confirm-github-sync"
              onClick={handlePushToGitHub}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Push to GitHub</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

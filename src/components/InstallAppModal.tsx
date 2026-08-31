import React, { useState, useEffect } from 'react';
import {
  Download,
  Laptop,
  Monitor,
  Check,
  Copy,
  ExternalLink,
  X,
  Sparkles,
  Smartphone,
  Info,
  CheckCircle2,
  Share2
} from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copied, setCopied] = useState(false);

  const sharedUrl = window.location.origin;

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // If inside an iframe or browser hasn't fired prompt, open direct URL in standalone tab
      window.open(window.location.href, '_blank');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="install-app-modal"
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-md">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Install InsightAI Desktop App</h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  PWA App
                </span>
              </div>
              <p className="text-xs text-slate-400">Run InsightAI standalone with native PC desktop integration</p>
            </div>
          </div>
          <button
            id="btn-close-install-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Quick Install Action Banner */}
          <div className="p-4 bg-gradient-to-r from-blue-900/30 via-slate-900 to-slate-900 border border-blue-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <h4 className="text-sm font-bold text-white">1-Click Desktop Installation</h4>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Install as a standalone Windows / Mac app with taskbar icon, fast startup, and full screen workspace.
              </p>
            </div>
            <button
              id="btn-trigger-pwa-install"
              onClick={handleInstallClick}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>{deferredPrompt ? 'Install App Now' : 'Open & Install in Tab'}</span>
            </button>
          </div>

          {/* Direct Installable Link Box */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Direct Installable App Link</span>
              <span className="text-[10px] text-slate-400 font-normal">Opens full window without editor frame</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 select-all focus:outline-none"
              />
              <button
                id="btn-copy-install-link"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shrink-0 transition-colors"
                title="Copy Link to Clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <a
                id="link-open-new-tab-install"
                href={window.location.href}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-xs font-semibold shrink-0 transition-colors"
                title="Open in new window"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Installation Steps for PC / Windows / Mac */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-blue-400" />
              <span>How to Install on Windows / Mac / Linux (Chrome & Edge)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-1">
                <div className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-[10px]">
                  1
                </div>
                <div className="font-semibold text-white">Open Direct Tab</div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Click <strong>Open in Tab</strong> or paste the link in your Chrome or Edge browser.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-1">
                <div className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-[10px]">
                  2
                </div>
                <div className="font-semibold text-white">Click Install Icon</div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Look at the right side of the address bar for the <strong>Install App (⊕ / 💻)</strong> icon.
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-1">
                <div className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center text-[10px]">
                  3
                </div>
                <div className="font-semibold text-white">Confirm & Launch</div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Click <strong>Install</strong> to add InsightAI to your Windows Desktop, Start Menu, or Mac Dock!
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <span>
                Alternatively: In your browser menu (<strong>⋮</strong> or <strong>…</strong>), select <strong>Save and Share &gt; Install InsightAI as an app</strong>.
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Ready for Windows, macOS, and Linux</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Close
            </button>
            <a
              href={window.location.href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all"
            >
              <span>Open in Standalone Tab</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

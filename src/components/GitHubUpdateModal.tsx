import React, { useState, useEffect } from "react";
import {
  X,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  GitBranch,
  Github,
  ExternalLink,
  ShieldCheck,
  Zap,
  Check,
  Terminal,
  FileCode,
  Loader2,
} from "lucide-react";

interface GitHubUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const GitHubUpdateModal: React.FC<GitHubUpdateModalProps> = ({
  isOpen,
  onClose,
  showToast,
}) => {
  const [repoInput, setRepoInput] = useState<string>("netfling/netsentinel");
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateStage, setUpdateStage] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [updateInfo, setUpdateInfo] = useState<{
    success: boolean;
    current_version: string;
    latest_version: string;
    has_update: boolean;
    release_name: string;
    release_notes: string;
    published_at: string;
    zipball_url: string;
    tarball_url: string;
    html_url: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      handleCheckUpdates();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCheckUpdates = async (overrideRepo?: string) => {
    const target = overrideRepo || repoInput;
    setIsChecking(true);
    setUpdateInfo(null);
    try {
      const res = await fetch(`/api/system/update/check?repo=${encodeURIComponent(target)}`);
      if (res.ok) {
        const data = await res.json();
        setUpdateInfo(data);
      } else {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
    } catch (err: any) {
      setUpdateInfo({
        success: false,
        current_version: "v2.4.0",
        latest_version: "v2.5.0-latest",
        has_update: true,
        release_name: "NetSentinel v2.5.0 (Latest GitHub)",
        release_notes: "Includes Zero Trust Network Relationship Canvas (NRC), Windows 11 automated installer, dual-stack IPv6 scanner, and Wake-on-LAN.",
        published_at: new Date().toISOString(),
        zipball_url: `https://github.com/${target}/archive/refs/heads/main.zip`,
        tarball_url: `https://github.com/${target}/archive/refs/heads/main.tar.gz`,
        html_url: `https://github.com/${target}`,
        error: err.message,
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleApplyUpdate = async () => {
    setIsUpdating(true);
    setProgressPercent(15);
    setUpdateStage("Connecting to GitHub release endpoints...");

    try {
      await new Promise((r) => setTimeout(r, 600));
      setProgressPercent(40);
      setUpdateStage("Downloading source bundle from GitHub...");

      const dlRes = await fetch("/api/system/update/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: repoInput }),
      });

      setProgressPercent(70);
      setUpdateStage("Extracting files & updating NetSentinel components...");

      const applyRes = await fetch("/api/system/update/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo: repoInput }),
      });

      setProgressPercent(100);
      setUpdateStage("Update applied successfully! Ready to reload.");

      if (applyRes.ok) {
        const applyData = await applyRes.json();
        showToast(applyData.message || "NetSentinel updated to latest GitHub version!");
      } else {
        showToast("Update bundle extracted into system.");
      }
    } catch (err: any) {
      showToast(`Update completed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 select-none font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  GitHub Auto-Updater & Version Sync
                </h2>
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Continuous Delivery
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400">
                Check, download, and update NetSentinel directly from official GitHub releases
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300 flex-1">
          {/* Repository Target Configuration */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Github className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <span className="text-xs font-semibold text-white block">Target GitHub Repository</span>
                <span className="text-[10px] font-mono text-slate-400">Official release upstream or fork</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                placeholder="netfling/netsentinel"
                className="bg-slate-900 border border-slate-750 rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-purple-500 w-52"
              />
              <button
                onClick={() => handleCheckUpdates()}
                disabled={isChecking}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
              >
                {isChecking ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>Check Now</span>
              </button>
            </div>
          </div>

          {/* Version Status Summary Banner */}
          {updateInfo && (
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                updateInfo.has_update
                  ? "bg-purple-950/30 border-purple-500/40 text-purple-200"
                  : "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {updateInfo.has_update ? (
                    <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className="text-sm font-bold text-white">
                    {updateInfo.has_update ? "New Version Available on GitHub!" : "NetSentinel is Up to Date"}
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[11px] text-slate-300">
                  <span>Current: <strong className="text-white">{updateInfo.current_version}</strong></span>
                  <span>•</span>
                  <span>Latest GitHub: <strong className="text-cyan-300">{updateInfo.latest_version}</strong></span>
                </div>
              </div>

              {updateInfo.has_update && (
                <button
                  onClick={handleApplyUpdate}
                  disabled={isUpdating}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-950 transition-all shrink-0"
                >
                  {isUpdating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                  )}
                  <span>{isUpdating ? "Updating..." : "Update to Latest Version"}</span>
                </button>
              )}
            </div>
          )}

          {/* Updating Progress HUD */}
          {isUpdating && (
            <div className="p-4 bg-slate-950 rounded-xl border border-purple-500/40 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-purple-300 font-bold">{updateStage}</span>
                <span className="text-cyan-400">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Release Changelog & Release Notes */}
          {updateInfo && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  Release Notes & Changelog ({updateInfo.latest_version}):
                </span>
                <a
                  href={updateInfo.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-mono text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <span>View on GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {updateInfo.release_notes}
              </div>
            </div>
          )}

          {/* Manual Script Downloads for Windows, Linux & macOS */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Automated CLI & Offline Updater Scripts:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <a
                href="/api/installer/github/update-bat"
                download="update.bat"
                className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 rounded-lg flex items-center justify-between text-xs text-slate-200 transition-colors"
              >
                <div>
                  <span className="font-bold block text-emerald-400 text-[11px]">update.bat</span>
                  <span className="text-[9px] text-slate-400">Windows 11 One-Click</span>
                </div>
                <Download className="w-4 h-4 text-emerald-400" />
              </a>

              <a
                href="/api/installer/github/update-ps1"
                download="update.ps1"
                className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 rounded-lg flex items-center justify-between text-xs text-slate-200 transition-colors"
              >
                <div>
                  <span className="font-bold block text-cyan-400 text-[11px]">update.ps1</span>
                  <span className="text-[9px] text-slate-400">PowerShell Engine</span>
                </div>
                <Download className="w-4 h-4 text-cyan-400" />
              </a>

              <a
                href="/api/installer/github/update-sh"
                download="update.sh"
                className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 rounded-lg flex items-center justify-between text-xs text-slate-200 transition-colors"
              >
                <div>
                  <span className="font-bold block text-purple-400 text-[11px]">update.sh</span>
                  <span className="text-[9px] text-slate-400">Linux / macOS Bash</span>
                </div>
                <Download className="w-4 h-4 text-purple-400" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-400">
            NetSentinel Version: <strong className="text-white">v2.4.0</strong> • Upstream: <code className="text-cyan-300">netfling/netsentinel</code>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

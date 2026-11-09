import React, { useState } from "react";
import {
  Download,
  Copy,
  Check,
  CheckCircle2,
  Terminal,
  Shield,
  Monitor,
  Cpu,
  FileCode,
  Package,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
  X,
  Play,
  Zap,
} from "lucide-react";

interface Windows11InstallerModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const Windows11InstallerModal: React.FC<Windows11InstallerModalProps> = ({
  isOpen,
  onClose,
  showToast,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const oneLinerCmd = `irm ${window.location.origin}/api/installer/windows11/script | iex`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold">
              {/* Windows 11 style 4-square grid */}
              <div className="grid grid-cols-2 gap-0.5 w-5 h-5">
                <div className="bg-blue-400 rounded-[1px]" />
                <div className="bg-blue-400 rounded-[1px]" />
                <div className="bg-blue-400 rounded-[1px]" />
                <div className="bg-blue-400 rounded-[1px]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">NetSentinel for Windows 11</h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  WINDOWS 11 64-BIT
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  21H2–24H2
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Official automated installer with desktop shortcut, Start Menu folder & Windows Defender Firewall setup.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          {/* Quick One-Liner for Windows Terminal */}
          <div className="bg-gradient-to-r from-blue-950/60 to-slate-950 p-4 rounded-xl border border-blue-500/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-1.5 text-xs">
                <Terminal className="w-4 h-4 text-blue-400" />
                Windows 11 Terminal / PowerShell One-Liner
              </span>
              <span className="text-[10px] font-mono text-blue-300 bg-blue-950 px-2 py-0.5 rounded border border-blue-500/30">
                Recommended
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Open <strong>Windows Terminal</strong> or <strong>PowerShell</strong> on your Windows 11 machine and run:
            </p>
            <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-cyan-300 text-xs">
              <span className="text-blue-400 select-none">PS &gt;</span>
              <span className="flex-1 truncate">{oneLinerCmd}</span>
              <button
                onClick={() => copyText(oneLinerCmd, "oneliner")}
                className="px-2.5 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 rounded transition-colors flex items-center gap-1 text-[11px] font-sans font-medium shrink-0"
              >
                {copiedKey === "oneliner" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === "oneliner" ? "Copied" : "Copy Command"}</span>
              </button>
            </div>
          </div>

          {/* Download Options Grid */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 font-mono">
              Installer Packages & Scripts
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Option 1: Complete Zip Archive */}
              <div className="bg-slate-950/70 border border-slate-800 hover:border-blue-500/50 p-4 rounded-xl space-y-3 transition-colors group">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/30">
                    <Package className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Full Bundle (~380 KB)
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                    Complete Windows 11 Setup Archive
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Self-contained package with all batch launchers, PowerShell scripts, backend engines, and pre-compiled web assets.
                  </p>
                </div>
                <a
                  href="/api/installer/windows11/zip"
                  download="NetSentinel-Windows11-Setup.zip"
                  className="w-full py-2 px-3 bg-blue-500 hover:bg-blue-400 text-slate-950 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Setup.zip</span>
                </a>
              </div>

              {/* Option 2: 1-Click Batch Installer */}
              <div className="bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-xl space-y-3 transition-colors group">
                <div className="flex items-start justify-between">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/30">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                    One-Click .BAT
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    install-windows11.bat Launcher
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Direct batch script launcher for Windows 11 with automatic UAC check, Conda detection, and desktop shortcut generation.
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href="/api/installer/windows11/bat"
                    download="install-windows11.bat"
                    className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-750 text-emerald-300 border border-emerald-500/40 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download install.bat</span>
                  </a>
                  <a
                    href="/api/installer/windows11/shortcut"
                    download="create-shortcut.bat"
                    className="py-2 px-3 bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-cyan-500/40 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                    title="Download create-shortcut.bat to place shortcut on Desktop anytime"
                  >
                    <Download className="w-4 h-4" />
                    <span>Create Shortcut</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* What This Installer Does on Windows 11 */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-semibold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Windows 11 Integration & Provisioning Steps:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Conda Automated Provisioning:</strong> Silently installs 64-bit Miniconda into <code className="text-slate-200">%USERPROFILE%\miniconda3</code>.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Isolated Environment:</strong> Configures <code className="text-cyan-300 font-mono">netsentinel</code> with Python 3.11 & Node.js 20.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Windows 11 Desktop Shortcut:</strong> Generates <code className="text-slate-200">NetSentinel Security.lnk</code> on Desktop.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Start Menu Integration:</strong> Registers shortcut under <code className="text-slate-200">Programs &gt; NetSentinel</code>.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Windows Defender Firewall:</strong> Automatically adds an inbound allow rule for Port 3000 for LAN audit connectivity.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Kernel Packet Drivers:</strong> Verifies Npcap / WinPcap driver for promiscuous ARP & Wi-Fi monitor scans.
                </span>
              </div>
            </div>
          </div>

          {/* Quick Manual Steps */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300">Quick Manual Installation Steps:</h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-400 text-[11px] leading-relaxed">
              <li>Download and extract <strong>NetSentinel-Windows11-Setup.zip</strong> to a folder on your Windows 11 PC (e.g. <code className="text-slate-300">C:\NetSentinel</code>).</li>
              <li>Right-click <strong>install-windows11.bat</strong> and select <strong>"Run as administrator"</strong>.</li>
              <li>When installation finishes, double-click the <strong>NetSentinel Security</strong> shortcut on your Windows 11 Desktop.</li>
              <li>Open your browser to <code className="text-cyan-300">http://localhost:3000</code>.</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Monitor className="w-4 h-4 text-blue-400" />
            <span>Windows 11 Home, Pro, Enterprise & Education supported</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/installer/windows11/zip"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Full Setup.zip</span>
            </a>
            <button
              onClick={onClose}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

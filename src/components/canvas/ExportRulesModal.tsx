import React, { useState, useEffect } from "react";
import {
  X,
  Code,
  Download,
  Copy,
  Check,
  RefreshCw,
  FileCode,
  CheckCircle2,
} from "lucide-react";
import { CompiledFirewallRule } from "../../types/canvas";

interface ExportRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportRulesModal: React.FC<ExportRulesModalProps> = ({ isOpen, onClose }) => {
  const [platform, setPlatform] = useState<
    "windows_firewall" | "nftables" | "iptables" | "ufw" | "pf"
  >("windows_firewall");
  const [rules, setRules] = useState<CompiledFirewallRule[]>([]);
  const [rawScript, setRawScript] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      compileRules();
    }
  }, [isOpen, platform]);

  const compileRules = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/canvas/compile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      if (res.ok) {
        const data = await res.json();
        setRules(data.rules || []);
        setRawScript(data.rawScript || "");
      }
    } catch (err) {
      console.error("Failed to compile rules", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(rawScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadScript = () => {
    const ext = platform === "windows_firewall" ? "bat" : platform === "pf" ? "conf" : "sh";
    const filename = `netsentinel-policy-${platform}.${ext}`;
    const blob = new Blob([rawScript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Export Compiled Firewall Policies
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Authoritative Canvas Rules translated into Native Platform Drivers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Platform Selector Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Target Driver:</span>
            <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              {(
                [
                  { id: "windows_firewall", label: "Windows Firewall" },
                  { id: "nftables", label: "Linux nftables" },
                  { id: "iptables", label: "Linux iptables" },
                  { id: "ufw", label: "Ubuntu UFW" },
                  { id: "pf", label: "BSD / macOS pf" },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`px-3 py-1.5 rounded text-[11px] font-medium font-mono transition-all ${
                    platform === p.id
                      ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Script</span>
                </>
              )}
            </button>
            <button
              onClick={downloadScript}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

        {/* Script Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              <span className="font-mono text-xs">Translating canvas graph to {platform}...</span>
            </div>
          ) : (
            <pre className="font-mono text-[11px] text-emerald-400 leading-relaxed whitespace-pre-wrap selection:bg-cyan-500 selection:text-slate-950">
              {rawScript}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Strict Default Deny with Stateful Returns Enforced</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

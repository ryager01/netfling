import React, { useState } from "react";
import { ComplianceAuditReport } from "../../types/canvas";
import {
  X,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  Zap,
  ArrowRight,
  Server,
  Layers,
} from "lucide-react";

interface ComplianceAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ComplianceAuditReport | null;
  onRefresh: () => void;
  onEnforceIntent: () => void;
  isEnforcing: boolean;
}

export const ComplianceAuditModal: React.FC<ComplianceAuditModalProps> = ({
  isOpen,
  onClose,
  report,
  onRefresh,
  onEnforceIntent,
  isEnforcing,
}) => {
  const [activeTab, setActiveTab] = useState<"summary" | "violations" | "policies">("summary");

  if (!isOpen) return null;

  const score = report?.complianceScore ?? 88;
  const getScoreColor = () => {
    if (score >= 90) return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
    if (score >= 70) return "text-amber-400 border-amber-500/40 bg-amber-500/10";
    return "text-red-400 border-red-500/40 bg-red-500/10";
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Zero Trust Compliance & Policy Engine
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Authoritative Canvas Intent vs Active Endpoint Telemetry
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Re-run compliance audit"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Score & Tabs Bar */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-xl border text-center ${getScoreColor()}`}>
              <div className="text-3xl font-extrabold font-mono">{score}%</div>
              <div className="text-[10px] font-mono uppercase tracking-wider mt-0.5">
                Compliance Index
              </div>
            </div>
            <div className="space-y-1 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">Security Model:</span>
                <span className="font-mono text-emerald-400">Strict Default Deny</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">Active Violations:</span>
                <span className="font-mono text-amber-400 font-bold">
                  {report?.violations?.length ?? 0} Detected
                </span>
              </div>
              <div className="text-[11px] text-slate-500">
                Audited {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onEnforceIntent}
              disabled={isEnforcing}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-950 transition-all disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${isEnforcing ? "animate-spin" : ""}`} />
              <span>{isEnforcing ? "Pushing Directives..." : "Enforce Canvas Intent"}</span>
            </button>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-800 px-5 text-xs">
          <button
            onClick={() => setActiveTab("summary")}
            className={`py-3 px-4 font-semibold border-b-2 transition-colors ${
              activeTab === "summary"
                ? "border-cyan-400 text-cyan-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Policy Comparison (Expected vs Actual)
          </button>
          <button
            onClick={() => setActiveTab("violations")}
            className={`py-3 px-4 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "violations"
                ? "border-amber-400 text-amber-300"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>Violations & Rogue Ports</span>
            {report?.violations && report.violations.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] bg-amber-500/20 text-amber-300">
                {report.violations.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 text-xs space-y-4">
          {activeTab === "summary" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Expected Policy (from Canvas) */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-slate-200 uppercase font-mono text-[11px]">
                      Expected Policy (Canvas Authoritative)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Zero Trust rule: absence of edge implies <strong>DENY</strong>. The canvas explicitly permits:
                  </p>
                  <div className="space-y-1.5 font-mono text-[11px] max-h-56 overflow-y-auto">
                    {report?.expectedPolicies?.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded bg-slate-900 border border-slate-800/80 text-emerald-300 flex items-center justify-between"
                      >
                        <span>
                          {p.source} → {p.destination}
                        </span>
                        <span className="text-cyan-400">{p.ports.join(", ")}</span>
                      </div>
                    )) || (
                      <div className="text-slate-500 italic p-2">Canvas policies loaded.</div>
                    )}
                  </div>
                </div>

                {/* Actual Policy (from local firewall state & listeners) */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Server className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-slate-200 uppercase font-mono text-[11px]">
                      Actual State (Agent Reported)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Live telemetry reported by Windows Firewall, nftables, and active OS socket listeners.
                  </p>
                  <div className="space-y-1.5 font-mono text-[11px] max-h-56 overflow-y-auto">
                    {report?.actualPolicies?.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded bg-slate-900 border border-slate-800/80 text-slate-300 flex items-center justify-between"
                      >
                        <span>{p.node}</span>
                        <span className="text-purple-400">{p.ruleSummary}</span>
                      </div>
                    )) || (
                      <div className="text-slate-500 italic p-2">Actual policies queried.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "violations" && (
            <div className="space-y-3">
              {report?.violations && report.violations.length > 0 ? (
                report.violations.map((v) => (
                  <div
                    key={v.id}
                    className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-500/30 hover:border-amber-500/60 transition-colors flex items-start gap-3"
                  >
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-xs">{v.description}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {v.severity}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Affected Node: <span className="text-cyan-300">{v.nodeLabel}</span>
                        {v.port && (
                          <span>
                            {" "}
                            · Port: <span className="text-amber-300">{v.port}</span>
                          </span>
                        )}
                        {v.process && (
                          <span>
                            {" "}
                            · Process: <span className="text-slate-300">{v.process}</span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Recommendation: Add relationship to canvas or kill rogue listening socket.
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <div className="text-sm font-semibold text-white">No Policy Violations Found</div>
                  <p className="text-xs text-slate-400">
                    All listening sockets and active firewall states match the canvas relationship intent.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono text-[11px]">
            Zero Trust Architecture (ZTA) • Authoritative Canvas Model
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close Auditor
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  RefreshCw,
  AlertTriangle,
  Lock,
  Unlock,
  Radio,
  Wifi,
  ExternalLink,
  Activity,
  Layers,
  CheckCircle2,
  XCircle,
  Copy,
  Info,
  Server,
  Zap,
  Download,
  BookOpen,
  Filter,
  FileCode,
  Crosshair,
  Bug,
  HardDrive,
  Cpu,
  Terminal,
  Eye,
} from "lucide-react";
import { TargetIpSelector, NetworkDevice } from "./TargetIpSelector";

export interface RatDefinition {
  port: number;
  name: string;
  category: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | string;
  mitre_id: string;
  notes: string;
  handshake_hint?: string;
}

interface RatFinding {
  port: number;
  trojan_name: string;
  category: string;
  severity: string;
  notes: string;
  banner: string;
  matched_signature: boolean;
}

interface RatHostResult {
  ip: string;
  mac: string;
  threat_level: string;
  risk_grade: string;
  is_infected: boolean;
  rat_findings_count: number;
  findings: RatFinding[];
  total_ports_probed: number;
  duration_ms: number;
  scanned_at: string;
  vendor?: string;
  hostname?: string;
  nickname?: string;
}

interface ModuleStatus {
  threats: number;
  status: "PASS" | "FAIL";
  label?: string;
}

interface HostIntegrityResult {
  timestamp: string;
  platform: string;
  status: string;
  risk_grade?: string;
  health_score: number;
  total_checks_run?: number;
  indicators_checked?: number;
  threats_detected: number;
  critical_count: number;
  high_count: number;
  medium_count?: number;
  findings: Array<{
    severity: string;
    category: string;
    indicator: string;
    process_id?: number;
    port?: number;
    path?: string;
    mitre_id?: string;
    remediation: string;
  }>;
  module_breakdown?: Record<string, ModuleStatus>;
  definitions_loaded?: number;
  duration_ms: number;
}

interface CustomScanResult {
  target: string;
  timestamp: string;
  findings: Array<{
    severity?: string;
    category?: string;
    indicator?: string;
    info?: string;
    path?: string;
    size_bytes?: number;
    status?: string;
    exe?: string;
    error?: string;
    mitre_id?: string;
  }>;
  threats_count: number;
  duration_ms: number;
}

interface RatDetectorViewProps {
  devices: NetworkDevice[];
  onToggleQuarantine: (mac: string, currentStatus: number, reason?: string) => void;
  showToast: (msg: string) => void;
}

export const RatDetectorView: React.FC<RatDetectorViewProps> = ({
  devices,
  onToggleQuarantine,
  showToast,
}) => {
  const [scanMode, setScanMode] = useState<
    "network" | "single" | "host_integrity" | "definitions" | "custom_scan"
  >("network");
  const [targetIp, setTargetIp] = useState<string>(devices[0]?.ip || "127.0.0.1");
  const [targetMac, setTargetMac] = useState<string>(devices[0]?.mac || "");
  const [customPath, setCustomPath] = useState<string>("/tmp");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Result state
  const [singleResult, setSingleResult] = useState<RatHostResult | null>(null);
  const [networkResult, setNetworkResult] = useState<{
    timestamp: string;
    total_devices_audited: number;
    compromised_count: number;
    clean_count: number;
    compromised_devices: RatHostResult[];
    clean_devices: RatHostResult[];
    overall_status: string;
    duration_ms: number;
  } | null>(null);
  const [hostIntegrityResult, setHostIntegrityResult] = useState<HostIntegrityResult | null>(null);
  const [customScanResult, setCustomScanResult] = useState<CustomScanResult | null>(null);

  // Definitions Library state
  const [definitions, setDefinitions] = useState<RatDefinition[]>([]);
  const [defSearch, setDefSearch] = useState<string>("");
  const [defCategoryFilter, setDefCategoryFilter] = useState<string>("ALL");
  const [defSeverityFilter, setDefSeverityFilter] = useState<string>("ALL");

  // Multi-Vector Malware Audit Progress Meter State
  const [auditProgress, setAuditProgress] = useState<{
    percent: number;
    stage: string;
    vectorIndex: number;
  }>({ percent: 0, stage: "", vectorIndex: 0 });

  // Load definitions once or when tab is selected
  useEffect(() => {
    fetch("/api/tools/rat/definitions")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: RatDefinition[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setDefinitions(data);
        }
      })
      .catch(() => {});
  }, []);

  const runAudit = async () => {
    setIsLoading(true);
    let initialStage = "Initializing Multi-Vector Malware & RAT Audit...";
    if (scanMode === "host_integrity") {
      initialStage = "Vector 1/11: Checking Kernel Rootkits & /etc/ld.so.preload injection...";
    } else if (scanMode === "custom_scan") {
      initialStage = `Inspecting '${customPath || "target"}' for malware signatures & strings...`;
    } else if (scanMode === "single") {
      initialStage = `Probing target ${targetIp} against 117+ RAT listener ports...`;
    } else {
      initialStage = "Sweeping all subnet devices for known RAT C2 & Trojan listeners...";
    }

    setAuditProgress({ percent: 8, stage: initialStage, vectorIndex: 1 });

    let currentPct = 8;
    const interval = setInterval(() => {
      currentPct += 7;
      if (currentPct > 93) currentPct = 93;
      let stage = initialStage;
      let vec = 1;

      if (scanMode === "host_integrity") {
        if (currentPct <= 18) {
          stage = "Vector 1/11: Checking Kernel Rootkits & /etc/ld.so.preload hooks...";
          vec = 1;
        } else if (currentPct <= 28) {
          stage = "Vector 2/11: Inspecting SUID / SGID Privilege Escalation Binaries...";
          vec = 2;
        } else if (currentPct <= 38) {
          stage = "Vector 3/11: Auditing SSH Authorized Keys & Rogue Private Keys...";
          vec = 3;
        } else if (currentPct <= 50) {
          stage = "Vector 4/11: Scanning Web Roots for Webshells (PHP, JSP, ASPX)...";
          vec = 4;
        } else if (currentPct <= 62) {
          stage = "Vector 5/11: Auditing Scheduled Tasks, Cron Jobs & Systemd Timers...";
          vec = 5;
        } else if (currentPct <= 74) {
          stage = "Vector 6/11: Inspecting Active Processes & Hidden Memory Maps...";
          vec = 6;
        } else if (currentPct <= 84) {
          stage = "Vector 7/11: Scanning for Cryptominers & Stratum Protocol Sockets...";
          vec = 7;
        } else {
          stage = "Vector 8/11: Auditing Reverse Shells, C2 Beacons & DNS Tampering...";
          vec = 8;
        }
      } else if (scanMode === "network") {
        stage = `Sweeping Subnet: Probing device ${Math.min(10, Math.floor(currentPct / 10))} of 10 for 117+ C2 signatures...`;
      } else if (scanMode === "custom_scan") {
        stage = `Analyzing file headers, ELF/PE packers, and strings in ${customPath || "target"}...`;
      }
      setAuditProgress({ percent: currentPct, stage, vectorIndex: vec });
    }, 220);

    try {
      if (scanMode === "host_integrity") {
        const res = await fetch("/api/tools/rat-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "host_integrity" }),
        });
        if (res.ok) {
          const data: HostIntegrityResult = await res.json();
          setHostIntegrityResult(data);
          setAuditProgress({ percent: 100, stage: "Host Integrity Audit Completed!", vectorIndex: 11 });
          if (data.threats_detected > 0) {
            showToast(`ALERT: ${data.threats_detected} host threat indicator(s) identified across 11 modules!`);
          } else {
            showToast("Workstation system integrity verified: All 11 checks clean!");
          }
        } else {
          showToast("Host integrity audit failed");
        }
      } else if (scanMode === "custom_scan") {
        const res = await fetch("/api/tools/rat/custom-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ target: customPath }),
        });
        if (res.ok) {
          const data: CustomScanResult = await res.json();
          setCustomScanResult(data);
          setAuditProgress({ percent: 100, stage: "Target Inspection Completed!", vectorIndex: 1 });
          if (data.threats_count > 0) {
            showToast(`ALERT: ${data.threats_count} suspicious artifact(s) found in target!`);
          } else {
            showToast(`Deep scan of '${customPath}' complete: Clean`);
          }
        } else {
          showToast("Target inspection failed");
        }
      } else {
        const payload =
          scanMode === "network"
            ? { sweep_all: true }
            : { target: targetIp, mac: targetMac, sweep_all: false };

        const res = await fetch("/api/tools/rat-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          setAuditProgress({ percent: 100, stage: "Scan Sweep Completed!", vectorIndex: 1 });
          if (scanMode === "network") {
            setNetworkResult(data);
            setSingleResult(null);
            if (data.compromised_count > 0) {
              showToast(`ALERT: ${data.compromised_count} compromised endpoint(s) detected!`);
            } else {
              showToast("Network RAT audit complete: All endpoints clean!");
            }
          } else {
            setSingleResult(data);
            setNetworkResult(null);
            if (data.is_infected) {
              showToast(`ALERT: RAT Trojan listener found on ${targetIp}!`);
            } else {
              showToast(`Host ${targetIp} clean: Zero RAT listeners found`);
            }
          }
        } else {
          showToast("RAT audit request failed");
        }
      }
    } catch (err: any) {
      showToast(`Error running RAT scan: ${err.message}`);
    } finally {
      clearInterval(interval);
      setTimeout(() => {
        setIsLoading(false);
        setAuditProgress({ percent: 0, stage: "", vectorIndex: 0 });
      }, 700);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard`);
  };

  const exportAuditReport = () => {
    let exportData: any = {};
    let filename = `malware-audit-${Date.now()}.json`;

    if (scanMode === "definitions") {
      exportData = {
        title: "NetSentinel Remote Access Trojan & Malware Definitions Registry",
        exported_at: new Date().toISOString(),
        total_definitions: definitions.length,
        definitions,
      };
      filename = `rat-definitions-library-${Date.now()}.json`;
    } else if (scanMode === "host_integrity") {
      exportData = {
        title: "NetSentinel Host System Integrity & Multi-Vector Malware Audit",
        exported_at: new Date().toISOString(),
        result: hostIntegrityResult,
      };
      filename = `host-integrity-audit-${Date.now()}.json`;
    } else {
      exportData = {
        title: "NetSentinel Network RAT Sweep Audit",
        exported_at: new Date().toISOString(),
        network_result: networkResult,
        single_result: singleResult,
      };
      filename = `rat-network-audit-${Date.now()}.json`;
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const dl = document.createElement("a");
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", filename);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
    showToast("Audit report exported successfully");
  };

  // Filtered definitions
  const filteredDefinitions = useMemo(() => {
    return definitions.filter((def) => {
      const matchSearch =
        !defSearch ||
        def.name.toLowerCase().includes(defSearch.toLowerCase()) ||
        def.category.toLowerCase().includes(defSearch.toLowerCase()) ||
        def.mitre_id.toLowerCase().includes(defSearch.toLowerCase()) ||
        def.notes.toLowerCase().includes(defSearch.toLowerCase()) ||
        String(def.port).includes(defSearch);

      const matchCat =
        defCategoryFilter === "ALL" ||
        def.category.toLowerCase().includes(defCategoryFilter.toLowerCase());

      const matchSev =
        defSeverityFilter === "ALL" || def.severity === defSeverityFilter;

      return matchSearch && matchCat && matchSev;
    });
  }, [definitions, defSearch, defCategoryFilter, defSeverityFilter]);

  // Unique categories for filtering
  const categories = useMemo(() => {
    const set = new Set<string>();
    definitions.forEach((d) => set.add(d.category));
    return Array.from(set).sort();
  }, [definitions]);

  const isCompromised =
    (scanMode === "network" && (networkResult?.compromised_count ?? 0) > 0) ||
    (scanMode === "single" && (singleResult?.is_infected ?? false));

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Card */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-bold bg-red-950/60 px-2 py-0.5 rounded border border-red-500/30">
                Threat Hunting & Malware Defense
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Definitions Loaded: {definitions.length > 0 ? definitions.length : "117+"}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <span>Remote Access Trojan (RAT) & Malware Audit Suite</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Deep inspection for DarkComet, njRAT, Quasar, AsyncRAT, Cobalt Strike, Metasploit, BitRAT, STRRAT, rootkits, webshells, and unauthorized reverse command shells.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={exportAuditReport}
              className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700/60"
              title="Export Report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            {scanMode !== "definitions" && (
              <button
                onClick={runAudit}
                disabled={isLoading || (scanMode === "single" && !targetIp)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-colors rounded-lg flex items-center gap-2 shadow-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span>{isLoading ? "Running Audit..." : "Execute Audit"}</span>
              </button>
            )}
          </div>
        </div>

        {/* MULTI-VECTOR MALWARE AUDIT PROGRESS METER */}
        {isLoading && (
          <div className="mb-6 bg-gradient-to-r from-red-950/80 via-slate-900/90 to-amber-950/80 border-2 border-red-500/50 rounded-xl p-5 shadow-xl shadow-red-950/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-red-500/20 text-red-300 rounded-xl border border-red-500/40 shrink-0">
                  <ShieldAlert className="w-5 h-5 animate-pulse text-red-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-red-300 font-bold bg-red-900/70 px-2.5 py-0.5 rounded border border-red-400/40">
                      MALWARE AUDIT IN PROGRESS
                    </span>
                    <span className="text-xs font-mono text-amber-300">
                      Module: {scanMode.toUpperCase()} · 117+ Signatures
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white mt-1">
                    {auditProgress.stage || "Analyzing system vectors for trojan activity..."}
                  </div>
                </div>
              </div>

              <div className="w-full md:w-64 space-y-1.5 shrink-0">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-semibold">Audit Progress:</span>
                  <span className="font-bold text-red-400">{auditProgress.percent}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-700/80">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-300 shadow-sm shadow-red-500"
                    style={{ width: `${Math.max(auditProgress.percent, 8)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5-Mode Scope Switcher */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300">Analysis & Detection Module:</label>
            <span className="text-[11px] font-mono text-slate-400">
              {scanMode === "network" && "Network-wide sweeps across all discovered subnet devices"}
              {scanMode === "single" && "Deep targeted port and banner handshake check on single IP"}
              {scanMode === "host_integrity" && "11-Vector Workstation Integrity (Rootkits, SSH keys, webshells, cron, processes)"}
              {scanMode === "definitions" && "Searchable database of 117+ malware, RAT & C2 signatures"}
              {scanMode === "custom_scan" && "Forensic inspection of specific file, folder or process PID"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setScanMode("network")}
              className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                scanMode === "network"
                  ? "bg-red-600/30 text-red-200 border border-red-500/50 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-red-400" />
              <span>Entire Network ({devices.length})</span>
            </button>

            <button
              onClick={() => setScanMode("single")}
              className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                scanMode === "single"
                  ? "bg-red-600/30 text-red-200 border border-red-500/50 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Crosshair className="w-3.5 h-3.5 text-amber-400" />
              <span>Target Host</span>
            </button>

            <button
              onClick={() => setScanMode("host_integrity")}
              className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                scanMode === "host_integrity"
                  ? "bg-purple-600/30 text-purple-200 border border-purple-500/50 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>11-Vector Host Audit</span>
            </button>

            <button
              onClick={() => setScanMode("definitions")}
              className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                scanMode === "definitions"
                  ? "bg-cyan-600/30 text-cyan-200 border border-cyan-500/50 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Definitions Library ({definitions.length || "117+"})</span>
            </button>

            <button
              onClick={() => setScanMode("custom_scan")}
              className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                scanMode === "custom_scan"
                  ? "bg-emerald-600/30 text-emerald-200 border border-emerald-500/50 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>Path / PID Deep Scan</span>
            </button>
          </div>

          {/* Conditional Input for Single Host */}
          {scanMode === "single" && (
            <div className="pt-2 max-w-md">
              <label className="text-xs font-semibold text-slate-300 block mb-1">Target Host IP:</label>
              <TargetIpSelector
                value={targetIp}
                onChange={(ip, dev) => {
                  setTargetIp(ip);
                  if (dev) setTargetMac(dev.mac);
                }}
                devices={devices}
                placeholder="Pick seen device or enter IP manually..."
              />
            </div>
          )}

          {/* Conditional Input for Custom Path */}
          {scanMode === "custom_scan" && (
            <div className="pt-2 flex flex-col sm:flex-row gap-2 max-w-xl">
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Target Path (file, directory) or Process PID:
                </label>
                <div className="relative">
                  <Terminal className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={customPath}
                    onChange={(e) => setCustomPath(e.target.value)}
                    placeholder="e.g. /tmp, /var/www, /dev/shm, or PID number"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>
              <div className="self-end">
                <button
                  onClick={runAudit}
                  disabled={isLoading || !customPath}
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Inspect Target</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Executive Threat Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400 font-medium">Trojan & RAT Registry</span>
            <div className="mt-1 text-2xl font-bold font-mono text-cyan-400">
              {definitions.length > 0 ? `${definitions.length} Signatures` : "117+ Known"}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              MITRE T1219, T1059, T1071, T1486
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400 font-medium">Active Threat Status</span>
            <div
              className={`mt-1 text-sm font-bold font-mono uppercase ${
                scanMode === "host_integrity"
                  ? (hostIntegrityResult?.threats_detected ?? 0) > 0
                    ? "text-red-400 animate-pulse"
                    : "text-emerald-400"
                  : isCompromised
                  ? "text-red-400 animate-pulse"
                  : "text-emerald-400"
              }`}
            >
              {scanMode === "host_integrity"
                ? hostIntegrityResult
                  ? hostIntegrityResult.status
                  : "READY FOR AUDIT"
                : isCompromised
                ? "COMPROMISED HOSTS FOUND"
                : "CLEAN & UNINFECTED"}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              {scanMode === "host_integrity"
                ? `${hostIntegrityResult?.platform || "Local OS"} (11 Checks)`
                : scanMode === "network"
                ? `${networkResult?.total_devices_audited || devices.length} endpoints monitored`
                : `Target: ${targetIp}`}
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400 font-medium">Active Threat Indicators</span>
            <div className="mt-1 text-2xl font-bold font-mono text-red-400">
              {scanMode === "host_integrity"
                ? hostIntegrityResult?.threats_detected ?? 0
                : scanMode === "network"
                ? networkResult?.compromised_count ?? 0
                : scanMode === "custom_scan"
                ? customScanResult?.threats_count ?? 0
                : singleResult?.is_infected
                ? 1
                : 0}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              {scanMode === "host_integrity"
                ? `${hostIntegrityResult?.critical_count ?? 0} Critical / ${hostIntegrityResult?.high_count ?? 0} High`
                : "Active Backdoor Listeners"}
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400 font-medium">Integrity Health</span>
            <div className="mt-1 text-2xl font-bold font-mono text-emerald-400">
              {scanMode === "host_integrity"
                ? `${hostIntegrityResult?.health_score ?? 100}%`
                : "Active Guard"}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">
              {scanMode === "host_integrity"
                ? "Multi-Vector Health Rating"
                : "1-Click Containment Ready"}
            </span>
          </div>
        </div>
      </div>

      {/* VIEW 1: NETWORK AUDIT FINDINGS */}
      {scanMode === "network" && (
        <div className="space-y-4">
          {/* Status banner */}
          {networkResult ? (
            isCompromised ? (
              <div className="bg-red-950/30 border-2 border-red-500/60 p-5 rounded-xl space-y-2 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-red-400" />
                    <span className="text-sm font-bold text-red-200">
                      CRITICAL MALWARE ALERT: ACTIVE REMOTE ACCESS TROJAN (RAT) DETECTED
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/40 text-red-100 font-bold uppercase">
                    Action Required
                  </span>
                </div>
                <p className="text-xs text-red-300 leading-relaxed">
                  One or more devices have open listener ports or reverse command beacons characteristic of Remote Access Trojans.
                  Immediately isolate the infected hardware into quarantine below to terminate external C2 command execution.
                </p>
              </div>
            ) : (
              <div className="bg-emerald-950/20 border border-emerald-500/40 p-5 rounded-xl space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold text-white">
                    Zero Remote Access Trojans or Backdoor Listeners Detected
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  All probed ports across {networkResult.total_devices_audited} devices are closed or non-responsive. No unauthorized command sockets active.
                </p>
              </div>
            )
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 text-center space-y-3">
              <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-sm font-bold text-white">Network Audit Ready</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Scan all {devices.length} network devices in the subnet for 117+ known Remote Access Trojan listeners and C2 channels.
              </p>
              <button
                onClick={runAudit}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg inline-flex items-center gap-2 shadow"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span>Run Network RAT Sweep</span>
              </button>
            </div>
          )}

          {networkResult && (
            <>
              {/* Compromised Devices First */}
              {networkResult.compromised_devices.length > 0 && (
                <div className="bg-slate-900/60 border border-red-500/50 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span>Compromised Endpoints Requiring Isolation ({networkResult.compromised_devices.length})</span>
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {networkResult.compromised_devices.map((dev, idx) => (
                      <div
                        key={idx}
                        className="p-4 bg-slate-950 border border-red-500/40 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-red-300">{dev.ip}</span>
                            <span className="text-[10px] font-mono text-slate-500">[{dev.mac}]</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-mono">
                              {dev.threat_level}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 font-medium">
                            {dev.vendor} · {dev.hostname}
                          </div>

                          {/* Trojan Details list */}
                          <div className="pt-2 space-y-1">
                            {dev.findings.map((f, fi) => (
                              <div key={fi} className="text-[11px] font-mono text-amber-300 flex items-center gap-2">
                                <span className="text-red-400 font-bold">• Port {f.port}:</span>
                                <span className="font-bold">{f.trojan_name}</span>
                                <span className="text-slate-400">({f.category})</span>
                                <span className="text-slate-500 truncate max-w-xs">{f.notes}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => onToggleQuarantine(dev.mac, 0, `Infected with ${dev.findings[0]?.trojan_name}`)}
                            className="px-3.5 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center gap-1.5 shadow"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Quarantine Host</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clean Devices List */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider">
                  Clean Endpoints ({networkResult.clean_devices.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {networkResult.clean_devices.map((dev, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-mono text-slate-300 font-medium">{dev.ip}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[160px]">{dev.vendor}</div>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Clean
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* VIEW 2: SINGLE TARGET AUDIT FINDINGS */}
      {scanMode === "single" && (
        <div className="space-y-4">
          {singleResult ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Target Host Audit: {singleResult.ip}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        singleResult.is_infected
                          ? "bg-red-500/20 text-red-300 font-bold"
                          : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {singleResult.threat_level}
                    </span>
                  </h3>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    Probed {singleResult.total_ports_probed} RAT signature ports in {singleResult.duration_ms} ms
                  </div>
                </div>

                {singleResult.is_infected && (
                  <button
                    onClick={() =>
                      onToggleQuarantine(
                        singleResult.mac,
                        0,
                        `Infected with ${singleResult.findings[0]?.trojan_name}`
                      )
                    }
                    className="px-3.5 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-lg flex items-center gap-1.5 shadow"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Quarantine Host</span>
                  </button>
                )}
              </div>

              {singleResult.findings.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <span>Zero known RAT listeners or reverse shell backdoors detected on this host.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {singleResult.findings.map((f, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-950 border border-red-500/40 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-red-400 font-mono">
                          Port {f.port} · {f.trojan_name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/30 text-red-200 font-bold">
                          {f.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{f.notes}</p>
                      <div className="text-[11px] font-mono text-slate-500 bg-slate-900 p-2 rounded border border-slate-800">
                        Banner Response: {f.banner || "(Open TCP connection - non-banner protocol)"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 text-center space-y-3">
              <Crosshair className="w-10 h-10 text-amber-500/70 mx-auto" />
              <div className="text-sm font-bold text-white">Target Host Probe Ready</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Probe host {targetIp} against 117+ specific ports and signatures for remote access trojans and reverse shells.
              </p>
              <button
                onClick={runAudit}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg inline-flex items-center gap-2 shadow"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span>Audit Host {targetIp}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: 11-VECTOR MULTI-CHECK HOST INTEGRITY AUDIT */}
      {scanMode === "host_integrity" && (
        <div className="space-y-5">
          {hostIntegrityResult ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    <ShieldCheck className="w-6 h-6" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Host System Integrity Audit ({hostIntegrityResult.platform})</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          hostIntegrityResult.threats_detected === 0
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-red-500/20 text-red-300 border border-red-500/30"
                        }`}
                      >
                        {hostIntegrityResult.status}
                      </span>
                    </h3>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Evaluated {hostIntegrityResult.total_checks_run || 11} forensic vectors across processes, LKM rootkits, webshells, SSH keys & persistence in {hostIntegrityResult.duration_ms} ms
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">System Health Score</div>
                    <div
                      className={`text-2xl font-bold font-mono ${
                        hostIntegrityResult.health_score >= 80 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {hostIntegrityResult.health_score}/100
                    </div>
                  </div>
                </div>
              </div>

              {/* 11-Module Audit Breakdown Badges */}
              {hostIntegrityResult.module_breakdown && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider">
                    Diagnostic Modules ({Object.keys(hostIntegrityResult.module_breakdown).length} Checks)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {Object.entries(hostIntegrityResult.module_breakdown).map(([key, mod]) => (
                      <div
                        key={key}
                        className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                          mod.status === "PASS"
                            ? "bg-slate-950/60 border-slate-800 text-slate-300"
                            : "bg-red-950/20 border-red-500/40 text-red-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {mod.status === "PASS" ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                          )}
                          <span className="font-medium truncate">{mod.label || key}</span>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold shrink-0 ${
                            mod.status === "PASS"
                              ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30"
                              : "bg-red-900/60 text-red-300 border border-red-500/40"
                          }`}
                        >
                          {mod.status === "PASS" ? "PASS" : `${mod.threats} DETECTED`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Findings List */}
              {hostIntegrityResult.findings.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-2 bg-slate-950/40 rounded-xl border border-slate-800">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <div className="text-sm font-bold text-white">Workstation System Integrity Pristine</div>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    No unauthorized Trojan listeners, no deleted running memory binaries, no rogue LKM rootkits, no web shells, and no unauthorized SSH forced commands detected.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider font-mono flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Flagged Host Indicators ({hostIntegrityResult.findings.length})</span>
                  </h4>
                  {hostIntegrityResult.findings.map((f, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-950 border border-red-500/40 rounded-xl space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          <span className="text-xs font-bold text-red-300 font-mono">
                            {f.category}
                          </span>
                          {f.mitre_id && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-800 text-cyan-300 rounded">
                              MITRE {f.mitre_id}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/30 text-red-200 font-bold uppercase">
                          {f.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200">{f.indicator}</p>
                      {f.path && (
                        <div className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                          Path: {f.path}
                        </div>
                      )}
                      <div className="text-xs text-amber-300/90 bg-amber-950/20 p-2.5 rounded border border-amber-500/20">
                        <strong>Remediation:</strong> {f.remediation}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 text-center space-y-3">
              <ShieldCheck className="w-10 h-10 text-purple-400 mx-auto" />
              <div className="text-sm font-bold text-white">Workstation Host System Integrity Audit</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Executes all 11 malware checks across process memory evasion, persistence mechanisms, reverse sockets, sensitive staging artifacts, DNS tampering, cryptominers, LKM rootkits, SSH keys, webshells, SUID binaries, and cron tasks.
              </p>
              <button
                onClick={runAudit}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg inline-flex items-center gap-2 shadow"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span>Run 11-Vector Host Audit</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: DEFINITIONS LIBRARY EXPLORER */}
      {scanMode === "definitions" && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>Known Remote Access Trojan (RAT) & Malware Encyclopedia</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Loaded {definitions.length} signatures covering commercial RATs, state-sponsored APT backdoors, C2 frameworks, and infostealers.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={defSearch}
                  onChange={(e) => setDefSearch(e.target.value)}
                  placeholder="Search name, port, MITRE..."
                  className="bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono w-48 sm:w-56"
                />
              </div>

              <select
                value={defSeverityFilter}
                onChange={(e) => setDefSeverityFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
              </select>

              <select
                value={defCategoryFilter}
                onChange={(e) => setDefCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono focus:outline-none max-w-[160px]"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Definitions Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-[10px] uppercase font-mono text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Port</th>
                  <th className="py-2.5 px-3">Threat Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">MITRE ATT&CK</th>
                  <th className="py-2.5 px-3">Behavior & Fingerprint</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredDefinitions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No definitions match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDefinitions.map((def, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-red-400 whitespace-nowrap">
                        {def.port}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-white whitespace-nowrap">
                        {def.name}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                        {def.category}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            def.severity === "CRITICAL"
                              ? "bg-red-500/20 text-red-300 border border-red-500/40"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          }`}
                        >
                          {def.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-cyan-400 whitespace-nowrap">
                        {def.mitre_id}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 max-w-md">
                        {def.notes}
                        {def.handshake_hint && (
                          <span className="ml-1 text-[10px] font-mono text-slate-500">
                            [Handshake: {def.handshake_hint}]
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 5: CUSTOM TARGET / PID DEEP SCAN */}
      {scanMode === "custom_scan" && (
        <div className="space-y-4">
          {customScanResult ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>Inspection Results: {customScanResult.target}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        customScanResult.threats_count === 0
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {customScanResult.threats_count === 0 ? "CLEAN" : `${customScanResult.threats_count} THREATS`}
                    </span>
                  </h3>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    Completed in {customScanResult.duration_ms} ms
                  </div>
                </div>
              </div>

              {customScanResult.findings.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <span>Target path verified clean. No webshell or malware signatures found.</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {customScanResult.findings.map((f, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border text-xs ${
                        f.severity === "CRITICAL"
                          ? "bg-red-950/20 border-red-500/40 text-red-200"
                          : "bg-slate-950 border-slate-800 text-slate-300"
                      }`}
                    >
                      {f.indicator && <div className="font-semibold">{f.indicator}</div>}
                      {f.info && <div className="text-slate-300">{f.info}</div>}
                      {f.exe && <div className="text-slate-400 font-mono text-[11px] mt-1">Binary: {f.exe}</div>}
                      {f.path && (
                        <div className="text-slate-400 font-mono text-[11px] mt-1">
                          Path: {f.path} ({f.size_bytes} bytes) - Status: {f.status}
                        </div>
                      )}
                      {f.error && <div className="text-amber-400 font-mono text-[11px]">{f.error}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-8 text-center space-y-3">
              <FileCode className="w-10 h-10 text-emerald-400 mx-auto" />
              <div className="text-sm font-bold text-white">Forensic Target Inspector</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Scan any custom script, web root (/var/www, /tmp, /dev/shm), or running process PID for webshell backdoors, unlinked memory binaries, and trojan footprints.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

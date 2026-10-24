import React, { useState } from "react";
import {
  Activity,
  Send,
  Globe,
  Mail,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  Server,
  Zap,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  Info,
  Sliders,
  Terminal,
  HelpCircle,
  XCircle,
} from "lucide-react";
import { TargetIpSelector, NetworkDevice } from "./TargetIpSelector";
import { RatDetectorView } from "./RatDetectorView";

interface NetworkDiagnosticsViewProps {
  devices: NetworkDevice[];
  onToggleQuarantine?: (mac: string, currentStatus: number, reason?: string) => void;
  showToast: (msg: string) => void;
}

export const NetworkDiagnosticsView: React.FC<NetworkDiagnosticsViewProps> = ({
  devices,
  onToggleQuarantine,
  showToast,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    "ping" | "traceroute" | "dns" | "dnshijack" | "ratcheck" | "email" | "blacklist"
  >("ping");

  // --- 1. Ping Tool State ---
  const [pingTarget, setPingTarget] = useState<string>("8.8.8.8");
  const [pingCount, setPingCount] = useState<number>(4);
  const [pingMode, setPingMode] = useState<"auto" | "icmp" | "tcp">("auto");
  const [pingPort, setPingPort] = useState<string>("");
  const [pingLoading, setPingLoading] = useState<boolean>(false);
  const [pingResult, setPingResult] = useState<any | null>(null);

  // --- 2. Traceroute Tool State ---
  const [traceTarget, setTraceTarget] = useState<string>("8.8.8.8");
  const [traceMaxHops, setTraceMaxHops] = useState<number>(15);
  const [traceLoading, setTraceLoading] = useState<boolean>(false);
  const [traceResult, setTraceResult] = useState<any | null>(null);

  // --- 3. DNS Tool State ---
  const [dnsTarget, setDnsTarget] = useState<string>("google.com");
  const [dnsRecordType, setDnsRecordType] = useState<string>("A");
  const [dnsResolver, setDnsResolver] = useState<string>("8.8.8.8");
  const [dnsLoading, setDnsLoading] = useState<boolean>(false);
  const [dnsResult, setDnsResult] = useState<any | null>(null);

  // --- 6. DNS Hijacking Check State ---
  const [dnsHijackLoading, setDnsHijackLoading] = useState<boolean>(false);
  const [dnsHijackResult, setDnsHijackResult] = useState<any | null>(null);

  // --- 4. Email Delivery Tool State ---
  const [emailTarget, setEmailTarget] = useState<string>("support@google.com");
  const [dkimSelector, setDkimSelector] = useState<string>("default");
  const [emailLoading, setEmailLoading] = useState<boolean>(false);
  const [emailResult, setEmailResult] = useState<any | null>(null);

  // --- 5. Blacklist Tool State ---
  const [blacklistTarget, setBlacklistTarget] = useState<string>("8.8.8.8");
  const [blacklistLoading, setBlacklistLoading] = useState<boolean>(false);
  const [blacklistResult, setBlacklistResult] = useState<any | null>(null);

  // Diagnostic Progress Meter State
  const [diagProgress, setDiagProgress] = useState<{
    active: boolean;
    toolName: string;
    stage: string;
    percent: number;
  }>({ active: false, toolName: "", stage: "", percent: 0 });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast("Copied to clipboard!");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Helper to start diagnostic progress meter
  const startProgress = (toolName: string, initialStage: string, durationMs = 2500) => {
    setDiagProgress({ active: true, toolName, stage: initialStage, percent: 12 });
    let pct = 12;
    const step = 8;
    const intervalTime = Math.max(100, Math.floor(durationMs / 12));
    const timer = setInterval(() => {
      pct += step;
      if (pct > 92) pct = 92;
      setDiagProgress((prev) => ({ ...prev, percent: pct }));
    }, intervalTime);
    return timer;
  };

  const finishProgress = (timer: any, successStage: string) => {
    clearInterval(timer);
    setDiagProgress((prev) => ({ ...prev, percent: 100, stage: successStage }));
    setTimeout(() => {
      setDiagProgress({ active: false, toolName: "", stage: "", percent: 0 });
    }, 600);
  };

  // --- Handlers ---
  const handleRunPing = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pingTarget.trim()) return showToast("Enter or select a target for ping test.");
    setPingLoading(true);
    const timer = startProgress("ICMP / TCP PING", `Transmitting ${pingCount} probe packets to ${pingTarget.trim()}...`, 2000);
    try {
      const payload: any = {
        target: pingTarget.trim(),
        count: pingCount,
        timeout: 2,
        mode: pingMode,
      };
      if (pingMode === "tcp" && pingPort.trim()) {
        payload.port = parseInt(pingPort.trim(), 10);
      }
      const res = await fetch("/api/tools/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setPingResult(data);
      finishProgress(timer, "Ping probe completed successfully!");
    } catch (err: any) {
      clearInterval(timer);
      setDiagProgress({ active: false, toolName: "", stage: "", percent: 0 });
      showToast(`Ping failed: ${err.message}`);
    } finally {
      setPingLoading(false);
    }
  };

  const handleRunTrace = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!traceTarget.trim()) return showToast("Enter or select a target for traceroute.");
    setTraceLoading(true);
    const timer = startProgress("LAYER 3 TRACEROUTE", `Tracing hop-by-hop route to ${traceTarget.trim()} (Max ${traceMaxHops} hops)...`, 3500);
    try {
      const res = await fetch("/api/tools/traceroute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: traceTarget.trim(), max_hops: traceMaxHops, timeout: 2 }),
      });
      const data = await res.json();
      setTraceResult(data);
      finishProgress(timer, "Traceroute hops resolved!");
    } catch (err: any) {
      clearInterval(timer);
      setDiagProgress({ active: false, toolName: "", stage: "", percent: 0 });
      showToast(`Traceroute failed: ${err.message}`);
    } finally {
      setTraceLoading(false);
    }
  };

  const handleRunDns = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!dnsTarget.trim()) return showToast("Enter a domain or IP for DNS lookup.");
    setDnsLoading(true);
    const timer = startProgress("DNS QUERY RESOLVER", `Resolving ${dnsRecordType} records for ${dnsTarget.trim()} via ${dnsResolver}...`, 1800);
    try {
      const res = await fetch("/api/tools/dns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: dnsTarget.trim(),
          record_type: dnsRecordType,
          resolver: dnsResolver,
        }),
      });
      const data = await res.json();
      setDnsResult(data);
      finishProgress(timer, "DNS record lookup complete!");
    } catch (err: any) {
      clearInterval(timer);
      setDiagProgress({ active: false, toolName: "", stage: "", percent: 0 });
      showToast(`DNS query failed: ${err.message}`);
    } finally {
      setDnsLoading(false);
    }
  };

  const handleRunEmailCheck = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!emailTarget.trim()) return showToast("Enter an email address or domain.");
    setEmailLoading(true);
    const timer = startProgress("EMAIL DELIVERABILITY & AUTHENTICATION", `Auditing MX, SPF, DKIM, and DMARC policies for ${emailTarget.trim()}...`, 2400);
    try {
      const res = await fetch("/api/tools/email-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: emailTarget.trim(),
          dkim_selector: dkimSelector.trim() || "default",
        }),
      });
      const data = await res.json();
      setEmailResult(data);
      finishProgress(timer, "Email deliverability audit complete!");
    } catch (err: any) {
      clearInterval(timer);
      setDiagProgress({ active: false, toolName: "", stage: "", percent: 0 });
      showToast(`Email check failed: ${err.message}`);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleRunBlacklist = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!blacklistTarget.trim()) return showToast("Enter an IP, domain, or email address.");
    setBlacklistLoading(true);
    const timer = startProgress("DNSBL REPUTATION SWEEP", `Querying 12 global DNSBL & RBL reputation databases for ${blacklistTarget.trim()}...`, 2500);
    try {
      const res = await fetch("/api/tools/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: blacklistTarget.trim() }),
      });
      const data = await res.json();
      setBlacklistResult(data);
      finishProgress(timer, "Blacklist databases checked!");
    } catch (err: any) {
      clearInterval(timer);
      setDiagProgress({ active: false, toolName: "", stage: "", percent: 0 });
      showToast(`Blacklist check failed: ${err.message}`);
    } finally {
      setBlacklistLoading(false);
    }
  };

  const handleRunDnsHijack = async () => {
    setDnsHijackLoading(true);
    const timer = startProgress("DNS HIJACKING AUDIT", "Testing local DNS against 4 global reference root resolvers...", 2000);
    try {
      const res = await fetch("/api/tools/dns-hijack");
      const data = await res.json();
      setDnsHijackResult(data);
      finishProgress(timer, "DNS hijacking audit complete!");
      if (data.is_hijacked) {
        showToast("CRITICAL ALERT: DNS hijacking / poisoning detected!");
      } else {
        showToast("DNS hijacking audit complete: Resolvers authentic");
      }
    } catch (err: any) {
      clearInterval(timer);
      setDiagProgress({ active: false, toolName: "", stage: "", percent: 0 });
      showToast(`DNS hijacking audit failed: ${err.message}`);
    } finally {
      setDnsHijackLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-5 shadow-xl backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Activity className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Network Testing & Diagnostics Suite
              </h1>
              <p className="text-xs text-slate-400">
                ICMP Ping, Hop-by-hop Traceroute, RFC DNS Resolver, Email Deliverability & DNSBL Blacklist Checker.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Help / Info Pill */}
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-xl">
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>All tools accept seen devices or manual IPs</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900/70 border border-slate-800 rounded-2xl overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSubTab("ping")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === "ping"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Ping Diagnostic</span>
        </button>

        <button
          onClick={() => setActiveSubTab("traceroute")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === "traceroute"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Traceroute Hops</span>
        </button>

        <button
          onClick={() => setActiveSubTab("dns")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === "dns"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>DNS Resolution</span>
        </button>

        <button
          onClick={() => {
            setActiveSubTab("dnshijack");
            if (!dnsHijackResult) handleRunDnsHijack();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === "dnshijack"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>DNS Hijacking Check</span>
        </button>

        <button
          onClick={() => setActiveSubTab("ratcheck")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === "ratcheck"
              ? "bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <span>RAT Trojan Audit</span>
        </button>

        <button
          onClick={() => setActiveSubTab("email")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === "email"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Email & Delivery Checks</span>
        </button>

        <button
          onClick={() => setActiveSubTab("blacklist")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === "blacklist"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Blacklist & Reputation</span>
        </button>
      </div>

      {/* DIAGNOSTIC TEST IN PROGRESS METER */}
      {diagProgress.active && (
        <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900/90 to-blue-950/80 border-2 border-cyan-500/50 rounded-2xl p-5 shadow-xl shadow-cyan-950/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 bg-cyan-500/20 text-cyan-300 rounded-xl border border-cyan-500/40 shrink-0">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold bg-cyan-900/70 px-2.5 py-0.5 rounded border border-cyan-400/40">
                    {diagProgress.toolName} RUNNING
                  </span>
                </div>
                <div className="text-sm font-bold text-white mt-1">
                  {diagProgress.stage}
                </div>
              </div>
            </div>

            <div className="w-full md:w-64 space-y-1.5 shrink-0">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-semibold">Test Progress:</span>
                <span className="font-bold text-cyan-300">{diagProgress.percent}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-700/80">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 rounded-full transition-all duration-300 shadow-sm shadow-cyan-400"
                  style={{ width: `${Math.max(diagProgress.percent, 8)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. PING TOOL SECTION */}
      {/* ============================================================== */}
      {activeSubTab === "ping" && (
        <div className="space-y-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              ICMP Ping Diagnostic Engine
            </h2>

            <form onSubmit={handleRunPing} className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
              <div className="md:col-span-4">
                <TargetIpSelector
                  label="Target Endpoint (IP or Hostname):"
                  value={pingTarget}
                  onChange={(val) => setPingTarget(val)}
                  devices={devices}
                  placeholder="e.g. 192.168.1.1, 8.8.8.8, or hostname"
                />
              </div>

              <div className="md:col-span-3">
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Probe Method:
                </label>
                <select
                  value={pingMode}
                  onChange={(e) => setPingMode(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                >
                  <option value="auto">Auto (ICMP + TCP Fallback)</option>
                  <option value="icmp">Strict ICMP Echo Only</option>
                  <option value="tcp">TCP Socket Latency Probe</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Packets (Count):
                </label>
                <select
                  value={pingCount}
                  onChange={(e) => setPingCount(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                >
                  <option value={2}>2 Packets (Fast)</option>
                  <option value={4}>4 Packets (Standard)</option>
                  <option value={8}>8 Packets (Detailed)</option>
                  <option value={10}>10 Packets (Deep Jitter)</option>
                </select>
              </div>

              {pingMode === "tcp" ? (
                <div className="md:col-span-1">
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Port:
                  </label>
                  <input
                    type="number"
                    value={pingPort}
                    onChange={(e) => setPingPort(e.target.value)}
                    placeholder="443"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              ) : null}

              <div className={pingMode === "tcp" ? "md:col-span-2" : "md:col-span-3"}>
                <button
                  type="submit"
                  disabled={pingLoading || !pingTarget}
                  className="w-full py-2 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-cyan-950 flex items-center justify-center gap-2"
                >
                  {pingLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Execute Ping</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Ping Results */}
          {pingResult && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      pingResult.status === "online" ? "bg-emerald-400 animate-pulse" : "bg-red-500"
                    }`}
                  />
                  <span className="font-bold text-white text-sm">
                    Ping Report for {pingResult.target}{" "}
                    {pingResult.resolved_ip && `(${pingResult.resolved_ip})`}
                  </span>
                  {pingResult.method && (
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      pingResult.method === "tcp_syn"
                        ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                        : "bg-blue-500/20 text-blue-300 border-blue-500/40"
                    }`}>
                      {pingResult.method === "tcp_syn" ? "TCP SYN (FIREWALL BYPASS)" : "ICMP ECHO"}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[11px] font-bold font-mono px-2.5 py-1 rounded-full uppercase ${
                    pingResult.quality === "excellent"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : pingResult.quality === "degraded"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-red-500/20 text-red-300 border border-red-500/40"
                  }`}
                >
                  Quality: {pingResult.quality}
                </span>
              </div>

              {/* Informative Note if TCP fallback occurred */}
              {pingResult.note && (
                <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-purple-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>{pingResult.note}</span>
                </div>
              )}

              {/* Latency Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Packet Loss</div>
                  <div
                    className={`text-xl font-bold font-mono mt-1 ${
                      pingResult.packet_loss_pct === 0
                        ? "text-emerald-400"
                        : pingResult.packet_loss_pct < 50
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}
                  >
                    {pingResult.packet_loss_pct}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {pingResult.packets_received} / {pingResult.packets_transmitted} rx
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Min RTT</div>
                  <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
                    {pingResult.rtt_min_ms || 0} ms
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Fastest reply</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Avg RTT</div>
                  <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
                    {pingResult.rtt_avg_ms || 0} ms
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Mean round trip</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Jitter / Mdev</div>
                  <div className="text-xl font-bold font-mono text-slate-300 mt-1">
                    {pingResult.rtt_mdev_ms || 0} ms
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Deviation variance</div>
                </div>
              </div>

              {/* Individual Packet Details */}
              {pingResult.packets && pingResult.packets.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 mb-2">Echo Reply Stream:</h4>
                  <div className="bg-slate-950 rounded-xl border border-slate-800 divide-y divide-slate-800/60 font-mono text-xs">
                    {pingResult.packets.map((pkt: any, i: number) => (
                      <div key={i} className="p-2.5 px-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-400 font-bold">seq={pkt.seq}</span>
                          <span className="text-slate-400">{pkt.bytes} bytes</span>
                          <span className="text-slate-500">from {pkt.from_ip}</span>
                          {pkt.probe && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded font-mono">
                              {pkt.probe}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400">ttl={pkt.ttl}</span>
                          <span className="text-cyan-400 font-bold">{pkt.time_ms} ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error or Remediation Popover Advice if packet loss */}
              {pingResult.remediation && (
                <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-300">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span>Ping Failure Resolution Guide:</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1 pl-1">
                    {pingResult.remediation.map((r: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-red-400 font-bold">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. TRACEROUTE TOOL SECTION */}
      {/* ============================================================== */}
      {activeSubTab === "traceroute" && (
        <div className="space-y-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Hop-by-Hop Traceroute Diagnostic
            </h2>

            <form onSubmit={handleRunTrace} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-7">
                <TargetIpSelector
                  label="Target Destination (IP or Hostname):"
                  value={traceTarget}
                  onChange={(val) => setTraceTarget(val)}
                  devices={devices}
                  placeholder="e.g. 8.8.8.8, 1.1.1.1, or google.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Max Hops:
                </label>
                <select
                  value={traceMaxHops}
                  onChange={(e) => setTraceMaxHops(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                >
                  <option value={10}>10 Hops</option>
                  <option value={15}>15 Hops (Standard)</option>
                  <option value={20}>20 Hops (Deep)</option>
                  <option value={30}>30 Hops (Full WAN)</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <button
                  type="submit"
                  disabled={traceLoading || !traceTarget}
                  className="w-full py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-cyan-950 flex items-center justify-center gap-2"
                >
                  {traceLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Probing Hops...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Execute Traceroute</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Traceroute Results */}
          {traceResult && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Trace Pathway to {traceResult.target}{" "}
                    <span className="text-xs text-cyan-400 font-mono">({traceResult.resolved_ip})</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Traversed {traceResult.total_hops} hops in {traceResult.duration_ms} ms.
                  </p>
                </div>
                <span
                  className={`text-[11px] font-bold font-mono px-2.5 py-1 rounded-full ${
                    traceResult.destination_reached
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  }`}
                >
                  {traceResult.destination_reached ? "Destination Reached" : "Hops Filtered / In Transit"}
                </span>
              </div>

              {/* Hop Breakdown Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="py-2.5 px-3">Hop #</th>
                      <th className="py-2.5 px-3">Node IP</th>
                      <th className="py-2.5 px-3">Reverse Hostname</th>
                      <th className="py-2.5 px-3">Latency RTT</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {traceResult.hops.map((hop: any) => (
                      <tr key={hop.hop} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-bold text-cyan-400">{hop.hop}</td>
                        <td className="py-2.5 px-3 text-white font-semibold">
                          {hop.ip === "*" ? <span className="text-slate-500">* * *</span> : hop.ip}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 truncate max-w-xs">{hop.hostname}</td>
                        <td className="py-2.5 px-3 text-cyan-300">
                          {hop.rtt_ms > 0 ? `${hop.rtt_ms} ms` : "-"}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              hop.status === "destination_reached"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : hop.status === "gateway"
                                ? "bg-cyan-500/20 text-cyan-300"
                                : hop.status === "intermediate"
                                ? "bg-slate-800 text-slate-300"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {hop.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. DNS RESOLUTION TOOL SECTION */}
      {/* ============================================================== */}
      {activeSubTab === "dns" && (
        <div className="space-y-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              RFC-Compliant DNS Resolution Engine
            </h2>

            <form onSubmit={handleRunDns} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-5">
                <TargetIpSelector
                  label="Domain or IP Address:"
                  value={dnsTarget}
                  onChange={(val) => setDnsTarget(val)}
                  devices={devices}
                  placeholder="e.g. google.com, cloudflare.com, or 8.8.8.8"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Record Type:
                </label>
                <select
                  value={dnsRecordType}
                  onChange={(e) => setDnsRecordType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                >
                  <option value="A">A (IPv4)</option>
                  <option value="AAAA">AAAA (IPv6)</option>
                  <option value="MX">MX (Mail Exchange)</option>
                  <option value="TXT">TXT (SPF / Verification)</option>
                  <option value="NS">NS (Nameservers)</option>
                  <option value="CNAME">CNAME (Alias)</option>
                  <option value="SOA">SOA (Authority)</option>
                  <option value="PTR">PTR (Reverse Lookup)</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Nameserver Resolver:
                </label>
                <select
                  value={dnsResolver}
                  onChange={(e) => setDnsResolver(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                >
                  <option value="8.8.8.8">Google (8.8.8.8)</option>
                  <option value="1.1.1.1">Cloudflare (1.1.1.1)</option>
                  <option value="9.9.9.9">Quad9 Secure (9.9.9.9)</option>
                  <option value="208.67.222.222">OpenDNS (208.67.222.222)</option>
                  <option value="system">Host System Resolver</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={dnsLoading || !dnsTarget}
                  className="w-full py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-cyan-950 flex items-center justify-center gap-2"
                >
                  {dnsLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Resolve</span>
                </button>
              </div>
            </form>
          </div>

          {/* DNS Results */}
          {dnsResult && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Query: <span className="text-cyan-400 font-mono">{dnsResult.query}</span> (Type:{" "}
                    {dnsResult.record_type})
                  </h3>
                  <p className="text-xs text-slate-400">
                    Resolver: {dnsResult.resolver} • Response Time: {dnsResult.response_time_ms} ms
                  </p>
                </div>
                <span
                  className={`text-[11px] font-bold font-mono px-2.5 py-1 rounded-full ${
                    dnsResult.status === "NOERROR"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-red-500/20 text-red-300 border border-red-500/40"
                  }`}
                >
                  {dnsResult.status}
                </span>
              </div>

              {/* Answers */}
              {dnsResult.answers && dnsResult.answers.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-300">
                    Resolved Answers ({dnsResult.answers.length}):
                  </h4>
                  <div className="bg-slate-950 rounded-xl border border-slate-800 divide-y divide-slate-800/60 font-mono text-xs">
                    {dnsResult.answers.map((ans: any, i: number) => (
                      <div key={i} className="p-3 px-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px]">
                            {ans.type}
                          </span>
                          <span className="text-white font-semibold break-all">{ans.value}</span>
                          {ans.priority !== undefined && (
                            <span className="text-slate-400 text-[10px]">
                              (Priority: {ans.priority})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-slate-400 text-[11px]">TTL: {ans.ttl}s</span>
                          <button
                            onClick={() => copyToClipboard(ans.value, `dns-${i}`)}
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                            title="Copy record"
                          >
                            {copiedKey === `dns-${i}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/60 rounded-xl border border-slate-800">
                  No records returned for query "{dnsResult.query}" of type {dnsResult.record_type}.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. EMAIL & DELIVERY CHECKS SECTION */}
      {/* ============================================================== */}
      {activeSubTab === "email" && (
        <div className="space-y-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4 text-cyan-400" />
              Email Deliverability, DNS Authentication & SMTP Port Verifier
            </h2>

            <form onSubmit={handleRunEmailCheck} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-7">
                <TargetIpSelector
                  label="Target Email Address or Domain:"
                  value={emailTarget}
                  onChange={(val) => setEmailTarget(val)}
                  devices={devices}
                  placeholder="e.g. admin@company.com or company.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  DKIM Selector:
                </label>
                <input
                  type="text"
                  value={dkimSelector}
                  onChange={(e) => setDkimSelector(e.target.value)}
                  placeholder="e.g. default, google"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="md:col-span-3">
                <button
                  type="submit"
                  disabled={emailLoading || !emailTarget}
                  className="w-full py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-cyan-950 flex items-center justify-center gap-2"
                >
                  {emailLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Auditing Deliverability...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Check Deliverability</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Email Deliverability Results */}
          {emailResult && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
              {/* Header Overview Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Deliverability Audit for{" "}
                    <span className="text-cyan-400 font-mono">{emailResult.domain}</span>
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span>Syntax RFC 5322:</span>
                    {emailResult.syntax_valid ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                      </span>
                    ) : (
                      <span className="text-red-400 font-bold flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Invalid Syntax
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-mono">Deliverability Score</div>
                    <div className="text-xl font-bold font-mono text-cyan-300">
                      {emailResult.deliverability_score} / 100
                    </div>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black font-mono shadow-inner border ${
                      emailResult.deliverability_grade === "A+" || emailResult.deliverability_grade === "A"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : emailResult.deliverability_grade === "B"
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        : emailResult.deliverability_grade === "C"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-red-500/20 text-red-300 border-red-500/40"
                    }`}
                  >
                    {emailResult.deliverability_grade}
                  </div>
                </div>
              </div>

              {/* Protocol Authentication Breakdown (MX, SPF, DMARC, DKIM) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. SPF */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      SPF (Sender Policy Framework)
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        emailResult.spf.valid
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {emailResult.spf.valid ? "CONFIGURED" : "MISSING"}
                    </span>
                  </div>
                  {emailResult.spf.valid ? (
                    <div className="text-xs space-y-1 font-mono">
                      <div className="text-slate-400 break-all bg-slate-900 p-2 rounded text-[11px]">
                        {emailResult.spf.raw}
                      </div>
                      <div className="text-cyan-300 text-[11px]">
                        Enforcement Policy: <strong>{emailResult.spf.policy}</strong>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      Domain lacks SPF authorization. Emails sent from this domain may be rejected or
                      sent to spam.
                    </p>
                  )}
                </div>

                {/* 2. DMARC */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-cyan-400" />
                      DMARC Policy
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        emailResult.dmarc.valid
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {emailResult.dmarc.valid ? "ACTIVE" : "MISSING"}
                    </span>
                  </div>
                  {emailResult.dmarc.valid ? (
                    <div className="text-xs space-y-1 font-mono">
                      <div className="text-slate-400 break-all bg-slate-900 p-2 rounded text-[11px]">
                        {emailResult.dmarc.raw}
                      </div>
                      <div className="text-cyan-300 text-[11px]">
                        Policy: <strong>p={emailResult.dmarc.policy}</strong> (Apply to:{" "}
                        {emailResult.dmarc.pct}%)
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400">
                      No DMARC record found at _dmarc.{emailResult.domain}. Receiving mailboxes cannot
                      authenticate alignment.
                    </p>
                  )}
                </div>
              </div>

              {/* Mail Exchanger (MX) & SMTP Connectivity */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-cyan-400" />
                  Primary Mail Exchangers (MX) & SMTP Port Probes:
                </h4>

                {emailResult.mx_records && emailResult.mx_records.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="py-2 px-3">Priority</th>
                          <th className="py-2 px-3">Host Exchange</th>
                          <th className="py-2 px-3">Resolved IP(s)</th>
                          <th className="py-2 px-3">TTL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {emailResult.mx_records.map((mx: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-900">
                            <td className="py-2 px-3 text-cyan-400 font-bold">{mx.priority}</td>
                            <td className="py-2 px-3 text-white font-semibold">{mx.host}</td>
                            <td className="py-2 px-3 text-slate-300">{mx.ips.join(", ") || "-"}</td>
                            <td className="py-2 px-3 text-slate-400">{mx.ttl}s</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-red-400 font-semibold">
                    No MX records found for {emailResult.domain}. Domain cannot receive incoming emails.
                  </p>
                )}

                {/* Port connectivity results */}
                {emailResult.smtp_connectivity && emailResult.smtp_connectivity.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {emailResult.smtp_connectivity.map((p: any) => (
                      <div
                        key={p.port}
                        className={`p-2.5 rounded-lg border flex items-center justify-between ${
                          p.connected
                            ? "bg-slate-900 border-emerald-500/30"
                            : "bg-slate-900/60 border-slate-800"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-white font-mono">
                            Port {p.port} ({p.service})
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {p.connected ? `Connected (${p.latency_ms} ms)` : "Filtered / Refused"}
                          </div>
                        </div>
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            p.connected ? "bg-emerald-400" : "bg-slate-600"
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Remediation & Recommendations Checklist */}
              {emailResult.recommendations && emailResult.recommendations.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Deliverability Improvement Checklist:</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 pl-1 font-sans">
                    {emailResult.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold shrink-0 font-mono">{idx + 1}.</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. BLACKLIST & REPUTATION SECTION */}
      {/* ============================================================== */}
      {activeSubTab === "blacklist" && (
        <div className="space-y-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              Public IP, Domain & Email DNSBL Blacklist Audit
            </h2>

            <form onSubmit={handleRunBlacklist} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-8">
                <TargetIpSelector
                  label="Target Public IP, Domain, or Email:"
                  value={blacklistTarget}
                  onChange={(val) => setBlacklistTarget(val)}
                  devices={devices}
                  placeholder="e.g. 8.8.8.8, mydomain.com, or user@example.com"
                />
              </div>

              <div className="md:col-span-4">
                <button
                  type="submit"
                  disabled={blacklistLoading || !blacklistTarget}
                  className="w-full py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-cyan-950 flex items-center justify-center gap-2"
                >
                  {blacklistLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Auditing Databases...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Check Blacklists</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Blacklist Results */}
          {blacklistResult && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Reputation Verdict for{" "}
                    <span className="text-cyan-400 font-mono">{blacklistResult.target}</span>
                  </h3>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-2 font-mono">
                    {blacklistResult.target_ip && <span>IP: {blacklistResult.target_ip}</span>}
                    {blacklistResult.ptr_record && (
                      <span>• Reverse PTR: {blacklistResult.ptr_record}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold font-mono px-3 py-1.5 rounded-xl uppercase tracking-wider ${
                      blacklistResult.reputation === "CLEAN"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : blacklistResult.reputation === "NEUTRAL"
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                        : "bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse"
                    }`}
                  >
                    Reputation: {blacklistResult.reputation}
                  </span>
                </div>
              </div>

              {/* Counters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Databases Checked</div>
                  <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
                    {blacklistResult.total_checked}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Authoritative DNSBL lists</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Clean Databases</div>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                    {blacklistResult.clean_count}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Zero listings found</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-mono uppercase">Blacklist Hits</div>
                  <div
                    className={`text-xl font-bold font-mono mt-1 ${
                      blacklistResult.listed_count > 0 ? "text-red-400 font-extrabold" : "text-slate-400"
                    }`}
                  >
                    {blacklistResult.listed_count}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {blacklistResult.listed_count === 0 ? "Good standing" : "Flagged in lists"}
                  </div>
                </div>
              </div>

              {/* DNSBL Breakdown Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="py-2.5 px-3">Database Provider</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Latency</th>
                      <th className="py-2.5 px-3">Resolution / Delist</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {blacklistResult.checks.map((chk: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-bold text-white">{chk.provider}</td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">{chk.category}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              chk.is_listed
                                ? "bg-red-500/20 text-red-300 border border-red-500/40"
                                : "bg-emerald-500/20 text-emerald-300"
                            }`}
                          >
                            {chk.is_listed ? "LISTED" : "CLEAN"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{chk.response_time_ms} ms</td>
                        <td className="py-2.5 px-3">
                          {chk.is_listed ? (
                            <a
                              href={chk.delist_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-red-300 hover:text-white underline flex items-center gap-1 font-semibold"
                            >
                              <span>Delist Request</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-500">Not listed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. DNS HIJACKING & POISONING DETECTION SECTION */}
      {/* ============================================================== */}
      {activeSubTab === "dnshijack" && (
        <div className="space-y-5">
          {/* Action / Trigger Banner */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>DNS Hijacking, Poisoning & Port 53 Transparent Interception Probe</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Multi-tier test for NXDOMAIN spoofing, canary reference divergence, ISP port 53 transparent interception, and DNSSEC validation
              </p>
            </div>

            <button
              onClick={handleRunDnsHijack}
              disabled={dnsHijackLoading}
              className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors shrink-0 shadow"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${dnsHijackLoading ? "animate-spin" : ""}`} />
              <span>{dnsHijackLoading ? "Probing DNS Vectors..." : "Re-Run DNS Hijack Audit"}</span>
            </button>
          </div>

          {dnsHijackResult && (
            <div className="space-y-5">
              {/* Executive Status Banner */}
              <div
                className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  dnsHijackResult.is_hijacked
                    ? "bg-red-950/30 border-red-500/60"
                    : dnsHijackResult.is_intercepted
                    ? "bg-amber-950/30 border-amber-500/50"
                    : "bg-emerald-950/20 border-emerald-500/40"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span
                    className={`p-3 rounded-xl ${
                      dnsHijackResult.is_hijacked
                        ? "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse"
                        : dnsHijackResult.is_intercepted
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    }`}
                  >
                    {dnsHijackResult.is_hijacked ? (
                      <ShieldAlert className="w-7 h-7" />
                    ) : (
                      <ShieldCheck className="w-7 h-7" />
                    )}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {dnsHijackResult.health_status}
                      </h3>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          dnsHijackResult.badge_color === "red"
                            ? "bg-red-500/30 text-red-200 border border-red-500/50"
                            : dnsHijackResult.badge_color === "amber"
                            ? "bg-amber-500/30 text-amber-200 border border-amber-500/50"
                            : "bg-emerald-500/30 text-emerald-200 border border-emerald-500/50"
                        }`}
                      >
                        {dnsHijackResult.badge_color === "red" ? "Action Needed" : "Verified"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 mt-1">
                      Audited in {dnsHijackResult.duration_ms} ms · Egress:{" "}
                      <span className="font-mono text-cyan-300 font-bold">
                        {dnsHijackResult.probes.upstream?.egress_public_ip || "Direct"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 font-medium block">
                      Integrity Health Score
                    </span>
                    <div
                      className={`text-2xl font-bold font-mono ${
                        dnsHijackResult.health_score >= 90
                          ? "text-emerald-400"
                          : dnsHijackResult.health_score >= 70
                          ? "text-amber-400"
                          : "text-red-400 font-extrabold"
                      }`}
                    >
                      {dnsHijackResult.health_score} / 100
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Probe Vector Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. NXDOMAIN Probe */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-cyan-400" />
                      <span>NXDOMAIN Poisoning Check</span>
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        dnsHijackResult.probes.nxdomain.is_hijacked
                          ? "bg-red-500/20 text-red-300 border border-red-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      }`}
                    >
                      {dnsHijackResult.probes.nxdomain.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {dnsHijackResult.probes.nxdomain.description}
                  </p>
                  {dnsHijackResult.probes.nxdomain.rogue_ips.length > 0 && (
                    <div className="text-[11px] font-mono text-red-300 bg-red-950/30 p-2 rounded border border-red-500/30">
                      Rogue IP(s) returned: {dnsHijackResult.probes.nxdomain.rogue_ips.join(", ")}
                    </div>
                  )}
                </div>

                {/* 2. Transparent Port 53 Interception */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-cyan-400" />
                      <span>Port 53 Transparent Interception</span>
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        dnsHijackResult.probes.transparent_proxy.is_intercepted
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      }`}
                    >
                      {dnsHijackResult.probes.transparent_proxy.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {dnsHijackResult.probes.transparent_proxy.description}
                  </p>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Targeted documentation IP: {dnsHijackResult.probes.transparent_proxy.target_dummy_ip}
                  </div>
                </div>

                {/* 3. Canary Domain Integrity */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Canary Domain Spoofing Probe</span>
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        dnsHijackResult.probes.canary.is_spoofed
                          ? "bg-red-500/20 text-red-300 border border-red-500/40"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      }`}
                    >
                      {dnsHijackResult.probes.canary.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {dnsHijackResult.probes.canary.description}
                  </p>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Compared against Cloudflare (1.1.1.1) and Google (8.8.8.8)
                  </div>
                </div>

                {/* 4. DNSSEC Cryptographic Validation */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-400" />
                      <span>DNSSEC Cryptographic Validation</span>
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        dnsHijackResult.probes.dnssec.dnssec_enforced
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      }`}
                    >
                      {dnsHijackResult.probes.dnssec.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {dnsHijackResult.probes.dnssec.description}
                  </p>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Probe endpoint: dnssec-failed.org
                  </div>
                </div>
              </div>

              {/* Canary Domains Detailed Comparison Table */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Canary Benchmark Resolution Alignment Table
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                        <th className="py-2 px-3">Benchmark Domain</th>
                        <th className="py-2 px-3">Local System Resolved IP</th>
                        <th className="py-2 px-3">Cloudflare (1.1.1.1)</th>
                        <th className="py-2 px-3">Google (8.8.8.8)</th>
                        <th className="py-2 px-3">Alignment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {dnsHijackResult.probes.canary.canary_results.map((c: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-bold text-white">{c.domain}</td>
                          <td className="py-2.5 px-3 text-cyan-300 font-bold">
                            {c.local_resolved_ips.slice(0, 2).join(", ") || "NXDOMAIN"}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">
                            {c.trusted_cloudflare_ips.slice(0, 2).join(", ") || "None"}
                          </td>
                          <td className="py-2.5 px-3 text-slate-300">
                            {c.trusted_google_ips.slice(0, 2).join(", ") || "None"}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                c.status === "ALIGNED"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-red-500/20 text-red-300 border border-red-500/40"
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actionable Remediation Checklist */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span>Security Recommendations & Remediation Checklist</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {dnsHijackResult.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-cyan-400 font-mono font-bold">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. RAT TROJAN & BACKDOOR CHECK SECTION */}
      {/* ============================================================== */}
      {activeSubTab === "ratcheck" && (
        <RatDetectorView
          devices={devices}
          onToggleQuarantine={onToggleQuarantine || (() => {})}
          showToast={showToast}
        />
      )}
    </div>
  );
};

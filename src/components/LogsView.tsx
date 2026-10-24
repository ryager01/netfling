import React, { useState, useEffect, useRef } from "react";
import {
  Terminal,
  Bug,
  Info,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  Search,
  Download,
  Trash2,
  Sliders,
  CheckCircle2,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Zap,
  Activity,
  Layers,
  FileText,
  Filter,
  Eye,
  Play,
  Pause,
  X,
} from "lucide-react";

export interface SystemLogItem {
  id: number;
  timestamp: string;
  level: "DEBUG" | "INFO" | "WARN" | "WARNING" | "ERROR" | "CRITICAL";
  category: string;
  module: string;
  message: string;
  details?: Record<string, any>;
  ip?: string;
  mac?: string;
  traceback?: string;
}

export interface LogStats {
  total_logs: number;
  debug_count: number;
  info_count: number;
  warn_count: number;
  error_count: number;
  by_level: Record<string, number>;
  by_category: Record<string, number>;
  last_log_timestamp?: string | null;
  verbose_debug_enabled?: boolean;
}

interface LogsViewProps {
  showToast: (msg: string) => void;
}

export const LogsView: React.FC<LogsViewProps> = ({ showToast }) => {
  const [logs, setLogs] = useState<SystemLogItem[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"table" | "terminal">("table");
  const [selectedLog, setSelectedLog] = useState<SystemLogItem | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [verboseDebug, setVerboseDebug] = useState<boolean>(true);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Fetch logs and stats
  const fetchLogs = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (selectedLevel !== "ALL") params.append("level", selectedLevel);
      if (selectedCategory !== "ALL") params.append("category", selectedCategory);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      params.append("limit", "500");

      const [logsRes, statsRes] = await Promise.all([
        fetch(`/api/logs?${params.toString()}`),
        fetch("/api/logs/stats"),
      ]);

      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(Array.isArray(data) ? data : data.logs || []);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
        if (typeof statsData.verbose_debug_enabled === "boolean") {
          setVerboseDebug(statsData.verbose_debug_enabled);
        }
      }
    } catch {
      if (!silent) showToast("Error connecting to NetSentinel logging bus.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs(false);
  }, [selectedLevel, selectedCategory]);

  // Live polling effect
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 2500);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedLevel, selectedCategory, searchQuery]);

  // Trigger test debug logs
  const handleTriggerTestLog = async () => {
    try {
      const res = await fetch("/api/logs/test", { method: "POST" });
      if (res.ok) {
        showToast("Emitted test DEBUG, INFO, WARN, and ERROR telemetry entries.");
        fetchLogs(false);
      } else {
        showToast("Failed to trigger test log entries.");
      }
    } catch {
      showToast("Network error emitting test logs.");
    }
  };

  // Toggle verbose debug mode
  const handleToggleVerboseDebug = async () => {
    const nextState = !verboseDebug;
    setVerboseDebug(nextState);
    try {
      const res = await fetch("/api/logs/debug-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextState }),
      });
      if (res.ok) {
        showToast(`Verbose debug logging ${nextState ? "ENABLED" : "DISABLED"}`);
        fetchLogs(true);
      }
    } catch {
      showToast("Error updating debug mode.");
    }
  };

  // Clear logs
  const handleClearLogs = async () => {
    if (!window.confirm("Are you sure you want to clear all system and debug logs?")) return;
    try {
      const res = await fetch("/api/logs", { method: "DELETE" });
      if (res.ok) {
        setLogs([]);
        showToast("All system and debug logs cleared.");
        fetchLogs(false);
      } else {
        showToast("Failed to clear logs.");
      }
    } catch {
      showToast("Error clearing logs.");
    }
  };

  // Export logs
  const handleExportLogs = (format: "log" | "json") => {
    window.open(`/api/logs/export?format=${format}`, "_blank");
    showToast(`Downloading NetSentinel logs export (${format.toUpperCase()})...`);
  };

  // Copy log entry
  const handleCopyLog = (log: SystemLogItem) => {
    const text = `[${log.timestamp}] [${log.level}] [${log.category}/${log.module}] ${log.message} ${
      log.ip ? `IP: ${log.ip}` : ""
    } ${log.details ? JSON.stringify(log.details) : ""} ${log.traceback || ""}`;
    navigator.clipboard.writeText(text);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast("Log entry copied to clipboard.");
  };

  // Level Badge Styling
  const renderLevelBadge = (level: string) => {
    const l = level.toUpperCase();
    if (l === "DEBUG") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
          <Bug className="w-3 h-3 text-purple-400" />
          DEBUG
        </span>
      );
    }
    if (l === "INFO") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
          <Info className="w-3 h-3 text-cyan-400" />
          INFO
        </span>
      );
    }
    if (l === "WARN" || l === "WARNING") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          WARN
        </span>
      );
    }
    if (l === "ERROR" || l === "CRITICAL") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
          <AlertOctagon className="w-3 h-3 text-rose-400" />
          ERROR
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300">
        {level}
      </span>
    );
  };

  // Category Badge Styling
  const renderCategoryBadge = (category: string) => {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-300">
        {category}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold bg-purple-950/70 px-2 py-0.5 rounded border border-purple-500/30">
                SYSTEM TELEMETRY & DEBUG CONSOLE
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <span
                  className={`w-2 h-2 rounded-full ${
                    autoRefresh ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                  }`}
                />
                {autoRefresh ? "Live Streaming" : "Stream Paused"}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-purple-400" />
              Unified System & Debugging Logs
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Real-time inspection of all operating system logs, raw socket sweeps, multi-threaded
              port probes, Wi-Fi spectrum telemetry, background daemon tasks, and API traces.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
                autoRefresh
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750"
              }`}
              title={autoRefresh ? "Pause Live Stream" : "Resume Live Stream"}
            >
              {autoRefresh ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{autoRefresh ? "Live: ON" : "Live: OFF"}</span>
            </button>

            <button
              onClick={() => fetchLogs(false)}
              disabled={isRefreshing}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleTriggerTestLog}
              className="px-3 py-1.5 text-xs font-semibold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              title="Emit test DEBUG, INFO, WARN, and ERROR entries"
            >
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>Emit Test Logs</span>
            </button>

            <button
              onClick={handleToggleVerboseDebug}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
                verboseDebug
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
              title="Toggle verbose raw packet and socket debugging"
            >
              <Bug className="w-3.5 h-3.5" />
              <span>Debug Mode: {verboseDebug ? "Verbose" : "Standard"}</span>
            </button>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleExportLogs("log")}
                className="px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-lg flex items-center gap-1"
                title="Download formatted .log file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>.LOG</span>
              </button>
              <button
                onClick={() => handleExportLogs("json")}
                className="px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 rounded-lg flex items-center gap-1"
                title="Download structured JSON"
              >
                <Download className="w-3.5 h-3.5" />
                <span>JSON</span>
              </button>
            </div>

            <button
              onClick={handleClearLogs}
              className="px-2.5 py-1.5 text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg flex items-center gap-1 transition-colors"
              title="Clear all logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Telemetry Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-xl">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Total Logs</span>
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {stats?.total_logs ?? logs.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Stored events in memory & DB</div>
          </div>

          <div
            onClick={() => setSelectedLevel("DEBUG")}
            className={`cursor-pointer bg-slate-950/70 border p-3.5 rounded-xl transition-all ${
              selectedLevel === "DEBUG"
                ? "border-purple-500 bg-purple-950/30"
                : "border-slate-800/80 hover:border-purple-500/40"
            }`}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-purple-400 flex items-center justify-between">
              <span>DEBUG LOGS</span>
              <Bug className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-xl font-bold font-mono text-purple-300 mt-1">
              {stats?.debug_count ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Raw sockets, traces & args</div>
          </div>

          <div
            onClick={() => setSelectedLevel("INFO")}
            className={`cursor-pointer bg-slate-950/70 border p-3.5 rounded-xl transition-all ${
              selectedLevel === "INFO"
                ? "border-cyan-500 bg-cyan-950/30"
                : "border-slate-800/80 hover:border-cyan-500/40"
            }`}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 flex items-center justify-between">
              <span>INFO LOGS</span>
              <Info className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
              {stats?.info_count ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Sweeps & completions</div>
          </div>

          <div
            onClick={() => setSelectedLevel("WARN")}
            className={`cursor-pointer bg-slate-950/70 border p-3.5 rounded-xl transition-all ${
              selectedLevel === "WARN"
                ? "border-amber-500 bg-amber-950/30"
                : "border-slate-800/80 hover:border-amber-500/40"
            }`}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 flex items-center justify-between">
              <span>WARNINGS</span>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold font-mono text-amber-300 mt-1">
              {stats?.warn_count ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">High latency & congestion</div>
          </div>

          <div
            onClick={() => setSelectedLevel("ERROR")}
            className={`cursor-pointer bg-slate-950/70 border p-3.5 rounded-xl transition-all ${
              selectedLevel === "ERROR"
                ? "border-rose-500 bg-rose-950/30"
                : "border-slate-800/80 hover:border-rose-500/40"
            }`}
          >
            <div className="text-[10px] font-mono uppercase tracking-wider text-rose-400 flex items-center justify-between">
              <span>ERRORS</span>
              <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-xl font-bold font-mono text-rose-300 mt-1">
              {stats?.error_count ?? 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Socket & connection failures</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Level Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {["ALL", "DEBUG", "INFO", "WARN", "ERROR"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all shrink-0 ${
                  selectedLevel === lvl
                    ? lvl === "DEBUG"
                      ? "bg-purple-500/25 text-purple-200 border border-purple-500/50"
                      : lvl === "INFO"
                      ? "bg-cyan-500/25 text-cyan-200 border border-cyan-500/50"
                      : lvl === "WARN"
                      ? "bg-amber-500/25 text-amber-200 border border-amber-500/50"
                      : lvl === "ERROR"
                      ? "bg-rose-500/25 text-rose-200 border border-rose-500/50"
                      : "bg-slate-700 text-white border border-slate-600"
                    : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-white"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter logs by keyword, module, IP, or message..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Dropdown & View Mode */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-purple-500 font-mono"
            >
              <option value="ALL">All Categories</option>
              <option value="network_scan">Network Scan (ARP/ICMP)</option>
              <option value="port_scan">Port Scan & Prober</option>
              <option value="wifi">Wi-Fi Spectrum & Saturation</option>
              <option value="api">API HTTP Gateway</option>
              <option value="surveillance">Surveillance & Cameras</option>
              <option value="security">Security & Alerts</option>
              <option value="daemon">Daemon Service</option>
              <option value="database">Database & WAL</option>
              <option value="system">System Kernel</option>
            </select>

            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("table")}
                className={`px-2.5 py-1 text-xs font-medium rounded ${
                  viewMode === "table" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode("terminal")}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded ${
                  viewMode === "terminal" ? "bg-purple-950/80 text-purple-300 border border-purple-500/40" : "text-slate-400 hover:text-white"
                }`}
              >
                Raw Terminal
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Logs View Container */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {isLoading && logs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-7 h-7 text-purple-400 animate-spin mx-auto" />
            <div className="text-sm font-semibold text-white">Loading System Logs...</div>
            <div className="text-xs text-slate-500">Querying SQLite database & in-memory stream</div>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Terminal className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-semibold text-slate-300">No logs found matching filter</div>
            <div className="text-xs text-slate-500">
              Try switching level to "ALL", clearing the search box, or emit test logs.
            </div>
            <button
              onClick={handleTriggerTestLog}
              className="mt-2 px-3 py-1.5 text-xs font-semibold bg-purple-500/20 text-purple-300 rounded border border-purple-500/40 hover:bg-purple-500/30"
            >
              Emit Test Debug Logs
            </button>
          </div>
        ) : viewMode === "terminal" ? (
          /* RAW TERMINAL VIEW */
          <div className="bg-slate-950 p-4 font-mono text-xs overflow-x-auto max-h-[600px] overflow-y-auto space-y-1">
            {logs.map((log) => {
              const lvl = log.level.toUpperCase();
              const colorClass =
                lvl === "DEBUG"
                  ? "text-purple-400"
                  : lvl === "INFO"
                  ? "text-cyan-300"
                  : lvl === "WARN" || lvl === "WARNING"
                  ? "text-amber-400 font-semibold"
                  : "text-rose-400 font-bold";

              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="hover:bg-slate-900/80 p-1 rounded cursor-pointer transition-colors flex items-start gap-2 group"
                >
                  <span className="text-slate-600 select-none">{log.id}</span>
                  <span className="text-slate-500 select-none">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`w-14 shrink-0 font-bold ${colorClass}`}>[{lvl}]</span>
                  <span className="text-slate-400 w-28 truncate shrink-0">[{log.module}]</span>
                  <span className="text-slate-200 flex-1 break-words">{log.message}</span>
                  {log.ip && <span className="text-emerald-400 text-[11px] shrink-0">ip={log.ip}</span>}
                  {log.details && Object.keys(log.details).length > 0 && (
                    <span className="text-slate-500 text-[10px] group-hover:text-purple-300 shrink-0">
                      [+details]
                    </span>
                  )}
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        ) : (
          /* STRUCTURED TABLE VIEW */
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950/80 sticky top-0 z-10 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                <tr>
                  <th className="py-2.5 px-3 w-16 text-slate-500">ID</th>
                  <th className="py-2.5 px-3 w-28">Timestamp</th>
                  <th className="py-2.5 px-3 w-24">Level</th>
                  <th className="py-2.5 px-3 w-28">Category</th>
                  <th className="py-2.5 px-3 w-28">Module</th>
                  <th className="py-2.5 px-4">Message & Telemetry Details</th>
                  <th className="py-2.5 px-3 w-28">Target IP</th>
                  <th className="py-2.5 px-3 w-20 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{log.id}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">{renderLevelBadge(log.level)}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">{renderCategoryBadge(log.category)}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300">
                      {log.module}
                    </td>
                    <td className="py-2.5 px-4 text-slate-200">
                      <div className="line-clamp-2 text-xs font-mono">{log.message}</div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="text-[10px] font-mono text-purple-400/90 mt-0.5 line-clamp-1">
                          payload: {JSON.stringify(log.details)}
                        </div>
                      )}
                      {log.traceback && (
                        <div className="text-[10px] font-mono text-rose-400 mt-0.5 flex items-center gap-1">
                          <AlertOctagon className="w-3 h-3" /> Stack traceback attached
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-emerald-400 whitespace-nowrap">
                      {log.ip || <span className="text-slate-600">—</span>}
                    </td>
                    <td
                      className="py-2.5 px-3 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleCopyLog(log)}
                          className="p-1 text-slate-500 hover:text-white rounded hover:bg-slate-850"
                          title="Copy raw log line"
                        >
                          {copiedId === log.id ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1 text-slate-500 hover:text-purple-300 rounded hover:bg-slate-850"
                          title="Inspect complete log payload & traceback"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INSPECTOR MODAL: Full Detailed Log Payload & Traceback */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/30">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white">Log #{selectedLog.id}</span>
                    {renderLevelBadge(selectedLog.level)}
                    {renderCategoryBadge(selectedLog.category)}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Module: <strong className="text-slate-200">{selectedLog.module}</strong> •{" "}
                    {new Date(selectedLog.timestamp).toISOString()}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 font-sans text-xs">
              {/* Message */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                  Message
                </label>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-slate-200 text-xs break-words whitespace-pre-wrap select-text">
                  {selectedLog.message}
                </div>
              </div>

              {/* IP / MAC */}
              {(selectedLog.ip || selectedLog.mac) && (
                <div className="grid grid-cols-2 gap-3">
                  {selectedLog.ip && (
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400 block">Target IP</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {selectedLog.ip}
                      </span>
                    </div>
                  )}
                  {selectedLog.mac && (
                    <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400 block">Hardware MAC</span>
                      <span className="text-xs font-mono font-bold text-cyan-300">
                        {selectedLog.mac}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* JSON Details */}
              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-semibold block mb-1">
                    Structured Debug Telemetry & Args
                  </label>
                  <pre className="p-3 bg-slate-950 rounded-xl border border-purple-500/30 font-mono text-purple-200 text-[11px] overflow-x-auto max-h-48 select-text">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

              {/* Traceback */}
              {selectedLog.traceback && (
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-semibold block mb-1">
                    Exception Stack Trace
                  </label>
                  <pre className="p-3 bg-rose-950/40 rounded-xl border border-rose-500/40 font-mono text-rose-200 text-[11px] overflow-x-auto max-h-56 select-text whitespace-pre-wrap">
                    {selectedLog.traceback}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
              <button
                onClick={() => handleCopyLog(selectedLog)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Full Entry</span>
              </button>

              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-purple-500 hover:bg-purple-400 text-slate-950 rounded-lg transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

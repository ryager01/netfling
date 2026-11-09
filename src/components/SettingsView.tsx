import React, { useState, useEffect } from "react";
import {
  Settings,
  Mail,
  Cpu,
  HardDrive,
  Database,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
  RefreshCw,
  Send,
  Download,
  Folder,
  Layers,
  Zap,
  Shield,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  CheckCircle2,
  Trash2,
  Server,
  Archive,
  Wifi,
  Globe,
  Radio,
  ArrowRight,
  AlertTriangle,
  Compass,
  X,
} from "lucide-react";

interface SettingsViewProps {
  showToast: (msg: string) => void;
  onRefreshDevices?: () => void;
  onOpenGuidedSetup?: () => void;
}

interface BackupItem {
  filename: string;
  path: string;
  size_bytes: number;
  size_kb: number;
  created_at: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  showToast,
  onRefreshDevices,
  onOpenGuidedSetup,
}) => {
  const [activeTab, setActiveTab] = useState<"network" | "email" | "threads" | "storage" | "backup">("network");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Email Test state
  const [isTestingEmail, setIsTestingEmail] = useState<boolean>(false);
  const [emailTestResult, setEmailTestResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    diagnostics?: string[];
  } | null>(null);

  // Backup state
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [backupProgress, setBackupProgress] = useState<{ active: boolean; stage: string; percent: number }>({
    active: false,
    stage: "",
    percent: 0,
  });
  const [backupsList, setBackupsList] = useState<BackupItem[]>([]);
  const [latestBackup, setLatestBackup] = useState<any | null>(null);

  // Database Wipe & Network Reset State
  const [showResetDbModal, setShowResetDbModal] = useState<boolean>(false);
  const [isResettingDb, setIsResettingDb] = useState<boolean>(false);
  const [resetClearCanvas, setResetClearCanvas] = useState<boolean>(true);
  const [resetClearSettings, setResetClearSettings] = useState<boolean>(false);
  const [resetConfirmInput, setResetConfirmInput] = useState<string>("");

  // Network Adapters state
  const [detectedSubnets, setDetectedSubnets] = useState<any[]>([]);
  const [networkDevices, setNetworkDevices] = useState<any[]>([]);
  const [allGateways, setAllGateways] = useState<string[]>([]);
  const [currentNetworkEnv, setCurrentNetworkEnv] = useState<any | null>(null);
  const [isLoadingSubnets, setIsLoadingSubnets] = useState<boolean>(false);

  // Form State
  const [settings, setSettings] = useState({
    network: {
      custom_gateway: "",
      custom_subnet: "",
      custom_interface: "",
      auto_detect: true,
    },
    email: {
      enabled: false,
      smtp_host: "smtp.gmail.com",
      smtp_port: 587,
      encryption: "tls",
      smtp_user: "",
      smtp_password: "",
      sender_address: "alerts@netsentinel.local",
      recipient_addresses: "",
      notify_on_intruder: true,
      notify_on_high_risk_port: true,
      notify_on_dns_hijack: true,
      notify_on_rat: true,
      notify_on_new_camera: true,
      notify_on_outage: false,
    },
    threads: {
      discovery_threads: 40,
      port_scan_threads: 100,
      rat_scan_threads: 50,
      dns_threads: 10,
      socket_timeout_ms: 300,
      inter_packet_delay_ms: 0,
      max_concurrent_connections: 256,
    },
    storage: {
      db_path: "~/.netsentinel/netsentinel.db",
      log_dir: "/var/log/netsentinel",
      snapshot_dir: "/var/log/netsentinel/captures",
      export_dir: "/var/log/netsentinel/exports",
      auto_purge_days: 30,
    },
    backup: {
      backup_dir: "/var/backups/netsentinel",
      auto_backup_enabled: true,
      backup_schedule: "daily",
      retention_count: 7,
      cloud_target: "sftp://backup.internal.lan/netsentinel",
    },
  });

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
    fetchBackups();
    fetchNetworkInterfaces();
  }, []);

  const fallbackSubnetsList = [
    { cidr: "192.168.1.0/24", label: "Primary LAN (192.168.1.0/24)", interface: "Wi-Fi/Ethernet", is_primary: true, recommended: true },
    { cidr: "192.168.0.0/24", label: "TP-Link / Netgear LAN (192.168.0.0/24)", interface: "Secondary LAN", is_primary: false, recommended: true },
    { cidr: "10.0.0.0/24", label: "Xfinity / Comcast / AT&T Fiber (10.0.0.0/24)", interface: "Cable/Fiber LAN", is_primary: false, recommended: false },
    { cidr: "192.168.50.0/24", label: "ASUS RT / ROG Router LAN (192.168.50.0/24)", interface: "ASUS LAN", is_primary: false, recommended: false },
  ];

  const fetchNetworkInterfaces = async () => {
    setIsLoadingSubnets(true);
    try {
      const res = await fetch("/api/network-interfaces");
      if (res.ok) {
        const data = await res.json();
        if (data.devices && Array.isArray(data.devices)) {
          setNetworkDevices(data.devices);
        }
        if (data.all_gateways && Array.isArray(data.all_gateways)) {
          setAllGateways(data.all_gateways);
        }
        if (data.subnets && Array.isArray(data.subnets) && data.subnets.length > 0) {
          setDetectedSubnets(data.subnets);
        } else {
          setDetectedSubnets(fallbackSubnetsList);
        }
        if (data.current) setCurrentNetworkEnv(data.current);
      } else {
        setDetectedSubnets(fallbackSubnetsList);
      }
    } catch {
      setDetectedSubnets(fallbackSubnetsList);
    } finally {
      setIsLoadingSubnets(false);
    }
  };

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings((prev) => ({
          network: { ...prev.network, ...(data.network || {}) },
          email: { ...prev.email, ...(data.email || {}) },
          threads: { ...prev.threads, ...(data.threads || {}) },
          storage: { ...prev.storage, ...(data.storage || {}) },
          backup: { ...prev.backup, ...(data.backup || {}) },
        }));
      }
    } catch {
      showToast("Could not load stored configuration, using defaults.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBackups = async () => {
    try {
      const res = await fetch("/api/settings/backups");
      if (res.ok) {
        const data = await res.json();
        setBackupsList(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignore
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
        }
        showToast("System configuration successfully saved!");
        if (onRefreshDevices) onRefreshDevices();
      } else {
        showToast("Failed to save settings to server.");
      }
    } catch (err: any) {
      showToast(`Error saving settings: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setIsTestingEmail(true);
    setEmailTestResult(null);
    try {
      const res = await fetch("/api/settings/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings.email),
      });
      const data = await res.json();
      setEmailTestResult(data);
      if (data.success) {
        showToast("SMTP handshake & test notification succeeded!");
      } else {
        showToast(`SMTP test failed: ${data.error || "Connection error"}`);
      }
    } catch (err: any) {
      setEmailTestResult({
        success: false,
        error: err.message,
        diagnostics: ["Network exception while contacting /api/settings/test-email"],
      });
      showToast(`Email test error: ${err.message}`);
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleResetFirstRun = async () => {
    try {
      localStorage.removeItem("netsentinel_first_run_completed");
      await fetch("/api/first-run/reset", { method: "POST" });
      showToast("First-run flag cleared! Setup wizard will auto-launch next time the application opens.");
    } catch {
      showToast("Failed to reset first run flag.");
    }
  };

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    setBackupProgress({ active: true, stage: "Locking database WAL write buffer...", percent: 20 });
    let pct = 20;
    const timer = setInterval(() => {
      pct += 15;
      if (pct > 90) pct = 90;
      let stage = "Compressing tables & serializing inventory...";
      if (pct > 60) stage = "Writing timestamped archive to disk...";
      setBackupProgress({ active: true, stage, percent: pct });
    }, 180);

    try {
      const res = await fetch("/api/settings/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backup_dir: settings.backup.backup_dir }),
      });
      clearInterval(timer);
      const data = await res.json();
      if (data.success) {
        setBackupProgress({ active: true, stage: `Backup created: ${data.filename}`, percent: 100 });
        setLatestBackup(data);
        showToast(`Instant backup created: ${data.filename} (${data.size_kb} KB)`);
        fetchBackups();
      } else {
        showToast(`Backup error: ${data.error || "Failed to create snapshot"}`);
      }
    } catch (err: any) {
      clearInterval(timer);
      showToast(`Backup failed: ${err.message}`);
    } finally {
      setIsBackingUp(false);
      setTimeout(() => {
        setBackupProgress({ active: false, stage: "", percent: 0 });
      }, 1000);
    }
  };

  const handleResetThreads = () => {
    setSettings((prev) => ({
      ...prev,
      threads: {
        discovery_threads: 40,
        port_scan_threads: 100,
        rat_scan_threads: 50,
        dns_threads: 10,
        socket_timeout_ms: 300,
        inter_packet_delay_ms: 0,
        max_concurrent_connections: 256,
      },
    }));
    showToast("Thread pool reset to recommended values (Save to apply).");
  };

  const handleResetDatabase = async () => {
    setIsResettingDb(true);
    try {
      const res = await fetch("/api/database/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clear_canvas: resetClearCanvas,
          clear_settings: resetClearSettings,
        }),
      });
      if (res.ok) {
        localStorage.removeItem("netsentinel_first_run_completed");
        showToast("Database reset to blank! Network inventory & telemetry cleared.");
        setShowResetDbModal(false);
        setResetConfirmInput("");
        if (onRefreshDevices) onRefreshDevices();
        fetchBackups();
      } else {
        const data = await res.json();
        showToast(`Database reset failed: ${data.error || "Server error"}`);
      }
    } catch (err: any) {
      showToast(`Error resetting database: ${err.message}`);
    } finally {
      setIsResettingDb(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
        <span className="text-sm text-slate-400">Loading system settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive Header */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
              System Configuration & Engine Tuning
            </div>
            <h1 className="text-xl font-bold text-white mt-1">Application Control Center & Settings</h1>
            <p className="text-xs text-slate-400 mt-1">
              Configure SMTP email alerting, multi-threaded scan concurrency, persistent storage paths, and automated disaster recovery backups.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving Configuration..." : "Save Settings"}
            </button>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab("network")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === "network"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <Wifi className="w-4 h-4 text-cyan-400" />
            <span>Network & Gateway</span>
          </button>

          <button
            onClick={() => setActiveTab("email")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === "email"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <Mail className="w-4 h-4 text-cyan-400" />
            <span>Email Notifications</span>
          </button>

          <button
            onClick={() => setActiveTab("threads")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === "threads"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Thread & Concurrency Optimizer</span>
          </button>

          <button
            onClick={() => setActiveTab("storage")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === "storage"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <HardDrive className="w-4 h-4 text-amber-400" />
            <span>Storage Locations</span>
          </button>

          <button
            onClick={() => setActiveTab("backup")}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
              activeTab === "backup"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <Database className="w-4 h-4 text-purple-400" />
            <span>Backup & Disaster Recovery</span>
          </button>
        </div>

        {/* SECTION 0: NETWORK & GATEWAY CONFIGURATION */}
        {activeTab === "network" && (
          <div className="pt-6 space-y-6">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-cyan-400" />
                    Network Gateway & Subnet Topology
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Define the default gateway router IP and subnet range for active asset discovery and router vulnerability audits.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fetchNetworkInterfaces}
                    disabled={isLoadingSubnets}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSubnets ? "animate-spin" : ""}`} />
                    <span>Detect Interfaces</span>
                  </button>
                </div>
              </div>

              {/* Loopback Warning if 127.0.0.1 */}
              {(currentNetworkEnv?.gateway_ip === "127.0.0.1" || settings.network.custom_gateway === "127.0.0.1") && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <span className="font-semibold text-amber-300">
                      Loopback Fallback Detected (127.0.0.1)
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      Your system is currently resolving to loopback 127.0.0.1. To run network sweeps and test UPnP / router vulnerabilities against your home or corporate router, enter its IP address below (typically <code className="text-cyan-300 font-mono">192.168.1.1</code> or <code className="text-cyan-300 font-mono">192.168.0.1</code>) and click Save Settings.
                    </p>
                  </div>
                </div>
              )}

              {/* Mode Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      network: { ...prev.network, auto_detect: true },
                    }))
                  }
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    settings.network.auto_detect
                      ? "bg-cyan-500/15 border-cyan-500/50 shadow-sm"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                    settings.network.auto_detect ? "border-cyan-400 bg-cyan-400" : "border-slate-600"
                  }`}>
                    {settings.network.auto_detect && <Check className="w-3 h-3 text-slate-950 font-bold" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Automatic OS Detection</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Query Windows ipconfig, route tables, or Linux /proc to automatically discover default gateway.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      network: { ...prev.network, auto_detect: false },
                    }))
                  }
                  className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    !settings.network.auto_detect
                      ? "bg-cyan-500/15 border-cyan-500/50 shadow-sm"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                    !settings.network.auto_detect ? "border-cyan-400 bg-cyan-400" : "border-slate-600"
                  }`}>
                    {!settings.network.auto_detect && <Check className="w-3 h-3 text-slate-950 font-bold" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Manual Gateway Override</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Explicitly define gateway IP and CIDR (useful for virtualized labs, custom LANs, and containers).
                    </p>
                  </div>
                </button>
              </div>

              {/* Form Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Default Gateway Router IP
                  </label>
                  <input
                    type="text"
                    value={settings.network.custom_gateway}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        network: {
                          ...prev.network,
                          custom_gateway: e.target.value,
                          auto_detect: false,
                        },
                      }))
                    }
                    placeholder="e.g. 192.168.1.1"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Target for Router Vulnerability Engine audits
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Subnet Range (CIDR)
                  </label>
                  <input
                    type="text"
                    value={settings.network.custom_subnet}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        network: {
                          ...prev.network,
                          custom_subnet: e.target.value,
                          auto_detect: false,
                        },
                      }))
                    }
                    placeholder="e.g. 192.168.1.0/24"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Range queried during discovery sweeps
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Active Interface Label
                  </label>
                  <input
                    type="text"
                    value={settings.network.custom_interface}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        network: {
                          ...prev.network,
                          custom_interface: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. Wi-Fi or Ethernet"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Hardware or adapter descriptor
                  </span>
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-2">
                  Quick Standard Router Presets:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "192.168.1.1 (Standard LAN)", gw: "192.168.1.1", cidr: "192.168.1.0/24" },
                    { label: "192.168.0.1 (TP-Link / UniFi)", gw: "192.168.0.1", cidr: "192.168.0.0/24" },
                    { label: "192.168.1.254 (AT&T / Motorola)", gw: "192.168.1.254", cidr: "192.168.1.0/24" },
                    { label: "10.0.0.1 (Xfinity / Corporate)", gw: "10.0.0.1", cidr: "10.0.0.0/24" },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          network: {
                            ...prev.network,
                            custom_gateway: preset.gw,
                            custom_subnet: preset.cidr,
                            auto_detect: false,
                          },
                        }))
                      }
                      className="px-2.5 py-1 text-[11px] font-mono bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-white rounded-lg transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Identified Network Devices (Linux & Windows) */}
              {networkDevices.length > 0 && (
                <div className="pt-3 border-t border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300">
                      Network Devices Identified Across OS ({networkDevices.length} Adapters):
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400">
                      Linux & Windows Native Enumeration
                    </span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {networkDevices.map((dev, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${dev.status === "up" ? "bg-emerald-400" : "bg-slate-500"}`} />
                            <span className="font-bold text-white text-xs">{dev.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 uppercase">
                              {dev.type}
                            </span>
                            {dev.is_primary && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                                PRIMARY
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {dev.description && <span className="text-slate-300 font-sans mr-2">{dev.description}</span>}
                            {dev.mac && <span>MAC: {dev.mac}</span>}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                            <span>IPs: {dev.ips?.length > 0 ? dev.ips.join(", ") : "None"}</span>
                            <span>•</span>
                            <span>Gateways: {dev.gateways?.length > 0 ? dev.gateways.join(", ") : "None"}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const gw = dev.gateways?.[0] || (dev.ips?.[0] ? `${dev.ips[0].rsplit?.(".", 1)?.[0] || dev.ips[0].split(".").slice(0, 3).join(".")}.1` : "192.168.1.1");
                            const sub = dev.subnets?.[0] || `${gw.split(".").slice(0, 3).join(".")}.0/24`;
                            setSettings((prev) => ({
                              ...prev,
                              network: {
                                ...prev.network,
                                custom_gateway: gw,
                                custom_subnet: sub,
                                custom_interface: dev.name,
                                auto_detect: false,
                              },
                            }));
                            showToast(`Applied network device: ${dev.name} (Gateway: ${gw})`);
                          }}
                          className="px-3 py-1.5 text-[10px] font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded transition-colors flex items-center gap-1 shrink-0 self-start sm:self-auto"
                        >
                          <span>Use Device</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Gateways Identified Across All Network Devices */}
              {allGateways.length > 0 && (
                <div className="pt-2 border-t border-slate-800/60 space-y-2">
                  <div className="text-xs font-semibold text-slate-300">
                    Gateways Identified Across All Network Devices:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allGateways.map((gw, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const prefix = gw.split(".").slice(0, 3).join(".");
                          setSettings((prev) => ({
                            ...prev,
                            network: {
                              ...prev.network,
                              custom_gateway: gw,
                              custom_subnet: `${prefix}.0/24`,
                              auto_detect: false,
                            },
                          }));
                          showToast(`Set Gateway: ${gw}`);
                        }}
                        className="px-2.5 py-1 text-[11px] font-mono bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500 text-cyan-300 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <span>Gateway: {gw}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Subnets Identified Across All Devices Table */}
              {detectedSubnets.length > 0 && (
                <div className="pt-2 border-t border-slate-800/60 space-y-2">
                  <div className="text-xs font-semibold text-slate-300">
                    Subnets Discovered Across All Network Devices:
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {detectedSubnets.map((sub, i) => (
                      <div
                        key={i}
                        className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Radio className="w-3.5 h-3.5 text-slate-500" />
                          <span className="font-mono text-cyan-300">{sub.cidr}</span>
                          <span className="text-[11px] text-slate-400">({sub.label})</span>
                          {sub.gateway && (
                            <span className="text-[10px] font-mono text-slate-500">
                              [GW: {sub.gateway}]
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const gw = sub.gateway || `${sub.cidr.split("/")[0].split(".").slice(0, 3).join(".")}.1`;
                            setSettings((prev) => ({
                              ...prev,
                              network: {
                                ...prev.network,
                                custom_gateway: gw,
                                custom_subnet: sub.cidr,
                                custom_interface: sub.interface,
                                auto_detect: false,
                              },
                            }));
                            showToast(`Selected ${sub.cidr} (Gateway: ${gw})`);
                          }}
                          className="px-2.5 py-1 text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded transition-colors flex items-center gap-1"
                        >
                          <span>Apply</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* First-Run Guided Setup Configuration Card */}
              <div className="pt-4 border-t border-slate-800/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Compass className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-xs font-bold text-white tracking-tight">
                        First-Run Guided Setup Execution
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        First-Time Only Lock Active
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 max-w-2xl">
                      NetFling Sentinel's guided discovery wizard is designed to run automatically only the very first time the application runs on this computer. It is permanently bypassed on subsequent reloads and app restarts to prevent workflow interruptions.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  {onOpenGuidedSetup && (
                    <button
                      type="button"
                      onClick={onOpenGuidedSetup}
                      className="px-3.5 py-1.5 text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Compass className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Relaunch Guided Setup Wizard</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleResetFirstRun}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-700 hover:border-amber-500/40 rounded-lg transition-colors flex items-center gap-1.5"
                    title="Clear completion flags to trigger automatic guided setup on the next app startup"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reset First-Run Startup Flag</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 1: EMAIL NOTIFICATION SETTINGS */}
        {activeTab === "email" && (
          <div className="pt-6 space-y-6">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-cyan-400" />
                    SMTP Email Alert Delivery Service
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Dispatch immediate email notifications when security incidents, new rogue devices, or network anomalies occur.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.email.enabled}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        email: { ...prev.email, enabled: e.target.checked },
                      }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                  <span className="ml-3 text-xs font-medium text-slate-300">
                    {settings.email.enabled ? "Alerts Enabled" : "Alerts Disabled"}
                  </span>
                </label>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    SMTP Server Host
                  </label>
                  <input
                    type="text"
                    value={settings.email.smtp_host}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        email: { ...prev.email, smtp_host: e.target.value },
                      }))
                    }
                    placeholder="smtp.gmail.com or mail.internal.lan"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      SMTP Port
                    </label>
                    <input
                      type="number"
                      value={settings.email.smtp_port}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          email: { ...prev.email, smtp_port: parseInt(e.target.value) || 587 },
                        }))
                      }
                      placeholder="587"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Encryption
                    </label>
                    <select
                      value={settings.email.encryption}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          email: { ...prev.email, encryption: e.target.value },
                        }))
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                    >
                      <option value="tls">STARTTLS (587)</option>
                      <option value="ssl">SSL / SMTPS (465)</option>
                      <option value="none">Plaintext (25)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    SMTP User / Account
                  </label>
                  <input
                    type="text"
                    value={settings.email.smtp_user}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        email: { ...prev.email, smtp_user: e.target.value },
                      }))
                    }
                    placeholder="user@example.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    SMTP Password / App Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={settings.email.smtp_password}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          email: { ...prev.email, smtp_password: e.target.value },
                        }))
                      }
                      placeholder="••••••••••••••••"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-3 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Sender Address (From)
                  </label>
                  <input
                    type="email"
                    value={settings.email.sender_address}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        email: { ...prev.email, sender_address: e.target.value },
                      }))
                    }
                    placeholder="alerts@netsentinel.local"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Alert Recipient Addresses (comma separated)
                  </label>
                  <input
                    type="text"
                    value={settings.email.recipient_addresses}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        email: { ...prev.email, recipient_addresses: e.target.value },
                      }))
                    }
                    placeholder="admin@example.com, ops@example.com"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              {/* Alert Triggers */}
              <div className="pt-4 border-t border-slate-800/80">
                <span className="text-xs font-semibold text-slate-300 block mb-2">
                  Automatic Notification Trigger Events:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {[
                    { key: "notify_on_intruder", label: "New Intruder / Unknown Device Discovered" },
                    { key: "notify_on_high_risk_port", label: "Open High-Risk Port Detected (e.g. Telnet, SMB)" },
                    { key: "notify_on_dns_hijack", label: "DNS Hijack / Poisoning Tampering Detected" },
                    { key: "notify_on_rat", label: "Remote Access Trojan (RAT) Match Found" },
                    { key: "notify_on_new_camera", label: "Hidden Camera / RTSP Video Feed Detected" },
                    { key: "notify_on_outage", label: "Gateway or Tracked Host Connectivity Outage" },
                  ].map((trigger) => (
                    <label
                      key={trigger.key}
                      className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer bg-slate-900/60 hover:bg-slate-800/50 p-2 rounded-lg border border-slate-800 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={(settings.email as any)[trigger.key]}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            email: { ...prev.email, [trigger.key]: e.target.checked },
                          }))
                        }
                        className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                      />
                      <span>{trigger.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Test Button & Diagnostics output */}
              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800">
                <div className="text-xs text-slate-400">
                  Click to execute a live SMTP relay handshake and send a verification message to your configured recipient.
                </div>

                <button
                  onClick={handleTestEmail}
                  disabled={isTestingEmail || !settings.email.smtp_host}
                  className="px-4 py-2 text-xs font-medium text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 rounded-lg flex items-center gap-2 shrink-0 transition-colors disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${isTestingEmail ? "animate-pulse" : ""}`} />
                  {isTestingEmail ? "Verifying SMTP Connection..." : "Send Test Alert Email"}
                </button>
              </div>

              {/* Test Result Log */}
              {emailTestResult && (
                <div
                  className={`mt-4 p-4 rounded-xl border text-xs font-mono space-y-2 ${
                    emailTestResult.success
                      ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-200"
                      : "bg-red-950/20 border-red-500/40 text-red-200"
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {emailTestResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span>{emailTestResult.message || emailTestResult.error}</span>
                  </div>

                  {emailTestResult.diagnostics && (
                    <div className="pt-2 border-t border-slate-800/60 space-y-1 text-[11px] text-slate-300">
                      {emailTestResult.diagnostics.map((d, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-cyan-400 font-bold">•</span>
                          <span>{d}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 2: THREAD & CONCURRENCY OPTIMIZER */}
        {activeTab === "threads" && (
          <div className="pt-6 space-y-6">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-emerald-400" />
                    Parallel Worker Concurrency & Port Scan Turbo Tuning
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tune worker thread counts and socket timeouts to achieve optimum port scanning throughput (up to 1,000 parallel workers).
                  </p>
                </div>

                <button
                  onClick={handleResetThreads}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
                </button>
              </div>

              {/* Sliders Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Port Scan Threads */}
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">
                      Full Port Scan Worker Threads
                    </span>
                    <span className="font-mono text-sm font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                      {settings.threads.port_scan_threads} Workers
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Controls parallel threads during top port and full 1–65,535 sweeps. High threads provide maximum ports/sec on local gigabit networks.
                  </p>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={settings.threads.port_scan_threads}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        threads: { ...prev.threads, port_scan_threads: parseInt(e.target.value) || 100 },
                      }))
                    }
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>10 (Gentle)</span>
                    <span>100 (Standard)</span>
                    <span>250 (Turbo)</span>
                    <span>500 (Extreme)</span>
                  </div>
                </div>

                {/* Subnet Discovery Sweep Threads */}
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">
                      Subnet Discovery ARP/ICMP Threads
                    </span>
                    <span className="font-mono text-sm font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                      {settings.threads.discovery_threads} Workers
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Concurrency for multi-subnet discovery sweeps and hardware MAC fingerprinting.
                  </p>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={settings.threads.discovery_threads}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        threads: { ...prev.threads, discovery_threads: parseInt(e.target.value) || 40 },
                      }))
                    }
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>10</span>
                    <span>40 (Recommended)</span>
                    <span>100 (Fast)</span>
                  </div>
                </div>

                {/* RAT Scan Threads */}
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">
                      RAT Trojan & Backdoor Probe Threads
                    </span>
                    <span className="font-mono text-sm font-bold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
                      {settings.threads.rat_scan_threads} Workers
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Probing concurrent endpoints and Trojan signature ports for backdoors.
                  </p>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={settings.threads.rat_scan_threads}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        threads: { ...prev.threads, rat_scan_threads: parseInt(e.target.value) || 50 },
                      }))
                    }
                    className="w-full accent-purple-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>10</span>
                    <span>50 (Recommended)</span>
                    <span>100</span>
                  </div>
                </div>

                {/* Socket Connect Timeout */}
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">
                      TCP Socket Connect Timeout
                    </span>
                    <span className="font-mono text-sm font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                      {settings.threads.socket_timeout_ms} ms
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Maximum wait time before declaring a port closed or filtered. Lower values speed up scans significantly on LAN.
                  </p>
                  <input
                    type="range"
                    min="100"
                    max="1500"
                    step="50"
                    value={settings.threads.socket_timeout_ms}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        threads: { ...prev.threads, socket_timeout_ms: parseInt(e.target.value) || 300 },
                      }))
                    }
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>100 ms (Blazing LAN)</span>
                    <span>300 ms (Standard)</span>
                    <span>1000 ms (High Latency)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: STORAGE LOCATIONS */}
        {activeTab === "storage" && (
          <div className="pt-6 space-y-6">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-amber-400" />
                  Filesystem Storage & Working Directories
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure primary database path, surveillance frame captures, logs, and export storage locations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Primary SQLite Database Location
                  </label>
                  <input
                    type="text"
                    value={settings.storage.db_path}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        storage: { ...prev.storage, db_path: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Houses devices, open ports, timeline presence events, and security logs.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    System Audit & Event Log Directory
                  </label>
                  <input
                    type="text"
                    value={settings.storage.log_dir}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        storage: { ...prev.storage, log_dir: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Daemon output, network intrusion transcripts, and diagnostic captures.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Camera Snapshot & RTSP Recording Directory
                  </label>
                  <input
                    type="text"
                    value={settings.storage.snapshot_dir}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        storage: { ...prev.storage, snapshot_dir: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Saved JPEG snapshots and short stream clips captured from surveillance feeds.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Automatic Timeline Event Retention (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={settings.storage.auto_purge_days}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        storage: { ...prev.storage, auto_purge_days: parseInt(e.target.value) || 30 },
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Presence events older than this threshold will be pruned automatically to conserve disk space.
                  </span>
                </div>
              </div>

              {/* DANGER ZONE: RESET DATABASE TO BLANK */}
              <div className="pt-4 border-t border-slate-800">
                <div className="bg-red-950/20 border border-red-500/40 rounded-xl p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Trash2 className="w-4 h-4 text-red-400" />
                        <h4 className="text-xs font-bold text-red-200 uppercase tracking-wider">
                          Danger Zone: Reset Database to Blank
                        </h4>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                          START NETWORK OVER
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 max-w-2xl">
                        Purge all discovered network devices, MAC inventory, open port findings, security alerts, and speed test telemetry to reset your network state back to blank.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setResetConfirmInput("");
                        setShowResetDbModal(true);
                      }}
                      className="px-4 py-2 text-xs font-semibold text-white bg-red-600/90 hover:bg-red-600 border border-red-500/50 rounded-lg flex items-center gap-2 shadow-sm transition-colors shrink-0 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-white" />
                      <span>Reset Database to Blank</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: BACKUP LOCATIONS & DISASTER RECOVERY */}
        {activeTab === "backup" && (
          <div className="pt-6 space-y-6">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-purple-400" />
                    Automated & On-Demand Backup Storage
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Maintain atomic SQLite WAL snapshots, historical inventory states, and disaster recovery point-in-time archives.
                  </p>
                </div>

                <button
                  onClick={handleCreateBackup}
                  disabled={isBackingUp}
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 rounded-lg flex items-center gap-2 shadow-sm transition-colors shrink-0"
                >
                  <Archive className={`w-3.5 h-3.5 ${isBackingUp ? "animate-spin" : ""}`} />
                  {isBackingUp ? "Creating Snapshot..." : "Create Instant Backup Now"}
                </button>
              </div>

              {/* BACKUP PROGRESS METER (Requested Feature) */}
              {(isBackingUp || backupProgress.active) && (
                <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-cyan-950/80 border border-emerald-500/40 rounded-xl p-3.5 space-y-1.5 font-mono text-xs">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-2 text-emerald-300 font-bold">
                      <Archive className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                      <span>{backupProgress.stage}</span>
                    </span>
                    <span className="text-emerald-400 font-bold">{backupProgress.percent}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full transition-all duration-200"
                      style={{ width: `${Math.max(backupProgress.percent, 8)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Local Backup Storage Directory
                  </label>
                  <input
                    type="text"
                    value={settings.backup.backup_dir}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        backup: { ...prev.backup, backup_dir: e.target.value },
                      }))
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Directory where timestamped .db backup archives are written.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Offsite / Remote Cloud Replication Target (SFTP/S3/Rsync)
                  </label>
                  <input
                    type="text"
                    value={settings.backup.cloud_target}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        backup: { ...prev.backup, cloud_target: e.target.value },
                      }))
                    }
                    placeholder="sftp://backup.internal.lan/netsentinel"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Optional remote replication target for off-site disaster recovery.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Automated Schedule
                    </label>
                    <select
                      value={settings.backup.backup_schedule}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          backup: { ...prev.backup, backup_schedule: e.target.value },
                        }))
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                    >
                      <option value="hourly">Hourly Snapshots</option>
                      <option value="daily">Daily at Midnight (Recommended)</option>
                      <option value="weekly">Weekly</option>
                      <option value="manual">Manual On-Demand Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Backup Retention Limit
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={settings.backup.retention_count}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          backup: { ...prev.backup, retention_count: parseInt(e.target.value) || 7 },
                        }))
                      }
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.backup.auto_backup_enabled}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          backup: { ...prev.backup, auto_backup_enabled: e.target.checked },
                        }))
                      }
                      className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                    />
                    <span className="font-medium">
                      Enable Automated Background Database Snapshot Rotation
                    </span>
                  </label>
                </div>
              </div>

              {/* Latest Backup Alert */}
              {latestBackup && (
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      Instant Snapshot Created: <strong>{latestBackup.filename}</strong> ({latestBackup.size_kb} KB, {latestBackup.device_count} devices recorded)
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">
                    {new Date(latestBackup.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              )}

              {/* Existing Backups Table */}
              <div className="pt-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Stored Database Snapshots in Location:
                </h4>

                {backupsList.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs bg-slate-900/40 rounded-lg border border-slate-800">
                    No historical backup files found in this location yet. Click "Create Instant Backup Now" above.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
                          <th className="py-2.5 px-4 font-mono">Filename</th>
                          <th className="py-2.5 px-4 font-mono">File Size</th>
                          <th className="py-2.5 px-4 font-mono">Created Timestamp</th>
                          <th className="py-2.5 px-4 font-mono">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-sans">
                        {backupsList.map((b, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                            <td className="py-3 px-4 font-mono text-cyan-300 font-medium">
                              {b.filename}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-300">
                              {b.size_kb} KB
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-400">
                              {new Date(b.created_at).toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                                Verified Valid SQLite WAL
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RESET DATABASE CONFIRMATION MODAL OVERLAY */}
      {showResetDbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-red-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
            <div className="flex items-start justify-between border-b border-red-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Reset Database & Start Network Over</h3>
                  <p className="text-xs text-red-300">Permanent factory wipe of inventory and telemetry</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetDbModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <p className="font-semibold text-slate-200">
                This operation will permanently purge the SQLite database (<code className="text-red-300 font-mono">netsentinel.db</code>) and clear:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-300 font-sans">
                <li>All discovered network devices, MAC addresses, and vendor profiles</li>
                <li>All open port audit records, banners, and risk benchmarks</li>
                <li>All security alerts, intruder logs, and telemetry history</li>
                <li>All speed test bandwidth measurements</li>
                <li>First-run completion status (enabling a fresh guided discovery sweep)</li>
              </ul>

              <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resetClearCanvas}
                    onChange={(e) => setResetClearCanvas(e.target.checked)}
                    className="rounded border-slate-700 text-red-500 focus:ring-0"
                  />
                  <span>Clear Network Relationship Canvas (NRC) nodes & rules</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resetClearSettings}
                    onChange={(e) => setResetClearSettings(e.target.checked)}
                    className="rounded border-slate-700 text-red-500 focus:ring-0"
                  />
                  <span className="text-amber-300">Also reset custom SMTP & thread settings to defaults</span>
                </label>
              </div>

              <div className="pt-2">
                <label className="block text-xs text-slate-400 mb-1.5 font-mono">
                  Type <strong className="text-red-400 select-all">RESET</strong> to confirm:
                </label>
                <input
                  type="text"
                  value={resetConfirmInput}
                  onChange={(e) => setResetConfirmInput(e.target.value)}
                  placeholder="RESET"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-red-500 uppercase"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowResetDbModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={resetConfirmInput.trim().toUpperCase() !== "RESET" || isResettingDb}
                onClick={handleResetDatabase}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 rounded-lg flex items-center gap-2 shadow-sm transition-all"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isResettingDb ? "animate-spin" : ""}`} />
                <span>{isResettingDb ? "Resetting Database..." : "Yes, Reset Database to Blank"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

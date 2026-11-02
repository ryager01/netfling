import React, { useState, useEffect, useRef } from "react";
import {
  Wifi,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Terminal,
  Download,
  RefreshCw,
  Server,
  Smartphone,
  Laptop,
  Printer,
  Radio,
  Search,
  Check,
  Edit2,
  Play,
  FileSpreadsheet,
  FileCode,
  Gauge,
  X,
  AlertCircle,
  Eye,
  Power,
  Clock,
  Pause,
  AlertTriangle,
  LayoutGrid,
  ChevronRight,
  ChevronLeft,
  Info,
  HelpCircle,
  Wrench,
  CheckCircle2,
  Lock,
  Unlock,
  Key,
  Globe,
  ExternalLink,
  Plus,
  Trash2,
  Printer as PrintIcon,
  Tag,
  SlidersHorizontal,
  Copy,
  FolderLock,
  FileText,
  Zap,
  Compass,
  BookOpen,
  Settings as SettingsIcon,
  Cpu,
  Share2,
} from "lucide-react";
import { TargetIpSelector } from "./components/TargetIpSelector";
import { QuarantineView } from "./components/QuarantineView";
import { NetworkDiagnosticsView } from "./components/NetworkDiagnosticsView";
import { CamerasDeckView } from "./components/CamerasDeckView";
import { CameraItem } from "./components/CameraManagementModal";
import { GuidedConfigModal } from "./components/GuidedConfigModal";
import { GatewayConfigModal } from "./components/GatewayConfigModal";
import { EmbeddedTerminal } from "./components/EmbeddedTerminal";
import { RatDetectorView } from "./components/RatDetectorView";
import { SettingsView } from "./components/SettingsView";
import { DocumentationView } from "./components/DocumentationView";
import { WifiAnalyzerView } from "./components/WifiAnalyzerView";
import { LogsView } from "./components/LogsView";
import { Windows11InstallerModal } from "./components/Windows11InstallerModal";
import { NetworkRelationshipCanvas } from "./components/canvas/NetworkRelationshipCanvas";

interface Device {
  mac: string;
  ip: string;
  ipv6?: string;
  hostname: string;
  vendor: string;
  device_type: string;
  nickname: string;
  is_known: number;
  is_trusted: number;
  is_quarantined?: number;
  quarantine_reason?: string;
  quarantined_at?: string;
  custom_metadata?: Record<string, string>;
  default_credentials?: {
    has_defaults: boolean;
    default_username: string;
    default_password: string;
    alt_password?: string;
    admin_url: string;
    default_web_host?: string;
    notes: string;
    protocol: string;
    port: number;
  } | null;
  first_seen: string;
  last_seen: string;
  latency_ms: number;
  status: string;
  is_paused?: boolean;
  open_ports?: Array<{
    port: number;
    service_name: string;
    banner: string;
    risk: string;
  }>;
}

interface NetworkInfo {
  local_ip: string;
  gateway_ip: string;
  interface: string;
  subnet_cidr: string;
}

interface SpeedTestResult {
  ping_ms: number;
  download_mbps: number;
  upload_mbps: number;
  server_name: string;
  server_country: string;
  client_ip: string;
  isp: string;
  timestamp?: string;
}

interface AlertItem {
  id: number;
  timestamp: string;
  alert_type: string;
  mac: string;
  ip: string;
  message: string;
  severity: string;
  resolved: number;
}

interface RouterAuditData {
  timestamp: string;
  gateway_ip: string;
  security_score: {
    score: number;
    grade: string;
    health: string;
    deductions: string[];
    untrusted_devices_count: number;
    open_vulnerabilities_count: number;
    unresolved_alerts_count: number;
  };
  dns_audit: {
    status: string;
    test_domain: string;
    resolved_ips: string[];
    is_hijacked: boolean;
    description: string;
  };
  upnp_audit: {
    target_ip: string;
    upnp_exposed: boolean;
    exposed_ports: number[];
    risk: string;
    recommendation: string;
  };
}

interface TimelineItem {
  id: number;
  mac: string;
  ip: string;
  event_type: string;
  timestamp: string;
  details: string;
  hostname?: string;
  vendor?: string;
  nickname?: string;
}

/**
 * Reusable Error Remediation Popover Component.
 * Accents error conditions in red and renders an informative popup on hover
 * detailing the root cause, technical explanation, and step-by-step resolution.
 */
interface ErrorPopoverProps {
  title: string;
  cause: string;
  explanation: string;
  solution: string[];
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}

function ErrorPopover({
  title,
  cause,
  explanation,
  solution,
  actionLabel,
  onAction,
  children,
}: ErrorPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="cursor-help">{children}</div>

      {isOpen && (
        <div
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 sm:w-96 p-4 bg-slate-900/95 backdrop-blur-md border border-red-500/50 rounded-xl shadow-2xl text-left text-xs pointer-events-auto transition-all"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b border-red-500/20 pb-2.5 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-red-500/20 text-red-400">
                <AlertTriangle className="w-3.5 h-3.5" />
              </span>
              <span className="font-semibold text-red-200 text-xs tracking-tight">{title}</span>
            </div>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 font-bold">
              Action Required
            </span>
          </div>

          {/* Root Cause & Explanation */}
          <div className="space-y-1.5 mb-3 text-slate-300">
            <div className="text-[11px] font-mono text-red-300">
              <span className="text-slate-500">Root Cause:</span> {cause}
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">{explanation}</p>
          </div>

          {/* Step-by-Step Resolution */}
          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-red-950/60 mb-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400">
              <Wrench className="w-3 h-3" />
              <span>How to Solve:</span>
            </div>
            <ul className="text-[11px] text-slate-300 space-y-1 pl-1 font-sans">
              {solution.map((step, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-cyan-400 font-mono font-bold shrink-0">{idx + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* One-Click Action Trigger */}
          {actionLabel && onAction && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction();
                setIsOpen(false);
              }}
              className="w-full py-1.5 px-3 bg-red-600/30 hover:bg-red-600/50 text-red-200 hover:text-white border border-red-500/40 rounded-md font-semibold text-[11px] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{actionLabel}</span>
            </button>
          )}

          {/* Bottom Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-solid border-t-slate-900 border-t-8 border-x-transparent border-x-8 border-b-0" />
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<
    | "hub"
    | "canvas"
    | "inventory"
    | "quarantine"
    | "nettools"
    | "wifi"
    | "router"
    | "cameras"
    | "portscan"
    | "speedtest"
    | "timeline"
    | "alerts"
    | "cli"
    | "rat"
    | "settings"
    | "docs"
    | "logs"
  >("hub");

  // Sidebar Collapsible State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Inspector Device Modal
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

  // Custom Metadata Key/Value Temp Inputs
  const [newMetaKey, setNewMetaKey] = useState<string>("");
  const [newMetaValue, setNewMetaValue] = useState<string>("");

  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [latestSpeedTest, setLatestSpeedTest] = useState<SpeedTestResult | null>(null);
  const [daemonRunning, setDaemonRunning] = useState<boolean>(false);
  const [routerAudit, setRouterAudit] = useState<RouterAuditData | null>(null);
  const [cameras, setCameras] = useState<CameraItem[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);

  // Loading States
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isSpeedTesting, setIsSpeedTesting] = useState<boolean>(false);
  const [isPortScanning, setIsPortScanning] = useState<boolean>(false);
  const [isAuditingRouter, setIsAuditingRouter] = useState<boolean>(false);
  const [isScanningCameras, setIsScanningCameras] = useState<boolean>(false);
  const [isExecutingCli, setIsExecutingCli] = useState<boolean>(false);
  const [isScanningIpv6, setIsScanningIpv6] = useState<boolean>(false);
  const [ipv6ScanProgress, setIpv6ScanProgress] = useState<{
    percent: number;
    stage: string;
    foundCount: number;
  }>({ percent: 0, stage: "", foundCount: 0 });

  const [cliExecProgress, setCliExecProgress] = useState<{
    active: boolean;
    command: string;
    stage: string;
    percent: number;
  }>({ active: false, command: "", stage: "", percent: 0 });

  // Live Network Scan Status State (Requested Feature)
  const [scanStatus, setScanStatus] = useState<{
    active: boolean;
    targetSubnet: string;
    stage: string;
    statusMessage: string;
    progressPercent: number;
    devicesFound: number;
    startedAt: number | null;
  }>({
    active: false,
    targetSubnet: "",
    stage: "idle",
    statusMessage: "Discovery engine idle",
    progressPercent: 0,
    devicesFound: 0,
    startedAt: null,
  });

  // Live Port Scan Status State with Ports Checked vs Total (Requested Feature)
  const [portScanStatus, setPortScanStatus] = useState<{
    active: boolean;
    targetIp: string;
    checkedCount: number;
    totalPorts: number;
    currentPort: number;
    openCount: number;
    progressPercent: number;
  }>({
    active: false,
    targetIp: "",
    checkedCount: 0,
    totalPorts: 50,
    currentPort: 0,
    openCount: 0,
    progressPercent: 0,
  });

  // Status Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Speed Test Progress Meter State
  const [speedTestProgress, setSpeedTestProgress] = useState<{
    percent: number;
    stage: string;
    currentMbps: number;
  }>({ percent: 0, stage: "", currentMbps: 0 });

  // Gateway / Router Audit Progress Meter State
  const [routerAuditProgress, setRouterAuditProgress] = useState<{
    percent: number;
    stage: string;
  }>({ percent: 0, stage: "" });

  // Camera RTSP Sweep Progress Meter State
  const [cameraScanProgress, setCameraScanProgress] = useState<{
    percent: number;
    stage: string;
    probedCount: number;
  }>({ percent: 0, stage: "", probedCount: 0 });

  // Guided Configuration Wizard State (First Run & On-Demand)
  const [showGuidedConfig, setShowGuidedConfig] = useState<boolean>(false);
  const [showGatewayModal, setShowGatewayModal] = useState<boolean>(false);
  const [showWin11Modal, setShowWin11Modal] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<"all" | "online" | "ipv6" | "untrusted" | "quarantined">("all");
  const [customSubnet, setCustomSubnet] = useState<string>("");

  // Port Scan Target & Multi-Threaded Controls State
  const [targetIp, setTargetIp] = useState<string>("");
  const [targetMac, setTargetMac] = useState<string>("");
  const [portFindings, setPortFindings] = useState<any[]>([]);
  const [portScanMode, setPortScanMode] = useState<"top" | "quick" | "well_known" | "extended" | "full" | "custom">("top");
  const [portScanThreads, setPortScanThreads] = useState<number>(100);
  const [customPortsInput, setCustomPortsInput] = useState<string>("");
  const [portScanBenchmark, setPortScanBenchmark] = useState<{
    total_probed: number;
    duration_ms: number;
    throughput_ports_per_sec: number;
    threads_used: number;
  } | null>(null);

  // Editing Nickname Inline
  const [editingMac, setEditingMac] = useState<string | null>(null);
  const [nicknameInput, setNicknameInput] = useState<string>("");

  // CLI output viewer
  const [cliOutput, setCliOutput] = useState<string>(
    "Ready. Click any command button below to run the NetSentinel Python engine with real-time output."
  );

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/status");
      if (res.ok) {
        const data = await res.json();
        setNetworkInfo(data.network);
        setDaemonRunning(data.daemon_running);
        if (data.latest_speed_test) {
          setLatestSpeedTest(data.latest_speed_test);
        }
      }
    } catch {
      // offline fallback
    }
  };

  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/devices");
      if (res.ok) {
        const data = await res.json();
        setDevices(data);
        if (selectedDevice) {
          const updated = data.find((d: Device) => d.mac === selectedDevice.mac);
          if (updated) setSelectedDevice(updated);
        }
      }
    } catch {
      // ignore
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data);
      }
    } catch {
      // ignore
    }
  };

  const fetchRouterAudit = async () => {
    setIsAuditingRouter(true);
    setRouterAuditProgress({ percent: 12, stage: "Probing Gateway IP & checking default routes..." });
    let currentPct = 12;
    const interval = setInterval(() => {
      currentPct += 7;
      if (currentPct > 92) currentPct = 92;
      let stage = "Probing Gateway IP & checking default routes...";
      if (currentPct > 25 && currentPct <= 50) {
        stage = "Auditing UPnP exposure & NAT-PMP port forwarding...";
      } else if (currentPct > 50 && currentPct <= 75) {
        stage = "Verifying DNS integrity vs reference Cloudflare & Google resolvers...";
      } else if (currentPct > 75) {
        stage = "Scanning management credentials & calculating security score...";
      }
      setRouterAuditProgress({ percent: currentPct, stage });
    }, 280);

    try {
      const res = await fetch("/api/router-audit");
      if (res.ok) {
        const data = await res.json();
        setRouterAudit(data);
        setRouterAuditProgress({ percent: 100, stage: "Gateway Defense Audit Complete!" });
      }
    } catch {
      // ignore
    } finally {
      clearInterval(interval);
      setTimeout(() => {
        setIsAuditingRouter(false);
        setRouterAuditProgress({ percent: 0, stage: "" });
      }, 700);
    }
  };

  const fetchCameras = async () => {
    setIsScanningCameras(true);
    setCameraScanProgress({ percent: 12, stage: "Probing RTSP port 554 and 8554 across network...", probedCount: 1 });
    let pct = 12;
    const interval = setInterval(() => {
      pct += 8;
      if (pct > 92) pct = 92;
      let stage = "Probing RTSP port 554 and 8554 across network...";
      if (pct > 40 && pct <= 70) {
        stage = "Discovering ONVIF web services (port 8000)...";
      } else if (pct > 70) {
        stage = "Connecting to real RTSP video feeds (cloud.wowza.com)...";
      }
      setCameraScanProgress({ percent: pct, stage, probedCount: Math.floor(pct / 20) + 1 });
    }, 250);

    try {
      const res = await fetch("/api/cameras");
      if (res.ok) {
        const data = await res.json();
        setCameras(data);
        setCameraScanProgress({ percent: 100, stage: "Surveillance Sweep Complete!", probedCount: data.length });
      }
    } catch {
      // ignore
    } finally {
      clearInterval(interval);
      setTimeout(() => {
        setIsScanningCameras(false);
        setCameraScanProgress({ percent: 0, stage: "", probedCount: 0 });
      }, 650);
    }
  };

  const fetchTimeline = async () => {
    try {
      const res = await fetch("/api/timeline");
      if (res.ok) {
        const data = await res.json();
        setTimeline(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchDevices();
    fetchAlerts();
    fetchRouterAudit();
    fetchCameras();

    // Check First Run: only run the guided setup wizard the very first time NetFling/NetSentinel
    // is ever run on this computer, NOT on every page reload or app restart.
    const checkFirstRunEligibility = async () => {
      try {
        const localFlag = localStorage.getItem("netsentinel_first_run_completed");
        if (localFlag === "true") {
          return; // Already completed or dismissed on this computer
        }

        // Query backend persistent database state
        const res = await fetch("/api/first-run/status");
        if (res.ok) {
          const data = await res.json();
          if (data.first_run_completed || (typeof data.device_count === "number" && data.device_count > 0)) {
            // Machine database is already initialized or contains existing inventory
            try {
              localStorage.setItem("netsentinel_first_run_completed", "true");
            } catch {}
            return;
          }
        }

        // Only launch if genuinely pristine first execution on this computer
        setShowGuidedConfig(true);
      } catch {
        // Fallback: do not pop up unexpectedly on network or storage errors
      }
    };

    checkFirstRunEligibility();
  }, []);

  // Trigger Subnet Scan with Live Status Display
  const handleTriggerScan = async (overrideSubnet?: string) => {
    const targetSubnet =
      overrideSubnet || customSubnet || networkInfo?.subnet_cidr || "192.168.1.0/24";
    setIsScanning(true);
    setScanStatus({
      active: true,
      targetSubnet,
      stage: "init",
      statusMessage: `Broadcasting ARP & ICMP probes across subnet ${targetSubnet}...`,
      progressPercent: 15,
      devicesFound: 0,
      startedAt: Date.now(),
    });
    showToast(`Scanning subnet ${targetSubnet}...`);

    // Poll live scan status every 300ms
    const pollTimer = setInterval(async () => {
      try {
        const sRes = await fetch("/api/scan/status");
        if (sRes.ok) {
          const sData = await sRes.json();
          if (sData) {
            setScanStatus((prev) => ({
              ...prev,
              stage: sData.stage || prev.stage,
              statusMessage: sData.statusMessage || prev.statusMessage,
              progressPercent: sData.progressPercent ?? prev.progressPercent,
              devicesFound: sData.devicesFound ?? prev.devicesFound,
            }));
          }
        }
      } catch {}
    }, 300);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subnet: targetSubnet }),
      });
      if (res.ok) {
        const data = await res.json();
        const count = data.devices?.length ?? 0;
        setScanStatus((prev) => ({
          ...prev,
          stage: "complete",
          statusMessage: `Sweep complete: ${count} device(s) found on ${targetSubnet}`,
          progressPercent: 100,
          devicesFound: count,
        }));
        await fetchDevices();
        await fetchStatus();
        await fetchAlerts();
        showToast(`Subnet sweep complete: ${count} device(s) found on ${targetSubnet}`);
      } else {
        showToast("Subnet discovery sweep failed. Check network adapter configuration.");
      }
    } catch {
      showToast("Network error during discovery sweep.");
    } finally {
      clearInterval(pollTimer);
      setIsScanning(false);
      setTimeout(() => {
        setScanStatus((prev) => ({ ...prev, active: false }));
      }, 3500);
    }
  };

  // Run Multi-Threaded Port Scan with Live Checked Count vs Total Count
  const handlePortScan = async (
    ipToScan: string,
    macToScan?: string,
    modeOverride?: string,
    threadsOverride?: number,
    customOverride?: string
  ) => {
    setTargetIp(ipToScan);
    setTargetMac(macToScan || "");
    setIsPortScanning(true);
    setActiveTab("portscan");
    const mode = modeOverride || portScanMode;
    const threads = threadsOverride || portScanThreads;
    const custom = customOverride !== undefined ? customOverride : customPortsInput;

    let initExpected = 50;
    if (mode === "quick") initExpected = 100;
    else if (mode === "well_known") initExpected = 1024;
    else if (mode === "extended") initExpected = 10000;
    else if (mode === "full") initExpected = 65535;

    setPortScanStatus({
      active: true,
      targetIp: ipToScan,
      checkedCount: 0,
      totalPorts: initExpected,
      currentPort: 0,
      openCount: 0,
      progressPercent: 0,
    });

    // Poll live port scanning progress every 200ms
    const pollTimer = setInterval(async () => {
      try {
        const pRes = await fetch("/api/portscan/status");
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData) {
            setPortScanStatus({
              active: pData.active,
              targetIp: pData.targetIp || ipToScan,
              checkedCount: pData.checkedCount || 0,
              totalPorts: pData.totalPorts || initExpected,
              currentPort: pData.currentPort || 0,
              openCount: pData.openCount || 0,
              progressPercent: pData.progressPercent || 0,
            });
          }
        }
      } catch {}
    }, 200);

    try {
      const res = await fetch("/api/portscan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ip: ipToScan,
          mac: macToScan,
          port_mode: mode,
          threads: threads,
          custom_ports: custom,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPortFindings(data.findings || []);
        setPortScanBenchmark({
          total_probed: data.total_probed || data.findings?.length || 0,
          duration_ms: data.duration_ms || 0,
          throughput_ports_per_sec: data.throughput_ports_per_sec || 0,
          threads_used: data.threads_used || threads,
        });
        setPortScanStatus((prev) => ({
          ...prev,
          checkedCount: data.total_probed || prev.totalPorts,
          totalPorts: data.total_probed || prev.totalPorts,
          openCount: data.open_count || data.findings?.length || 0,
          progressPercent: 100,
        }));
        fetchDevices();
        showToast(
          `Port audit complete: ${data.open_count || data.findings?.length || 0} open ports detected (${data.duration_ms || 0}ms)`
        );
      }
    } catch {
      showToast("Port audit encountered an error.");
    } finally {
      clearInterval(pollTimer);
      setIsPortScanning(false);
      setTimeout(() => {
        setPortScanStatus((prev) => ({ ...prev, active: false }));
      }, 4000);
    }
  };

  // Run Speed Test with High-Visibility Live Progress Meter
  const handleSpeedTest = async () => {
    setIsSpeedTesting(true);
    setSpeedTestProgress({
      percent: 8,
      stage: "Measuring Round-Trip Latency & Jitter (ICMP Echo)...",
      currentMbps: 0,
    });
    let currentPct = 8;
    const interval = setInterval(() => {
      currentPct += Math.floor(Math.random() * 4) + 2;
      if (currentPct > 93) currentPct = 93;
      let stage = "Measuring Round-Trip Latency & Jitter (ICMP Echo)...";
      let simulatedMbps = 0;
      if (currentPct > 20 && currentPct <= 65) {
        stage = "Benchmarking Multi-Stream Downlink Bandwidth (Download)...";
        simulatedMbps = Math.floor(45 + Math.random() * 110);
      } else if (currentPct > 65 && currentPct <= 88) {
        stage = "Testing Multi-Stream Uplink Saturation Throughput (Upload)...";
        simulatedMbps = Math.floor(22 + Math.random() * 45);
      } else if (currentPct > 88) {
        stage = "Aggregating telemetry & computing final throughput percentiles...";
      }
      setSpeedTestProgress({ percent: currentPct, stage, currentMbps: simulatedMbps });
    }, 240);

    try {
      const res = await fetch("/api/speedtest", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setLatestSpeedTest(data.results);
        setSpeedTestProgress({
          percent: 100,
          stage: "Speed Test Benchmark Completed!",
          currentMbps: data.results?.download_mbps || 0,
        });
        showToast("Speed test benchmark finished");
      }
    } catch {
      showToast("Speed test failed to complete");
    } finally {
      clearInterval(interval);
      setTimeout(() => {
        setIsSpeedTesting(false);
        setSpeedTestProgress({ percent: 0, stage: "", currentMbps: 0 });
      }, 750);
    }
  };

  // Toggle Trust
  const handleToggleTrust = async (mac: string, currentTrust: number) => {
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(mac)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_trusted: currentTrust !== 1 }),
      });
      if (res.ok) {
        await fetchDevices();
        await fetchStatus();
        await fetchRouterAudit();
        showToast(`Device ${currentTrust === 1 ? "marked untrusted" : "marked trusted"}`);
      }
    } catch {
      // ignore
    }
  };

  // Toggle Quarantine (Requested Feature)
  const handleToggleQuarantine = async (
    mac: string,
    currentQuarantined?: number | boolean,
    reason?: string
  ) => {
    try {
      const isQuarantine =
        typeof currentQuarantined === "boolean" ? currentQuarantined : currentQuarantined !== 1;
      const res = await fetch(`/api/devices/${encodeURIComponent(mac)}/quarantine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quarantined: isQuarantine,
          reason: reason || "Unverified or suspicious device placed in quarantine",
        }),
      });
      if (res.ok) {
        await fetchDevices();
        fetchStatus();
        showToast(isQuarantine ? `Device placed in QUARANTINE` : `Device released from quarantine`);
      }
    } catch {
      // ignore
    }
  };

  // Update Camera in state and refresh inventory
  const handleUpdateCamera = (updatedCamera: CameraItem) => {
    setCameras((prev) =>
      prev.map((c) => (c.ip === updatedCamera.ip ? updatedCamera : c))
    );
    fetchDevices();
  };

  // Update Custom Metadata (Requested Feature)
  const handleSaveCustomMetadata = async (mac: string, updatedMetadata: Record<string, string>) => {
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(mac)}/metadata`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata: updatedMetadata }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.device) {
          setSelectedDevice(data.device);
          fetchDevices();
          showToast("Custom metadata saved permanently");
        }
      }
    } catch {
      // ignore
    }
  };

  // Add Metadata Key/Value Pair
  const handleAddMetaPair = () => {
    if (!selectedDevice || !newMetaKey.trim()) return;
    const current = { ...(selectedDevice.custom_metadata || {}) };
    current[newMetaKey.trim()] = newMetaValue.trim();
    handleSaveCustomMetadata(selectedDevice.mac, current);
    setNewMetaKey("");
    setNewMetaValue("");
  };

  // Remove Metadata Key/Value Pair
  const handleRemoveMetaPair = (keyToRemove: string) => {
    if (!selectedDevice) return;
    const current = { ...(selectedDevice.custom_metadata || {}) };
    delete current[keyToRemove];
    handleSaveCustomMetadata(selectedDevice.mac, current);
  };

  // Save Nickname
  const handleSaveNickname = async (mac: string) => {
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(mac)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nicknameInput }),
      });
      if (res.ok) {
        setEditingMac(null);
        fetchDevices();
        showToast("Device nickname updated");
      }
    } catch {
      // ignore
    }
  };

  // Send Wake-on-LAN
  const handleSendWol = async (mac: string) => {
    try {
      const res = await fetch("/api/wol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mac }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          showToast(`Wake-on-LAN Magic Packet sent to ${mac}`);
        } else {
          showToast(`WoL failed: ${data.error}`);
        }
      }
    } catch {
      // ignore
    }
  };

  // Toggle Pause Internet Policy
  const handleTogglePause = async (mac: string, currentPaused?: boolean) => {
    try {
      const res = await fetch(`/api/devices/${encodeURIComponent(mac)}/pause`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pause: !currentPaused }),
      });
      if (res.ok) {
        setDevices((prev) =>
          prev.map((d) => (d.mac === mac ? { ...d, is_paused: !currentPaused } : d))
        );
        fetchTimeline();
        showToast(`Internet access ${!currentPaused ? "paused" : "resumed"} for ${mac}`);
      }
    } catch {
      // ignore
    }
  };

  // Toggle Daemon
  const handleToggleDaemon = async () => {
    try {
      const res = await fetch("/api/daemon/toggle", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setDaemonRunning(data.running);
        showToast(`Intruder daemon ${data.running ? "started" : "stopped"}`);
      }
    } catch {
      // ignore
    }
  };

  // Clear Alerts
  const handleClearAlerts = async () => {
    try {
      const res = await fetch("/api/alerts/clear", { method: "POST" });
      if (res.ok) {
        setAlerts([]);
        fetchStatus();
        fetchRouterAudit();
        showToast("All security alerts cleared");
      }
    } catch {
      // ignore
    }
  };

  // IPv6 Neighbor Discovery Sweep Handler (Requested Feature)
  const handleScanIpv6 = async () => {
    setIsScanningIpv6(true);
    setIpv6ScanProgress({ percent: 15, stage: "Querying Windows 11 netsh & Linux neighbor tables...", foundCount: 0 });
    let pct = 15;
    const interval = setInterval(() => {
      pct += 10;
      if (pct > 90) pct = 90;
      let stage = "Querying Windows 11 netsh & Linux neighbor tables...";
      if (pct > 40 && pct <= 70) {
        stage = "Scanning ICMPv6 multicast solicitation & NDP cache...";
      } else if (pct > 70) {
        stage = "Resolving RFC 4291 EUI-64 & SLAAC global addresses...";
      }
      setIpv6ScanProgress((prev) => ({ ...prev, percent: pct, stage }));
    }, 200);

    try {
      const res = await fetch("/api/discovery/ipv6/sweep", { method: "POST" });
      clearInterval(interval);
      if (res.ok) {
        const data = await res.json();
        setIpv6ScanProgress({
          percent: 100,
          stage: `Discovered & mapped ${data.ipv6_devices_total || 0} dual-stack IPv6 devices!`,
          foundCount: data.ipv6_devices_total || 0,
        });
        showToast(`IPv6 Neighbor Discovery: ${data.ipv6_devices_total || 0} IPv6 devices identified!`);
        fetchDevices();
      } else {
        setIpv6ScanProgress((prev) => ({ ...prev, percent: 100, stage: "Sweep completed" }));
      }
    } catch (err: any) {
      clearInterval(interval);
      showToast(`IPv6 discovery error: ${err.message}`);
    } finally {
      setTimeout(() => {
        setIsScanningIpv6(false);
      }, 1200);
    }
  };

  // Run CLI with Dynamic Progress Meter
  const handleRunCli = async (cmd: string) => {
    setIsExecutingCli(true);
    setCliOutput(`[NetSentinel] Spawning 'python3 cli.py ${cmd}'...\n`);
    setCliExecProgress({
      active: true,
      command: cmd,
      stage: `Initializing subshell for 'python3 cli.py ${cmd}'...`,
      percent: 15,
    });

    let pct = 15;
    const timer = setInterval(() => {
      pct += 10;
      if (pct > 90) pct = 90;
      let stage = `Executing python3 cli.py ${cmd}...`;
      if (pct > 50) stage = "Streaming subshell stdout & parsing engine output...";
      setCliExecProgress((prev) => ({ ...prev, percent: pct, stage }));
    }, 250);

    try {
      const res = await fetch("/api/run-cli", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });
      clearInterval(timer);
      if (res.ok) {
        const data = await res.json();
        setCliOutput(data.output || "Completed with no output.");
        setCliExecProgress({
          active: true,
          command: cmd,
          stage: "Execution completed successfully!",
          percent: 100,
        });
      }
    } catch (err: any) {
      clearInterval(timer);
      setCliOutput(`Error running CLI: ${err.message}`);
    } finally {
      setIsExecutingCli(false);
      setTimeout(() => {
        setCliExecProgress({ active: false, command: "", stage: "", percent: 0 });
      }, 1200);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard`);
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "Router / Gateway":
        return <Radio className="w-4 h-4 text-cyan-400" />;
      case "Smartphone / Tablet":
        return <Smartphone className="w-4 h-4 text-indigo-400" />;
      case "PC / Workstation":
        return <Laptop className="w-4 h-4 text-emerald-400" />;
      case "Server / NAS":
        return <Server className="w-4 h-4 text-purple-400" />;
      case "Printer":
        return <Printer className="w-4 h-4 text-amber-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  // Calculations for Red Error Badges in Sidebar Navigation
  const untrustedCount = devices.filter((d) => d.is_trusted === 0 && d.status === "online").length;
  const quarantinedCount = devices.filter((d) => d.is_quarantined === 1).length;
  const routerDeductionsCount = routerAudit?.security_score?.deductions?.length || 0;
  const cameraRiskCount = cameras.length;
  const highRiskPortsCount = devices.reduce(
    (acc, d) => acc + (d.open_ports?.filter((p) => p.risk === "High").length || 0),
    0
  );
  const activeAlertsCount = alerts.filter((a) => a.resolved === 0).length;

  const filteredDevices = devices.filter((d) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      d.ip.toLowerCase().includes(query) ||
      d.mac.toLowerCase().includes(query) ||
      (d.ipv6 && d.ipv6.toLowerCase().includes(query)) ||
      (d.hostname && d.hostname.toLowerCase().includes(query)) ||
      (d.vendor && d.vendor.toLowerCase().includes(query)) ||
      (d.nickname && d.nickname.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    if (filterType === "online") return d.status === "online";
    if (filterType === "ipv6") return !!d.ipv6;
    if (filterType === "untrusted") return d.is_trusted === 0;
    if (filterType === "quarantined") return d.is_quarantined === 1;

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-cyan-500/50 text-cyan-200 text-xs px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="flex items-center justify-between gap-4 px-6 py-3 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title={isSidebarCollapsed ? "Expand Sidebar Command Center" : "Collapse Sidebar Command Center"}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Wifi className="w-4 h-4" />
            </div>
            <span className="text-base font-bold tracking-tight text-white">NetFling Sentinel</span>
          </div>
        </div>

        {/* Global Action & Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGatewayModal(true)}
            className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/40 transition-all text-xs text-slate-400 hover:text-slate-200 cursor-pointer shadow-sm group"
            title="Click to configure Gateway IP, Subnet CIDR, and network interfaces"
          >
            <div
              className={`w-2 h-2 rounded-full ${
                networkInfo?.gateway_ip === "127.0.0.1"
                  ? "bg-amber-400 animate-pulse"
                  : "bg-emerald-400"
              }`}
            />
            <span>
              Gateway:{" "}
              <span className="font-mono text-slate-200 font-semibold">
                {networkInfo?.gateway_ip || "127.0.0.1"}
              </span>
            </span>
            {networkInfo?.gateway_ip === "127.0.0.1" && (
              <span className="px-1.5 py-0.2 text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                Loopback
              </span>
            )}
            <span aria-hidden="true" className="text-slate-700">·</span>
            <span>
              Subnet:{" "}
              <span className="font-mono text-slate-200">
                {networkInfo?.subnet_cidr || "Auto"}
              </span>
            </span>
            <Edit2 className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors ml-0.5" />
          </button>

          {/* Quick Subnet Target Input & Scan */}
          <div className="hidden lg:flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1">
            <span className="text-[11px] text-slate-500 font-mono">Target:</span>
            <input
              type="text"
              value={customSubnet}
              onChange={(e) => setCustomSubnet(e.target.value)}
              placeholder={networkInfo?.subnet_cidr || "192.168.1.0/24"}
              className="bg-transparent text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none w-32"
              title="Target Subnet CIDR (e.g. 192.168.1.0/24)"
            />
          </div>

          <button
            onClick={() => setActiveTab("logs")}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-all shrink-0 shadow-sm ${
              activeTab === "logs"
                ? "bg-purple-500/20 text-purple-300 border-purple-500/50"
                : "bg-slate-900/80 hover:bg-slate-850 text-slate-300 hover:text-white border-slate-800 hover:border-purple-500/40"
            }`}
            title="Open System & Debugging Logs Telemetry Console"
          >
            <Terminal className="w-3.5 h-3.5 text-purple-400" />
            <span>Logs</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          </button>

          <button
            onClick={() => setShowWin11Modal(true)}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border-blue-500/30 hover:border-blue-500/50 transition-all shrink-0 shadow-sm"
            title="Download & Install NetSentinel for Windows 11"
          >
            <div className="grid grid-cols-2 gap-0.5 w-3 h-3">
              <div className="bg-blue-400 rounded-[0.5px]" />
              <div className="bg-blue-400 rounded-[0.5px]" />
              <div className="bg-blue-400 rounded-[0.5px]" />
              <div className="bg-blue-400 rounded-[0.5px]" />
            </div>
            <span>Win 11 Installer</span>
          </button>

          <button
            onClick={() => setShowGuidedConfig(true)}
            className="px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 transition-colors rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm"
            title="Launch First-Run Guided Discovery & Configuration Wizard"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Guided Setup</span>
          </button>

          <button
            onClick={() => handleTriggerScan()}
            disabled={isScanning}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 transition-colors rounded-lg flex items-center gap-2 whitespace-nowrap shrink-0 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
            {isScanning ? "Scanning..." : "Discovery Sweep"}
          </button>
        </div>
      </header>

      {/* Main Workspace with Collapsible Sidebar Navigation */}
      <div className="flex-1 flex overflow-hidden">
        {/* COLLAPSIBLE COMMAND CENTER SIDEBAR */}
        <aside
          className={`border-r border-slate-800/80 bg-slate-900/40 flex flex-col justify-between transition-all duration-300 shrink-0 ${
            isSidebarCollapsed ? "w-[72px]" : "w-64"
          }`}
        >
          {/* Navigation Section */}
          <div className="p-3 space-y-1 overflow-y-auto">
            {!isSidebarCollapsed && (
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                Command Center Deck
              </div>
            )}

            {/* Hub */}
            <button
              onClick={() => setActiveTab("hub")}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? "justify-center px-0" : "justify-between px-3"
              } py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "hub"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
              title="Command Hub Overview"
            >
              <div className="flex items-center gap-3">
                <LayoutGrid className="w-4 h-4 shrink-0 text-cyan-400" />
                {!isSidebarCollapsed && <span>Command Hub</span>}
              </div>
            </button>

            {/* Network Relationship Canvas (NRC) */}
            <button
              onClick={() => setActiveTab("canvas")}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? "justify-center px-0" : "justify-between px-3"
              } py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "canvas"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
              title="Network Relationship Canvas (NRC): Zero Trust Policy-by-Diagram Engine"
            >
              <div className="flex items-center gap-3">
                <Share2 className="w-4 h-4 shrink-0 text-cyan-400" />
                {!isSidebarCollapsed && <span>Relationship Canvas</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className="px-1.5 py-0.2 rounded font-mono text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  NRC
                </span>
              )}
            </button>

            {/* Inventory */}
            <button
              onClick={() => setActiveTab("inventory")}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? "justify-center px-0" : "justify-between px-3"
              } py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "inventory"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
              title="Device Inventory & Profiler"
            >
              <div className="flex items-center gap-3">
                <Laptop className="w-4 h-4 shrink-0 text-emerald-400" />
                {!isSidebarCollapsed && <span>Device Inventory</span>}
              </div>
              {/* Red Error Number Badge for Untrusted / Quarantined Devices */}
              {(untrustedCount > 0 || quarantinedCount > 0) && (
                <span
                  className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 ${
                    isSidebarCollapsed ? "absolute top-1 right-1" : ""
                  }`}
                  title={`${untrustedCount} untrusted, ${quarantinedCount} quarantined`}
                >
                  {untrustedCount + quarantinedCount}
                </span>
              )}
            </button>

            {/* Quarantine Deck (Requested Feature) */}
            <button
              onClick={() => setActiveTab("quarantine")}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? "justify-center px-0" : "justify-between px-3"
              } py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "quarantine"
                  ? "bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
              title="Quarantine Deck: View online & offline isolated endpoints"
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                {!isSidebarCollapsed && <span>Quarantine Deck</span>}
              </div>
              {quarantinedCount > 0 && (
                <ErrorPopover
                  title="Quarantine Isolation Vault"
                  cause={`${quarantinedCount} endpoint(s) held in quarantine isolation`}
                  explanation="Devices held in quarantine have their normal network permissions suspended to protect LAN endpoints from unverified traffic or rogue behavior."
                  solution={[
                    "Open Quarantine Deck to inspect online and offline isolated hardware.",
                    "Review device MAC, hostname, and factory credentials.",
                    "Release endpoint back to inventory or enforce permanent internet drop.",
                  ]}
                  actionLabel="Open Quarantine Deck"
                  onAction={() => setActiveTab("quarantine")}
                >
                  <span
                    className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold bg-red-500/30 text-red-300 border border-red-500/50 animate-pulse ${
                      isSidebarCollapsed ? "absolute top-1 right-1" : ""
                    }`}
                  >
                    {quarantinedCount}
                  </span>
                </ErrorPopover>
              )}
            </button>

            {/* Network Diagnostics Suite (Requested Feature) */}
            <button
              onClick={() => setActiveTab("nettools")}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? "justify-center px-0" : "justify-between px-3"
              } py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "nettools"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
              title="Network Testing Tools (Ping, Traceroute, DNS, Email & Blacklist)"
            >
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 shrink-0 text-cyan-400" />
                {!isSidebarCollapsed && <span>Diagnostics Suite</span>}
              </div>
            </button>

            {/* Wi-Fi Spectrum & Saturation Analyzer (Requested Feature) */}
            <button
              onClick={() => setActiveTab("wifi")}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? "justify-center px-0" : "justify-between px-3"
              } py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "wifi"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
              title="Wi-Fi Spectrum & Saturation Analysis Tool (2.4/5/6 GHz, Signal Strength, Channel In Use & Saturation)"
            >
              <div className="flex items-center gap-3">
                <Radio className="w-4 h-4 shrink-0 text-cyan-400" />
                {!isSidebarCollapsed && <span>Wi-Fi Analyzer</span>}
              </div>
            </button>

            {/* Router Security */}
            <button
              onClick={() => {
                setActiveTab("router");
                if (!routerAudit) fetchRouterAudit();
              }}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? "justify-center px-0" : "justify-between px-3"
              } py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "router"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
              title="Router Vulnerability Audit"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 shrink-0 text-cyan-400" />
                {!isSidebarCollapsed && <span>Router Security</span>}
              </div>
              {routerDeductionsCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40`}
                  title={`${routerDeductionsCount} security vulnerabilities detected`}
                >
                  {routerDeductionsCount}
                </span>
              )}
            </button>

            {/* Hidden Cameras */}
            <button
              onClick={() => {
                setActiveTab("cameras");
                fetchCameras();
              }}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? "justify-center px-0" : "justify-between px-3"
              } py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "cameras"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
              title="Surveillance & Camera Detector"
            >
              <div className="flex items-center gap-3">
                <Eye className="w-4 h-4 shrink-0 text-purple-400" />
                {!isSidebarCollapsed && <span>Hidden Cameras</span>}
              </div>
              {cameraRiskCount > 0 && (
                <span
                  className="px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40"
                  title={`${cameraRiskCount} camera feeds detected`}
                >
                  {cameraRiskCount}
                </span>
              )}
            </button>

            {/* Port Audit */}
            <button
              onClick={() => setActiveTab("portscan")}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? "justify-center px-0" : "justify-between px-3"
              } py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "portscan"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
              title="Port Scanning & Service Audit"
            >
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 shrink-0 text-amber-400" />
                {!isSidebarCollapsed && <span>Port Audit</span>}
              </div>
              {highRiskPortsCount > 0 && (
                <span
                  className="px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40"
                  title={`${highRiskPortsCount} high-risk ports open`}
                >
                  {highRiskPortsCount}
                </span>
              )}
            </button>

            {/* Speed Test */}
            <button
              onClick={() => setActiveTab("speedtest")}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? "justify-center px-0" : "justify-between px-3"
              } py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "speedtest"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
              title="Speed Test & Ping Benchmark"
            >
              <div className="flex items-center gap-3">
                <Gauge className="w-4 h-4 shrink-0 text-emerald-400" />
                {!isSidebarCollapsed && <span>Speed & Latency</span>}
              </div>
            </button>

            {/* Timeline */}
            <button
              onClick={() => {
                setActiveTab("timeline");
                fetchTimeline();
              }}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? "justify-center px-0" : "justify-between px-3"
              } py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "timeline"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
              title="Presence Timeline & Outages"
            >
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 shrink-0 text-indigo-400" />
                {!isSidebarCollapsed && <span>Timeline History</span>}
              </div>
            </button>

            {/* Intruder Alerts */}
            <button
              onClick={() => setActiveTab("alerts")}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? "justify-center px-0" : "justify-between px-3"
              } py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "alerts"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
              title="Intruder & Security Alerts"
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                {!isSidebarCollapsed && <span>Intruder Alerts</span>}
              </div>
              {activeAlertsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                  {activeAlertsCount}
                </span>
              )}
            </button>

            {/* RAT & Trojan Detector */}
            <button
              onClick={() => setActiveTab("rat")}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? "justify-center px-0" : "justify-between px-3"
              } py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "rat"
                  ? "bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
              title="RAT Check Tools: Scan network & endpoints for Remote Access Trojans & backdoors"
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
                {!isSidebarCollapsed && <span>RAT & Trojans</span>}
              </div>
              <span className="px-1.5 py-0.2 rounded font-mono text-[9px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                AUDIT
              </span>
            </button>

            {/* Terminal TUI */}
            <button
              onClick={() => setActiveTab("cli")}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? "justify-center px-0" : "justify-between px-3"
              } py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "cli"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
              title="Interactive Terminal Console"
            >
              <div className="flex items-center gap-3">
                <Terminal className="w-4 h-4 shrink-0 text-cyan-400" />
                {!isSidebarCollapsed && <span>Terminal TUI</span>}
              </div>
            </button>

            {/* System Settings */}
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? "justify-center px-0" : "justify-between px-3"
              } py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "settings"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
              title="System Configuration (Email Alerts, Threads, Storage & Backup)"
            >
              <div className="flex items-center gap-3">
                <SettingsIcon className="w-4 h-4 shrink-0 text-slate-300" />
                {!isSidebarCollapsed && <span>Settings</span>}
              </div>
            </button>

            {/* System & Debugging Logs (REQUESTED FEATURE) */}
            <button
              onClick={() => setActiveTab("logs")}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? "justify-center px-0" : "justify-between px-3"
              } py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "logs"
                  ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
              title="System Logs & Real-Time Debugging Telemetry Console"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 shrink-0 text-purple-400" />
                {!isSidebarCollapsed && <span>System & Debug Logs</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className="px-1.5 py-0.2 rounded font-mono text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  DEBUG
                </span>
              )}
            </button>

            {/* Documentation & Manual */}
            <button
              onClick={() => setActiveTab("docs")}
              className={`w-full flex items-center ${
                isSidebarCollapsed ? "justify-center px-0" : "justify-between px-3"
              } py-2.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "docs"
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
              title="Documentation, Architecture Manual & Installation Scripts"
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 shrink-0 text-indigo-400" />
                {!isSidebarCollapsed && <span>Documentation</span>}
              </div>
              <span className="px-1.5 py-0.2 rounded font-mono text-[9px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                MANUAL
              </span>
            </button>
          </div>

          {/* Sidebar Footer: Daemon Status & Quick Collapse Toggle */}
          <div className="p-3 border-t border-slate-800/80">
            {!isSidebarCollapsed ? (
              <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Intruder Daemon:</span>
                  <button
                    onClick={handleToggleDaemon}
                    className={`font-mono px-1.5 py-0.2 rounded text-[10px] ${
                      daemonRunning
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-red-500/20 text-red-300 border border-red-500/40 font-bold"
                    }`}
                  >
                    {daemonRunning ? "RUNNING" : "STOPPED"}
                  </button>
                </div>
                <div className="text-[10px] text-slate-500">
                  Auto-sweeps every 30s for rogue MACs
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <button
                  onClick={handleToggleDaemon}
                  className={`w-3 h-3 rounded-full ${
                    daemonRunning ? "bg-emerald-400" : "bg-red-500 animate-pulse"
                  }`}
                  title={daemonRunning ? "Daemon Running" : "Daemon Stopped"}
                />
              </div>
            )}
          </div>
        </aside>

        {/* MAIN AREA - FORMATTED LIKE BEAUTIFUL EXECUTIVE REPORTS */}
        <main
          className={`flex-1 ${
            activeTab === "canvas"
              ? "p-0 overflow-hidden flex flex-col"
              : "overflow-y-auto p-6 md:p-8 space-y-6"
          }`}
        >
          {/* TAB: NETWORK RELATIONSHIP CANVAS (NRC) */}
          {activeTab === "canvas" && (
            <NetworkRelationshipCanvas inventoryDevices={devices} />
          )}

          {/* NETWORK SCAN STATUS DISPLAY (REQUESTED FEATURE) */}
          {activeTab !== "canvas" && (isScanning || scanStatus.active) && (
            <div className="bg-gradient-to-r from-cyan-950/80 via-slate-900/90 to-blue-950/80 border-2 border-cyan-500/50 rounded-xl p-5 shadow-xl shadow-cyan-950/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="p-3 bg-cyan-500/20 text-cyan-300 rounded-xl border border-cyan-500/40 shrink-0">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold bg-cyan-900/70 px-2.5 py-0.5 rounded border border-cyan-400/40">
                        NETWORK SCAN STATUS: ACTIVE
                      </span>
                      <span className="text-xs font-mono text-slate-300 font-semibold">
                        Subnet: {scanStatus.targetSubnet || networkInfo?.subnet_cidr || "0.0.0.0/24"}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white mt-1">
                      {scanStatus.statusMessage || "Active subnet host discovery sweep in progress..."}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-300 mt-1">
                      <span>Stage: <strong className="text-cyan-300 uppercase font-mono">{scanStatus.stage}</strong></span>
                      <span>•</span>
                      <span>Hosts Discovered: <strong className="text-emerald-400 font-mono">{scanStatus.devicesFound} devices</strong></span>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-64 space-y-1.5 shrink-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Discovery Progress:</span>
                    <span className="font-mono font-bold text-cyan-300">{scanStatus.progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-700/80">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-300 shadow-sm shadow-cyan-400"
                      style={{ width: `${Math.max(scanStatus.progressPercent, 10)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 0: COMMAND HUB OVERVIEW REPORT */}
          {activeTab === "hub" && (
            <div className="space-y-6">
              {/* Report Header */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                      Report: Executive Network Health & Security Summary
                    </div>
                    <h1 className="text-xl font-bold text-white mt-1">Network Command Hub Audit</h1>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                      <span>Scope: {networkInfo?.subnet_cidr || "Local Area Network"}</span>
                      <span aria-hidden="true" className="text-slate-700">·</span>
                      <span>Interface: {networkInfo?.interface || "eth0"}</span>
                      <span aria-hidden="true" className="text-slate-700">·</span>
                      <span>Audit Time: {new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
                    >
                      <PrintIcon className="w-3.5 h-3.5" />
                      Print Report
                    </button>
                  </div>
                </div>

                {/* Score & Key Findings Strip */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-lg">
                    <span className="text-xs text-slate-400 font-medium">Security Health Rating</span>
                    <div className="mt-1 text-2xl font-bold font-mono text-cyan-400">
                      {routerAudit?.security_score?.score ?? 100} / 100
                    </div>
                    <span className="text-[11px] text-emerald-400 font-mono">
                      Grade {routerAudit?.security_score?.grade ?? "A"} ({routerAudit?.security_score?.health ?? "Good"})
                    </span>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-lg">
                    <span className="text-xs text-slate-400 font-medium">Identified Endpoints</span>
                    <div className="mt-1 text-2xl font-bold font-mono text-white">
                      {devices.length} Tracked
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {devices.filter((d) => d.status === "online").length} active online
                    </span>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-lg">
                    <span className="text-xs text-slate-400 font-medium">Untrusted / Rogue Devices</span>
                    <div className="mt-1 text-2xl font-bold font-mono text-red-400">
                      {untrustedCount} Devices
                    </div>
                    <span className="text-[11px] text-red-300">
                      {quarantinedCount} in quarantine
                    </span>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-lg">
                    <span className="text-xs text-slate-400 font-medium">Active Security Alerts</span>
                    <div className="mt-1 text-2xl font-bold font-mono text-amber-400">
                      {activeAlertsCount} Unresolved
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {daemonRunning ? "Daemon monitoring" : "Daemon standby"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive Target Subnet & Discovery Sweep Bar */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-5 shadow-lg transition-all">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                        <Radio className="w-4 h-4" />
                      </span>
                      <h3 className="text-sm font-bold text-white tracking-tight">
                        Target Subnet Discovery Sweep
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold">
                        {customSubnet || networkInfo?.subnet_cidr || "192.168.1.0/24"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Scan all active hosts on your local network or enter an IP/subnet CIDR to immediately audit.
                    </p>
                  </div>

                  {/* Input, Presets & Sweep Trigger */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 focus-within:border-cyan-400">
                      <span className="text-xs text-slate-500 font-mono mr-2">Target CIDR:</span>
                      <input
                        type="text"
                        value={customSubnet}
                        onChange={(e) => setCustomSubnet(e.target.value)}
                        placeholder={networkInfo?.subnet_cidr || "192.168.1.0/24"}
                        className="bg-transparent text-xs font-mono text-cyan-300 placeholder-slate-600 focus:outline-none w-36"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      {["192.168.1.0/24", "192.168.0.0/24", "10.0.0.0/24"].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setCustomSubnet(preset);
                            showToast(`Selected target subnet ${preset}`);
                          }}
                          className={`px-2 py-1 text-[11px] font-mono rounded border transition-colors ${
                            (customSubnet || networkInfo?.subnet_cidr) === preset
                              ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                              : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                          }`}
                        >
                          {preset.split(".")[0] === "192" && preset.split(".")[2] === "1"
                            ? "192.168.1.x"
                            : preset.split(".")[0] === "192"
                            ? "192.168.0.x"
                            : "10.0.0.x"}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleTriggerScan()}
                      disabled={isScanning}
                      className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm transition-transform active:scale-95 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
                      <span>{isScanning ? "Scanning Subnet..." : "Run Discovery Sweep"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Launcher Hub Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Inventory Card */}
                <div
                  onClick={() => setActiveTab("inventory")}
                  className="bg-slate-900/40 hover:bg-slate-800/40 border border-slate-800 hover:border-slate-700 p-5 rounded-xl cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                        <Laptop className="w-5 h-5" />
                      </span>
                      {untrustedCount > 0 && (
                        <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                          {untrustedCount} Untrusted
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-white">Device Inventory & Profiler</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Inspect remembered hardware, custom metadata tags, quarantine controls, and default credentials.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <span>{devices.length} devices remembered</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Router Security Card */}
                <div
                  onClick={() => setActiveTab("router")}
                  className={`p-5 rounded-xl cursor-pointer transition-all flex flex-col justify-between ${
                    routerDeductionsCount > 0
                      ? "bg-red-950/15 border border-red-500/40 hover:border-red-500/60"
                      : "bg-slate-900/40 hover:bg-slate-800/40 border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                        <Shield className="w-5 h-5" />
                      </span>
                      {routerDeductionsCount > 0 && (
                        <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                          {routerDeductionsCount} Vulnerabilities
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-white">Router Security Audit</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      UPnP WAN port exposure, cross-resolver DNS integrity test, and security rating.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <span>Score: {routerAudit?.security_score?.score ?? 100}/100</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Hidden Camera Card */}
                <div
                  onClick={() => setActiveTab("cameras")}
                  className="bg-slate-900/40 hover:bg-slate-800/40 border border-slate-800 hover:border-slate-700 p-5 rounded-xl cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                        <Eye className="w-5 h-5" />
                      </span>
                      {cameraRiskCount > 0 && (
                        <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                          {cameraRiskCount} Camera Detected
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-white">Hidden Camera Detector</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Probing RTSP streams (port 554) and CCTV hardware signatures on local subnet.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <span>{cameraRiskCount > 0 ? "Surveillance detected" : "No streams active"}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Quarantine Deck Card (Requested Feature) */}
                <div
                  onClick={() => setActiveTab("quarantine")}
                  className={`p-5 rounded-xl cursor-pointer transition-all flex flex-col justify-between ${
                    quarantinedCount > 0
                      ? "bg-red-950/20 border border-red-500/40 hover:border-red-500/60"
                      : "bg-slate-900/40 hover:bg-slate-800/40 border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="p-2 rounded-lg bg-red-500/10 text-red-400">
                        <ShieldAlert className="w-5 h-5" />
                      </span>
                      {quarantinedCount > 0 && (
                        <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                          {quarantinedCount} Isolated
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-white">Quarantine Command Deck</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Zero-trust endpoint isolation: Monitor active online and dormant offline quarantined devices with instant release actions.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <span>{quarantinedCount} endpoints held</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Diagnostics Suite Card (Requested Feature) */}
                <div
                  onClick={() => setActiveTab("nettools")}
                  className="bg-slate-900/40 hover:bg-slate-800/40 border border-slate-800 hover:border-slate-700 p-5 rounded-xl cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                        <Activity className="w-5 h-5" />
                      </span>
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        7 Tools
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white">Network Diagnostics & DNS</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      ICMP Ping, Hop-by-hop Traceroute, RFC DNS resolver, DNS Hijacking probe, Email Deliverability audit & Blacklist reputation.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <span>Includes DNS hijack check</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* RAT Check Tools Card */}
                <div
                  onClick={() => setActiveTab("rat")}
                  className="bg-slate-900/40 hover:bg-slate-800/40 border border-slate-800 hover:border-red-500/40 p-5 rounded-xl cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="p-2 rounded-lg bg-red-500/10 text-red-400">
                        <ShieldAlert className="w-5 h-5" />
                      </span>
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                        Trojan Audit
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white">RAT Check Tools</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Probe network devices for DarkComet, njRAT, PoisonIvy, Remcos, Gh0st, and known remote access trojan signatures.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <span>Single-host & network-wide audit</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Interactive Terminal Console Card */}
                <div
                  onClick={() => setActiveTab("cli")}
                  className="bg-slate-900/40 hover:bg-slate-800/40 border border-slate-800 hover:border-cyan-500/40 p-5 rounded-xl cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                        <Terminal className="w-5 h-5" />
                      </span>
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        Live Shell
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white">Embedded Terminal Console</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Interactive command shell with command history, preset macros, DNS hijack audit, and live stdout streaming.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <span>Direct engine terminal access</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Settings & Disaster Recovery Card */}
                <div
                  onClick={() => setActiveTab("settings")}
                  className="bg-slate-900/40 hover:bg-slate-800/40 border border-slate-800 hover:border-slate-600 p-5 rounded-xl cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="p-2 rounded-lg bg-slate-800 text-slate-300">
                        <SettingsIcon className="w-5 h-5" />
                      </span>
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        Config & Backup
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white">System Settings & Backups</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Configure SMTP email notification dispatch, multi-threaded scan worker pool, filesystem storage paths, and automated backups.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <span>Email, Threads, Storage & Disaster Recovery</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Documentation Manual Card */}
                <div
                  onClick={() => setActiveTab("docs")}
                  className="bg-slate-900/40 hover:bg-slate-800/40 border border-slate-800 hover:border-indigo-500/40 p-5 rounded-xl cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                        <BookOpen className="w-5 h-5" />
                      </span>
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                        13 Sections
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white">Documentation & Scripts</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Full technical manual explaining every feature in detail, plus conda setup script (setup_conda.sh) and compiler script (compile_app.sh).
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <span>Includes Conda scripts & CLI guide</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: DEVICE INVENTORY REPORT */}
          {activeTab === "inventory" && (
            <div className="space-y-6">
              {/* Executive Header */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                      Report: Hardware Discovery & Custom Metadata Inventory
                    </div>
                    <h1 className="text-xl font-bold text-white mt-1">Subnet Device Inventory Report</h1>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                      <span>Total Remembered: {devices.length}</span>
                      <span aria-hidden="true" className="text-slate-700">·</span>
                      <span>Active: {devices.filter((d) => d.status === "online").length}</span>
                      <span aria-hidden="true" className="text-slate-700">·</span>
                      <span>Quarantined: {quarantinedCount}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleScanIpv6}
                      disabled={isScanningIpv6}
                      className="px-3 py-1.5 text-xs font-semibold text-purple-200 bg-purple-900/60 hover:bg-purple-800/80 disabled:opacity-50 rounded-lg border border-purple-500/40 transition-colors flex items-center gap-1.5 shadow-sm"
                      title="Scan network for IPv6 neighbors, NDP mappings, and SLAAC addresses"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isScanningIpv6 ? "animate-spin" : ""}`} />
                      <span>{isScanningIpv6 ? "Scanning IPv6..." : "IPv6 Neighbor Sweep"}</span>
                    </button>
                    <a
                      href="/api/export/csv"
                      download="netsentinel_inventory.csv"
                      className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                      Export CSV
                    </a>
                    <a
                      href="/api/export/json"
                      download="netsentinel_inventory.json"
                      className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
                    >
                      <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                      Export JSON
                    </a>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search IP, IPv6, MAC, hostname, custom tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-md pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-md text-xs flex-wrap">
                    <button
                      onClick={() => setFilterType("all")}
                      className={`px-2.5 py-1 rounded transition-colors ${
                        filterType === "all" ? "bg-slate-800 text-white font-medium" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      All ({devices.length})
                    </button>
                    <button
                      onClick={() => setFilterType("online")}
                      className={`px-2.5 py-1 rounded transition-colors ${
                        filterType === "online" ? "bg-slate-800 text-emerald-400 font-medium" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Online ({devices.filter((d) => d.status === "online").length})
                    </button>
                    <button
                      onClick={() => setFilterType("ipv6")}
                      className={`px-2.5 py-1 rounded transition-colors ${
                        filterType === "ipv6" ? "bg-purple-900/70 text-purple-200 border border-purple-500/50 font-bold" : "text-slate-400 hover:text-purple-300"
                      }`}
                      title="Filter devices with active dual-stack IPv6 address"
                    >
                      IPv6 Stack ({devices.filter((d) => d.ipv6).length})
                    </button>
                    <button
                      onClick={() => setFilterType("untrusted")}
                      className={`px-2.5 py-1 rounded transition-colors ${
                        filterType === "untrusted" ? "bg-slate-800 text-red-400 font-medium" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Untrusted ({untrustedCount})
                    </button>
                    <button
                      onClick={() => setFilterType("quarantined")}
                      className={`px-2.5 py-1 rounded transition-colors ${
                        filterType === "quarantined" ? "bg-slate-800 text-amber-400 font-medium" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Quarantined ({quarantinedCount})
                    </button>
                  </div>
                </div>
              </div>

              {/* IPV6 DISCOVERY SWEEP PROGRESS METER (Requested Feature) */}
              {isScanningIpv6 && (
                <div className="bg-gradient-to-r from-purple-950/80 via-slate-900/90 to-indigo-950/80 border-2 border-purple-500/50 rounded-xl p-5 shadow-xl shadow-purple-950/50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="p-3 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/40 shrink-0">
                        <Globe className="w-5 h-5 animate-pulse text-purple-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300 font-bold bg-purple-900/70 px-2.5 py-0.5 rounded border border-purple-400/40">
                            IPV6 NEIGHBOR DISCOVERY ACTIVE
                          </span>
                          <span className="text-xs font-mono text-cyan-300 font-semibold">
                            Dual-Stack Neighbor Protocol (NDP / EUI-64)
                          </span>
                        </div>
                        <div className="text-sm font-bold text-white mt-1">
                          {ipv6ScanProgress.stage || "Probing IPv6 neighbors and NDP mappings..."}
                        </div>
                      </div>
                    </div>

                    <div className="w-full md:w-64 space-y-1.5 shrink-0">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-300 font-semibold">Sweep Progress:</span>
                        <span className="font-bold text-purple-300">{ipv6ScanProgress.percent}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-700/80">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-300 shadow-sm shadow-purple-400"
                          style={{ width: `${Math.max(ipv6ScanProgress.percent, 8)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* High-Density Data Grid */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold">
                        <th className="py-3 px-4 w-12 text-center">State</th>
                        <th className="py-3 px-4">Endpoint Identity</th>
                        <th className="py-3 px-4">Hardware & Vendor</th>
                        <th className="py-3 px-4">Default Credentials Hint</th>
                        <th className="py-3 px-4 text-center">Quarantine / Trust</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {filteredDevices.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-500">
                            No devices found matching current filters.
                          </td>
                        </tr>
                      ) : (
                        filteredDevices.map((d) => (
                          <tr
                            key={d.mac}
                            onClick={() => setSelectedDevice(d)}
                            className={`hover:bg-slate-800/40 transition-colors cursor-pointer group ${
                              d.is_quarantined === 1
                                ? "bg-red-950/20"
                                : d.is_trusted === 0
                                ? "bg-red-950/10"
                                : ""
                            }`}
                          >
                            {/* State */}
                            <td className="py-3.5 px-4 text-center">
                              {d.is_quarantined === 1 ? (
                                <ErrorPopover
                                  title="Device in Quarantine"
                                  cause={d.quarantine_reason || "Isolated by administrator"}
                                  explanation="This device was flagged as unauthorized or suspicious and placed in quarantine."
                                  solution={["Verify physical MAC address.", "Click 'Release Quarantine' if verified."]}
                                  actionLabel="Release Quarantine"
                                  onAction={() => handleToggleQuarantine(d.mac, 1)}
                                >
                                  <Lock className="w-3.5 h-3.5 text-red-400 inline" />
                                </ErrorPopover>
                              ) : d.status === "online" ? (
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" title="Online" />
                              ) : (
                                <span className="inline-block w-2 h-2 rounded-full bg-slate-600" title="Offline" />
                              )}
                            </td>

                            {/* Identity */}
                            <td className="py-3.5 px-4">
                              <div className="font-mono text-slate-200 font-semibold">{d.ip}</div>
                              <div className="font-mono text-[11px] text-slate-500">{d.mac}</div>
                              {d.ipv6 && (
                                <div className="font-mono text-[10px] text-purple-300 flex items-center gap-1 mt-0.5 truncate max-w-[220px]" title={`IPv6 Address: ${d.ipv6}`}>
                                  <span className="px-1 py-0.2 bg-purple-950/80 border border-purple-500/40 rounded text-[9px] text-purple-300 font-bold shrink-0">IPv6</span>
                                  <span className="truncate">{d.ipv6}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(d.ipv6!, "IPv6 Address");
                                    }}
                                    className="text-purple-400 hover:text-white shrink-0 ml-0.5"
                                    title="Copy IPv6 Address"
                                  >
                                    <Copy className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              )}
                              {d.nickname && (
                                <div className="text-[11px] text-cyan-300 font-sans font-medium">{d.nickname}</div>
                              )}
                            </td>

                            {/* Vendor & Category */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                {getDeviceIcon(d.device_type)}
                                <div>
                                  <div className="text-slate-200 font-medium">{d.vendor}</div>
                                  <div className="text-slate-500 text-[11px]">
                                    {d.hostname !== "Unknown" ? d.hostname : d.device_type}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Default Credentials Hint */}
                            <td className="py-3.5 px-4">
                              {d.default_credentials ? (
                                <div className="space-y-0.5">
                                  <div className="text-[11px] font-mono text-amber-300 flex items-center gap-1.5">
                                    <Key className="w-3 h-3 text-amber-400" />
                                    <span>
                                      {d.default_credentials.default_username} / {d.default_credentials.default_password}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    Admin: {d.default_credentials.admin_url}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-500">None standard</span>
                              )}
                            </td>

                            {/* Quarantine & Trust Actions */}
                            <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-2">
                                {d.is_quarantined === 1 ? (
                                  <button
                                    onClick={() => handleToggleQuarantine(d.mac, 1)}
                                    className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30"
                                  >
                                    QUARANTINED
                                  </button>
                                ) : d.is_trusted === 0 ? (
                                  <button
                                    onClick={() => handleToggleQuarantine(d.mac, 0, "Unknown rogue MAC")}
                                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20"
                                  >
                                    Quarantine
                                  </button>
                                ) : (
                                  <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Trusted
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedDevice(d)}
                                  className="px-2.5 py-1 text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700"
                                >
                                  Inspect & Meta
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: QUARANTINE DECK (REQUESTED FEATURE) */}
          {activeTab === "quarantine" && (
            <QuarantineView
              devices={devices}
              onRefresh={fetchDevices}
              onUpdateQuarantine={handleToggleQuarantine}
              onTogglePause={handleTogglePause}
              onSelectDeviceForScan={(ip) => {
                setTargetIp(ip);
                setActiveTab("portscan");
              }}
              onInspectDevice={(dev) => {
                const fullDev = devices.find((d) => d.mac === dev.mac) || (dev as any);
                setSelectedDevice(fullDev);
              }}
              showToast={showToast}
            />
          )}

          {/* TAB: NETWORK DIAGNOSTICS & TESTING SUITE (REQUESTED FEATURE) */}
          {activeTab === "nettools" && (
            <NetworkDiagnosticsView
              devices={devices}
              showToast={showToast}
            />
          )}

          {/* TAB: WI-FI SPECTRUM & SATURATION ANALYZER (REQUESTED FEATURE) */}
          {activeTab === "wifi" && (
            <WifiAnalyzerView showToast={showToast} />
          )}

          {/* TAB 2: ROUTER SECURITY REPORT */}
          {activeTab === "router" && (
            <div className="space-y-6">
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                      Report: Automated Router Vulnerability & UPnP / DNS Security
                    </div>
                    <h1 className="text-xl font-bold text-white mt-1">Gateway Defense Audit Report</h1>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                      <span>Gateway Target: {routerAudit?.gateway_ip || "127.0.0.1"}</span>
                      <span aria-hidden="true" className="text-slate-700">·</span>
                      <span>Audit Timestamp: {routerAudit?.timestamp || new Date().toISOString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={fetchRouterAudit}
                    disabled={isAuditingRouter}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-lg flex items-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isAuditingRouter ? "animate-spin" : ""}`} />
                    {isAuditingRouter ? "Auditing..." : "Re-Run Audit"}
                  </button>
                </div>

                {/* GATEWAY DEFENSE AUDIT PROGRESS METER */}
                {isAuditingRouter && (
                  <div className="mb-5 bg-gradient-to-r from-cyan-950/80 via-slate-900/90 to-blue-950/80 border-2 border-cyan-500/50 rounded-xl p-5 shadow-xl shadow-cyan-950/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="p-3 bg-cyan-500/20 text-cyan-300 rounded-xl border border-cyan-500/40 shrink-0">
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold bg-cyan-900/70 px-2.5 py-0.5 rounded border border-cyan-400/40">
                              GATEWAY AUDIT IN PROGRESS
                            </span>
                            <span className="text-xs font-mono text-slate-300">
                              Target: {routerAudit?.gateway_ip || "Default Gateway"}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-white mt-1">
                            {routerAuditProgress.stage || "Auditing router security posture..."}
                          </div>
                        </div>
                      </div>

                      <div className="w-full md:w-64 space-y-1.5 shrink-0">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-300 font-semibold">Audit Progress:</span>
                          <span className="font-bold text-cyan-300">{routerAuditProgress.percent}%</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-700/80">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 via-cyan-400 to-emerald-400 rounded-full transition-all duration-300 shadow-sm shadow-cyan-400"
                            style={{ width: `${Math.max(routerAuditProgress.percent, 8)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {routerAudit && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-lg">
                        <span className="text-xs text-slate-400 font-medium">Security Score</span>
                        <div className="mt-1 text-2xl font-bold font-mono text-cyan-400">
                          {routerAudit.security_score.score} / 100
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Grade {routerAudit.security_score.grade} ({routerAudit.security_score.health})
                        </span>
                      </div>

                      <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-lg">
                        <span className="text-xs text-slate-400 font-medium">UPnP Exposure</span>
                        <div className="mt-1 text-sm font-bold font-mono">
                          {routerAudit.upnp_audit.upnp_exposed ? (
                            <span className="text-red-400 font-bold">VULNERABLE (Open)</span>
                          ) : (
                            <span className="text-emerald-400">PROTECTED (Closed)</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-lg">
                        <span className="text-xs text-slate-400 font-medium">DNS Integrity</span>
                        <div className="mt-1 text-sm font-bold font-mono">
                          {routerAudit.dns_audit.is_hijacked ? (
                            <span className="text-red-400 font-bold">HIJACKED</span>
                          ) : (
                            <span className="text-emerald-400">SECURE (Standard)</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-lg">
                        <span className="text-xs text-slate-400 font-medium">Active Deductions</span>
                        <div className="mt-1 text-2xl font-bold font-mono text-amber-400">
                          {routerAudit.security_score.deductions.length} Issues
                        </div>
                      </div>
                    </div>

                    {/* Detailed Findings Table */}
                    <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-5 space-y-3">
                      <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Vulnerability Findings & Risk Deductions
                      </h3>
                      {routerAudit.security_score.deductions.length === 0 ? (
                        <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                          <Check className="w-4 h-4" /> No security penalties detected. Local network is hardened.
                        </p>
                      ) : (
                        <ul className="space-y-2 text-xs font-sans">
                          {routerAudit.security_score.deductions.map((d, i) => (
                            <li key={i} className="flex items-center gap-2 text-amber-300">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>{d}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: HIDDEN CAMERAS & SURVEILLANCE REPORT */}
          {activeTab === "cameras" && (
            <CamerasDeckView
              cameras={cameras}
              isScanning={isScanningCameras}
              scanProgress={cameraScanProgress}
              onScanCameras={fetchCameras}
              onUpdateCamera={handleUpdateCamera}
              showToast={showToast}
            />
          )}

          {/* TAB 4: MULTI-THREADED PORT AUDIT REPORT */}
          {activeTab === "portscan" && (
            <div className="space-y-6">
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                      Report: Multi-Threaded Port Audit & High-Throughput Service Prober
                    </div>
                    <h1 className="text-xl font-bold text-white mt-1">Port & Service Security Report</h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                      High-concurrency TCP connect audit with service banner grabbing and threat level evaluation across up to 65,535 ports.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 w-full max-w-md">
                    <TargetIpSelector
                      value={targetIp}
                      onChange={(ip, dev) => {
                        setTargetIp(ip);
                        if (dev) setTargetMac(dev.mac);
                      }}
                      devices={devices}
                      placeholder="Target IP (pick seen device or enter IP)..."
                      className="flex-1"
                    />
                    <button
                      onClick={() => handlePortScan(targetIp, targetMac)}
                      disabled={!targetIp || isPortScanning}
                      className="px-4 py-2.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-lg shrink-0 transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Zap className={`w-3.5 h-3.5 ${isPortScanning ? "animate-spin" : ""}`} />
                      {isPortScanning ? "Auditing Ports..." : "Audit Ports"}
                    </button>
                  </div>
                </div>

                {/* Scan Profiles & Worker Thread Tuning Bar */}
                <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-4">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-300 block mb-2">
                      Port Audit Scope & Range Profile:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                      {[
                        { id: "top", label: "Top 50 Services", desc: "Common (Fastest)" },
                        { id: "quick", label: "Top 100 Extended", desc: "Standard Services" },
                        { id: "well_known", label: "Well-Known (1–1,024)", desc: "System Ports" },
                        { id: "extended", label: "Extended (1–10,000)", desc: "Deep Range" },
                        { id: "full", label: "Full (1–65,535)", desc: "Complete Sweep" },
                        { id: "custom", label: "Custom Range", desc: "User Specified" },
                      ].map((profile) => (
                        <button
                          key={profile.id}
                          type="button"
                          onClick={() => setPortScanMode(profile.id as any)}
                          className={`p-2.5 rounded-lg border text-left transition-all ${
                            portScanMode === profile.id
                              ? "bg-cyan-500/15 border-cyan-500/50 text-cyan-200 shadow-sm"
                              : "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-white"
                          }`}
                        >
                          <div className="text-xs font-semibold truncate">{profile.label}</div>
                          <div className="text-[10px] text-slate-500 truncate">{profile.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Ports Input */}
                  {portScanMode === "custom" && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Custom Port Range / List (e.g. 21, 22, 80, 443, 554, 8000-8080, 8443, 9000-9100)
                      </label>
                      <input
                        type="text"
                        value={customPortsInput}
                        onChange={(e) => setCustomPortsInput(e.target.value)}
                        placeholder="21, 22, 80, 443, 554, 8000-8080"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                    </div>
                  )}

                  {/* Thread Concurrency Slider */}
                  <div className="pt-2 border-t border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-white flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-emerald-400" /> Parallel Worker Threads:
                        </span>
                        <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                          {portScanThreads} Threads
                        </span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="500"
                        step="10"
                        value={portScanThreads}
                        onChange={(e) => setPortScanThreads(parseInt(e.target.value) || 100)}
                        className="w-full accent-emerald-400 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {[50, 100, 200, 500].map((thr) => (
                        <button
                          key={thr}
                          type="button"
                          onClick={() => setPortScanThreads(thr)}
                          className={`px-2.5 py-1 rounded text-[10px] font-mono font-semibold transition-colors ${
                            portScanThreads === thr
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                          }`}
                        >
                          {thr}T
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* LIVE PORT SCAN PROGRESS & COUNT DISPLAY (REQUESTED FEATURE) */}
                {(isPortScanning || portScanStatus.active) && (
                  <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900/90 to-cyan-950/70 border-2 border-emerald-500/50 rounded-xl p-5 shadow-xl shadow-emerald-950/40 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-lg border border-emerald-500/40 shrink-0">
                          <Zap className="w-5 h-5 animate-spin" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                            PORT SCAN IN PROGRESS
                          </span>
                          <h3 className="text-sm font-bold text-white mt-0.5">
                            Auditing Host: {targetIp || portScanStatus.targetIp || "Selected Target"}
                          </h3>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-400">Ports Checked vs Total:</div>
                        <div className="text-xl font-mono font-extrabold text-emerald-400">
                          {portScanStatus.checkedCount.toLocaleString()} / {portScanStatus.totalPorts.toLocaleString()}
                          <span className="text-xs font-normal text-slate-300 ml-1.5">
                            ({portScanStatus.progressPercent.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Animated Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-700/80">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 rounded-full transition-all duration-200 shadow-sm shadow-emerald-400"
                          style={{
                            width: `${Math.max(
                              (portScanStatus.checkedCount / Math.max(portScanStatus.totalPorts, 1)) * 100,
                              3
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                      <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Ports Checked</span>
                        <span className="font-mono font-bold text-white text-sm">
                          {portScanStatus.checkedCount.toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Total To Check</span>
                        <span className="font-mono font-bold text-cyan-300 text-sm">
                          {portScanStatus.totalPorts.toLocaleString()} Ports
                        </span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Open Ports Found</span>
                        <span className="font-mono font-bold text-emerald-400 text-sm">
                          {portScanStatus.openCount} Open
                        </span>
                      </div>
                      <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Currently Probing</span>
                        <span className="font-mono font-bold text-amber-300 text-sm">
                          {portScanStatus.currentPort ? `TCP ${portScanStatus.currentPort}` : "Sweeping..."}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Benchmark Performance Telemetry Strip */}
                {portScanBenchmark && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Audit Throughput</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        ⚡ {portScanBenchmark.throughput_ports_per_sec.toLocaleString()} ports/sec
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Sweep Duration</span>
                      <span className="font-mono font-bold text-cyan-400 text-sm">
                        {portScanBenchmark.duration_ms} ms
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Total Probed</span>
                      <span className="font-mono font-bold text-slate-200 text-sm">
                        {portScanBenchmark.total_probed} Ports
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Worker Threads</span>
                      <span className="font-mono font-bold text-purple-400 text-sm">
                        {portScanBenchmark.threads_used} Active
                      </span>
                    </div>
                  </div>
                )}

                {/* Findings Table */}
                {portFindings.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    {targetIp ? "No open ports detected in this range profile." : "Select an endpoint to audit."}
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
                          <th className="py-2.5 px-4">Port</th>
                          <th className="py-2.5 px-4">Service</th>
                          <th className="py-2.5 px-4">Description</th>
                          <th className="py-2.5 px-4">Risk Level</th>
                          <th className="py-2.5 px-4">Application Banner</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-sans">
                        {portFindings.map((f, i) => (
                          <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 font-mono font-bold text-slate-200">{f.port}</td>
                            <td className="py-3 px-4 text-cyan-400 font-medium">{f.service_name}</td>
                            <td className="py-3 px-4 text-slate-400">{f.description}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                                  f.risk === "High"
                                    ? "bg-red-500/20 text-red-300 font-bold"
                                    : f.risk === "Medium"
                                    ? "bg-amber-500/20 text-amber-300"
                                    : "bg-emerald-500/20 text-emerald-300"
                                }`}
                              >
                                {f.risk} Risk
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-300">
                              {f.banner || <span className="text-slate-600">None</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: SPEED & PING REPORT */}
          {activeTab === "speedtest" && (
            <div className="space-y-6">
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                      Report: Bandwidth Throughput & Network Latency Metrics
                    </div>
                    <h1 className="text-xl font-bold text-white mt-1">Network Performance Benchmark Report</h1>
                  </div>

                  <button
                    onClick={handleSpeedTest}
                    disabled={isSpeedTesting}
                    className="px-4 py-2 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg flex items-center gap-2"
                  >
                    <Gauge className={`w-4 h-4 ${isSpeedTesting ? "animate-spin" : ""}`} />
                    {isSpeedTesting ? "Measuring..." : "Run Speed Benchmark"}
                  </button>
                </div>

                {/* SPEED BENCHMARK PROGRESS METER */}
                {isSpeedTesting && (
                  <div className="mb-6 bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-cyan-950/80 border-2 border-emerald-500/50 rounded-xl p-5 shadow-xl shadow-emerald-950/50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="p-3 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/40 shrink-0">
                          <Gauge className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold bg-emerald-900/70 px-2.5 py-0.5 rounded border border-emerald-400/40">
                              BENCHMARK IN PROGRESS
                            </span>
                            {speedTestProgress.currentMbps > 0 && (
                              <span className="text-xs font-mono text-cyan-300 font-bold">
                                Current Rate: ~{speedTestProgress.currentMbps} Mbps
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-bold text-white mt-1">
                            {speedTestProgress.stage || "Measuring network throughput..."}
                          </div>
                        </div>
                      </div>

                      <div className="w-full md:w-64 space-y-1.5 shrink-0">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-300 font-semibold">Test Progress:</span>
                          <span className="font-bold text-emerald-400">{speedTestProgress.percent}%</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-700/80">
                          <div
                            className="h-full bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 rounded-full transition-all duration-300 shadow-sm shadow-emerald-400"
                            style={{ width: `${Math.max(speedTestProgress.percent, 8)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-lg">
                    <span className="text-xs text-slate-400 font-medium">Download Bandwidth</span>
                    <div className="mt-2 text-3xl font-bold font-mono text-emerald-400">
                      {latestSpeedTest ? latestSpeedTest.download_mbps.toFixed(2) : "--"}
                      <span className="text-sm font-normal text-slate-500 ml-1.5">Mbps</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-lg">
                    <span className="text-xs text-slate-400 font-medium">Upload Bandwidth</span>
                    <div className="mt-2 text-3xl font-bold font-mono text-cyan-400">
                      {latestSpeedTest ? latestSpeedTest.upload_mbps.toFixed(2) : "--"}
                      <span className="text-sm font-normal text-slate-500 ml-1.5">Mbps</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-lg">
                    <span className="text-xs text-slate-400 font-medium">Round-Trip Latency (Ping)</span>
                    <div className="mt-2 text-3xl font-bold font-mono text-amber-400">
                      {latestSpeedTest ? latestSpeedTest.ping_ms.toFixed(2) : "--"}
                      <span className="text-sm font-normal text-slate-500 ml-1.5">ms</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: TIMELINE & PRESENCE REPORT */}
          {activeTab === "timeline" && (
            <div className="space-y-6">
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                      Report: Digital Presence Timeline & Connection Outage History
                    </div>
                    <h1 className="text-xl font-bold text-white mt-1">Presence & State Transition Report</h1>
                  </div>

                  <button
                    onClick={fetchTimeline}
                    className="px-3 py-1.5 text-xs bg-slate-800 text-slate-300 rounded-lg flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Refresh
                  </button>
                </div>

                <div className="divide-y divide-slate-800/60 font-sans">
                  {timeline.length === 0 ? (
                    <div className="py-12 text-center text-slate-500">No events logged yet.</div>
                  ) : (
                    timeline.map((item) => (
                      <div key={item.id} className="py-3 px-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                              item.event_type === "CONNECTED"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : item.event_type === "DISCONNECTED"
                                ? "bg-slate-700 text-slate-300"
                                : "bg-red-500/20 text-red-300"
                            }`}
                          >
                            {item.event_type}
                          </span>
                          <div>
                            <div className="text-xs font-semibold text-slate-200">
                              {item.nickname || item.hostname || item.mac}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {item.mac} {item.details && `· ${item.details}`}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: ALERTS REPORT */}
          {activeTab === "alerts" && (
            <div className="space-y-6">
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                      Report: Intruder Alarms & Security Anomaly Audit
                    </div>
                    <h1 className="text-xl font-bold text-white mt-1">Security Event Audit Log</h1>
                  </div>

                  {alerts.length > 0 && (
                    <button
                      onClick={handleClearAlerts}
                      className="px-3 py-1.5 text-xs text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg"
                    >
                      Clear All Alerts
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-800/60 font-sans">
                  {alerts.length === 0 ? (
                    <div className="py-12 text-center text-slate-500">No intruder alerts logged.</div>
                  ) : (
                    alerts.map((a) => (
                      <div key={a.id} className="py-3 px-2 flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold px-1.5 rounded bg-red-500/20 text-red-300">
                              {a.alert_type}
                            </span>
                            <span className="text-xs font-mono text-slate-500">
                              {new Date(a.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-200 mt-1">{a.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: TERMINAL TUI REPORT & EMBEDDED CONSOLE */}
          {activeTab === "cli" && (
            <div className="space-y-6">
              <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                      Terminal: Live Python Rich CLI Interface & Shell
                    </div>
                    <h1 className="text-xl font-bold text-white mt-1">Terminal Execution Console</h1>
                    <p className="text-xs text-slate-400 mt-1">
                      Full-featured embedded terminal with interactive command prompt, preset macros, and direct engine execution.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleRunCli("--scan")}
                      disabled={isExecutingCli}
                      className="px-3 py-1.5 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700"
                    >
                      cli.py --scan
                    </button>
                    <button
                      onClick={() => handleRunCli("--router-audit")}
                      disabled={isExecutingCli}
                      className="px-3 py-1.5 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded border border-slate-700"
                    >
                      cli.py --router-audit
                    </button>
                    <button
                      onClick={() => handleRunCli("--cameras")}
                      disabled={isExecutingCli}
                      className="px-3 py-1.5 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-purple-300 rounded border border-slate-700"
                    >
                      cli.py --cameras
                    </button>
                    <button
                      onClick={() => handleRunCli("--speedtest")}
                      disabled={isExecutingCli}
                      className="px-3 py-1.5 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-amber-300 rounded border border-slate-700"
                    >
                      cli.py --speedtest
                    </button>
                  </div>
                </div>

                {/* CLI EXECUTION PROGRESS METER (Requested Feature) */}
                {(isExecutingCli || cliExecProgress.active) && (
                  <div className="mb-4 bg-gradient-to-r from-cyan-950/80 via-slate-900/90 to-blue-950/80 border-2 border-cyan-500/50 rounded-xl p-4 shadow-xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-cyan-500/20 text-cyan-300 rounded-lg border border-cyan-500/40 shrink-0">
                          <Terminal className="w-4 h-4 animate-spin text-cyan-400" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                            ENGINE SUBPROCESS RUNNING
                          </span>
                          <h4 className="text-xs font-mono font-bold text-white mt-0.5">
                            {cliExecProgress.command ? `python3 cli.py ${cliExecProgress.command}` : "Running command..."}
                          </h4>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {cliExecProgress.stage || "Executing engine subshell command..."}
                          </div>
                        </div>
                      </div>

                      <div className="w-full md:w-56 space-y-1 shrink-0">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-400">Progress:</span>
                          <span className="font-bold text-cyan-300">{cliExecProgress.percent}%</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-700/80">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-300"
                            style={{ width: `${Math.max(cliExecProgress.percent, 8)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Embedded Terminal Component */}
                <EmbeddedTerminal
                  showToast={showToast}
                  onNavigateTab={(tab) => setActiveTab(tab as any)}
                />
              </div>
            </div>
          )}

          {/* TAB 9: REMOTE ACCESS TROJAN (RAT) & BACKDOOR DETECTOR */}
          {activeTab === "rat" && (
            <RatDetectorView
              devices={devices}
              onToggleQuarantine={handleToggleQuarantine}
              showToast={showToast}
            />
          )}

          {/* TAB 10: APPLICATION SETTINGS & BACKUPS */}
          {activeTab === "settings" && (
            <SettingsView
              showToast={showToast}
              onRefreshDevices={fetchDevices}
              onOpenGuidedSetup={() => setShowGuidedConfig(true)}
            />
          )}

          {/* TAB 11: DOCUMENTATION MANUAL & SCRIPTS */}
          {activeTab === "docs" && (
            <DocumentationView
              showToast={showToast}
              onNavigateTab={(tab) => setActiveTab(tab as any)}
            />
          )}

          {/* TAB 12: SYSTEM & DEBUG LOGS CONSOLE (REQUESTED FEATURE) */}
          {activeTab === "logs" && (
            <LogsView showToast={showToast} />
          )}
        </main>
      </div>

      {/* INSPECT DEVICE MODAL (CUSTOM METADATA, DEFAULT CREDENTIALS, QUARANTINE) */}
      {selectedDevice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                  {getDeviceIcon(selectedDevice.device_type)}
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">
                    {selectedDevice.nickname || selectedDevice.hostname || selectedDevice.ip}
                  </h2>
                  <div className="text-xs font-mono text-slate-400">
                    IP: {selectedDevice.ip} · MAC: {selectedDevice.mac}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedDevice(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quarantine & Access Action Banner */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2.5 text-xs">
                {selectedDevice.is_quarantined === 1 ? (
                  <span className="text-red-400 flex items-center gap-1.5 font-bold">
                    <Lock className="w-4 h-4" /> Endpoint Currently in Quarantine
                  </span>
                ) : selectedDevice.is_trusted === 1 ? (
                  <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-4 h-4" /> Verified Trusted Device
                  </span>
                ) : (
                  <span className="text-red-400 flex items-center gap-1.5 font-medium">
                    <ShieldAlert className="w-4 h-4" /> Unverified Device on LAN
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedDevice.is_quarantined === 1 ? (
                  <button
                    onClick={() => handleToggleQuarantine(selectedDevice.mac, 1)}
                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg hover:bg-emerald-600/50"
                  >
                    Release Quarantine
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleQuarantine(selectedDevice.mac, 0, "Quarantined via inspector")}
                    className="px-3 py-1.5 text-xs font-semibold bg-red-600/30 text-red-300 border border-red-500/40 rounded-lg hover:bg-red-600/50"
                  >
                    Place in Quarantine
                  </button>
                )}

                <button
                  onClick={() => handleToggleTrust(selectedDevice.mac, selectedDevice.is_trusted)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-700"
                >
                  {selectedDevice.is_trusted === 1 ? "Untrust" : "Trust Device"}
                </button>
              </div>
            </div>

            {/* Factory Default Credentials Card */}
            {selectedDevice.default_credentials && (
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-amber-400" />
                    Factory Default Credentials & Admin Web Page
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                    Default Profile
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-amber-950/60 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 text-[10px]">Default Username</span>
                      <div className="font-mono text-slate-200 font-bold">
                        {selectedDevice.default_credentials.default_username}
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(selectedDevice.default_credentials!.default_username, "Username")}
                      className="p-1 hover:text-cyan-400"
                      title="Copy Username"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-amber-950/60 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 text-[10px]">Default Password</span>
                      <div className="font-mono text-slate-200 font-bold">
                        {selectedDevice.default_credentials.default_password}
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(selectedDevice.default_credentials!.default_password, "Password")}
                      className="p-1 hover:text-cyan-400"
                      title="Copy Password"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs bg-slate-950/80 p-2.5 rounded-lg border border-amber-950/60">
                  <span className="font-mono text-slate-300 truncate">
                    Admin URL: {selectedDevice.default_credentials.admin_url}
                  </span>
                  <a
                    href={selectedDevice.default_credentials.admin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 hover:text-white flex items-center gap-1 font-semibold shrink-0 ml-2"
                  >
                    <span>Launch Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  {selectedDevice.default_credentials.notes}
                </p>
              </div>
            )}

            {/* Custom Metadata Engine (User Can Add Any Metadata Desired) */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-cyan-400" />
                  Custom Device Metadata (Permanent Storage)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">SQLite Tracked</span>
              </div>

              {/* Render Existing Custom Metadata Pairs */}
              {selectedDevice.custom_metadata && Object.keys(selectedDevice.custom_metadata).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries(selectedDevice.custom_metadata).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex items-center justify-between bg-slate-900 px-3 py-2 rounded-lg border border-slate-800"
                    >
                      <div className="truncate mr-2">
                        <span className="text-slate-500 text-[10px] block">{k}</span>
                        <span className="text-slate-200 font-medium truncate block">{v}</span>
                      </div>
                      <button
                        onClick={() => handleRemoveMetaPair(k)}
                        className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                        title="Delete key"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  No custom metadata added yet. You can attach any custom properties (e.g., Owner, Department, Asset Tag, Room, Notes).
                </p>
              )}

              {/* Form to Add New Custom Metadata Key-Value */}
              <div className="pt-2 border-t border-slate-850 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  placeholder="Key (e.g. Owner, Room, OS)"
                  value={newMetaKey}
                  onChange={(e) => setNewMetaKey(e.target.value)}
                  className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-white placeholder-slate-500 flex-1"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. Alice, Lab 3, Ubuntu)"
                  value={newMetaValue}
                  onChange={(e) => setNewMetaValue(e.target.value)}
                  className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-white placeholder-slate-500 flex-1"
                />
                <button
                  onClick={handleAddMetaPair}
                  disabled={!newMetaKey.trim()}
                  className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Meta</span>
                </button>
              </div>
            </div>

            {/* Standard Telemetry & Visibility History */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px]">Hardware Vendor</span>
                <div className="text-slate-200 font-medium truncate">{selectedDevice.vendor}</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px]">First Seen Timestamp</span>
                <div className="text-slate-200 font-mono text-[11px] truncate">
                  {new Date(selectedDevice.first_seen).toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px]">Last Seen Timestamp</span>
                <div className="text-slate-200 font-mono text-[11px] truncate">
                  {new Date(selectedDevice.last_seen).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSendWol(selectedDevice.mac)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1.5"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>Wake-on-LAN</span>
                </button>
                <button
                  onClick={() => {
                    handlePortScan(selectedDevice.ip, selectedDevice.mac);
                    setSelectedDevice(null);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1.5"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Audit Ports</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("nettools");
                    setSelectedDevice(null);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold bg-cyan-900/30 hover:bg-cyan-800/50 text-cyan-200 border border-cyan-500/30 rounded-lg flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Run Diagnostics</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedDevice(null)}
                className="px-4 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GUIDED CONFIG WIZARD MODAL */}
      <GuidedConfigModal
        isOpen={showGuidedConfig}
        onClose={() => {
          setShowGuidedConfig(false);
          try {
            localStorage.setItem("netsentinel_first_run_completed", "true");
            fetch("/api/first-run/complete", { method: "POST" }).catch(() => {});
          } catch {}
        }}
        onComplete={() => {
          setShowGuidedConfig(false);
          try {
            localStorage.setItem("netsentinel_first_run_completed", "true");
            fetch("/api/first-run/complete", { method: "POST" }).catch(() => {});
          } catch {}
          fetchStatus();
          fetchDevices();
        }}
        showToast={showToast}
      />

      {/* GATEWAY & SUBNET TARGET MODAL */}
      <GatewayConfigModal
        isOpen={showGatewayModal}
        onClose={() => setShowGatewayModal(false)}
        currentGateway={networkInfo?.gateway_ip || "127.0.0.1"}
        currentSubnet={networkInfo?.subnet_cidr || "127.0.0.1/32"}
        currentInterface={networkInfo?.interface || "Wi-Fi"}
        onSuccess={(updated) => {
          setNetworkInfo((prev) =>
            prev
              ? {
                  ...prev,
                  gateway_ip: updated.gateway_ip,
                  subnet_cidr: updated.subnet_cidr,
                  interface: updated.interface,
                }
              : {
                  local_ip: "127.0.0.1",
                  gateway_ip: updated.gateway_ip,
                  subnet_cidr: updated.subnet_cidr,
                  interface: updated.interface,
                }
          );
          fetchStatus();
          fetchDevices();
        }}
        showToast={showToast}
        onSaveAndSweep={(sub) => {
          setCustomSubnet(sub);
          handleTriggerScan(sub);
        }}
      />

      {/* WINDOWS 11 AUTOMATED INSTALLER MODAL */}
      <Windows11InstallerModal
        isOpen={showWin11Modal}
        onClose={() => setShowWin11Modal(false)}
        showToast={showToast}
      />
    </div>
  );
}

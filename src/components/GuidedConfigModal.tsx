import React, { useState, useEffect } from "react";
import {
  X,
  Compass,
  Radio,
  Wifi,
  Search,
  Check,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Sliders,
  Shield,
  Layers,
  Activity,
  Laptop,
  Camera,
  Key,
  ArrowRight,
  ExternalLink,
  Plus,
  RefreshCw,
  Clock,
  Sparkles,
} from "lucide-react";

export interface KnownSubnet {
  cidr: string;
  interface: string;
  is_primary: boolean;
  label: string;
  recommended: boolean;
}

interface GuidedConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  showToast: (msg: string) => void;
  onSelectTab?: (tab: string) => void;
}

export function GuidedConfigModal({
  isOpen,
  onClose,
  onComplete,
  showToast,
  onSelectTab,
}: GuidedConfigModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Subnet Selection & Options
  const [knownSubnets, setKnownSubnets] = useState<KnownSubnet[]>([]);
  const [selectedSubnets, setSelectedSubnets] = useState<string[]>([]);
  const [customCidr, setCustomCidr] = useState<string>("");
  const [performPortScans, setPerformPortScans] = useState<boolean>(true);
  const [isLoadingSubnets, setIsLoadingSubnets] = useState<boolean>(false);

  // Step 2: Live Scanning Execution
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStatusLogs, setScanStatusLogs] = useState<string[]>([]);
  const [currentScanningSubnet, setCurrentScanningSubnet] = useState<string>("");

  // Step 3: Discovery Results
  const [discoveryResult, setDiscoveryResult] = useState<{
    subnets_scanned: string[];
    devices_discovered: number;
    total_inventory: number;
    cameras_identified: number;
    port_scans_performed: boolean;
    devices: any[];
    cameras: any[];
  } | null>(null);

  // Load known subnets on open
  useEffect(() => {
    if (isOpen) {
      fetchSubnets();
    }
  }, [isOpen]);

  const fallbackSubnets: KnownSubnet[] = [
    {
      cidr: "192.168.1.0/24",
      interface: "Wi-Fi/Ethernet",
      is_primary: true,
      label: "Standard Residential LAN (192.168.1.0/24)",
      recommended: true,
    },
    {
      cidr: "192.168.0.0/24",
      interface: "Secondary LAN",
      is_primary: false,
      label: "TP-Link / Netgear / D-Link LAN (192.168.0.0/24)",
      recommended: true,
    },
    {
      cidr: "10.0.0.0/24",
      interface: "Cable/Fiber LAN",
      is_primary: false,
      label: "Xfinity / Comcast / AT&T Fiber (10.0.0.0/24)",
      recommended: false,
    },
    {
      cidr: "192.168.50.0/24",
      interface: "ASUS LAN",
      is_primary: false,
      label: "ASUS RT / ROG Router LAN (192.168.50.0/24)",
      recommended: false,
    },
  ];

  const fetchSubnets = async () => {
    setIsLoadingSubnets(true);
    try {
      const res = await fetch("/api/subnets");
      if (res.ok) {
        const data: KnownSubnet[] = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setKnownSubnets(data);
          const recommended = data.filter((s) => s.recommended).map((s) => s.cidr);
          setSelectedSubnets(recommended.length > 0 ? recommended : [data[0]?.cidr || "192.168.1.0/24"]);
          return;
        }
      }
      setKnownSubnets(fallbackSubnets);
      setSelectedSubnets(["192.168.1.0/24"]);
    } catch {
      setKnownSubnets(fallbackSubnets);
      setSelectedSubnets(["192.168.1.0/24"]);
    } finally {
      setIsLoadingSubnets(false);
    }
  };

  const normalizeCidr = (input: string): string => {
    let trimmed = input.trim();
    if (!trimmed) return "";
    if (!trimmed.includes("/")) {
      const parts = trimmed.split(".");
      if (parts.length >= 3) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
      }
      return `${trimmed}/24`;
    }
    return trimmed;
  };

  const handleToggleSubnet = (cidr: string) => {
    if (selectedSubnets.includes(cidr)) {
      if (selectedSubnets.length === 1) {
        showToast("At least one subnet must be selected for discovery");
        return;
      }
      setSelectedSubnets(selectedSubnets.filter((s) => s !== cidr));
    } else {
      setSelectedSubnets([...selectedSubnets, cidr]);
    }
  };

  const handleAddCustomSubnet = () => {
    const trimmed = customCidr.trim();
    if (!trimmed) return;
    const normalized = normalizeCidr(trimmed);
    if (!selectedSubnets.includes(normalized)) {
      setSelectedSubnets((prev) => [...prev, normalized]);
      setKnownSubnets((prev) => [
        ...prev.filter((s) => s.cidr !== normalized),
        {
          cidr: normalized,
          interface: "custom",
          is_primary: false,
          label: `Custom Subnet (${normalized})`,
          recommended: true,
        },
      ]);
    }
    setCustomCidr("");
    showToast(`Added subnet ${normalized}`);
  };

  // Run Guided Discovery
  const handleStartSweep = async () => {
    // Automatically include any pending custom input if user entered it and didn't hit 'Add Subnet'
    let targetsToSweep = [...selectedSubnets];
    if (customCidr.trim()) {
      const normalized = normalizeCidr(customCidr);
      if (normalized && !targetsToSweep.includes(normalized)) {
        targetsToSweep.push(normalized);
        setSelectedSubnets(targetsToSweep);
      }
    }

    if (targetsToSweep.length === 0) {
      targetsToSweep = ["192.168.1.0/24"];
      setSelectedSubnets(targetsToSweep);
    }

    setStep(2);
    setScanProgress(5);
    setScanStatusLogs([
      `[NetSentinel] Initializing Guided Configuration discovery sweep...`,
      `[Target Subnets] ${targetsToSweep.join(", ")}`,
      `[Port Scan Option] ${performPortScans ? "ENABLED (Top TCP services)" : "DISABLED"}`,
    ]);

    // Simulated progress timer while the real backend discovery runs
    let progress = 10;
    const progressInterval = setInterval(() => {
      progress = Math.min(progress + 5, 88);
      setScanProgress(progress);
    }, 400);

    try {
      const res = await fetch("/api/guided-discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subnets: targetsToSweep,
          perform_port_scans: performPortScans,
        }),
      });

      clearInterval(progressInterval);
      setScanProgress(100);

      if (res.ok) {
        const data = await res.json();
        setDiscoveryResult(data);
        setScanStatusLogs((prev) => [
          ...prev,
          `[SWEEP-COMPLETE] Successfully scanned ${data.subnets_scanned?.length || 1} subnet(s).`,
          `[INVENTORY] Cataloged ${data.devices_discovered ?? 0} devices into database.`,
          performPortScans
            ? `[PORTSCAN] Port audit completed and stored with each device in inventory.`
            : `[PORTSCAN] Initial port scan skipped.`,
          `[CAMERAS] Detected ${data.cameras_identified ?? 0} camera(s). Default usernames and passwords stored in cameras defaults section.`,
        ]);
        setTimeout(() => {
          setStep(3);
        }, 800);
      } else {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson.error || "Subnet discovery sweep encountered an error";
        showToast(msg);
        setScanStatusLogs((prev) => [
          ...prev,
          `[ERROR] Discovery sweep: ${msg}`,
          `[NOTICE] Returning to configuration step...`,
        ]);
        setTimeout(() => setStep(1), 1800);
      }
    } catch {
      clearInterval(progressInterval);
      showToast("Network error during discovery sweep");
      setScanStatusLogs((prev) => [
        ...prev,
        `[ERROR] Network error during discovery sweep. Check server connectivity.`,
        `[NOTICE] Returning to configuration step...`,
      ]);
      setTimeout(() => setStep(1), 1800);
    }
  };

  // Complete & Save First Run Flag
  const handleFinish = () => {
    try {
      localStorage.setItem("netsentinel_first_run_completed", "true");
    } catch {
      // ignore
    }
    showToast("First-run guided configuration completed!");
    onComplete();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Compass className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Guided Network Discovery & Configuration
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold uppercase">
                  First Run Setup
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated multi-subnet sweep, inventory registration, and camera defaults provisioning
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Close Setup Wizard"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="flex items-center justify-between px-8 py-3 bg-slate-950/40 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                step >= 1 ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-400"
              }`}
            >
              1
            </span>
            <span className={`text-xs font-semibold ${step >= 1 ? "text-cyan-300" : "text-slate-500"}`}>
              Subnets & Port Scans
            </span>
          </div>

          <div className="w-12 h-[1px] bg-slate-800" />

          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                step >= 2 ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-400"
              }`}
            >
              2
            </span>
            <span className={`text-xs font-semibold ${step >= 2 ? "text-cyan-300" : "text-slate-500"}`}>
              Discovery Sweep
            </span>
          </div>

          <div className="w-12 h-[1px] bg-slate-800" />

          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                step === 3 ? "bg-emerald-400 text-slate-950" : "bg-slate-800 text-slate-400"
              }`}
            >
              3
            </span>
            <span className={`text-xs font-semibold ${step === 3 ? "text-emerald-300" : "text-slate-500"}`}>
              Inventory & Camera Defaults
            </span>
          </div>
        </div>

        {/* Wizard Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: CONFIGURE SUBNETS & INITIAL PORT SCANS */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                      <Radio className="w-4 h-4 text-cyan-400" />
                      <span>Select Subnets to Sweep</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      NetSentinel identified the following known subnets and interfaces on your network.
                    </p>
                  </div>

                  <button
                    onClick={fetchSubnets}
                    disabled={isLoadingSubnets}
                    className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                    title="Refresh Subnet List"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingSubnets ? "animate-spin" : ""}`} />
                  </button>
                </div>

                {/* Subnet Checklist */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {knownSubnets.map((sub, idx) => {
                    const isSelected = selectedSubnets.includes(sub.cidr);
                    return (
                      <div
                        key={idx}
                        onClick={() => handleToggleSubnet(sub.cidr)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-cyan-500/10 border-cyan-500/50 shadow-sm"
                            : "bg-slate-900 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                          />
                          <div>
                            <div className="text-xs font-mono font-bold text-slate-200">
                              {sub.cidr}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {sub.label}
                            </div>
                          </div>
                        </div>

                        {sub.is_primary && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                            Active
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Custom Subnet */}
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="text"
                    placeholder="Add custom subnet CIDR (e.g. 192.168.10.0/24)..."
                    value={customCidr}
                    onChange={(e) => setCustomCidr(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddCustomSubnet()}
                    className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    onClick={handleAddCustomSubnet}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Subnet</span>
                  </button>
                </div>
              </div>

              {/* Optional Initial Port Scans */}
              <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-xl space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={performPortScans}
                    onChange={(e) => setPerformPortScans(e.target.checked)}
                    className="w-4 h-4 accent-cyan-400 rounded mt-0.5 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      <span>Perform Initial Port Scans on Discovered Endpoints (Recommended)</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Concurrently probes standard infrastructure ports (21, 22, 23, 53, 80, 443, 554 RTSP, 3389, 8000, 8080, 8443, 8899 ONVIF).
                      The port scan findings are automatically stored with each device in inventory.
                    </p>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-500 font-mono">
                  {selectedSubnets.length} subnet(s) queued for discovery
                </span>

                <button
                  onClick={handleStartSweep}
                  className="px-6 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Begin Guided Sweep</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ANIMATED DISCOVERY SWEEP PROGRESS */}
          {step === 2 && (
            <div className="space-y-6 py-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mx-auto animate-pulse">
                  <Compass className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-white">Performing Network Sweep</h3>
                <p className="text-xs text-slate-400">
                  Scanning ARP tables, probing host responsiveness, evaluating open ports, and classifying cameras...
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 max-w-lg mx-auto">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Sweep Status</span>
                  <span className="text-cyan-400 font-bold">{scanProgress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
              </div>

              {/* Live Status Terminal Log */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[11px] text-slate-300 space-y-1.5 max-h-48 overflow-y-auto">
                {scanStatusLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-cyan-500 shrink-0">›</span>
                    <span className={log.includes("COMPLETE") || log.includes("CAMERAS") ? "text-emerald-400 font-bold" : ""}>
                      {log}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: RESULTS SUMMARY REPORT */}
          {step === 3 && discoveryResult && (
            <div className="space-y-6">
              <div className="bg-emerald-950/20 border border-emerald-500/40 p-5 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-bold text-white">
                    Discovery Sweep Completed Successfully
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  All devices were fingerprinted and stored into the inventory database. Port scan results were attached to each device record, and camera defaults were provisioned.
                </p>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                  <span className="text-xs text-slate-400 font-medium">Subnets Swept</span>
                  <div className="mt-1 text-2xl font-bold font-mono text-cyan-400">
                    {discoveryResult.subnets_scanned.length}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">CIDR Blocks</span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                  <span className="text-xs text-slate-400 font-medium">Devices Stored</span>
                  <div className="mt-1 text-2xl font-bold font-mono text-emerald-400">
                    {discoveryResult.total_inventory}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">In Inventory DB</span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                  <span className="text-xs text-slate-400 font-medium">Port Audit</span>
                  <div className="mt-1 text-2xl font-bold font-mono text-amber-300">
                    {discoveryResult.port_scans_performed ? "Completed" : "Skipped"}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">Stored in Device Profile</span>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                  <span className="text-xs text-slate-400 font-medium">Cameras Identified</span>
                  <div className="mt-1 text-2xl font-bold font-mono text-purple-400">
                    {discoveryResult.cameras_identified}
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">Defaults Provisioned</span>
                </div>
              </div>

              {/* Cameras Highlight Section */}
              {discoveryResult.cameras_identified > 0 && (
                <div className="bg-purple-950/20 border border-purple-500/30 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Camera className="w-4 h-4 text-purple-400" />
                      <span>Cameras Identified with Defaults Stored</span>
                    </span>
                    <button
                      onClick={() => {
                        onClose();
                        onSelectTab?.("cameras");
                      }}
                      className="text-[11px] text-purple-300 hover:underline flex items-center gap-1 font-mono"
                    >
                      <span>Open Camera Management</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {discoveryResult.cameras.map((c, i) => (
                      <div key={i} className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1">
                        <div className="text-xs font-bold text-white">{c.camera_type || c.vendor}</div>
                        <div className="text-[11px] font-mono text-cyan-400">IP: {c.ip} · MAC: {c.mac}</div>
                        <div className="text-[10px] font-mono text-amber-300 flex items-center gap-1">
                          <Key className="w-3 h-3" />
                          <span>
                            Default Login: {c.camera_defaults?.default_username} / {c.camera_defaults?.default_password}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Launch Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleFinish}
                  className="px-6 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Launch NetFling Sentinel Command Center</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

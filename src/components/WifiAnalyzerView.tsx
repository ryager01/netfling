import React, { useState, useEffect } from "react";
import {
  Wifi,
  Radio,
  RefreshCw,
  Signal,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Shield,
  Layers,
  Search,
  Download,
  Info,
  Zap,
  Activity,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { WifiSpectrumGraph } from "./WifiSpectrumGraph";

export interface WifiNetwork {
  ssid: string;
  bssid: string;
  channel: number;
  frequency_mhz: number;
  frequency_ghz: number;
  band: "2.4 GHz" | "5 GHz" | "6 GHz" | string;
  channel_width: string;
  signal_percent: number;
  signal_dbm: number;
  security: string;
  radio_type: string;
  vendor?: string;
  is_connected: boolean;
  frequency_saturation_percent: number;
  channel_saturation_percent: number;
  ssid_saturation_percent: number;
  competing_aps_on_channel: number;
  interference_level: string;
  optimization_advice: string;
  recommended_channel: number;
}

export interface FrequencySaturation {
  band: string;
  total_networks: number;
  average_channel_saturation: number;
  spectrum_saturation_percent: number;
  saturation_status: string;
  optimal_channel: number;
  recommended_action: string;
}

export interface ChannelSaturation {
  channel: number;
  band: string;
  frequency_mhz: number;
  aps: { ssid: string; bssid: string; signal_percent: number; signal_dbm: number }[];
  ap_count: number;
  co_channel_energy: number;
  adjacent_interference: number;
  saturation_percent: number;
  saturation_level: string;
  recommendation: string;
}

interface WifiAnalyzerProps {
  showToast: (msg: string) => void;
}

export const WifiAnalyzerView: React.FC<WifiAnalyzerProps> = ({ showToast }) => {
  const [networks, setNetworks] = useState<WifiNetwork[]>([]);
  const [freqSaturation, setFreqSaturation] = useState<Record<string, FrequencySaturation>>({});
  const [channels, setChannels] = useState<ChannelSaturation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [selectedBand, setSelectedBand] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"signal" | "saturation" | "channel" | "ssid">("signal");
  const [lastScanTime, setLastScanTime] = useState<string>("");
  const [viewMode, setViewMode] = useState<"graphical" | "tabular" | "dual">("graphical");

  // RF Spectrum Sweep Progress Meter State
  const [scanProgress, setScanProgress] = useState<{
    percent: number;
    stage: string;
    currentChannel: number;
  }>({ percent: 0, stage: "", currentChannel: 1 });

  const fetchWifiScan = async (showNotification = false) => {
    setIsScanning(true);
    setScanProgress({
      percent: 10,
      stage: "Sweeping 2.4 GHz Band (Channels 1–14, 2412–2484 MHz)...",
      currentChannel: 1,
    });

    let pct = 10;
    const interval = setInterval(() => {
      pct += 9;
      if (pct > 92) pct = 92;
      let stage = "Sweeping 2.4 GHz Band (Channels 1–14, 2412–2484 MHz)...";
      let ch = 1;
      if (pct <= 40) {
        stage = `Sweeping 2.4 GHz Band: Probing Channel ${Math.min(14, Math.floor(pct / 3) + 1)}...`;
        ch = Math.min(14, Math.floor(pct / 3) + 1);
      } else if (pct > 40 && pct <= 75) {
        stage = `Sweeping 5 GHz U-NII Bands: Probing Channel ${36 + Math.floor((pct - 40) * 2)}...`;
        ch = 36 + Math.floor((pct - 40) * 2);
      } else {
        stage = "Sweeping 6 GHz Wi-Fi 6E Spectrum & Computing Channel Saturation Matrix...";
        ch = 149;
      }
      setScanProgress({ percent: pct, stage, currentChannel: ch });
    }, 220);

    try {
      const res = await fetch("/api/wifi/scan");
      if (res.ok) {
        const data = await res.json();
        setNetworks(data.networks || []);
        setFreqSaturation(data.frequency_saturation || {});
        setChannels(data.channel_saturation || []);
        setLastScanTime(new Date().toLocaleTimeString());
        setScanProgress({ percent: 100, stage: "RF Spectrum Sweep Complete!", currentChannel: 165 });
        if (showNotification) {
          showToast(`Wi-Fi Spectrum Scan complete: ${data.networks?.length || 0} SSIDs detected`);
        }
      } else {
        showToast("Wi-Fi scan failed. Check wireless adapter or permissions.");
      }
    } catch {
      showToast("Network error connecting to Wi-Fi analyzer engine.");
    } finally {
      clearInterval(interval);
      setTimeout(() => {
        setIsLoading(false);
        setIsScanning(false);
        setScanProgress({ percent: 0, stage: "", currentChannel: 1 });
      }, 650);
    }
  };

  useEffect(() => {
    fetchWifiScan(false);
  }, []);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchWifiScan(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Filter networks by band & search
  const filteredNetworks = networks
    .filter((net) => {
      if (selectedBand === "2.4" && net.band !== "2.4 GHz") return false;
      if (selectedBand === "5" && net.band !== "5 GHz") return false;
      if (selectedBand === "6" && net.band !== "6 GHz") return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          net.ssid.toLowerCase().includes(q) ||
          net.bssid.toLowerCase().includes(q) ||
          (net.vendor && net.vendor.toLowerCase().includes(q)) ||
          net.channel.toString() === q
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "signal") return b.signal_percent - a.signal_percent;
      if (sortBy === "saturation") return b.ssid_saturation_percent - a.ssid_saturation_percent;
      if (sortBy === "channel") return a.channel - b.channel;
      return a.ssid.localeCompare(b.ssid);
    });

  const getSignalBadge = (dbm: number, percent: number) => {
    if (percent >= 75 || dbm >= -60) {
      return {
        label: "Excellent",
        color: "text-emerald-400 bg-emerald-950/60 border-emerald-500/40",
        bars: 4,
      };
    } else if (percent >= 50 || dbm >= -72) {
      return {
        label: "Good",
        color: "text-cyan-400 bg-cyan-950/60 border-cyan-500/40",
        bars: 3,
      };
    } else if (percent >= 30 || dbm >= -82) {
      return {
        label: "Fair",
        color: "text-amber-400 bg-amber-950/60 border-amber-500/40",
        bars: 2,
      };
    }
    return {
      label: "Weak",
      color: "text-rose-400 bg-rose-950/60 border-rose-500/40",
      bars: 1,
    };
  };

  const getSaturationColor = (sat: number) => {
    if (sat >= 75) return "text-rose-400 bg-rose-500";
    if (sat >= 50) return "text-amber-400 bg-amber-500";
    if (sat >= 25) return "text-cyan-400 bg-cyan-500";
    return "text-emerald-400 bg-emerald-500";
  };

  const exportReport = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(
        JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            networks,
            frequency_saturation: freqSaturation,
            channels,
          },
          null,
          2
        )
      );
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `wifi-spectrum-audit-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Wi-Fi Spectrum Analysis report exported.");
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Executive Controls */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                RF Spectrum Intelligence
              </span>
              {lastScanTime && (
                <span className="text-[11px] font-mono text-slate-400">
                  Last Updated: {lastScanTime}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-white mt-1 flex items-center gap-2.5">
              <Radio className="w-5 h-5 text-cyan-400" />
              Wi-Fi Spectrum & Saturation Analyzer
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-band airtime inspection across 2.4 GHz, 5 GHz, and 6 GHz frequencies with live signal strength, channel utilization, and co-channel interference scoring.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500/20"
              />
              <span>Live Monitor (15s)</span>
            </label>

            <button
              onClick={() => exportReport()}
              className="px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700/60"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <button
              onClick={() => fetchWifiScan(true)}
              disabled={isScanning}
              className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 transition-colors rounded-lg flex items-center gap-2 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
              <span>{isScanning ? "Scanning Spectrum..." : "Rescan Spectrum"}</span>
            </button>
          </div>
        </div>

        {/* RF SPECTRUM SWEEP PROGRESS METER */}
        {isScanning && (
          <div className="mb-6 bg-gradient-to-r from-cyan-950/80 via-slate-900/90 to-purple-950/80 border-2 border-cyan-500/50 rounded-xl p-5 shadow-xl shadow-cyan-950/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-cyan-500/20 text-cyan-300 rounded-xl border border-cyan-500/40 shrink-0">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300 font-bold bg-cyan-900/70 px-2.5 py-0.5 rounded border border-cyan-400/40">
                      RF SPECTRUM SWEEP ACTIVE
                    </span>
                    <span className="text-xs font-mono text-purple-300 font-bold">
                      Probing Channel {scanProgress.currentChannel}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white mt-1">
                    {scanProgress.stage || "Sweeping RF channels and calculating frequency saturation..."}
                  </div>
                </div>
              </div>

              <div className="w-full md:w-64 space-y-1.5 shrink-0">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-semibold">Sweep Progress:</span>
                  <span className="font-bold text-cyan-300">{scanProgress.percent}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-700/80">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 via-teal-400 to-purple-400 rounded-full transition-all duration-300 shadow-sm shadow-cyan-400"
                    style={{ width: `${Math.max(scanProgress.percent, 10)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3 Frequency Band Saturation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 2.4 GHz Band */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span className="text-xs font-bold text-white">2.4 GHz Frequency Band</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                Ch 1–14
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Band Saturation:</span>
                <span
                  className={`font-mono font-bold ${
                    (freqSaturation["2.4 GHz"]?.spectrum_saturation_percent || 0) >= 70
                      ? "text-rose-400"
                      : "text-amber-400"
                  }`}
                >
                  {freqSaturation["2.4 GHz"]?.spectrum_saturation_percent || 0}% Saturation
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    (freqSaturation["2.4 GHz"]?.spectrum_saturation_percent || 0) >= 70
                      ? "bg-rose-500"
                      : "bg-amber-400"
                  }`}
                  style={{
                    width: `${freqSaturation["2.4 GHz"]?.spectrum_saturation_percent || 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">
                {freqSaturation["2.4 GHz"]?.total_networks || 0} SSIDs Detected
              </span>
              <span className="font-semibold text-emerald-400">
                Optimal: Ch {freqSaturation["2.4 GHz"]?.optimal_channel || 1}
              </span>
            </div>
          </div>

          {/* 5 GHz Band */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
                <span className="text-xs font-bold text-white">5 GHz Frequency Band</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                Ch 36–165
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Band Saturation:</span>
                <span className="font-mono font-bold text-cyan-400">
                  {freqSaturation["5 GHz"]?.spectrum_saturation_percent || 0}% Saturation
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-cyan-400 rounded-full transition-all duration-500"
                  style={{
                    width: `${freqSaturation["5 GHz"]?.spectrum_saturation_percent || 0}%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">
                {freqSaturation["5 GHz"]?.total_networks || 0} SSIDs Detected
              </span>
              <span className="font-semibold text-emerald-400">
                Optimal: Ch {freqSaturation["5 GHz"]?.optimal_channel || 36}
              </span>
            </div>
          </div>

          {/* 6 GHz Band */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="text-xs font-bold text-white">6 GHz Band (Wi-Fi 6E/7)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                160 MHz Wide
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Band Saturation:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {freqSaturation["6 GHz"]?.spectrum_saturation_percent || 0}% Pristine
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(
                      freqSaturation["6 GHz"]?.spectrum_saturation_percent || 5,
                      5
                    )}%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">
                {freqSaturation["6 GHz"]?.total_networks || 0} SSIDs Detected
              </span>
              <span className="font-semibold text-emerald-400">Zero Co-Channel Clutter</span>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW SELECTOR: GRAPHICAL SPECTRUM vs TABULAR INVENTORY vs DUAL VIEW */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 pl-1">Analyzer View:</span>
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode("graphical")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-all ${
                viewMode === "graphical"
                  ? "bg-cyan-400 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Graphical Spectrum View (Parabolic Curves)</span>
            </button>

            <button
              onClick={() => setViewMode("tabular")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-all ${
                viewMode === "tabular"
                  ? "bg-cyan-400 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tabular SSIDs & Metrics View</span>
            </button>

            <button
              onClick={() => setViewMode("dual")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-all ${
                viewMode === "dual"
                  ? "bg-cyan-400 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Dual Combined View</span>
            </button>
          </div>
        </div>

        <div className="text-[11px] font-mono text-cyan-400 pr-2 hidden md:block">
          {viewMode === "graphical"
            ? "Graphical View: Visual Parabolic RF Curves & Constellation Radar"
            : viewMode === "tabular"
            ? "Tabular View: Structured SSID Network Records"
            : "Dual View: Graphical Spectrum + Tabular Breakdown"}
        </div>
      </div>

      {/* VIEW 1: GRAPHICAL SPECTRUM REPRESENTATION */}
      {(viewMode === "graphical" || viewMode === "dual") && (
        <WifiSpectrumGraph
          networks={networks}
          channels={channels}
          freqSaturation={freqSaturation}
          showToast={showToast}
        />
      )}

      {/* VIEW 2: TABULAR SPECTRUM HEATMAP & SSIDs LIST */}
      {(viewMode === "tabular" || viewMode === "dual") && (
        <>
          {/* Spectrum & Channel Saturation Heatmap Visualizer */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Channel Occupancy & RF Saturation Heatmap
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time channel utilization, competing Access Points, and adjacent channel bleed across standard Wi-Fi channels.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[10px] text-slate-400">Legend:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 text-[10px] border border-emerald-500/30">
              Clear (&lt;25%)
            </span>
            <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 text-[10px] border border-cyan-500/30">
              Moderate
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 text-[10px] border border-amber-500/30">
              Congested
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-400 text-[10px] border border-rose-500/30">
              Saturated (&gt;75%)
            </span>
          </div>
        </div>

        {/* 2.4 GHz Visual Channel Strips */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>2.4 GHz Channel Airtime Competition (Channels 1–11):</span>
            <span className="text-[11px] text-slate-400">
              Non-overlapping channels: <strong className="text-cyan-300">1, 6, 11</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2">
            {channels
              .filter((c) => c.band === "2.4 GHz" && c.channel <= 11)
              .map((ch) => {
                const isOptimal = ch.channel === freqSaturation["2.4 GHz"]?.optimal_channel;
                const isStandard = [1, 6, 11].includes(ch.channel);
                return (
                  <div
                    key={ch.channel}
                    className={`p-2.5 rounded-lg border transition-all text-center flex flex-col justify-between ${
                      ch.saturation_percent >= 75
                        ? "bg-rose-950/20 border-rose-500/40"
                        : ch.saturation_percent >= 50
                        ? "bg-amber-950/20 border-amber-500/40"
                        : ch.saturation_percent >= 25
                        ? "bg-cyan-950/20 border-cyan-500/40"
                        : "bg-slate-950/60 border-slate-800"
                    } ${isOptimal ? "ring-1 ring-emerald-500/60" : ""}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-bold text-white">Ch {ch.channel}</span>
                        {isOptimal && (
                          <span className="text-[9px] px-1 py-0.2 bg-emerald-500 text-slate-950 font-bold rounded">
                            BEST
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 block">
                        {ch.frequency_mhz} MHz
                      </span>
                    </div>

                    <div className="my-2 space-y-1">
                      <div className="text-base font-extrabold font-mono text-white">
                        {ch.saturation_percent}%
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            ch.saturation_percent >= 75
                              ? "bg-rose-500"
                              : ch.saturation_percent >= 50
                              ? "bg-amber-400"
                              : ch.saturation_percent >= 25
                              ? "bg-cyan-400"
                              : "bg-emerald-400"
                          }`}
                          style={{ width: `${Math.max(ch.saturation_percent, 6)}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400">
                      <span className="font-semibold text-slate-200">{ch.ap_count}</span> AP
                      {ch.ap_count !== 1 ? "s" : ""}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* 5 GHz Key Channel Strips */}
        <div className="space-y-3 pt-4 border-t border-slate-800/60">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>5 GHz Primary Channels (UNII-1 & UNII-3):</span>
            <span className="text-[11px] text-slate-400">
              Optimal 5 GHz Channel: <strong className="text-emerald-400">Ch {freqSaturation["5 GHz"]?.optimal_channel || 36}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
            {channels
              .filter((c) => c.band === "5 GHz" && [36, 40, 44, 48, 149, 153, 157, 161].includes(c.channel))
              .map((ch) => {
                const isOptimal = ch.channel === freqSaturation["5 GHz"]?.optimal_channel;
                return (
                  <div
                    key={ch.channel}
                    className={`p-2.5 rounded-lg border text-center flex flex-col justify-between ${
                      ch.saturation_percent >= 70
                        ? "bg-rose-950/20 border-rose-500/40"
                        : ch.saturation_percent >= 40
                        ? "bg-amber-950/20 border-amber-500/40"
                        : "bg-slate-950/60 border-slate-800"
                    } ${isOptimal ? "ring-1 ring-emerald-500/60" : ""}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-bold text-white">Ch {ch.channel}</span>
                        {isOptimal && (
                          <span className="text-[9px] px-1 py-0.2 bg-emerald-500 text-slate-950 font-bold rounded">
                            BEST
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 block">
                        {ch.frequency_mhz} MHz
                      </span>
                    </div>

                    <div className="my-2 space-y-1">
                      <div className="text-base font-extrabold font-mono text-white">
                        {ch.saturation_percent}%
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            ch.saturation_percent >= 70
                              ? "bg-rose-500"
                              : ch.saturation_percent >= 40
                              ? "bg-amber-400"
                              : "bg-cyan-400"
                          }`}
                          style={{ width: `${Math.max(ch.saturation_percent, 6)}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400">
                      <span className="font-semibold text-slate-200">{ch.ap_count}</span> AP
                      {ch.ap_count !== 1 ? "s" : ""}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-400">Filter Frequency:</span>
          {[
            { id: "all", label: "All Frequencies" },
            { id: "2.4", label: "2.4 GHz" },
            { id: "5", label: "5 GHz" },
            { id: "6", label: "6 GHz (Wi-Fi 6E/7)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedBand(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                selectedBand === tab.id
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SSID, MAC, vendor, or channel..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0 text-xs text-slate-400">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              <option value="signal">Signal Strength</option>
              <option value="saturation">SSID Saturation</option>
              <option value="channel">Channel Number</option>
              <option value="ssid">SSID Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Detected SSIDs Table & Saturation Breakdown */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Identified Wireless SSIDs ({filteredNetworks.length} Networks)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Showing SSIDs, Frequency, Signal Strength, Channel in use, and Saturation
          </span>
        </div>

        {filteredNetworks.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No wireless networks matching filter. Click "Rescan Spectrum" to update.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 text-[10px] text-slate-400 uppercase font-mono border-b border-slate-800">
                  <th className="py-3 px-4">SSID / Access Point</th>
                  <th className="py-3 px-3">Band & Frequency</th>
                  <th className="py-3 px-3">Channel In Use</th>
                  <th className="py-3 px-3">Signal Strength</th>
                  <th className="py-3 px-3">Frequency Saturation</th>
                  <th className="py-3 px-3">Channel Saturation</th>
                  <th className="py-3 px-3">SSID Saturation & Contention</th>
                  <th className="py-3 px-4">Optimization Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredNetworks.map((net, idx) => {
                  const sig = getSignalBadge(net.signal_dbm, net.signal_percent);
                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        net.is_connected ? "bg-cyan-500/5" : ""
                      }`}
                    >
                      {/* SSID / Vendor */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`p-1.5 rounded-lg shrink-0 ${
                              net.is_connected
                                ? "bg-cyan-500/20 text-cyan-300"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            <Wifi className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs">{net.ssid}</span>
                              {net.is_connected && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                                  CONNECTED
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[10px] text-slate-400">
                                {net.bssid}
                              </span>
                              {net.vendor && (
                                <span className="text-[10px] text-slate-500 font-medium">
                                  • {net.vendor}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {net.security} • {net.radio_type}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Frequency */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                              net.band === "6 GHz"
                                ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                                : net.band === "5 GHz"
                                ? "bg-cyan-950/60 text-cyan-300 border border-cyan-500/30"
                                : "bg-amber-950/60 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {net.band}
                          </span>
                          <span className="font-mono text-[11px] text-slate-300 block">
                            {net.frequency_mhz} MHz ({net.frequency_ghz} GHz)
                          </span>
                        </div>
                      </td>

                      {/* Channel in Use */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-white text-xs bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            Channel {net.channel}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Width: {net.channel_width}
                          </span>
                        </div>
                      </td>

                      {/* Signal Strength (dBm & %) */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-bold text-white text-xs">
                              {net.signal_dbm} dBm
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${sig.color}`}
                            >
                              {sig.label} ({net.signal_percent}%)
                            </span>
                          </div>
                          <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                net.signal_percent >= 70
                                  ? "bg-emerald-400"
                                  : net.signal_percent >= 40
                                  ? "bg-cyan-400"
                                  : "bg-amber-400"
                              }`}
                              style={{ width: `${net.signal_percent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Frequency Saturation */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Freq Sat:</span>
                            <span className="font-mono font-bold text-slate-200">
                              {net.frequency_saturation_percent}%
                            </span>
                          </div>
                          <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                net.frequency_saturation_percent >= 70
                                  ? "bg-rose-500"
                                  : net.frequency_saturation_percent >= 40
                                  ? "bg-amber-400"
                                  : "bg-cyan-400"
                              }`}
                              style={{ width: `${net.frequency_saturation_percent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Channel Saturation */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Ch {net.channel}:</span>
                            <span
                              className={`font-mono font-bold ${
                                net.channel_saturation_percent >= 75
                                  ? "text-rose-400"
                                  : net.channel_saturation_percent >= 50
                                  ? "text-amber-400"
                                  : "text-slate-200"
                              }`}
                            >
                              {net.channel_saturation_percent}%
                            </span>
                          </div>
                          <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                net.channel_saturation_percent >= 75
                                  ? "bg-rose-500"
                                  : net.channel_saturation_percent >= 50
                                  ? "bg-amber-400"
                                  : "bg-cyan-400"
                              }`}
                              style={{ width: `${net.channel_saturation_percent}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* SSID Saturation & Contention */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-mono font-bold text-xs ${
                                net.ssid_saturation_percent >= 70
                                  ? "text-rose-400"
                                  : net.ssid_saturation_percent >= 40
                                  ? "text-amber-400"
                                  : "text-emerald-400"
                              }`}
                            >
                              {net.ssid_saturation_percent}%
                            </span>
                            <span className="text-[10px] text-slate-400">
                              ({net.competing_aps_on_channel} AP
                              {net.competing_aps_on_channel !== 1 ? "s" : ""} competing)
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-medium block ${
                              net.ssid_saturation_percent >= 70
                                ? "text-rose-400"
                                : net.ssid_saturation_percent >= 40
                                ? "text-amber-400"
                                : "text-emerald-400"
                            }`}
                          >
                            {net.interference_level}
                          </span>
                        </div>
                      </td>

                      {/* Optimization Advice */}
                      <td className="py-3 px-4">
                        <div className="text-[11px] text-slate-300 max-w-xs leading-relaxed">
                          {net.optimization_advice}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};

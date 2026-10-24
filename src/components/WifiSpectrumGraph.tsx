import React, { useState, useMemo } from "react";
import {
  Wifi,
  Radio,
  Signal,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Zap,
  TrendingUp,
  Compass,
  Star,
  Shield,
  Activity,
  Sliders,
} from "lucide-react";
import { WifiNetwork, ChannelSaturation, FrequencySaturation } from "./WifiAnalyzerView";

interface WifiSpectrumGraphProps {
  networks: WifiNetwork[];
  channels: ChannelSaturation[];
  freqSaturation: Record<string, FrequencySaturation>;
  showToast: (msg: string) => void;
}

// Color palette for distinct SSID parabolic curves
const CURVE_COLORS = [
  { stroke: "#06b6d4", fill: "rgba(6, 182, 212, 0.22)", glow: "rgba(6, 182, 212, 0.6)", text: "text-cyan-400" }, // Cyan
  { stroke: "#10b981", fill: "rgba(16, 185, 129, 0.22)", glow: "rgba(16, 185, 129, 0.6)", text: "text-emerald-400" }, // Emerald
  { stroke: "#a855f7", fill: "rgba(168, 85, 247, 0.22)", glow: "rgba(168, 85, 247, 0.6)", text: "text-purple-400" }, // Purple
  { stroke: "#f59e0b", fill: "rgba(245, 158, 11, 0.22)", glow: "rgba(245, 158, 11, 0.6)", text: "text-amber-400" }, // Amber
  { stroke: "#ec4899", fill: "rgba(236, 72, 153, 0.22)", glow: "rgba(236, 72, 153, 0.6)", text: "text-pink-400" }, // Pink
  { stroke: "#3b82f6", fill: "rgba(59, 130, 246, 0.22)", glow: "rgba(59, 130, 246, 0.6)", text: "text-blue-400" }, // Blue
  { stroke: "#14b8a6", fill: "rgba(20, 184, 166, 0.22)", glow: "rgba(20, 184, 166, 0.6)", text: "text-teal-400" }, // Teal
  { stroke: "#f97316", fill: "rgba(249, 115, 22, 0.22)", glow: "rgba(249, 115, 22, 0.6)", text: "text-orange-400" }, // Orange
  { stroke: "#8b5cf6", fill: "rgba(139, 92, 246, 0.22)", glow: "rgba(139, 92, 246, 0.6)", text: "text-violet-400" }, // Violet
  { stroke: "#84cc16", fill: "rgba(132, 204, 22, 0.22)", glow: "rgba(132, 204, 22, 0.6)", text: "text-lime-400" }, // Lime
];

export function WifiSpectrumGraph({
  networks,
  channels,
  freqSaturation,
  showToast,
}: WifiSpectrumGraphProps) {
  const [activeBand, setActiveBand] = useState<"2.4" | "5" | "6">("2.4");
  const [hoveredSsid, setHoveredSsid] = useState<string | null>(null);
  const [selectedSsid, setSelectedSsid] = useState<WifiNetwork | null>(null);
  const [graphMode, setGraphMode] = useState<"spectrum" | "radar" | "ratings">("spectrum");

  // Filter networks for the active band
  const bandNetworks = useMemo(() => {
    return networks.filter((n) => {
      if (activeBand === "2.4") return n.band === "2.4 GHz";
      if (activeBand === "5") return n.band === "5 GHz";
      return n.band === "6 GHz";
    });
  }, [networks, activeBand]);

  // Channel configuration per frequency band
  const bandConfig = useMemo(() => {
    if (activeBand === "2.4") {
      return {
        name: "2.4 GHz Band (Channels 1 to 14)",
        minChannel: 0,
        maxChannel: 14,
        displayChannels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
        standardChannels: [1, 6, 11],
        channelWidthChannels: 4.0, // 20MHz spans ~4 channel steps
        minFreq: 2400,
        maxFreq: 2485,
        freqStep: 5,
        channelToFreq: (ch: number) => (ch === 14 ? 2484 : 2407 + ch * 5),
      };
    } else if (activeBand === "5") {
      return {
        name: "5 GHz Band (UNII-1, UNII-2, UNII-3)",
        minChannel: 32,
        maxChannel: 168,
        displayChannels: [36, 40, 44, 48, 52, 56, 60, 64, 100, 104, 108, 112, 149, 153, 157, 161, 165],
        standardChannels: [36, 40, 44, 48, 149, 153, 157, 161],
        channelWidthChannels: 8.0, // 20/40/80MHz
        minFreq: 5160,
        maxFreq: 5845,
        freqStep: 20,
        channelToFreq: (ch: number) => 5000 + ch * 5,
      };
    } else {
      return {
        name: "6 GHz Band (Wi-Fi 6E / Wi-Fi 7)",
        minChannel: 1,
        maxChannel: 233,
        displayChannels: [1, 17, 33, 49, 65, 81, 97, 113, 129, 145, 161, 177, 193, 209, 225],
        standardChannels: [1, 33, 65, 97, 129, 161, 193],
        channelWidthChannels: 16.0,
        minFreq: 5935,
        maxFreq: 7125,
        freqStep: 40,
        channelToFreq: (ch: number) => 5950 + ch * 5,
      };
    }
  }, [activeBand]);

  // SVG Geometry Dimensions
  const svgWidth = 980;
  const svgHeight = 360;
  const padding = { top: 40, right: 35, bottom: 50, left: 65 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // dBm Scale: -100 dBm (bottom) to -20 dBm (top)
  const minDbm = -100;
  const maxDbm = -20;
  const dbmRange = maxDbm - minDbm; // 80 dBm

  const getDbmY = (dbm: number) => {
    const clamped = Math.max(minDbm, Math.min(maxDbm, dbm));
    const normalized = (clamped - minDbm) / dbmRange;
    return padding.top + plotHeight * (1 - normalized);
  };

  const getChannelX = (channel: number) => {
    const { minChannel, maxChannel } = bandConfig;
    const ratio = (channel - minChannel) / (maxChannel - minChannel);
    return padding.left + plotWidth * Math.max(0, Math.min(1, ratio));
  };

  // Generate Parabolic Path for each SSID curve:
  // Parabola: y = peakY + ((x - centerX) / halfWidth)^2 * (plotBottom - peakY)
  const generateParabolaPath = (network: WifiNetwork) => {
    const centerX = getChannelX(network.channel);
    const peakY = getDbmY(network.signal_dbm);
    const baseY = padding.top + plotHeight;

    // Calculate bandwidth spread in pixel width
    let channelSpan = bandConfig.channelWidthChannels;
    if (network.channel_width.includes("40")) channelSpan *= 1.8;
    if (network.channel_width.includes("80")) channelSpan *= 3.2;
    if (network.channel_width.includes("160")) channelSpan *= 5.5;

    const spanWidthPx = (channelSpan / (bandConfig.maxChannel - bandConfig.minChannel)) * plotWidth;
    const halfWidth = Math.max(spanWidthPx / 2, 28);

    const leftX = Math.max(padding.left, centerX - halfWidth);
    const rightX = Math.min(padding.left + plotWidth, centerX + halfWidth);

    // Build smooth quadratic bezier curve path
    return {
      d: `M ${leftX} ${baseY} Q ${centerX} ${peakY} ${rightX} ${baseY} Z`,
      curveOnly: `M ${leftX} ${baseY} Q ${centerX} ${peakY} ${rightX} ${baseY}`,
      leftX,
      rightX,
      centerX,
      peakY,
      baseY,
    };
  };

  // Channel Star Ratings
  const channelRatings = useMemo(() => {
    const list = channels.filter((c) => {
      if (activeBand === "2.4") return c.band === "2.4 GHz" && c.channel <= 14;
      if (activeBand === "5") return c.band === "5 GHz";
      return c.band === "6 GHz";
    });

    return list.map((ch) => {
      // Score calculation: 100 - saturation_percent
      const cleanliness = Math.max(0, 100 - ch.saturation_percent);
      const stars = Number((cleanliness / 20).toFixed(1));
      return {
        ...ch,
        cleanliness,
        stars,
        isOptimal: ch.channel === freqSaturation[ch.band]?.optimal_channel,
      };
    });
  }, [channels, activeBand, freqSaturation]);

  return (
    <div className="space-y-6">
      {/* Visualizer Top Bar & Band Mode Switcher */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-500/30">
                Visual RF Spectrum Representation
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                {bandNetworks.length} Active Radio Curves
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              <span>RF Spectrum & Channel Parabolic Curve Graph</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Graphic bell-curve model of Wi-Fi channel overlaps, signal strength attenuation, and frequency co-channel interference.
            </p>
          </div>

          {/* Graphical View Sub-Modes */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-1">
              <button
                onClick={() => setGraphMode("spectrum")}
                className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
                  graphMode === "spectrum"
                    ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Spectrum Curves</span>
              </button>

              <button
                onClick={() => setGraphMode("radar")}
                className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
                  graphMode === "radar"
                    ? "bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Signal Constellation</span>
              </button>

              <button
                onClick={() => setGraphMode("ratings")}
                className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
                  graphMode === "ratings"
                    ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Star className="w-3.5 h-3.5" />
                <span>Channel Ratings</span>
              </button>
            </div>

            {/* Frequency Band Selector */}
            <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-lg p-1">
              {[
                { id: "2.4", label: "2.4 GHz", desc: "Ch 1–14" },
                { id: "5", label: "5 GHz", desc: "UNII-1/3" },
                { id: "6", label: "6 GHz", desc: "Wi-Fi 6E/7" },
              ].map((band) => (
                <button
                  key={band.id}
                  onClick={() => setActiveBand(band.id as any)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    activeBand === band.id
                      ? "bg-cyan-400 text-slate-950 font-bold shadow"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>{band.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* View Mode 1: PARABOLIC RF SPECTRUM GRAPH */}
        {graphMode === "spectrum" && (
          <div className="space-y-4">
            {/* SVG Spectrum Graph Canvas */}
            <div className="relative w-full bg-slate-950/90 rounded-xl border border-slate-800 p-3 overflow-x-auto shadow-inner">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-auto min-w-[700px] select-none font-mono"
              >
                <defs>
                  {/* Grid Lines Pattern */}
                  <linearGradient id="dbmGreenZone" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                  </linearGradient>
                  <linearGradient id="dbmAmberZone" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.08" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.01" />
                  </linearGradient>
                </defs>

                {/* Background Shaded Signal Quality Zones */}
                {/* Excellent Zone (-20 to -60 dBm) */}
                <rect
                  x={padding.left}
                  y={getDbmY(-20)}
                  width={plotWidth}
                  height={getDbmY(-60) - getDbmY(-20)}
                  fill="url(#dbmGreenZone)"
                />
                {/* Fair/Poor Zone (-75 to -100 dBm) */}
                <rect
                  x={padding.left}
                  y={getDbmY(-75)}
                  width={plotWidth}
                  height={getDbmY(-100) - getDbmY(-75)}
                  fill="url(#dbmAmberZone)"
                />

                {/* Horizontal dBm Reference Grid Lines */}
                {[-20, -30, -40, -50, -60, -70, -80, -90, -100].map((dbm) => {
                  const y = getDbmY(dbm);
                  return (
                    <g key={dbm}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={padding.left + plotWidth}
                        y2={y}
                        stroke="#1e293b"
                        strokeDasharray={dbm === -60 || dbm === -75 ? "4 4" : "2 2"}
                        strokeWidth="1"
                      />
                      <text
                        x={padding.left - 8}
                        y={y + 3}
                        textAnchor="end"
                        fontSize="9"
                        fill={dbm >= -60 ? "#10b981" : dbm >= -75 ? "#06b6d4" : "#64748b"}
                      >
                        {dbm} dBm
                      </text>
                    </g>
                  );
                })}

                {/* Vertical Channel Reference Lines */}
                {bandConfig.displayChannels.map((ch) => {
                  const x = getChannelX(ch);
                  const isStandard = bandConfig.standardChannels.includes(ch);
                  const isOptimal = ch === freqSaturation[activeBand === "2.4" ? "2.4 GHz" : "5 GHz"]?.optimal_channel;

                  return (
                    <g key={ch}>
                      <line
                        x1={x}
                        y1={padding.top}
                        x2={x}
                        y2={padding.top + plotHeight}
                        stroke={isOptimal ? "#10b981" : isStandard ? "#334155" : "#1e293b"}
                        strokeWidth={isOptimal || isStandard ? 1.5 : 0.8}
                        strokeDasharray={isOptimal ? "3 3" : undefined}
                      />
                      {/* Channel Label on X-Axis */}
                      <text
                        x={x}
                        y={padding.top + plotHeight + 16}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight={isStandard || isOptimal ? "bold" : "normal"}
                        fill={isOptimal ? "#10b981" : isStandard ? "#38bdf8" : "#94a3b8"}
                      >
                        {ch}
                      </text>
                      {/* Frequency in MHz below channel */}
                      <text
                        x={x}
                        y={padding.top + plotHeight + 28}
                        textAnchor="middle"
                        fontSize="8"
                        fill="#64748b"
                      >
                        {bandConfig.channelToFreq(ch)}
                      </text>
                    </g>
                  );
                })}

                {/* Graph Title & Axis Labels */}
                <text
                  x={padding.left + plotWidth / 2}
                  y={20}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="bold"
                  fill="#94a3b8"
                >
                  {bandConfig.name} · Signal Strength vs Channel Distribution
                </text>

                <text
                  x={padding.left + plotWidth / 2}
                  y={svgHeight - 8}
                  textAnchor="middle"
                  fontSize="9"
                  fill="#64748b"
                >
                  Wi-Fi Channel Number & Center Frequency (MHz)
                </text>

                {/* PARABOLIC BELL CURVES FOR EACH SSID */}
                {bandNetworks.map((net, idx) => {
                  const color = CURVE_COLORS[idx % CURVE_COLORS.length];
                  const geom = generateParabolaPath(net);
                  const isHovered = hoveredSsid === net.ssid;
                  const isSelected = selectedSsid?.ssid === net.ssid;
                  const opacity = hoveredSsid && !isHovered ? 0.25 : 0.85;

                  return (
                    <g
                      key={net.bssid || idx}
                      className="cursor-pointer transition-opacity duration-200"
                      opacity={opacity}
                      onMouseEnter={() => setHoveredSsid(net.ssid)}
                      onMouseLeave={() => setHoveredSsid(null)}
                      onClick={() => {
                        setSelectedSsid(net);
                        showToast(`Selected SSID: ${net.ssid} (${net.signal_dbm} dBm on Ch ${net.channel})`);
                      }}
                    >
                      {/* Translucent Parabolic Fill */}
                      <path
                        d={geom.d}
                        fill={color.fill}
                        stroke="none"
                      />

                      {/* Parabolic Glowing Border Stroke */}
                      <path
                        d={geom.curveOnly}
                        fill="none"
                        stroke={color.stroke}
                        strokeWidth={isHovered || isSelected || net.is_connected ? 3.5 : 2}
                        filter={isHovered ? "drop-shadow(0 0 6px currentColor)" : undefined}
                      />

                      {/* Apex Peak Dot */}
                      <circle
                        cx={geom.centerX}
                        cy={geom.peakY}
                        r={net.is_connected ? 5 : isHovered ? 4.5 : 3}
                        fill={color.stroke}
                        stroke="#020617"
                        strokeWidth="1.5"
                      />

                      {/* Connected SSID Halo Ring */}
                      {net.is_connected && (
                        <circle
                          cx={geom.centerX}
                          cy={geom.peakY}
                          r={8}
                          fill="none"
                          stroke="#06b6d4"
                          strokeWidth="1.5"
                          strokeDasharray="2 2"
                        />
                      )}

                      {/* SSID Name Label over Peak */}
                      <g transform={`translate(${geom.centerX}, ${Math.max(geom.peakY - 10, 35)})`}>
                        <rect
                          x={-Math.min(net.ssid.length * 3.6 + 6, 60)}
                          y={-12}
                          width={Math.min(net.ssid.length * 7.2 + 12, 120)}
                          height={15}
                          rx={3}
                          fill="rgba(2, 6, 23, 0.85)"
                          stroke={isHovered || net.is_connected ? color.stroke : "#334155"}
                          strokeWidth="1"
                        />
                        <text
                          x={0}
                          y={-2}
                          textAnchor="middle"
                          fontSize="8.5"
                          fontWeight="bold"
                          fill={isHovered ? "#ffffff" : color.stroke}
                        >
                          {net.ssid.length > 14 ? `${net.ssid.slice(0, 12)}…` : net.ssid}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Interactive Network Legend Bar */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2 text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Signal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Detected SSIDs Spectrum Legend ({bandNetworks.length} Networks):</span>
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Hover or click a network curve to inspect details
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap max-h-36 overflow-y-auto pr-1">
                {bandNetworks.map((net, idx) => {
                  const color = CURVE_COLORS[idx % CURVE_COLORS.length];
                  const isHovered = hoveredSsid === net.ssid;
                  const isSelected = selectedSsid?.ssid === net.ssid;

                  return (
                    <button
                      key={net.bssid || idx}
                      onMouseEnter={() => setHoveredSsid(net.ssid)}
                      onMouseLeave={() => setHoveredSsid(null)}
                      onClick={() => setSelectedSsid(net)}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-mono flex items-center gap-2 transition-all ${
                        isHovered || isSelected
                          ? "bg-slate-800 border-cyan-400 text-white shadow-md"
                          : "bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: color.stroke }}
                      />
                      <span className="font-bold truncate max-w-[130px]">{net.ssid}</span>
                      <span className="text-[10px] text-slate-400">Ch {net.channel}</span>
                      <span
                        className={`text-[10px] font-bold ${
                          net.signal_percent >= 70 ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        {net.signal_dbm} dBm
                      </span>
                      {net.is_connected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected / Hovered Network Forensic Details Drawer */}
            {selectedSsid && (
              <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-cyan-500/40 rounded-xl p-4 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                      <Wifi className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{selectedSsid.ssid}</h4>
                        {selectedSsid.is_connected && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40 font-bold">
                            CONNECTED
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono text-slate-400">
                        BSSID: {selectedSsid.bssid} {selectedSsid.vendor ? `· ${selectedSsid.vendor}` : ""}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedSsid(null)}
                    className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
                  >
                    Close
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs font-mono">
                  <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Signal Strength</span>
                    <span className="text-cyan-400 font-bold text-sm">
                      {selectedSsid.signal_dbm} dBm
                    </span>
                    <span className="text-slate-400 text-[10px] block">
                      {selectedSsid.signal_percent}% Quality
                    </span>
                  </div>

                  <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Channel & Width</span>
                    <span className="text-white font-bold text-sm">
                      Ch {selectedSsid.channel}
                    </span>
                    <span className="text-slate-400 text-[10px] block">
                      {selectedSsid.channel_width}
                    </span>
                  </div>

                  <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Frequency Band</span>
                    <span className="text-amber-300 font-bold text-sm">
                      {selectedSsid.band}
                    </span>
                    <span className="text-slate-400 text-[10px] block">
                      {selectedSsid.frequency_mhz} MHz
                    </span>
                  </div>

                  <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Channel Saturation</span>
                    <span
                      className={`font-bold text-sm ${
                        selectedSsid.channel_saturation_percent >= 70
                          ? "text-rose-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {selectedSsid.channel_saturation_percent}%
                    </span>
                    <span className="text-slate-400 text-[10px] block">
                      {selectedSsid.competing_aps_on_channel} Competing APs
                    </span>
                  </div>

                  <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Security Protocol</span>
                    <span className="text-purple-300 font-bold text-xs truncate block">
                      {selectedSsid.security}
                    </span>
                    <span className="text-slate-400 text-[10px] block">
                      {selectedSsid.radio_type}
                    </span>
                  </div>

                  <div className="p-2 bg-slate-950/80 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Recommended Ch</span>
                    <span className="text-emerald-400 font-bold text-sm">
                      Ch {selectedSsid.recommended_channel}
                    </span>
                    <span className="text-slate-400 text-[10px] block">Cleanest Spectrum</span>
                  </div>
                </div>

                <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-cyan-400 font-bold mr-1">Airtime Advice:</span>
                  {selectedSsid.optimization_advice}
                </div>
              </div>
            )}
          </div>
        )}

        {/* View Mode 2: RADAR & CONSTELLATION CHART */}
        {graphMode === "radar" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Polar Radar Visualizer */}
            <div className="md:col-span-2 relative aspect-square max-w-[420px] mx-auto w-full bg-slate-950/90 rounded-2xl border border-slate-800 p-4 flex items-center justify-center">
              <svg viewBox="0 0 400 400" className="w-full h-full select-none font-mono">
                {/* Concentric Signal Rings */}
                {[
                  { r: 170, label: "-90 dBm (Weak)" },
                  { r: 130, label: "-75 dBm (Fair)" },
                  { r: 90, label: "-60 dBm (Good)" },
                  { r: 50, label: "-40 dBm (Strong)" },
                  { r: 15, label: "Core" },
                ].map((ring, i) => (
                  <g key={i}>
                    <circle
                      cx="200"
                      cy="200"
                      r={ring.r}
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="1"
                      strokeDasharray={i === 4 ? undefined : "3 3"}
                    />
                    {i > 0 && (
                      <text
                        x="205"
                        y={200 - ring.r + 12}
                        fontSize="8"
                        fill="#64748b"
                      >
                        {ring.label}
                      </text>
                    )}
                  </g>
                ))}

                {/* Radar Sweep Crosshairs */}
                <line x1="30" y1="200" x2="370" y2="200" stroke="#1e293b" strokeWidth="1" />
                <line x1="200" y1="30" x2="200" y2="370" stroke="#1e293b" strokeWidth="1" />

                {/* Center Receiver Node */}
                <circle cx="200" cy="200" r="6" fill="#06b6d4" />
                <circle cx="200" cy="200" r="10" fill="none" stroke="#06b6d4" strokeWidth="1.5" className="animate-ping" />

                {/* Plot AP Nodes */}
                {bandNetworks.map((net, i) => {
                  // Distance from center based on dBm (-30 dBm = 30px, -95 dBm = 175px)
                  const dist = Math.max(30, Math.min(175, ((-net.signal_dbm - 20) / 75) * 165));
                  // Angle derived from channel number + index
                  const angle = ((net.channel * 28 + i * 15) % 360) * (Math.PI / 180);
                  const x = 200 + Math.cos(angle) * dist;
                  const y = 200 + Math.sin(angle) * dist;
                  const color = CURVE_COLORS[i % CURVE_COLORS.length];

                  return (
                    <g
                      key={net.bssid || i}
                      className="cursor-pointer"
                      onClick={() => setSelectedSsid(net)}
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r={net.is_connected ? 7 : 5}
                        fill={color.stroke}
                        stroke="#020617"
                        strokeWidth="1.5"
                      />
                      <text
                        x={x + 8}
                        y={y + 3}
                        fontSize="9"
                        fontWeight="bold"
                        fill="#e2e8f0"
                      >
                        {net.ssid.slice(0, 10)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Constellation Side Metrics */}
            <div className="space-y-4">
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-2">
                <span className="text-xs font-mono text-cyan-400 uppercase font-bold flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  Radial Signal Constellation
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Nodes placed closer to the central cyan core represent higher RF power and lower packet loss. Peripheral nodes indicate boundary coverage or elevated attenuation.
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">Top Signal APs:</span>
                {bandNetworks.slice(0, 4).map((net, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedSsid(net)}
                    className="p-2.5 bg-slate-950/60 border border-slate-800 hover:border-cyan-500/50 rounded-lg flex items-center justify-between cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span className="text-xs font-bold text-white truncate max-w-[140px]">
                        {net.ssid}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-bold">
                      {net.signal_dbm} dBm
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* View Mode 3: CHANNEL RATING & STAR MATRIX */}
        {graphMode === "ratings" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {channelRatings.map((ch) => (
                <div
                  key={ch.channel}
                  className={`p-4 rounded-xl border transition-all ${
                    ch.isOptimal
                      ? "bg-emerald-950/30 border-emerald-500/60 ring-1 ring-emerald-500/40"
                      : ch.saturation_percent >= 70
                      ? "bg-rose-950/20 border-rose-500/40"
                      : "bg-slate-950/70 border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-bold text-white">
                      Channel {ch.channel}
                    </span>
                    {ch.isOptimal && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 text-[10px] font-bold">
                        RECOMMENDED
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {ch.frequency_mhz} MHz · {ch.ap_count} Competing AP{ch.ap_count !== 1 ? "s" : ""}
                  </div>

                  {/* Star Rating Display */}
                  <div className="flex items-center gap-1 my-3">
                    {[1, 2, 3, 4, 5].map((starIdx) => (
                      <Star
                        key={starIdx}
                        className={`w-4 h-4 ${
                          ch.stars >= starIdx
                            ? "text-amber-400 fill-amber-400"
                            : ch.stars >= starIdx - 0.5
                            ? "text-amber-400 fill-amber-400/50"
                            : "text-slate-700"
                        }`}
                      />
                    ))}
                    <span className="font-mono text-xs font-bold text-white ml-1">
                      {ch.stars} / 5
                    </span>
                  </div>

                  {/* Saturation Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>Airtime Saturation:</span>
                      <span
                        className={`font-bold ${
                          ch.saturation_percent >= 70 ? "text-rose-400" : "text-emerald-400"
                        }`}
                      >
                        {ch.saturation_percent}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          ch.saturation_percent >= 70
                            ? "bg-rose-500"
                            : ch.saturation_percent >= 40
                            ? "bg-amber-400"
                            : "bg-emerald-400"
                        }`}
                        style={{ width: `${Math.max(ch.saturation_percent, 6)}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800/80 leading-tight">
                    {ch.recommendation || `Channel ${ch.channel} evaluated for co-channel interference.`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

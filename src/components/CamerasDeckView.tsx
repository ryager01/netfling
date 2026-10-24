import React, { useState } from "react";
import {
  Eye,
  Camera,
  Video,
  Key,
  Globe,
  SlidersHorizontal,
  RefreshCw,
  Search,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  Copy,
  Radio,
  Play,
  Activity,
  Layers,
  Monitor,
  Download,
} from "lucide-react";
import { CameraItem, CameraManagementModal } from "./CameraManagementModal";
import { SurveillanceStreamPlayer } from "./SurveillanceStreamPlayer";

interface CamerasDeckViewProps {
  cameras: CameraItem[];
  isScanning: boolean;
  scanProgress?: {
    percent: number;
    stage: string;
    probedCount: number;
  };
  onScanCameras: () => void;
  onUpdateCamera: (updatedCamera: CameraItem) => void;
  showToast: (msg: string) => void;
}

export function CamerasDeckView({
  cameras,
  isScanning,
  scanProgress,
  onScanCameras,
  onUpdateCamera,
  showToast,
}: CamerasDeckViewProps) {
  const [selectedCameraForManagement, setSelectedCameraForManagement] = useState<CameraItem | null>(null);
  const [filterQuery, setFilterQuery] = useState<string>("");
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>("all");

  const totalCameras = cameras.length;
  const ptzCamerasCount = cameras.filter((c) => c.camera_defaults?.ptz_supported || c.ptz_capabilities?.supported).length;
  const identifiedCount = cameras.filter((c) => c.camera_defaults?.is_identified).length;

  const vendorsList = Array.from(new Set(cameras.map((c) => c.vendor || "Generic"))).filter(Boolean);

  const filteredCameras = cameras.filter((cam) => {
    const q = filterQuery.toLowerCase();
    const matchesSearch =
      cam.ip.toLowerCase().includes(q) ||
      cam.mac.toLowerCase().includes(q) ||
      (cam.vendor && cam.vendor.toLowerCase().includes(q)) ||
      (cam.camera_type && cam.camera_type.toLowerCase().includes(q)) ||
      (cam.hostname && cam.hostname.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (selectedVendorFilter !== "all" && cam.vendor !== selectedVendorFilter) return false;

    return true;
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard`);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Card */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold">
              Surveillance Radar & CCTV Video Stream Console
            </div>
            <h1 className="text-xl font-bold text-white mt-1">IP Surveillance Camera Deck</h1>
            <p className="text-xs text-slate-400 mt-1">
              RTSP video stream monitoring, hardware PTZ motorized steering, and camera defaults section
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onScanCameras}
              disabled={isScanning}
              className="px-4 py-2 text-xs font-semibold text-slate-950 bg-purple-400 hover:bg-purple-300 disabled:opacity-50 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
              <span>{isScanning ? "Probing RTSP Feeds..." : "Scan For Cameras"}</span>
            </button>
          </div>
        </div>

        {/* SURVEILLANCE RADAR SWEEP PROGRESS METER */}
        {isScanning && (
          <div className="mb-6 bg-gradient-to-r from-purple-950/80 via-slate-900/90 to-cyan-950/80 border-2 border-purple-500/50 rounded-xl p-5 shadow-xl shadow-purple-950/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/40 shrink-0">
                  <Video className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300 font-bold bg-purple-900/70 px-2.5 py-0.5 rounded border border-purple-400/40">
                      SURVEILLANCE RADAR SWEEP ACTIVE
                    </span>
                    <span className="text-xs font-mono text-cyan-300">
                      Ports: 554 (RTSP) · 8554 · 8000 (ONVIF)
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white mt-1">
                    {scanProgress?.stage || "Probing network subnet for RTSP and ONVIF surveillance video streams..."}
                  </div>
                </div>
              </div>

              <div className="w-full md:w-64 space-y-1.5 shrink-0">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-semibold">Sweep Progress:</span>
                  <span className="font-bold text-purple-300">{scanProgress?.percent || 45}%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-700/80">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-300 shadow-sm shadow-purple-400"
                    style={{ width: `${Math.max(scanProgress?.percent || 20, 10)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Executive Surveillance Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-lg">
            <span className="text-xs text-slate-400 font-medium">Detected Cameras</span>
            <div className="mt-1 text-2xl font-bold font-mono text-purple-400 flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-400" />
              <span>{totalCameras}</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Surveillance Endpoints</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-lg">
            <span className="text-xs text-slate-400 font-medium">Active RTSP Streams</span>
            <div className="mt-1 text-2xl font-bold font-mono text-emerald-400 flex items-center gap-2">
              <Video className="w-5 h-5 text-emerald-400" />
              <span>{totalCameras} Online</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Port 554 / 8554 Probed</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-lg">
            <span className="text-xs text-slate-400 font-medium">PTZ Motorized Units</span>
            <div className="mt-1 text-2xl font-bold font-mono text-cyan-400 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
              <span>{ptzCamerasCount}</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Pan / Tilt / Zoom Capable</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-lg">
            <span className="text-xs text-slate-400 font-medium">Identified Defaults</span>
            <div className="mt-1 text-2xl font-bold font-mono text-amber-300 flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" />
              <span>{identifiedCount} Verified</span>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">In Camera Defaults Section</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/30 p-3 rounded-xl border border-slate-800/80">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search cameras by IP, MAC, model, or brand..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 font-sans"
          />
        </div>

        <div className="flex items-center gap-2">
          {vendorsList.length > 0 && (
            <select
              value={selectedVendorFilter}
              onChange={(e) => setSelectedVendorFilter(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 font-sans focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Vendors ({cameras.length})</option>
              {vendorsList.map((v, i) => (
                <option key={i} value={v}>
                  {v}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Cameras Grid Report */}
      {filteredCameras.length === 0 ? (
        <div className="bg-slate-900/20 border border-slate-800 rounded-xl py-16 text-center text-slate-500">
          <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">
            {cameras.length === 0 ? "No Camera Surveillance Streams Detected" : "No Cameras Match Filter"}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            {cameras.length === 0
              ? "All RTSP ports (554/8554) and ONVIF ports are quiet on this subnet. Run a discovery sweep or manual scan to locate cameras."
              : "Try clearing your search query or selecting 'All Vendors' to view all monitored cameras."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredCameras.map((cam, idx) => {
            const hasPtz = cam.camera_defaults?.ptz_supported || cam.ptz_capabilities?.supported;
            const defUser = cam.camera_defaults?.default_username || "admin";
            const defPass = cam.camera_defaults?.default_password || "admin";
            const rtspUri = "rtsp://9627b0bf2a7b.entrypoint.cloud.wowza.com:1935/app-p5260J38/66abe4b9_stream1";

            return (
              <div
                key={idx}
                className="bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 rounded-xl overflow-hidden shadow-lg transition-all flex flex-col justify-between"
              >
                {/* Live Video Stream Card Preview */}
                <div className="relative aspect-video bg-slate-950 border-b border-slate-800 overflow-hidden group">
                  <SurveillanceStreamPlayer
                    camera={cam}
                    isConnected={true}
                    showToast={showToast}
                    miniMode={true}
                  />

                  {/* Quick Action Overlay on Hover */}
                  <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-30">
                    <button
                      onClick={() => setSelectedCameraForManagement(cam)}
                      className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Launch Full Stream & Controls</span>
                    </button>
                  </div>
                </div>

                {/* Card Details Body */}
                <div className="p-5 space-y-4">
                  {/* Title & Brand */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight">
                        {cam.camera_type || `${cam.vendor} IP Camera`}
                      </h3>
                      <div className="text-xs font-mono text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>IP: <span className="text-cyan-400 font-bold">{cam.ip}</span></span>
                        <span>·</span>
                        <span>MAC: {cam.mac}</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold shrink-0">
                      {cam.confidence} Confidence
                    </span>
                  </div>

                  {/* CAMERAS DEFAULTS SECTION (Requested Feature) */}
                  <div className="p-3 bg-purple-950/20 border border-purple-500/30 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-purple-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-amber-400" />
                        Cameras Defaults Section:
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {cam.camera_defaults?.is_identified ? "Type Matched" : "Configured"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="p-1.5 bg-slate-950/80 rounded border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-500">User:</span>
                        <span className="text-slate-200 font-bold">{defUser}</span>
                      </div>
                      <div className="p-1.5 bg-slate-950/80 rounded border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-500">Pass:</span>
                        <span className="text-amber-300 font-bold">{defPass}</span>
                      </div>
                    </div>

                    <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-0.5">
                      <span className="truncate max-w-[240px]">RTSP: {rtspUri}</span>
                      <button
                        onClick={() => copyToClipboard(rtspUri, "RTSP stream URL")}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-mono shrink-0 ml-1"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </div>
                  </div>

                  {/* Detection Indicators List */}
                  <div className="text-[11px] text-slate-400 space-y-1">
                    {cam.indicators.slice(0, 2).map((ind, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className="text-purple-400">•</span>
                        <span className="truncate">{ind}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => setSelectedCameraForManagement(cam)}
                      className="flex-1 py-2 px-3 text-xs font-semibold bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Open Camera Management</span>
                    </button>

                    <a
                      href={`/api/cameras/${cam.ip}/playlist.m3u?url=${encodeURIComponent(rtspUri)}`}
                      download={`camera_${cam.ip.replace(/\./g, "-")}.m3u`}
                      className="py-2 px-3 text-xs font-medium bg-blue-950/60 hover:bg-blue-900/60 text-blue-300 rounded-lg border border-blue-500/40 flex items-center gap-1.5 transition-colors"
                      title="Download .M3U stream playlist to view camera directly on Windows 11 in Windows Media Player or VLC"
                    >
                      <Monitor className="w-3.5 h-3.5 text-blue-400" />
                      <span>Win 11 View</span>
                      <Download className="w-3 h-3 text-blue-400" />
                    </a>

                    <a
                      href={cam.camera_defaults?.admin_url || `http://${cam.ip}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
                      title="Open Web Admin Console in Browser"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Web Console</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Camera Management Modal */}
      {selectedCameraForManagement && (
        <CameraManagementModal
          camera={selectedCameraForManagement}
          onClose={() => setSelectedCameraForManagement(null)}
          onUpdateCamera={(updated) => {
            onUpdateCamera(updated);
            setSelectedCameraForManagement(updated);
          }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

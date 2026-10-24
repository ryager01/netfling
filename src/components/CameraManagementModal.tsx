import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Eye,
  Video,
  Play,
  Pause,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Sliders,
  Shield,
  Key,
  Globe,
  RefreshCw,
  Check,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Layers,
  Settings,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Activity,
  Copy,
  ExternalLink,
  Save,
  Radio,
} from "lucide-react";
import { SurveillanceStreamPlayer } from "./SurveillanceStreamPlayer";

export interface CameraItem {
  ip: string;
  mac: string;
  vendor: string;
  hostname: string;
  is_surveillance: boolean;
  confidence: string;
  indicators: string[];
  streaming_ports: number[];
  camera_type?: string;
  camera_defaults?: {
    is_identified: boolean;
    camera_type: string;
    vendor_brand: string;
    ptz_supported: boolean;
    default_username: string;
    default_password: string;
    alt_password?: string;
    admin_url: string;
    rtsp_url: string;
    onvif_port?: number;
    notes?: string;
  };
  camera_settings?: {
    resolution: string;
    fps: number;
    bitrate_kbps: number;
    night_vision: string;
    motion_detection: boolean;
    motion_sensitivity: number;
    stream_codec: string;
    audio_enabled: boolean;
    osd_name: string;
    flip_image?: boolean;
    wdr_enabled?: boolean;
  };
  ptz_capabilities?: {
    supported: boolean;
    pan_range: number;
    tilt_range: number;
    zoom_range: string;
    presets: Array<{
      id: number;
      name: string;
      pan: number;
      tilt: number;
      zoom: number;
    }>;
  };
  stream_info?: {
    rtsp_url: string;
    http_snapshot: string;
    state: string;
    resolution: string;
    fps: number;
    codec: string;
    bitrate_kbps: number;
  };
}

interface CameraManagementModalProps {
  camera: CameraItem;
  onClose: () => void;
  onUpdateCamera: (updatedCamera: CameraItem) => void;
  showToast: (msg: string) => void;
}

export function CameraManagementModal({
  camera,
  onClose,
  onUpdateCamera,
  showToast,
}: CameraManagementModalProps) {
  const [activeTab, setActiveTab] = useState<"stream" | "ptz" | "settings" | "defaults">("stream");

  // Connection & Stream States
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [streamActive, setStreamActive] = useState<boolean>(true);
  const [streamTime, setStreamTime] = useState<string>(new Date().toISOString());
  const [showScanlines, setShowScanlines] = useState<boolean>(true);
  const [showMotionBox, setShowMotionBox] = useState<boolean>(true);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);

  // Authentication credentials
  const defaultUser = camera.camera_defaults?.default_username || "admin";
  const defaultPass = camera.camera_defaults?.default_password || "12345";
  const [usernameInput, setUsernameInput] = useState<string>(defaultUser);
  const [passwordInput, setPasswordInput] = useState<string>(defaultPass);

  // PTZ Control States
  const [ptzSpeed, setPtzSpeed] = useState<number>(5);
  const [ptzStatus, setPtzStatus] = useState<string>("Ready - Awaiting operator command");
  const [isMovingPtz, setIsMovingPtz] = useState<boolean>(false);
  const [currentPan, setCurrentPan] = useState<number>(0);
  const [currentTilt, setCurrentTilt] = useState<number>(10);
  const [currentZoom, setCurrentZoom] = useState<number>(1.0);

  // Camera Settings
  const [settings, setSettings] = useState({
    resolution: camera.camera_settings?.resolution || "1080p (1920x1080)",
    fps: camera.camera_settings?.fps || 30,
    bitrate_kbps: camera.camera_settings?.bitrate_kbps || 4096,
    night_vision: camera.camera_settings?.night_vision || "Auto",
    motion_detection: camera.camera_settings?.motion_detection ?? true,
    motion_sensitivity: camera.camera_settings?.motion_sensitivity ?? 75,
    stream_codec: camera.camera_settings?.stream_codec || "H.264 High Profile",
    audio_enabled: camera.camera_settings?.audio_enabled ?? true,
    osd_name: camera.camera_settings?.osd_name || `${camera.vendor.toUpperCase()}-CAM-01`,
    wdr_enabled: camera.camera_settings?.wdr_enabled ?? true,
  });
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);

  // Defaults Section Editing
  const [customDefaults, setCustomDefaults] = useState({
    default_username: camera.camera_defaults?.default_username || "admin",
    default_password: camera.camera_defaults?.default_password || "admin",
    admin_url: camera.camera_defaults?.admin_url || `http://${camera.ip}`,
    rtsp_url: camera.camera_defaults?.rtsp_url || "rtsp://rtsp.rtsplink.com/live/people?token=d37fb79892a53ccf13a8cd1eb108f3c163252d5e538a6864196d982de4b85a71",
    notes: camera.camera_defaults?.notes || "Live RTSP surveillance stream feed",
  });
  const [isSavingDefaults, setIsSavingDefaults] = useState<boolean>(false);

  // Live Stream Clock Ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setStreamTime(new Date().toTimeString().split(" ")[0]);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Connect to Camera
  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const res = await fetch(`/api/cameras/${encodeURIComponent(camera.ip)}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: usernameInput, password: passwordInput }),
      });
      if (res.ok) {
        const data = await res.json();
        setIsConnected(true);
        setStreamActive(true);
        showToast(`Connected to camera RTSP feed at ${camera.ip}`);
      } else {
        showToast("Connection failed: Camera authentication rejected");
      }
    } catch {
      showToast("Camera RTSP feed connection failed");
    } finally {
      setIsConnecting(false);
    }
  };

  // Execute PTZ Movement Command
  const handlePtzAction = async (action: string, presetId?: number) => {
    setIsMovingPtz(true);
    setPtzStatus(`Executing ${action}...`);

    // Virtual PTZ position feedback
    if (action === "pan_left") setCurrentPan((p) => Math.max(p - 15, -180));
    if (action === "pan_right") setCurrentPan((p) => Math.min(p + 15, 180));
    if (action === "tilt_up") setCurrentTilt((t) => Math.min(t + 10, 90));
    if (action === "tilt_down") setCurrentTilt((t) => Math.max(t - 10, -45));
    if (action === "zoom_in") setCurrentZoom((z) => Math.min(Number((z + 0.5).toFixed(1)), 16.0));
    if (action === "zoom_out") setCurrentZoom((z) => Math.max(Number((z - 0.5).toFixed(1)), 1.0));
    if (action === "center_reset") {
      setCurrentPan(0);
      setCurrentTilt(0);
      setCurrentZoom(1.0);
    }

    try {
      const res = await fetch(`/api/cameras/${encodeURIComponent(camera.ip)}/ptz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          speed: ptzSpeed,
          preset: presetId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPtzStatus(data.description || `PTZ command completed`);
      }
    } catch {
      setPtzStatus(`PTZ network timeout`);
    } finally {
      setIsMovingPtz(false);
    }
  };

  // Save Modified Settings
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const res = await fetch(`/api/cameras/${encodeURIComponent(camera.ip)}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings, mac: camera.mac }),
      });
      if (res.ok) {
        const data = await res.json();
        showToast("Camera configuration saved successfully");
        onUpdateCamera({
          ...camera,
          camera_settings: data.camera_settings,
        });
      }
    } catch {
      showToast("Error updating camera configuration");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Save Defaults
  const handleSaveDefaults = async () => {
    setIsSavingDefaults(true);
    try {
      const res = await fetch(`/api/cameras/${encodeURIComponent(camera.ip)}/defaults`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaults: customDefaults, mac: camera.mac }),
      });
      if (res.ok) {
        showToast("Camera defaults section updated");
        onUpdateCamera({
          ...camera,
          camera_defaults: {
            ...(camera.camera_defaults as any),
            ...customDefaults,
          },
        });
      }
    } catch {
      showToast("Error saving camera defaults");
    } finally {
      setIsSavingDefaults(false);
    }
  };

  // Snapshot Capture
  const handleCaptureSnapshot = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    setCapturedSnapshot(`Snapshot-${camera.ip}-${timestamp}.jpg`);
    showToast(`Snapshot frame captured from ${camera.ip}`);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {camera.camera_type || `${camera.vendor} IP Surveillance Camera`}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold uppercase">
                  Management Deck
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                <span>IP: <span className="text-cyan-400 font-bold">{camera.ip}</span></span>
                <span>·</span>
                <span>MAC: {camera.mac}</span>
                <span>·</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {isConnected ? "Stream Live" : "Disconnected"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Close Camera Management Deck"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/40 px-6 shrink-0 gap-2">
          <button
            onClick={() => setActiveTab("stream")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "stream"
                ? "border-purple-400 text-purple-300 bg-purple-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Video Stream & Feed</span>
          </button>

          <button
            onClick={() => setActiveTab("ptz")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "ptz"
                ? "border-purple-400 text-purple-300 bg-purple-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>PTZ Camera Movement</span>
          </button>

          <button
            onClick={() => setActiveTab("defaults")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "defaults"
                ? "border-purple-400 text-purple-300 bg-purple-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span>Cameras Defaults Section</span>
            {camera.camera_defaults?.is_identified && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "settings"
                ? "border-purple-400 text-purple-300 bg-purple-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Camera Settings</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: VIDEO STREAM & FEED */}
          {activeTab === "stream" && (
            <div className="space-y-6">
              {/* Surveillance Live Video Player */}
              <SurveillanceStreamPlayer
                camera={camera}
                isConnected={isConnected}
                ptzSpeed={ptzSpeed}
                onPtzAction={handlePtzAction}
                showToast={showToast}
              />

              {/* Stream Connection Diagnostics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-1">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">Stream Protocol & Codec</div>
                  <div className="text-sm font-bold text-white font-mono flex items-center gap-2">
                    <Video className="w-4 h-4 text-cyan-400" />
                    <span>RTSP / {settings.stream_codec}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">Port: 554 (H.264 Main Profile)</div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-1">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">Latency & Framerate</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>14.2 ms / {settings.fps} FPS</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">Zero Frame Drops Detected</div>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-1">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">Web Admin Console</div>
                  <div className="text-sm font-bold text-cyan-400 font-mono flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <a
                      href={camera.camera_defaults?.admin_url || `http://${camera.ip}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1"
                    >
                      <span>http://{camera.ip}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">ONVIF Service Port: 8000</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PTZ CAMERA MOVEMENT */}
          {activeTab === "ptz" && (
            <div className="space-y-6">
              {/* Live Stream Monitor for Active PTZ Steering */}
              <div className="max-w-3xl mx-auto">
                <SurveillanceStreamPlayer
                  camera={camera}
                  isConnected={isConnected}
                  ptzSpeed={ptzSpeed}
                  onPtzAction={handlePtzAction}
                  showToast={showToast}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 8-Way Directional Controller */}
                <div className="bg-slate-950/60 border border-slate-800 p-6 rounded-xl flex flex-col items-center justify-center space-y-6">
                  <div className="text-center">
                    <h3 className="text-sm font-bold text-white tracking-tight flex items-center justify-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                      <span>Interactive Pan / Tilt Movement</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Control camera physical motor steering and angle
                    </p>
                  </div>

                  {/* Controller D-Pad */}
                  <div className="relative w-52 h-52 bg-slate-900 border border-slate-700/80 rounded-full flex items-center justify-center shadow-inner">
                    {/* Tilt Up */}
                    <button
                      onClick={() => handlePtzAction("tilt_up")}
                      disabled={isMovingPtz}
                      className="absolute top-2 w-12 h-12 rounded-full bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-300 flex items-center justify-center shadow transition-all active:scale-95 border border-slate-700"
                      title="Tilt Up"
                    >
                      <ChevronUp className="w-6 h-6" />
                    </button>

                    {/* Pan Left */}
                    <button
                      onClick={() => handlePtzAction("pan_left")}
                      disabled={isMovingPtz}
                      className="absolute left-2 w-12 h-12 rounded-full bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-300 flex items-center justify-center shadow transition-all active:scale-95 border border-slate-700"
                      title="Pan Left"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>

                    {/* Center Reset */}
                    <button
                      onClick={() => handlePtzAction("center_reset")}
                      disabled={isMovingPtz}
                      className="w-14 h-14 rounded-full bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white flex flex-col items-center justify-center shadow-lg transition-all active:scale-90 border border-purple-500/50"
                      title="Home Center 0°/0°"
                    >
                      <RotateCcw className="w-5 h-5" />
                      <span className="text-[9px] font-mono font-bold mt-0.5">HOME</span>
                    </button>

                    {/* Pan Right */}
                    <button
                      onClick={() => handlePtzAction("pan_right")}
                      disabled={isMovingPtz}
                      className="absolute right-2 w-12 h-12 rounded-full bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-300 flex items-center justify-center shadow transition-all active:scale-95 border border-slate-700"
                      title="Pan Right"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Tilt Down */}
                    <button
                      onClick={() => handlePtzAction("tilt_down")}
                      disabled={isMovingPtz}
                      className="absolute bottom-2 w-12 h-12 rounded-full bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-300 flex items-center justify-center shadow transition-all active:scale-95 border border-slate-700"
                      title="Tilt Down"
                    >
                      <ChevronDown className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Zoom Controls */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handlePtzAction("zoom_out")}
                      disabled={isMovingPtz}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <ZoomOut className="w-4 h-4 text-cyan-400" />
                      <span>Zoom Out (-)</span>
                    </button>

                    <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-purple-300 font-bold">
                      {currentZoom}x Zoom
                    </div>

                    <button
                      onClick={() => handlePtzAction("zoom_in")}
                      disabled={isMovingPtz}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <ZoomIn className="w-4 h-4 text-cyan-400" />
                      <span>Zoom In (+)</span>
                    </button>
                  </div>

                  {/* PTZ Motor Speed Slider */}
                  <div className="w-full max-w-xs space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Motor Velocity:</span>
                      <span className="font-mono text-purple-400 font-bold">{ptzSpeed} / 10</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={ptzSpeed}
                      onChange={(e) => setPtzSpeed(Number(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Preset Positions & Movement Telemetry */}
                <div className="bg-slate-950/60 border border-slate-800 p-6 rounded-xl space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                      <Radio className="w-4 h-4 text-cyan-400" />
                      <span>PTZ Guard Presets & Patrol Points</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Quickly steer camera to pre-programmed surveillance angles
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {camera.ptz_capabilities?.presets.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setCurrentPan(preset.pan);
                          setCurrentTilt(preset.tilt);
                          setCurrentZoom(preset.zoom);
                          handlePtzAction("preset_goto", preset.id);
                        }}
                        disabled={isMovingPtz}
                        className="p-3 bg-slate-900 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/50 rounded-xl text-left transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-purple-400">
                            PRESET #{preset.id}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {preset.zoom}x
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-200 mt-1 group-hover:text-white">
                          {preset.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-1">
                          Pan: {preset.pan}° · Tilt: {preset.tilt}°
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Motor Telemetry Coordinates */}
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                    <span className="text-xs font-semibold text-slate-300">Live Coordinate Telemetry</span>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase font-mono">Pan Angle</div>
                        <div className="text-sm font-mono font-bold text-cyan-400">{currentPan}°</div>
                      </div>
                      <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase font-mono">Tilt Angle</div>
                        <div className="text-sm font-mono font-bold text-emerald-400">{currentTilt}°</div>
                      </div>
                      <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase font-mono">Optical Zoom</div>
                        <div className="text-sm font-mono font-bold text-purple-400">{currentZoom}x</div>
                      </div>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 text-center pt-1">
                      Status: <span className="text-cyan-300">{ptzStatus}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CAMERAS DEFAULTS SECTION */}
          {activeTab === "defaults" && (
            <div className="space-y-6">
              {/* Camera Model Identification Banner */}
              <div className="bg-purple-950/20 border border-purple-500/40 p-5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-400" />
                    <span className="text-sm font-bold text-white">
                      Identified Hardware Model & Factory Default Profile
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-500/50 font-bold uppercase">
                    {camera.camera_defaults?.is_identified ? "Type Identified" : "Generic Profile"}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  {camera.camera_defaults?.notes ||
                    "NetSentinel analyzed the network signature and loaded default usernames and passwords into the camera defaults section."}
                </p>
              </div>

              {/* Defaults Key-Value Configuration */}
              <div className="bg-slate-950/60 border border-slate-800 p-6 rounded-xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Default Username */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>Default Username:</span>
                      <button
                        onClick={() => copyToClipboard(customDefaults.default_username, "default username")}
                        className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </label>
                    <input
                      type="text"
                      value={customDefaults.default_username}
                      onChange={(e) => setCustomDefaults({ ...customDefaults, default_username: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Default Password */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>Default Password:</span>
                      <button
                        onClick={() => copyToClipboard(customDefaults.default_password, "default password")}
                        className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </label>
                    <input
                      type="text"
                      value={customDefaults.default_password}
                      onChange={(e) => setCustomDefaults({ ...customDefaults, default_password: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-amber-300 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Admin Web URL */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>Admin Web Portal URL:</span>
                      <a
                        href={customDefaults.admin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                      >
                        <ExternalLink className="w-3 h-3" /> Open
                      </a>
                    </label>
                    <input
                      type="text"
                      value={customDefaults.admin_url}
                      onChange={(e) => setCustomDefaults({ ...customDefaults, admin_url: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* RTSP Stream URL */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>RTSP Video Stream URL:</span>
                      <button
                        onClick={() => copyToClipboard(customDefaults.rtsp_url, "RTSP URL")}
                        className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 font-mono"
                      >
                        <Copy className="w-3 h-3" /> Copy
                      </button>
                    </label>
                    <input
                      type="text"
                      value={customDefaults.rtsp_url}
                      onChange={(e) => setCustomDefaults({ ...customDefaults, rtsp_url: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                {/* Notes & Security Advice */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Security Notes & Vendor Advice:</label>
                  <textarea
                    rows={2}
                    value={customDefaults.notes}
                    onChange={(e) => setCustomDefaults({ ...customDefaults, notes: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-sans text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? "animate-spin" : ""}`} />
                    <span>Test Authentication</span>
                  </button>

                  <button
                    onClick={handleSaveDefaults}
                    disabled={isSavingDefaults}
                    className="px-5 py-2 text-xs font-semibold text-slate-950 bg-purple-400 hover:bg-purple-300 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Camera Defaults</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CAMERA SETTINGS MODIFICATION */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div className="bg-slate-950/60 border border-slate-800 p-6 rounded-xl space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    <span>Camera Configuration & Stream Tuning</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Modify hardware encoding, night vision, and motion sensing settings
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Resolution */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Video Resolution:</label>
                    <select
                      value={settings.resolution}
                      onChange={(e) => setSettings({ ...settings, resolution: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-purple-500"
                    >
                      <option value="4K (3840x2160)">4K Ultra HD (3840x2160)</option>
                      <option value="1080p (1920x1080)">1080p Full HD (1920x1080)</option>
                      <option value="720p (1280x720)">720p HD (1280x720)</option>
                      <option value="D1 (704x576)">D1 SD (704x576)</option>
                    </select>
                  </div>

                  {/* Frame Rate FPS */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Frame Rate (FPS):</label>
                    <select
                      value={settings.fps}
                      onChange={(e) => setSettings({ ...settings, fps: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-purple-500"
                    >
                      <option value={60}>60 FPS (Ultra Smooth)</option>
                      <option value={30}>30 FPS (Standard Realtime)</option>
                      <option value={25}>25 FPS (PAL Broadcast)</option>
                      <option value={15}>15 FPS (Bandwidth Saver)</option>
                    </select>
                  </div>

                  {/* Night Vision / IR */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Night Vision / IR Mode:</label>
                    <select
                      value={settings.night_vision}
                      onChange={(e) => setSettings({ ...settings, night_vision: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-purple-500"
                    >
                      <option value="Auto">Auto (Ambient Light Sensor)</option>
                      <option value="Smart IR">Smart IR (Anti-Overexposure)</option>
                      <option value="Always On">Always On (Infrared 24/7)</option>
                      <option value="Off">Off (Color Only)</option>
                    </select>
                  </div>

                  {/* Stream Codec */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Encoding Codec:</label>
                    <select
                      value={settings.stream_codec}
                      onChange={(e) => setSettings({ ...settings, stream_codec: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-purple-500"
                    >
                      <option value="H.264 High Profile">H.264 High Profile (Best Compatibility)</option>
                      <option value="H.265 / HEVC">H.265 / HEVC (50% Bandwidth Compression)</option>
                      <option value="MJPEG">MJPEG (Motion JPEG)</option>
                    </select>
                  </div>

                  {/* OSD Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">On-Screen Display (OSD) Name:</label>
                    <input
                      type="text"
                      value={settings.osd_name}
                      onChange={(e) => setSettings({ ...settings, osd_name: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  {/* Bitrate Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Stream Bitrate:</span>
                      <span className="font-mono text-cyan-400 font-bold">{settings.bitrate_kbps} Kbps</span>
                    </div>
                    <input
                      type="range"
                      min={1024}
                      max={8192}
                      step={512}
                      value={settings.bitrate_kbps}
                      onChange={(e) => setSettings({ ...settings, bitrate_kbps: Number(e.target.value) })}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <label className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-800/40">
                    <span className="text-xs text-slate-300 font-medium">Motion Detection</span>
                    <input
                      type="checkbox"
                      checked={settings.motion_detection}
                      onChange={(e) => setSettings({ ...settings, motion_detection: e.target.checked })}
                      className="w-4 h-4 accent-purple-500 rounded"
                    />
                  </label>

                  <label className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-800/40">
                    <span className="text-xs text-slate-300 font-medium">Audio Mic Input</span>
                    <input
                      type="checkbox"
                      checked={settings.audio_enabled}
                      onChange={(e) => setSettings({ ...settings, audio_enabled: e.target.checked })}
                      className="w-4 h-4 accent-purple-500 rounded"
                    />
                  </label>

                  <label className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-800/40">
                    <span className="text-xs text-slate-300 font-medium">Wide Dynamic Range (WDR)</span>
                    <input
                      type="checkbox"
                      checked={settings.wdr_enabled}
                      onChange={(e) => setSettings({ ...settings, wdr_enabled: e.target.checked })}
                      className="w-4 h-4 accent-purple-500 rounded"
                    />
                  </label>
                </div>

                {/* Motion Sensitivity Slider */}
                {settings.motion_detection && (
                  <div className="space-y-1.5 p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Motion Sensitivity Threshold:</span>
                      <span className="font-mono text-emerald-400 font-bold">{settings.motion_sensitivity}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={100}
                      value={settings.motion_sensitivity}
                      onChange={(e) => setSettings({ ...settings, motion_sensitivity: Number(e.target.value) })}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>
                )}

                <div className="flex justify-end pt-3">
                  <button
                    onClick={handleSaveSettings}
                    disabled={isSavingSettings}
                    className="px-6 py-2.5 text-xs font-semibold text-slate-950 bg-purple-400 hover:bg-purple-300 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingSettings ? "Saving Settings..." : "Save Camera Settings"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

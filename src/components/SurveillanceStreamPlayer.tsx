import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  Camera,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Layers,
  Activity,
  SlidersHorizontal,
  RefreshCw,
  Sun,
  Moon,
  Zap,
  Eye,
  Radio,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Download,
  Video,
  X,
  Compass,
  Link,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
} from "lucide-react";
import { CameraItem } from "./CameraManagementModal";

export const DEFAULT_LIVE_RTSP_STREAM =
  "rtsp://rtsp.rtsplink.com/live/people?token=d37fb79892a53ccf13a8cd1eb108f3c163252d5e538a6864196d982de4b85a71";

interface SurveillanceStreamPlayerProps {
  camera: CameraItem;
  isConnected: boolean;
  ptzSpeed?: number;
  onPtzAction?: (action: string) => void;
  showToast: (msg: string) => void;
  miniMode?: boolean;
}

export function SurveillanceStreamPlayer({
  camera,
  isConnected,
  ptzSpeed = 5,
  onPtzAction,
  showToast,
  miniMode = false,
}: SurveillanceStreamPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamImgRef = useRef<HTMLImageElement | null>(null);

  // Stream States - Default to LIVE RTSP STREAM (Pointing all viewers to user's live RTSP stream)
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [streamSource, setStreamSource] = useState<"live_stream" | "custom" | "webcam">("live_stream");
  const [activeStreamUrl, setActiveStreamUrl] = useState<string>(DEFAULT_LIVE_RTSP_STREAM);
  const [customInputUrl, setCustomInputUrl] = useState<string>(DEFAULT_LIVE_RTSP_STREAM);
  const [showUrlEditor, setShowUrlEditor] = useState<boolean>(false);
  const [streamConnected, setStreamConnected] = useState<boolean>(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [streamKey, setStreamKey] = useState<number>(Date.now());

  // Point all viewers to the live RTSP stream when mounted or camera changed
  useEffect(() => {
    setActiveStreamUrl(DEFAULT_LIVE_RTSP_STREAM);
    setCustomInputUrl(DEFAULT_LIVE_RTSP_STREAM);
    setStreamSource("live_stream");
  }, [camera.ip]);

  // Local Webcam
  const [webcamActive, setWebcamActive] = useState<boolean>(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);

  // Visual Effects & Filters
  const [visionMode, setVisionMode] = useState<"daylight" | "infrared" | "thermal" | "starlight">("daylight");
  const [showScanlines, setShowScanlines] = useState<boolean>(true);
  const [showMotionBox, setShowMotionBox] = useState<boolean>(true);
  const [showCrosshairs, setShowCrosshairs] = useState<boolean>(!miniMode);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Audio Monitor
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(32);

  // Snapshot Preview Modal
  const [snapshotPreview, setSnapshotPreview] = useState<{ url: string; time: string } | null>(null);
  const [isCapturingSnapshot, setIsCapturingSnapshot] = useState<boolean>(false);

  // Digital & Hardware PTZ State
  const [pan, setPan] = useState<number>(0); // -180 to 180 degrees
  const [tilt, setTilt] = useState<number>(10); // -45 to 90 degrees
  const [zoom, setZoom] = useState<number>(1.0); // 1.0x to 16.0x

  // Dynamic Telemetry
  const [fps, setFps] = useState<number>(30);
  const [bitrate, setBitrate] = useState<number>(camera.camera_settings?.bitrate_kbps || 4096);
  const [timestampStr, setTimestampStr] = useState<string>("");

  // Target object positions for AI motion tracking
  const [motionBoxPos, setMotionBoxPos] = useState({ x: 38, y: 32, w: 16, h: 26, label: "PERSON 98%", active: true });

  // Update telemetry
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const ms = String(now.getMilliseconds()).padStart(3, "0");
      setTimestampStr(`${now.toISOString().replace("T", " ").replace("Z", "")}.${ms}`);
      setBitrate((prev) => {
        const base = camera.camera_settings?.bitrate_kbps || 4096;
        return base + Math.floor((Math.random() - 0.5) * 120);
      });
      // Gently drift motion tracking box simulating real-time AI object detection
      setMotionBoxPos((prev) => {
        const nextX = Math.min(68, Math.max(22, prev.x + (Math.random() - 0.49) * 1.5));
        const nextY = Math.min(55, Math.max(20, prev.y + (Math.random() - 0.5) * 1.0));
        return { ...prev, x: nextX, y: nextY };
      });
    }, 150);
    return () => clearInterval(interval);
  }, [camera]);

  // WebCam Handler
  useEffect(() => {
    let mediaStream: MediaStream | null = null;
    if (streamSource === "webcam") {
      setWebcamError(null);
      navigator.mediaDevices
        ?.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
        .then((stream) => {
          mediaStream = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }
          setWebcamActive(true);
          showToast("Local camera / webcam connected to surveillance player");
        })
        .catch(() => {
          setWebcamError("Could not access local camera (permission or hardware in use)");
          setWebcamActive(false);
          setStreamSource("live_stream");
          showToast("Local camera unavailable: switched to Live RTSP feed");
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setWebcamActive(false);
    }

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [streamSource]);

  // Audio VU Meter Sim
  useEffect(() => {
    if (!audioEnabled || !isPlaying) return;
    const interval = setInterval(() => {
      setAudioLevel(Math.floor(25 + Math.random() * 45));
    }, 150);
    return () => clearInterval(interval);
  }, [audioEnabled, isPlaying]);

  // PTZ Handlers
  const handlePan = (direction: -1 | 1) => {
    const step = 15;
    const newPan = Math.max(-180, Math.min(180, pan + direction * step));
    setPan(newPan);
    if (onPtzAction) onPtzAction(direction > 0 ? "pan_right" : "pan_left");
  };

  const handleTilt = (direction: -1 | 1) => {
    const step = 10;
    const newTilt = Math.max(-45, Math.min(90, tilt + direction * step));
    setTilt(newTilt);
    if (onPtzAction) onPtzAction(direction > 0 ? "tilt_up" : "tilt_down");
  };

  const handleZoom = (direction: -1 | 1) => {
    const step = 0.25;
    const newZoom = Math.max(1.0, Math.min(8.0, Number((zoom + direction * step).toFixed(2))));
    setZoom(newZoom);
    if (onPtzAction) onPtzAction(direction > 0 ? "zoom_in" : "zoom_out");
  };

  const resetPtz = () => {
    setPan(0);
    setTilt(10);
    setZoom(1.0);
    if (onPtzAction) onPtzAction("center_reset");
    showToast("PTZ Camera Reset to Center Normal View");
  };

  // Reconnect / Refresh Live Stream
  const handleReconnectStream = () => {
    setStreamError(null);
    setStreamConnected(false);
    setStreamKey(Date.now());
    showToast("Reconnecting live RTSP stream feed...");
  };

  // Switch custom RTSP/HTTP URL
  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInputUrl.trim()) return;
    setActiveStreamUrl(customInputUrl.trim());
    setStreamSource("custom");
    setShowUrlEditor(false);
    handleReconnectStream();
    showToast(`Streaming from custom RTSP URL: ${customInputUrl.substring(0, 45)}...`);
  };

  const handleCopyStreamUrl = () => {
    navigator.clipboard.writeText(activeStreamUrl);
    showToast("Live RTSP URL copied to clipboard");
  };

  // Snapshot Capture
  const handleTakeSnapshot = async () => {
    setIsCapturingSnapshot(true);
    try {
      const snapUrl = `/api/cameras/${camera.ip}/snapshot?url=${encodeURIComponent(activeStreamUrl)}&t=${Date.now()}`;
      const nowStr = new Date().toISOString();
      setSnapshotPreview({ url: snapUrl, time: nowStr });
      showToast("Real-time live video frame snapshot captured.");
    } catch {
      showToast("Snapshot capture error");
    } finally {
      setIsCapturingSnapshot(false);
    }
  };

  const handleDownloadSnapshot = () => {
    if (!snapshotPreview) return;
    const a = document.createElement("a");
    a.href = snapshotPreview.url;
    a.download = `cctv_frame_${camera.ip.replace(/\./g, "-")}_${Date.now()}.jpg`;
    a.click();
    a.remove();
    showToast("Surveillance frame snapshot downloaded.");
  };

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Filter Styles based on Vision Mode
  const getVisionFilterStyle = () => {
    switch (visionMode) {
      case "infrared":
        return "grayscale contrast-150 brightness-110";
      case "thermal":
        return "contrast-200 saturate-200 hue-rotate-180 invert";
      case "starlight":
        return "brightness-125 contrast-125 sepia hue-rotate-90 saturate-200";
      default:
        return "";
    }
  };

  const streamSrcUrl = isPlaying
    ? `/api/stream/live?url=${encodeURIComponent(activeStreamUrl)}&key=${streamKey}`
    : `/api/stream/snapshot?url=${encodeURIComponent(activeStreamUrl)}&key=${streamKey}`;

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl flex flex-col justify-between select-none ${
        miniMode ? "aspect-video" : "aspect-video min-h-[360px]"
      }`}
    >
      {/* 1. REAL LIVE RTSP VIDEO STREAM (FFmpeg MJPEG Proxy) */}
      {streamSource !== "webcam" && (
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-black flex items-center justify-center">
          <img
            ref={streamImgRef}
            src={streamSrcUrl}
            alt="Real Live RTSP CCTV Surveillance Stream"
            onLoad={() => {
              setStreamConnected(true);
              setStreamError(null);
            }}
            onError={() => {
              setStreamConnected(false);
              setStreamError("Connecting to live RTSP feed (rtsp.rtsplink.com)...");
            }}
            className={`w-full h-full object-cover transition-transform duration-200 ${getVisionFilterStyle()}`}
            style={{
              transform: `scale(${zoom}) translate(${pan * 0.4}px, ${-(tilt - 10) * 0.4}px)`,
              transformOrigin: "center center",
            }}
          />

          {/* Connection / Reconnecting Spinner Overlay */}
          {!streamConnected && !streamError && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-4 text-center z-10">
              <div className="w-10 h-10 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
              <div className="text-xs font-mono text-cyan-300 font-bold">
                CONNECTING TO LIVE RTSP STREAM...
              </div>
              <p className="text-[11px] font-mono text-slate-400 max-w-sm truncate">
                {activeStreamUrl}
              </p>
            </div>
          )}

          {streamError && !streamConnected && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-2 p-4 text-center z-10">
              <AlertCircle className="w-8 h-8 text-amber-400" />
              <div className="text-xs font-mono text-amber-300 font-bold">{streamError}</div>
              <button
                onClick={handleReconnectStream}
                className="mt-2 px-3 py-1.5 text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Live Stream Feed</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 2. LOCAL WEBCAM ELEMENT */}
      {streamSource === "webcam" && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover z-0 ${getVisionFilterStyle()}`}
          style={{
            transform: `scale(${zoom}) translate(${pan * 0.4}px, ${-(tilt - 10) * 0.4}px)`,
            transformOrigin: "center center",
          }}
        />
      )}

      {/* CRT SCANLINES TEXTURE */}
      {showScanlines && (
        <div
          className="absolute inset-0 pointer-events-none z-10 opacity-35"
          style={{
            backgroundImage:
              "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.45) 50%)",
            backgroundSize: "100% 4px",
          }}
        />
      )}

      {/* AI MOTION TRACKING BOUNDING BOX OVERLAY */}
      {showMotionBox && isPlaying && (
        <div
          className="absolute pointer-events-none z-20 border-2 border-emerald-400 rounded-sm transition-all duration-300 shadow-[0_0_12px_rgba(52,211,153,0.6)]"
          style={{
            left: `${motionBoxPos.x}%`,
            top: `${motionBoxPos.y}%`,
            width: `${motionBoxPos.w}%`,
            height: `${motionBoxPos.h}%`,
          }}
        >
          <div className="absolute -top-5 left-0 px-1.5 py-0.5 bg-emerald-500 text-slate-950 text-[9px] font-mono font-bold tracking-wider rounded-t">
            {motionBoxPos.label}
          </div>
          <div className="w-2 h-2 border-t-2 border-l-2 border-emerald-300 absolute -top-1 -left-1" />
          <div className="w-2 h-2 border-t-2 border-r-2 border-emerald-300 absolute -top-1 -right-1" />
          <div className="w-2 h-2 border-b-2 border-l-2 border-emerald-300 absolute -bottom-1 -left-1" />
          <div className="w-2 h-2 border-b-2 border-r-2 border-emerald-300 absolute -bottom-1 -right-1" />
        </div>
      )}

      {/* CROSSHAIRS RETICLE */}
      {showCrosshairs && !miniMode && (
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border border-cyan-400/40 flex items-center justify-center">
            <div className="w-2 h-2 bg-cyan-400/70 rounded-full" />
          </div>
          <div className="absolute w-24 h-px bg-cyan-400/30" />
          <div className="absolute h-24 w-px bg-cyan-400/30" />
        </div>
      )}

      {/* TOP HUD OVERLAY */}
      <div className="absolute top-0 left-0 right-0 z-20 p-3 sm:p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between text-xs font-mono">
        {/* Left Status Group */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-950/90 border border-red-500/60 text-red-400 font-bold text-[10px] shadow">
            <span className={`w-2 h-2 rounded-full bg-red-500 ${isPlaying ? "animate-ping" : ""}`} />
            LIVE RTSP FEED
          </span>

          <span className="px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700/80 text-cyan-300 font-bold text-[11px] flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-cyan-400" />
            <span>{camera.camera_settings?.osd_name || `CAM-${camera.ip.split(".").pop()}`}</span>
          </span>

          {!miniMode && (
            <span className="text-slate-300 text-[11px] hidden md:inline">
              {camera.camera_settings?.resolution || "720p HD"} @ {fps} FPS · H.264
            </span>
          )}

          {!miniMode && (
            <span className="px-2 py-0.5 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 font-mono text-[10px] hidden lg:inline">
              rtsplink.com/live/people
            </span>
          )}
        </div>

        {/* Right Telemetry Group */}
        <div className="flex items-center gap-2">
          {!miniMode && (
            <span className="px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800 text-emerald-400 text-[10px] hidden sm:inline">
              BITRATE: {bitrate} Kbps
            </span>
          )}
          <span className="px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800 text-slate-200 text-[10px] sm:text-[11px]">
            {timestampStr || new Date().toISOString()}
          </span>
        </div>
      </div>

      {/* PTZ COMPASS / ANGLE HUD (When zoomed or panned) */}
      {!miniMode && (pan !== 0 || tilt !== 10 || zoom !== 1.0) && (
        <div className="absolute top-14 left-4 z-20 px-2.5 py-1 rounded bg-slate-950/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 flex items-center gap-2 shadow-lg backdrop-blur-sm">
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>Pan: {pan}°</span>
          <span>·</span>
          <span>Tilt: {tilt}°</span>
          <span>·</span>
          <span>Zoom: {zoom}x</span>
          <button onClick={resetPtz} className="ml-1 text-[9px] text-cyan-400 underline hover:text-white">
            Reset
          </button>
        </div>
      )}

      {/* URL BAR POPDOWN (When toggled) */}
      {showUrlEditor && !miniMode && (
        <div className="absolute top-14 right-4 z-30 p-3 bg-slate-950/95 border border-slate-700 rounded-xl shadow-2xl backdrop-blur-md max-w-md w-full space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-white font-mono">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Link className="w-3.5 h-3.5" />
              Live RTSP Stream Source
            </span>
            <button onClick={() => setShowUrlEditor(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleApplyCustomUrl} className="flex gap-2">
            <input
              type="text"
              value={customInputUrl}
              onChange={(e) => setCustomInputUrl(e.target.value)}
              placeholder="rtsp://... or http://..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg transition-colors"
            >
              Switch
            </button>
          </form>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <button
              type="button"
              onClick={() => {
                setCustomInputUrl(DEFAULT_LIVE_RTSP_STREAM);
                setActiveStreamUrl(DEFAULT_LIVE_RTSP_STREAM);
                setStreamSource("live_stream");
                setShowUrlEditor(false);
                handleReconnectStream();
                showToast("Reset to Default Live Stream (rtsp.rtsplink.com)");
              }}
              className="text-purple-400 hover:underline"
            >
              Reset to Default Live Stream
            </button>
            <button
              type="button"
              onClick={handleCopyStreamUrl}
              className="flex items-center gap-1 text-slate-300 hover:text-white"
            >
              <Copy className="w-3 h-3" />
              <span>Copy URL</span>
            </button>
          </div>
        </div>
      )}

      {/* ON-SCREEN PTZ STEERING PAD (Active in full view) */}
      {!miniMode && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-1 bg-slate-950/75 backdrop-blur-md p-2 rounded-xl border border-slate-800 shadow-xl opacity-80 hover:opacity-100 transition-opacity">
          <span className="text-[9px] font-mono font-bold text-slate-400 mb-0.5">PTZ STEER</span>
          <button
            onClick={() => handleTilt(1)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-200 active:bg-cyan-500/20 active:text-cyan-300 transition-colors"
            title="Tilt Up"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePan(-1)}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-200 active:bg-cyan-500/20 active:text-cyan-300 transition-colors"
              title="Pan Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={resetPtz}
              className="p-1.5 rounded hover:bg-slate-800 text-cyan-400 active:scale-95 transition-transform"
              title="Center Reset"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handlePan(1)}
              className="p-1.5 rounded hover:bg-slate-800 text-slate-200 active:bg-cyan-500/20 active:text-cyan-300 transition-colors"
              title="Pan Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => handleTilt(-1)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-200 active:bg-cyan-500/20 active:text-cyan-300 transition-colors"
            title="Tilt Down"
          >
            <ChevronDown className="w-4 h-4" />
          </button>

          <div className="w-full h-px bg-slate-800 my-1" />

          {/* Zoom Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleZoom(1)}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 active:text-cyan-300"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-[9px] font-mono font-bold text-cyan-400 min-w-[24px] text-center">
              {zoom}x
            </span>
            <button
              onClick={() => handleZoom(-1)}
              className="p-1 rounded hover:bg-slate-800 text-slate-300 active:text-cyan-300"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM HUD CONTROLS BAR */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-sans">
        {/* Playback & Quick Tools */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-white transition-colors"
            title={isPlaying ? "Pause Stream" : "Resume Stream"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          </button>

          <button
            onClick={handleTakeSnapshot}
            disabled={isCapturingSnapshot}
            className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 border border-slate-700/80 font-medium transition-colors disabled:opacity-50"
            title="Capture Instant Frame Snapshot"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Snapshot</span>
          </button>

          {/* Vision Filter Selector */}
          {!miniMode && (
            <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5">
              {[
                { id: "daylight", label: "Day", icon: Sun },
                { id: "infrared", label: "IR", icon: Moon },
                { id: "thermal", label: "Thermal", icon: Zap },
                { id: "starlight", label: "NVG", icon: Eye },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setVisionMode(m.id as any)}
                    className={`px-2 py-1 rounded text-[11px] font-mono flex items-center gap-1 transition-colors ${
                      visionMode === m.id
                        ? "bg-purple-600/40 text-purple-300 font-bold border border-purple-500/50"
                        : "text-slate-400 hover:text-white"
                    }`}
                    title={`${m.label} Vision Mode`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* CRT Scanlines Toggle */}
          {!miniMode && (
            <button
              onClick={() => setShowScanlines(!showScanlines)}
              className={`p-1.5 rounded-lg border transition-colors ${
                showScanlines
                  ? "bg-purple-600/30 text-purple-300 border-purple-500/50"
                  : "bg-slate-900/80 text-slate-500 border-slate-800"
              }`}
              title="Toggle CRT Scanline Texture"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          )}

          {/* AI Motion Box Toggle */}
          {!miniMode && (
            <button
              onClick={() => setShowMotionBox(!showMotionBox)}
              className={`p-1.5 rounded-lg border transition-colors ${
                showMotionBox
                  ? "bg-emerald-600/30 text-emerald-300 border-emerald-500/50"
                  : "bg-slate-900/80 text-slate-500 border-slate-800"
              }`}
              title="Toggle AI Motion Bounding Box"
            >
              <Activity className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Crosshairs Toggle */}
          {!miniMode && (
            <button
              onClick={() => setShowCrosshairs(!showCrosshairs)}
              className={`p-1.5 rounded-lg border transition-colors ${
                showCrosshairs
                  ? "bg-cyan-600/30 text-cyan-300 border-cyan-500/50"
                  : "bg-slate-900/80 text-slate-500 border-slate-800"
              }`}
              title="Toggle Crosshairs Reticle"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right Tools: Stream Selector, Audio Monitor, Fullscreen */}
        <div className="flex items-center gap-2.5">
          {/* Stream Source Selector */}
          {!miniMode && (
            <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => {
                  setStreamSource("live_stream");
                  setActiveStreamUrl(DEFAULT_LIVE_RTSP_STREAM);
                  handleReconnectStream();
                }}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  streamSource === "live_stream"
                    ? "bg-purple-500/20 text-purple-300 font-bold border border-purple-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Live RTSP Stream from rtsplink.com"
              >
                Live RTSP
              </button>
              <button
                onClick={() => setShowUrlEditor(!showUrlEditor)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 ${
                  showUrlEditor || streamSource === "custom"
                    ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Custom RTSP Stream URL"
              >
                <Link className="w-3 h-3" />
                <span>URL</span>
              </button>
              <button
                onClick={() => setStreamSource("webcam")}
                className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
                  streamSource === "webcam"
                    ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Stream from Local Webcam"
              >
                <Video className="w-3 h-3" />
                <span>Webcam</span>
              </button>
            </div>
          )}

          {/* Audio VU Monitor */}
          {!miniMode && (
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-2 py-1 rounded-lg">
              <button
                onClick={() => setAudioEnabled(!audioEnabled)}
                className="text-slate-400 hover:text-white"
                title={audioEnabled ? "Mute Surveillance Audio" : "Listen to Camera Audio Stream"}
              >
                {audioEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
              </button>
              {audioEnabled && (
                <div className="flex items-center gap-0.5">
                  <div
                    className="w-1.5 bg-emerald-400 rounded-full transition-all"
                    style={{ height: `${Math.max(6, audioLevel * 0.2)}px` }}
                  />
                  <div
                    className="w-1.5 bg-cyan-400 rounded-full transition-all"
                    style={{ height: `${Math.max(6, audioLevel * 0.25)}px` }}
                  />
                  <div
                    className="w-1.5 bg-amber-400 rounded-full transition-all"
                    style={{ height: `${Math.max(6, audioLevel * 0.3)}px` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Fullscreen Button */}
          {!miniMode && (
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Player"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Snapshot Preview Modal */}
      {snapshotPreview && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Live Surveillance Snapshot Captured</h3>
              </div>
              <button
                onClick={() => setSnapshotPreview(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-800 bg-black shadow-inner flex items-center justify-center">
              <img src={snapshotPreview.url} alt="Captured Snapshot" className="w-full h-full object-contain" />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Timestamp: {snapshotPreview.time}</span>
              <span>Source: {activeStreamUrl.substring(0, 40)}...</span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSnapshotPreview(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Close Preview
              </button>
              <button
                onClick={handleDownloadSnapshot}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg flex items-center gap-2 shadow transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Real JPEG Frame</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React from "react";
import {
  CanvasNode,
  CanvasNodeStatus,
  CanvasNodeType,
} from "../../types/canvas";
import {
  Laptop,
  Server,
  Radio,
  Globe,
  Cloud,
  Layers,
  Box,
  ShieldCheck,
  AlertOctagon,
  AlertTriangle,
  HelpCircle,
  Eye,
  Plus,
  RotateCcw,
  ArrowRight,
  Trash2,
} from "lucide-react";

interface CanvasNodeCardProps {
  node: CanvasNode;
  isSelected: boolean;
  onSelect: (node: CanvasNode, e: React.MouseEvent) => void;
  onStartConnect: (node: CanvasNode, e: React.MouseEvent) => void;
  onDragStart: (node: CanvasNode, e: React.MouseEvent) => void;
  onCreateLoopback?: (node: CanvasNode, e: React.MouseEvent) => void;
  onDeleteNode?: (id: string, e: React.MouseEvent) => void;
}

export const CanvasNodeCard: React.FC<CanvasNodeCardProps> = ({
  node,
  isSelected,
  onSelect,
  onStartConnect,
  onDragStart,
  onCreateLoopback,
  onDeleteNode,
}) => {
  // Status Colors per prompt:
  // Managed: 🟢 Green
  // Unmanaged: 🔴 Red
  // Warning: 🟡 Yellow
  // Offline: ⚪ Gray
  // Threat Detected: 🚨 Flashing Red
  const getStatusVisuals = (status: CanvasNodeStatus) => {
    switch (status) {
      case "managed":
        return {
          color: "#10b981",
          borderColor: "border-emerald-500/80",
          ringColor: "ring-emerald-500/30",
          badgeBg: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
          emoji: "🟢",
          label: "Managed",
          glow: "shadow-emerald-950/40",
        };
      case "unmanaged":
        return {
          color: "#ef4444",
          borderColor: "border-red-500/80",
          ringColor: "ring-red-500/30",
          badgeBg: "bg-red-500/15 text-red-400 border-red-500/30",
          emoji: "🔴",
          label: "Unmanaged",
          glow: "shadow-red-950/40",
        };
      case "warning":
        return {
          color: "#f59e0b",
          borderColor: "border-amber-500/80",
          ringColor: "ring-amber-500/30",
          badgeBg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
          emoji: "🟡",
          label: "Warning",
          glow: "shadow-amber-950/40",
        };
      case "threat_detected":
        return {
          color: "#ef4444",
          borderColor: "border-red-500 animate-pulse",
          ringColor: "ring-red-500/50 animate-ping",
          badgeBg: "bg-red-500/25 text-red-200 border-red-500/50 animate-pulse",
          emoji: "🚨",
          label: "Threat Detected",
          glow: "shadow-red-500/50",
        };
      case "offline":
      default:
        return {
          color: "#94a3b8",
          borderColor: "border-slate-600/80",
          ringColor: "ring-slate-500/20",
          badgeBg: "bg-slate-700/30 text-slate-400 border-slate-600/30",
          emoji: "⚪",
          label: "Offline",
          glow: "shadow-slate-950/40",
        };
    }
  };

  const visuals = getStatusVisuals(node.status);

  // Icon mapping per object type
  const getNodeIcon = (type: CanvasNodeType) => {
    switch (type) {
      case "internet":
        return <Globe className="w-5 h-5 text-cyan-400" />;
      case "external_service":
        return <Cloud className="w-5 h-5 text-sky-400" />;
      case "network":
        return <Radio className="w-5 h-5 text-amber-400" />;
      case "group":
        return <Layers className="w-5 h-5 text-purple-400" />;
      case "application":
        return <Box className="w-5 h-5 text-pink-400" />;
      case "managed_device":
        return <Laptop className="w-5 h-5 text-emerald-400" />;
      case "unmanaged_device":
      default:
        return <Server className="w-5 h-5 text-red-400" />;
    }
  };

  return (
    <div
      style={{
        left: `${node.x}px`,
        top: `${node.y}px`,
        width: "240px",
      }}
      className={`absolute select-none cursor-move transition-shadow duration-150 z-20 ${
        isSelected ? "ring-2 ring-cyan-400 shadow-xl shadow-cyan-950/50" : ""
      }`}
      onMouseDown={(e) => onDragStart(node, e)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node, e);
      }}
    >
      <div
        className={`relative bg-slate-900/95 backdrop-blur-md rounded-xl border ${
          visuals.borderColor
        } p-3.5 shadow-lg ${visuals.glow} group hover:border-cyan-400/80 transition-all`}
      >
        {/* Top Header: Icon + Name + Status Emoji Indicator */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 shrink-0">
              {getNodeIcon(node.type || node.node_type || "managed_device")}
            </div>
            <div className="min-w-0">
              <h3
                className="text-xs font-semibold text-white truncate group-hover:text-cyan-300 transition-colors"
                title={node.label}
              >
                {node.label}
              </h3>
              <p className="text-[11px] font-mono text-slate-400 truncate">
                {node.ip || node.cidr || "0.0.0.0/0"}
              </p>
            </div>
          </div>

          {/* Prompt-mandated Device Status Emoji Indicator */}
          <div
            className="flex items-center gap-1 shrink-0"
            title={`${visuals.label} (${node.status})`}
          >
            <span className="text-xs">{visuals.emoji}</span>
          </div>
        </div>

        {/* Info Badges Strip */}
        <div className="flex items-center justify-between gap-1 pt-2 border-t border-slate-800/80 text-[10px] font-mono">
          <span
            className={`px-1.5 py-0.5 rounded border text-[9px] font-medium tracking-tight ${visuals.badgeBg}`}
          >
            {visuals.label}
          </span>

          <div className="flex items-center gap-1.5 text-slate-400">
            {node.os && (
              <span className="px-1 py-0.2 bg-slate-800 rounded border border-slate-700 text-slate-300">
                {node.os}
              </span>
            )}
            {node.groupName && (
              <span className="text-purple-400 bg-purple-950/40 px-1 py-0.2 rounded border border-purple-800/40">
                {node.groupName}
              </span>
            )}
          </div>
        </div>

        {/* Hover Delete Device Quick Action */}
        {onDeleteNode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteNode(node.id, e);
            }}
            className="absolute -top-2.5 -left-2.5 w-6 h-6 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-red-400/40 z-30"
            title={`Delete ${node.label} from canvas`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Hover Loopback Port Redirect Initiator (A --- 8080:80 ---> A) */}
        {onCreateLoopback && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateLoopback(node, e);
            }}
            className="absolute -top-2.5 right-6 w-6 h-6 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-indigo-400/40 z-30"
            title={`Add Loopback / Port Redirect on ${node.label} (${node.label} --- 8080:80 ---> ${node.label})`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Hover Port/Connection Initiator Quick Action */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStartConnect(node, e);
          }}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-30"
          title={`Connect relationship from ${node.label}`}
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { CanvasNode, CanvasNodeStatus, CanvasNodeType, CanvasGroup, CanvasRelationship, AgentNode } from "../../types/canvas";
import {
  X,
  Server,
  Laptop,
  Radio,
  Globe,
  Cloud,
  Layers,
  Box,
  Trash2,
  Check,
  ShieldAlert,
  Activity,
  ArrowRight,
  ArrowLeft,
  ArrowLeftRight,
} from "lucide-react";

interface NodePropertiesDrawerProps {
  node: CanvasNode | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: CanvasNode) => void;
  onDelete: (id: string) => void;
  groups: CanvasGroup[];
  relationships: CanvasRelationship[];
  nodes: CanvasNode[];
  agents: AgentNode[];
}

export const NodePropertiesDrawer: React.FC<NodePropertiesDrawerProps> = ({
  node,
  isOpen,
  onClose,
  onSave,
  onDelete,
  groups,
  relationships,
  nodes,
  agents,
}) => {
  const [label, setLabel] = useState<string>("");
  const [ip, setIp] = useState<string>("");
  const [nodeType, setNodeType] = useState<CanvasNodeType>("managed_device");
  const [status, setStatus] = useState<CanvasNodeStatus>("managed");
  const [groupId, setGroupId] = useState<string>("");

  useEffect(() => {
    if (node) {
      setLabel(node.label || "");
      setIp(node.ip || node.ip_or_cidr || "");
      setNodeType(node.type || node.node_type || "managed_device");
      setStatus(node.status || "managed");
      setGroupId(node.groupId || node.group_id || "");
    }
  }, [node]);

  if (!isOpen || !node) return null;

  const handleSave = () => {
    const selectedGroup = groups.find((g) => g.id === groupId);
    const updated: CanvasNode = {
      ...node,
      label: label.trim() || node.label,
      ip: ip.trim(),
      ip_or_cidr: ip.trim(),
      type: nodeType,
      node_type: nodeType,
      status,
      groupId: groupId || undefined,
      group_id: groupId || undefined,
      groupName: selectedGroup?.name,
    };
    onSave(updated);
  };

  // Find linked agent telemetry
  const linkedAgent = agents.find(
    (a) =>
      (node.device_mac && a.device_mac && a.device_mac.toUpperCase() === node.device_mac.toUpperCase()) ||
      a.hostname.toLowerCase() === node.label.toLowerCase() ||
      a.ip === (node.ip || node.ip_or_cidr)
  );

  // Find connected relationships
  const connectedEdges = relationships.filter(
    (r) => r.sourceId === node.id || r.targetId === node.id
  );

  const nodeMap = new Map<string, CanvasNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const statusOptions: Array<{ id: CanvasNodeStatus; label: string; emoji: string; color: string }> = [
    { id: "managed", label: "Managed", emoji: "🟢", color: "text-emerald-400 border-emerald-500/50 bg-emerald-950/40" },
    { id: "unmanaged", label: "Unmanaged", emoji: "🔴", color: "text-red-400 border-red-500/50 bg-red-950/40" },
    { id: "warning", label: "Warning", emoji: "🟡", color: "text-amber-400 border-amber-500/50 bg-amber-950/40" },
    { id: "offline", label: "Offline", emoji: "⚪", color: "text-slate-400 border-slate-700 bg-slate-900" },
    { id: "threat_detected", label: "Threat", emoji: "🚨", color: "text-red-400 border-red-500/60 bg-red-950/50 animate-pulse" },
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-slate-900/98 backdrop-blur-xl border-l border-slate-800 shadow-2xl z-50 flex flex-col font-sans select-none overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Server className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight truncate max-w-[200px]">
              {node.label}
            </h2>
            <p className="text-[11px] font-mono text-slate-400">Node Properties Inspector</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Status Selector (🟢 🔴 🟡 ⚪ 🚨) */}
        <div>
          <label className="text-[11px] font-medium text-slate-300 mb-1.5 block">
            Device Status & Policy Governance
          </label>
          <div className="grid grid-cols-5 gap-1.5 font-mono text-[10px]">
            {statusOptions.map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatus(st.id)}
                className={`py-2 px-1 rounded-lg border text-center transition-all flex flex-col items-center gap-1 ${
                  status === st.id || (st.id === "threat_detected" && status === "threat")
                    ? `${st.color} font-bold ring-1 ring-white/20 shadow-md`
                    : "bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300"
                }`}
                title={`Set status to ${st.label}`}
              >
                <span className="text-xs">{st.emoji}</span>
                <span className="text-[9px] truncate w-full">{st.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Node Label */}
        <div>
          <label className="text-[11px] font-medium text-slate-300 mb-1.5 block">
            Display Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. WS-DEV-WIN11, SRV-DATABASE"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* IP Address / CIDR */}
        <div>
          <label className="text-[11px] font-medium text-slate-300 mb-1.5 block">
            IP Address or CIDR Boundary
          </label>
          <input
            type="text"
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            placeholder="192.168.1.50 or 10.0.0.0/24"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Node Object Type */}
        <div>
          <label className="text-[11px] font-medium text-slate-300 mb-1.5 block">
            Node Entity Type
          </label>
          <select
            value={nodeType}
            onChange={(e) => setNodeType(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
          >
            <option value="managed_device">Managed Device (Agent Governed)</option>
            <option value="unmanaged_device">Unmanaged Device (Restricted)</option>
            <option value="network">Network / Subnet Boundary</option>
            <option value="group">Device Group Container</option>
            <option value="internet">Public Internet / WAN (0.0.0.0/0)</option>
            <option value="external_service">External SaaS / Cloud API</option>
            <option value="application">Application / Microservice</option>
          </select>
        </div>

        {/* Group Membership */}
        <div>
          <label className="text-[11px] font-medium text-slate-300 mb-1.5 block">
            Logical Group Membership
          </label>
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="">No Group Assigned</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Agent Telemetry & Active Listeners */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-200">Local Endpoint Telemetry</span>
            <span
              className={`px-1.5 py-0.2 rounded font-mono text-[9px] font-bold ${
                linkedAgent
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {linkedAgent ? "Agent Online" : "No Agent"}
            </span>
          </div>

          {linkedAgent ? (
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Firewall Engine:</span>
                <span className="text-cyan-400 font-semibold">{linkedAgent.firewallType || linkedAgent.firewall_provider}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400">Compliance Rating:</span>
                <span className="text-emerald-400 font-bold">{linkedAgent.compliance_score ?? 100}%</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">
                  Active Sockets Queried:
                </span>
                <div className="space-y-1 font-mono text-[10px]">
                  {linkedAgent.active_listeners && linkedAgent.active_listeners.length > 0 ? (
                    linkedAgent.active_listeners.map((l, idx) => (
                      <div
                        key={idx}
                        className="p-1.5 rounded bg-slate-900 border border-slate-800/80 flex items-center justify-between"
                      >
                        <span className="text-cyan-300 font-bold">
                          {l.proto.toUpperCase()} {l.port}
                        </span>
                        <span className="text-slate-400">{l.process || "kernel listener"}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 italic p-1">No open listening sockets detected.</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/60 text-slate-500 text-[11px]">
              Deploy the NetSentinel agent on this endpoint to verify local listeners and enforce Zero Trust firewall rules locally.
            </div>
          )}
        </div>

        {/* Connected Policy Edges */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-200">Connected Relationships</span>
            <span className="text-[10px] font-mono text-cyan-400 font-bold">{connectedEdges.length} Active</span>
          </div>

          <div className="space-y-1.5">
            {connectedEdges.map((rel) => {
              const isSource = rel.sourceId === node.id;
              const peer = nodeMap.get(isSource ? rel.targetId : rel.sourceId);
              return (
                <div
                  key={rel.id}
                  className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px] font-mono"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-cyan-400">
                      {rel.direction === "bidirectional" ? (
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                      ) : isSource ? (
                        <ArrowRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowLeft className="w-3.5 h-3.5" />
                      )}
                    </span>
                    <span className="text-slate-300 truncate">{peer?.label || "Peer"}</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 font-bold text-[10px]">
                    {rel.ports.join(", ")}
                  </span>
                </div>
              );
            })}
            {connectedEdges.length === 0 && (
              <div className="text-slate-500 italic p-1 text-[11px]">
                No active relationships connected. Strict Default Deny is enforced.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-2">
        <button
          onClick={() => onDelete(node.id)}
          className="p-2.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
          title="Delete Node and Connected Relationships"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md shadow-cyan-950"
          >
            <Check className="w-4 h-4" />
            <span>Update Node</span>
          </button>
        </div>
      </div>
    </div>
  );
};

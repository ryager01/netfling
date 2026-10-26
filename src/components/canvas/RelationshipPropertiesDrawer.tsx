import React, { useState, useEffect } from "react";
import { CanvasRelationship, CanvasNode } from "../../types/canvas";
import {
  X,
  Shield,
  Trash2,
  Check,
  Code,
  Zap,
  Info,
  Layers,
  ArrowRight,
  ArrowLeftRight,
  ArrowLeft,
  Sliders,
  Sparkles,
} from "lucide-react";

interface RelationshipPropertiesDrawerProps {
  relationship: CanvasRelationship | null;
  sourceNode: CanvasNode | null;
  targetNode: CanvasNode | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: CanvasRelationship) => void;
  onDelete: (id: string) => void;
}

export const RelationshipPropertiesDrawer: React.FC<RelationshipPropertiesDrawerProps> = ({
  relationship,
  sourceNode,
  targetNode,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [portsInput, setPortsInput] = useState<string>("");
  const [protocol, setProtocol] = useState<"tcp" | "udp" | "icmp" | "any">("tcp");
  const [direction, setDirection] = useState<"one_way" | "bidirectional" | "reverse">("one_way");
  const [triggeredPorts, setTriggeredPorts] = useState<string>("");
  const [stateful, setStateful] = useState<boolean>(true);
  const [logging, setLogging] = useState<boolean>(true);
  const [ids, setIds] = useState<boolean>(true);
  const [schedule, setSchedule] = useState<string>("Always");
  const [aiNotes, setAiNotes] = useState<string>("");
  const [previewPlatform, setPreviewPlatform] = useState<
    "windows_firewall" | "nftables" | "iptables" | "ufw" | "pf"
  >("windows_firewall");
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    if (relationship) {
      setPortsInput(relationship.ports.join(", "));
      setProtocol(relationship.protocol);
      setDirection(relationship.direction);
      setTriggeredPorts(relationship.triggeredPorts || "");
      setStateful(relationship.stateful);
      setLogging(relationship.logging);
      setIds(relationship.ids);
      setSchedule(relationship.schedule || "Always");
      setAiNotes(
        relationship.aiNotes ||
          `Permit ${relationship.protocol.toUpperCase()} traffic on ports [${relationship.ports.join(
            ", "
          )}] between ${sourceNode?.label || "Source"} and ${targetNode?.label || "Target"}.`
      );
    }
  }, [relationship, sourceNode, targetNode]);

  if (!isOpen || !relationship) return null;

  const handleSave = () => {
    const parsedPorts = portsInput
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const updated: CanvasRelationship = {
      ...relationship,
      ports: parsedPorts.length > 0 ? parsedPorts : ["443"],
      protocol,
      direction,
      triggeredPorts: triggeredPorts.trim() || undefined,
      stateful,
      logging,
      ids,
      schedule,
      aiNotes,
    };
    onSave(updated);
  };

  // Generate real-time translation preview
  const generateLiveCode = () => {
    const srcIp = sourceNode?.ip || "any";
    const dstIp = targetNode?.ip || "any";
    const portStr = portsInput || "443";
    const cleanPorts = portStr.split(",").map((p) => p.trim());
    const ruleName = `NRC_${sourceNode?.label.replace(/\s+/g, "_")}_to_${targetNode?.label.replace(
      /\s+/g,
      "_"
    )}_${cleanPorts.join("_")}`;

    switch (previewPlatform) {
      case "windows_firewall":
        if (direction === "bidirectional") {
          return `# Inbound & Outbound Bidirectional Trust
netsh advfirewall firewall add rule name="${ruleName}_IN" dir=in action=allow protocol=${protocol} localport=${cleanPorts.join(
            ","
          )} remoteip=${srcIp} enable=yes
netsh advfirewall firewall add rule name="${ruleName}_OUT" dir=out action=allow protocol=${protocol} remoteport=${cleanPorts.join(
            ","
          )} remoteip=${dstIp} enable=yes`;
        }
        return `# Generated Windows Defender Firewall Rule
netsh advfirewall firewall add rule name="${ruleName}" dir=in action=allow protocol=${protocol} localport=${cleanPorts.join(
          ","
        )} remoteip=${srcIp} enable=yes`;

      case "nftables":
        return `# Generated nftables rule
table inet filter {
  chain forward {
    ip saddr ${srcIp} ip daddr ${dstIp} ${protocol} dport { ${cleanPorts.join(
          ", "
        )} } ct state new,established accept
  }
}`;

      case "iptables":
        return `# Generated iptables rule
iptables -A FORWARD -s ${srcIp} -d ${dstIp} -p ${protocol} -m multiport --dports ${cleanPorts.join(
          ","
        )} -m state --state NEW,ESTABLISHED -j ACCEPT`;

      case "ufw":
        return `# Generated UFW command
ufw allow proto ${protocol} from ${srcIp} to ${dstIp} port ${cleanPorts.join(",")}`;

      case "pf":
        return `# Generated BSD/macOS pf rule
pass in quick proto ${protocol} from ${srcIp} to ${dstIp} port { ${cleanPorts.join(
          ", "
        )} } keep state`;
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-slate-900/98 backdrop-blur-xl border-l border-slate-800 shadow-2xl z-50 flex flex-col font-sans select-none overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Relationship Properties</h2>
            <p className="text-[11px] font-mono text-slate-400">Policy Edge Inspector</p>
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
        {/* Source & Destination Summary */}
        <div className="bg-slate-950/70 rounded-xl p-3 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">Source</span>
              <span className="text-xs font-semibold text-cyan-300 truncate block">
                {sourceNode?.label || "Unknown Source"}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {sourceNode?.ip || "any"}
              </span>
            </div>

            <div className="px-2 text-slate-500 shrink-0">
              {direction === "bidirectional" ? (
                <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
              ) : direction === "reverse" ? (
                <ArrowLeft className="w-4 h-4 text-cyan-400" />
              ) : (
                <ArrowRight className="w-4 h-4 text-cyan-400" />
              )}
            </div>

            <div className="min-w-0 flex-1 text-right">
              <span className="text-[10px] uppercase font-mono text-slate-500 block">Destination</span>
              <span className="text-xs font-semibold text-emerald-300 truncate block">
                {targetNode?.label || "Unknown Destination"}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {targetNode?.ip || "any"}
              </span>
            </div>
          </div>
        </div>

        {/* Direction Mode Buttons */}
        <div>
          <label className="text-[11px] font-medium text-slate-300 mb-1.5 block">Direction</label>
          <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setDirection("one_way")}
              className={`py-1.5 px-2 rounded text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                direction === "one_way"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>One-Way</span>
            </button>
            <button
              onClick={() => setDirection("bidirectional")}
              className={`py-1.5 px-2 rounded text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                direction === "bidirectional"
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Trust (⇄)</span>
            </button>
            <button
              onClick={() => setDirection("reverse")}
              className={`py-1.5 px-2 rounded text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                direction === "reverse"
                  ? "bg-purple-500 text-white font-bold shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Reverse (←)</span>
            </button>
          </div>
        </div>

        {/* Allowed Ports */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-medium text-slate-300">Allowed Ports</label>
            <span className="text-[10px] font-mono text-slate-500">Comma-separated</span>
          </div>
          <input
            type="text"
            value={portsInput}
            onChange={(e) => setPortsInput(e.target.value)}
            placeholder="443, 80"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
          />
          {/* Quick presets */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {["443", "80, 443", "22", "53", "3389", "5432"].map((preset) => (
              <button
                key={preset}
                onClick={() => setPortsInput(preset)}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-slate-300 border border-slate-700 transition-colors"
              >
                +{preset}
              </button>
            ))}
          </div>
        </div>

        {/* Protocol Selector */}
        <div>
          <label className="text-[11px] font-medium text-slate-300 mb-1.5 block">Protocol</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(["tcp", "udp", "icmp", "any"] as const).map((proto) => (
              <button
                key={proto}
                onClick={() => setProtocol(proto)}
                className={`py-1.5 rounded-lg border text-xs font-mono font-semibold uppercase transition-all ${
                  protocol === proto
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/60"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {proto}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic / Triggered Ports Bracket Notation: [1024-65535] */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-medium text-slate-300">
              Triggered / Dynamic Ports
            </label>
            <span className="text-[10px] font-mono text-amber-400">[Property Notation]</span>
          </div>
          <input
            type="text"
            value={triggeredPorts}
            onChange={(e) => setTriggeredPorts(e.target.value)}
            placeholder="1024-65535"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-500"
          />
          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
            Documents expected ephemeral or triggered transport negotiation. Informational property;
            does not automatically open wide port ranges.
          </p>
        </div>

        {/* Security Feature Toggles (Stateful, Logging, IDS) */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <label className="text-[11px] font-medium text-slate-300 block">
            Inspection & Security Controls
          </label>

          <div className="grid grid-cols-3 gap-2">
            <div
              onClick={() => setStateful(!stateful)}
              className={`cursor-pointer p-2 rounded-lg border flex flex-col items-center text-center transition-all ${
                stateful
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                  : "bg-slate-950 border-slate-800 text-slate-500"
              }`}
            >
              <span className="text-[10px] uppercase font-mono font-bold">Stateful</span>
              <span className="text-xs font-semibold mt-0.5">{stateful ? "Enabled" : "Off"}</span>
            </div>

            <div
              onClick={() => setLogging(!logging)}
              className={`cursor-pointer p-2 rounded-lg border flex flex-col items-center text-center transition-all ${
                logging
                  ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300"
                  : "bg-slate-950 border-slate-800 text-slate-500"
              }`}
            >
              <span className="text-[10px] uppercase font-mono font-bold">Logging</span>
              <span className="text-xs font-semibold mt-0.5">{logging ? "Enabled" : "Off"}</span>
            </div>

            <div
              onClick={() => setIds(!ids)}
              className={`cursor-pointer p-2 rounded-lg border flex flex-col items-center text-center transition-all ${
                ids
                  ? "bg-purple-500/15 border-purple-500/40 text-purple-300"
                  : "bg-slate-950 border-slate-800 text-slate-500"
              }`}
            >
              <span className="text-[10px] uppercase font-mono font-bold">IDS / IPS</span>
              <span className="text-xs font-semibold mt-0.5">{ids ? "Enabled" : "Off"}</span>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div>
          <label className="text-[11px] font-medium text-slate-300 mb-1.5 block">Schedule</label>
          <select
            value={schedule}
            onChange={(e) => setSchedule(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="Always">Always (24/7 Enforced)</option>
            <option value="Business Hours">Business Hours (08:00 - 18:00 M-F)</option>
            <option value="Maintenance Only">Maintenance Window (22:00 - 04:00)</option>
          </select>
        </div>

        {/* AI Notes */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <label className="text-[11px] font-medium text-slate-300">AI Intent Notes</label>
          </div>
          <textarea
            value={aiNotes}
            onChange={(e) => setAiNotes(e.target.value)}
            rows={2}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 resize-none font-sans"
          />
        </div>

        {/* Live Translation Engine Preview */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-semibold text-slate-200">
                Compiled Translation
              </span>
            </div>
            <select
              value={previewPlatform}
              onChange={(e) => setPreviewPlatform(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[10px] font-mono text-cyan-300 focus:outline-none"
            >
              <option value="windows_firewall">Windows Defender</option>
              <option value="nftables">nftables</option>
              <option value="iptables">iptables</option>
              <option value="ufw">ufw</option>
              <option value="pf">pf (macOS/BSD)</option>
            </select>
          </div>
          <pre className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[10px] text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-36">
            {generateLiveCode()}
          </pre>
        </div>
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-2">
        <button
          onClick={() => onDelete(relationship.id)}
          className="p-2.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
          title="Delete Relationship Edge"
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
            <span>Apply Intent</span>
          </button>
        </div>
      </div>
    </div>
  );
};

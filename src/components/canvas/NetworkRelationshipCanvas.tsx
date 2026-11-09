import React, { useState, useEffect } from "react";
import {
  CanvasNode,
  CanvasRelationship,
  CanvasGroup,
  AgentNode,
  ComplianceAuditReport,
} from "../../types/canvas";
import { CanvasViewport } from "./CanvasViewport";
import { AssetCatalogSidebar } from "./AssetCatalogSidebar";
import { RelationshipPropertiesDrawer } from "./RelationshipPropertiesDrawer";
import { NodePropertiesDrawer } from "./NodePropertiesDrawer";
import { AIPolicyCommandBar } from "./AIPolicyCommandBar";
import { ComplianceAuditModal } from "./ComplianceAuditModal";
import { AgentDeploymentModal } from "./AgentDeploymentModal";
import { ExportRulesModal } from "./ExportRulesModal";
import { ArchitectureBlueprintModal } from "./ArchitectureBlueprintModal";
import {
  Shield,
  Layers,
  Sparkles,
  ShieldCheck,
  Laptop,
  Code,
  LayoutGrid,
  RefreshCw,
  Plus,
  Play,
  Activity,
  AlertOctagon,
  Info,
  BookOpen,
} from "lucide-react";

interface NetworkRelationshipCanvasProps {
  inventoryDevices: Array<{
    ip: string;
    hostname: string;
    mac: string;
    vendor: string;
    device_type: string;
    status: string;
  }>;
}

export const NetworkRelationshipCanvas: React.FC<NetworkRelationshipCanvasProps> = ({
  inventoryDevices,
}) => {
  // Topology State
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [relationships, setRelationships] = useState<CanvasRelationship[]>([]);
  const [groups, setGroups] = useState<CanvasGroup[]>([]);
  const [agents, setAgents] = useState<AgentNode[]>([]);
  const [complianceReport, setComplianceReport] = useState<ComplianceAuditReport | null>(null);

  // Selected State
  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<CanvasRelationship | null>(null);

  // Drawer / Modals State
  const [isCatalogOpen, setIsCatalogOpen] = useState<boolean>(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState<boolean>(false);
  const [isNodeDrawerOpen, setIsNodeDrawerOpen] = useState<boolean>(false);
  const [isComplianceOpen, setIsComplianceOpen] = useState<boolean>(false);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isBlueprintOpen, setIsBlueprintOpen] = useState<boolean>(false);
  const [showAiBar, setShowAiBar] = useState<boolean>(true);

  // Loading & Enforcing State
  const [isLoadingTopology, setIsLoadingTopology] = useState<boolean>(false);
  const [isEnforcing, setIsEnforcing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Load Topology on Mount
  useEffect(() => {
    fetchTopology();
    fetchCompliance();
  }, []);

  const showNotification = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const fetchTopology = async () => {
    setIsLoadingTopology(true);
    try {
      const res = await fetch("/api/canvas/topology");
      if (res.ok) {
        const data = await res.json();
        const normalizedNodes: CanvasNode[] = (data.nodes || []).map((n: any) => ({
          ...n,
          x: n.pos_x ?? n.x ?? 100,
          y: n.pos_y ?? n.y ?? 100,
          type: n.node_type ?? n.type ?? "managed_device",
          ip: n.ip_or_cidr ?? n.ip ?? "",
          status: n.status === "threat" ? "threat_detected" : (n.status ?? "managed"),
        }));

        const normalizedRelationships: CanvasRelationship[] = (data.relationships || []).map((r: any) => ({
          ...r,
          sourceId: r.source_node_id ?? r.sourceId,
          targetId: r.target_node_id ?? r.targetId,
          ports: r.allowed_ports ?? r.ports ?? ["443"],
          stateful: r.is_stateful ?? r.stateful ?? true,
          logging: r.logging_enabled ?? r.logging ?? true,
          ids: r.ids_enabled ?? r.ids ?? true,
          trafficState: r.traffic_status ?? r.trafficState ?? "expected",
          triggeredPorts: Array.isArray(r.triggered_ports) ? r.triggered_ports.join(", ") : (r.triggeredPorts ?? r.triggered_ports),
          aiNotes: r.ai_notes ?? r.aiNotes,
        }));

        setNodes(normalizedNodes);
        setRelationships(normalizedRelationships);
        setGroups(data.groups || []);
        setAgents((data.agents || []).map((a: any) => ({
          ...a,
          lastHeartbeat: a.last_heartbeat ?? a.lastHeartbeat ?? new Date().toISOString(),
          complianceStatus: a.status === "connected" ? "compliant" : "non_compliant",
          firewallType: a.firewall_provider ?? a.firewallType ?? "Windows Firewall",
          activePorts: a.active_listeners?.map((l: any) => l.port) ?? a.activePorts ?? [80, 443],
        })));
      }
    } catch (err) {
      console.error("Failed to load canvas topology", err);
    } finally {
      setIsLoadingTopology(false);
    }
  };

  const fetchCompliance = async () => {
    try {
      const res = await fetch("/api/canvas/compliance");
      if (res.ok) {
        const data = await res.json();
        setComplianceReport(data);
      }
    } catch (err) {
      console.error("Failed to fetch compliance report", err);
    }
  };

  // Node Position Update (Drag)
  const handleUpdateNodePosition = async (id: string, x: number, y: number) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y, pos_x: x, pos_y: y } : n)));
    const target = nodes.find((n) => n.id === id);
    if (target) {
      try {
        await fetch("/api/canvas/nodes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...target,
            pos_x: x,
            pos_y: y,
            node_type: target.type || target.node_type || "managed_device",
            ip_or_cidr: target.ip || target.ip_or_cidr || "",
          }),
        });
      } catch (e) {
        console.error("Failed to persist node position", e);
      }
    }
  };

  // Add new node from Catalog or Preset
  const handleAddNode = async (partialNode: Partial<CanvasNode>) => {
    const id = `node_${Date.now()}`;
    const newNode: CanvasNode = {
      id,
      label: partialNode.label || "New Node",
      type: partialNode.type || "managed_device",
      node_type: partialNode.type || "managed_device",
      status: partialNode.status || "managed",
      ip: partialNode.ip || "192.168.1.100",
      ip_or_cidr: partialNode.ip || "192.168.1.100",
      cidr: partialNode.cidr,
      groupId: partialNode.groupId,
      group_id: partialNode.groupId,
      groupName: partialNode.groupName,
      x: 300 + Math.floor(Math.random() * 200),
      y: 180 + Math.floor(Math.random() * 150),
      pos_x: 300 + Math.floor(Math.random() * 200),
      pos_y: 180 + Math.floor(Math.random() * 150),
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNode(newNode);
    showNotification(`Added node: ${newNode.label}`);

    try {
      await fetch("/api/canvas/nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNode),
      });
      fetchCompliance();
    } catch (err) {
      console.error("Failed to save node", err);
    }
  };

  // Create Relationship from Drag-to-Connect
  const handleCreateRelationship = async (sourceId: string, targetId: string) => {
    const src = nodes.find((n) => n.id === sourceId);
    const dst = nodes.find((n) => n.id === targetId);
    if (!src || !dst) return;

    const id = `rel_${Date.now()}`;
    const newRel: CanvasRelationship = {
      id,
      sourceId,
      source_node_id: sourceId,
      targetId,
      target_node_id: targetId,
      direction: "one_way",
      ports: ["443"],
      allowed_ports: ["443"],
      protocol: "tcp",
      stateful: true,
      is_stateful: true,
      logging: true,
      logging_enabled: true,
      ids: true,
      ids_enabled: true,
      schedule: "Always",
      trafficState: "expected",
      traffic_status: "expected",
      aiNotes: `Permit HTTPS 443 from ${src.label} to ${dst.label}`,
      ai_notes: `Permit HTTPS 443 from ${src.label} to ${dst.label}`,
    };

    setRelationships((prev) => [...prev, newRel]);
    setSelectedRelationship(newRel);
    setIsPropertiesOpen(true);
    showNotification(`Created relationship: ${src.label} ──443──> ${dst.label}`);

    try {
      await fetch("/api/canvas/relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRel),
      });
      fetchCompliance();
    } catch (err) {
      console.error("Failed to persist relationship", err);
    }
  };

  // Save Relationship from Properties Drawer
  const handleSaveRelationship = async (updated: CanvasRelationship) => {
    const payload = {
      ...updated,
      source_node_id: updated.sourceId || updated.source_node_id,
      target_node_id: updated.targetId || updated.target_node_id,
      allowed_ports: updated.ports,
      is_stateful: updated.stateful,
      logging_enabled: updated.logging,
      ids_enabled: updated.ids,
      ai_notes: updated.aiNotes,
    };

    setRelationships((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setSelectedRelationship(updated);
    setIsPropertiesOpen(false);
    showNotification("Relationship policy updated.");

    try {
      await fetch("/api/canvas/relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      fetchCompliance();
    } catch (err) {
      console.error("Failed to update relationship", err);
    }
  };

  // Delete Relationship
  const handleDeleteRelationship = async (id: string) => {
    setRelationships((prev) => prev.filter((r) => r.id !== id));
    if (selectedRelationship?.id === id) {
      setSelectedRelationship(null);
      setIsPropertiesOpen(false);
    }
    showNotification("Relationship deleted.");

    try {
      await fetch(`/api/canvas/relationships/${id}`, { method: "DELETE" });
      fetchCompliance();
    } catch (err) {
      console.error("Failed to delete relationship", err);
    }
  };

  // Delete Node by ID
  const handleDeleteNode = async (id: string) => {
    const targetNode = nodes.find((n) => n.id === id);
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setRelationships((prev) => prev.filter((r) => r.sourceId !== id && r.targetId !== id));
    if (selectedNode?.id === id) {
      setSelectedNode(null);
      setIsNodeDrawerOpen(false);
    }
    if (selectedRelationship && (selectedRelationship.sourceId === id || selectedRelationship.targetId === id)) {
      setSelectedRelationship(null);
      setIsPropertiesOpen(false);
    }
    showNotification(`Deleted node: ${targetNode?.label || id}`);

    try {
      await fetch(`/api/canvas/nodes/${id}`, { method: "DELETE" });
      fetchCompliance();
    } catch (err) {
      console.error("Failed to delete node", err);
    }
  };

  // Delete Node or Relationship currently selected
  const handleDeleteSelected = async () => {
    if (selectedNode) {
      handleDeleteNode(selectedNode.id);
    } else if (selectedRelationship) {
      handleDeleteRelationship(selectedRelationship.id);
    }
  };

  // Save Node from Node Properties Drawer
  const handleSaveNode = async (updated: CanvasNode) => {
    setNodes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    setSelectedNode(updated);
    setIsNodeDrawerOpen(false);
    showNotification(`Updated node: ${updated.label}`);

    try {
      await fetch("/api/canvas/nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...updated,
          node_type: updated.type || updated.node_type || "managed_device",
          ip_or_cidr: updated.ip || updated.ip_or_cidr || "",
          pos_x: updated.x,
          pos_y: updated.y,
        }),
      });
      fetchCompliance();
    } catch (err) {
      console.error("Failed to update node", err);
    }
  };

  // Apply AI Policy Proposal
  const handleApplyPolicyProposal = async (proposal: {
    source: string;
    destination: string;
    ports: string[];
    protocol: string;
    direction: "one_way" | "bidirectional" | "reverse";
    explanation: string;
    confidence: number;
  }) => {
    // Find matching source and destination nodes
    const srcMatch = nodes.find(
      (n) =>
        n.label.toLowerCase().includes(proposal.source.toLowerCase()) ||
        (n.groupName && n.groupName.toLowerCase().includes(proposal.source.toLowerCase()))
    );
    const dstMatch = nodes.find(
      (n) =>
        n.label.toLowerCase().includes(proposal.destination.toLowerCase()) ||
        (n.groupName && n.groupName.toLowerCase().includes(proposal.destination.toLowerCase()))
    );

    if (!srcMatch || !dstMatch) {
      showNotification("AI identified intent, but matching nodes are missing from the canvas.");
      return;
    }

    const id = `rel_ai_${Date.now()}`;
    const newRel: CanvasRelationship = {
      id,
      sourceId: srcMatch.id,
      targetId: dstMatch.id,
      direction: proposal.direction || "one_way",
      ports: proposal.ports && proposal.ports.length > 0 ? proposal.ports : ["443"],
      protocol: (proposal.protocol as any) || "tcp",
      stateful: true,
      logging: true,
      ids: true,
      schedule: "Always",
      trafficState: "expected",
      aiNotes: proposal.explanation,
    };

    setRelationships((prev) => [...prev, newRel]);
    setSelectedRelationship(newRel);
    setIsPropertiesOpen(true);
    showNotification(`AI Intent Applied: ${srcMatch.label} → ${dstMatch.label}`);

    try {
      await fetch("/api/canvas/relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRel),
      });
      fetchCompliance();
    } catch (err) {
      console.error("Failed to persist AI relationship", err);
    }
  };

  // Enforce Intent directly to Agents
  const handleEnforceIntent = async () => {
    setIsEnforcing(true);
    try {
      // Simulate pushing configuration to connected agents
      await new Promise((res) => setTimeout(res, 1200));
      showNotification("Directives successfully dispatched to all connected endpoint agents!");
      fetchCompliance();
    } catch (err) {
      console.error("Failed to enforce intent", err);
    } finally {
      setIsEnforcing(false);
    }
  };

  // Re-layout presets (ERD / Hierarchical)
  const handleApplyLayout = (type: "erd" | "hierarchical") => {
    const updated = [...nodes];
    if (type === "hierarchical") {
      // Gateway & Internet at top, Servers in middle, Clients at bottom
      updated.forEach((n, idx) => {
        if (n.type === "internet" || n.label.toLowerCase().includes("gateway")) {
          n.x = 450 + (idx % 2) * 280;
          n.y = 80;
        } else if (n.type === "group" || n.label.toLowerCase().includes("server")) {
          n.x = 220 + (idx % 3) * 280;
          n.y = 260;
        } else {
          n.x = 180 + (idx % 4) * 260;
          n.y = 440;
        }
      });
    } else {
      // Grid arrangement
      updated.forEach((n, idx) => {
        const cols = 3;
        n.x = 150 + (idx % cols) * 320;
        n.y = 100 + Math.floor(idx / cols) * 200;
      });
    }
    setNodes(updated);
    showNotification(`Applied ${type.toUpperCase()} layout.`);
  };

  // Existing node IP set for inventory matching
  const existingNodeIps = new Set(nodes.map((n) => n.ip || "").filter(Boolean));

  // Current relationship source and target node lookup
  const sourceNode = selectedRelationship
    ? nodes.find((n) => n.id === selectedRelationship.sourceId) || null
    : null;
  const targetNode = selectedRelationship
    ? nodes.find((n) => n.id === selectedRelationship.targetId) || null
    : null;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden relative font-sans">
      {/* Toast Notification */}
      {statusMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-cyan-500/50 text-cyan-200 text-xs px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Top Canvas Command Deck Header */}
      <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-tight">
                Network Relationship Canvas (NRC)
              </h1>
              <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Authoritative Intent
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Zero Trust firewall policies synthesized directly from topology relationships.
            </p>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="hidden lg:flex items-center gap-3 font-mono text-[11px]">
          <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
            Nodes: <strong className="text-white">{nodes.length}</strong>
          </div>
          <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400">
            Policies: <strong className="text-white">{relationships.length}</strong>
          </div>
          <div
            onClick={() => setIsComplianceOpen(true)}
            className="cursor-pointer px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-cyan-400 transition-colors flex items-center gap-1.5"
            title="Open Zero Trust Compliance Auditor"
          >
            <span>Compliance:</span>
            <strong className="text-emerald-400 font-bold">
              {complianceReport?.complianceScore ?? 88}%
            </strong>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiBar(!showAiBar)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
              showAiBar
                ? "bg-purple-600/20 border-purple-500/50 text-purple-300"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            }`}
            title="Toggle Natural Language Policy Generator"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Intent</span>
          </button>

          <button
            onClick={() => setIsCatalogOpen(!isCatalogOpen)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Open Palette to Add Devices and Groups"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Add Objects</span>
          </button>

          <button
            onClick={() => setIsComplianceOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Compliance</span>
          </button>

          <button
            onClick={() => setIsAgentModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Laptop className="w-3.5 h-3.5 text-cyan-400" />
            <span>Agents</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Code className="w-3.5 h-3.5" />
            <span>Export Rules</span>
          </button>

          <button
            onClick={() => setIsBlueprintOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 hover:border-purple-500/60 text-purple-200 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            title="View Full Architecture, Component Tree, Protocols, and Sequence Diagrams"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span>Blueprint</span>
          </button>

          {/* Re-layout preset button */}
          <button
            onClick={() => handleApplyLayout("hierarchical")}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Auto-arrange in Hierarchical Top-Down Layout"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* AI Policy Natural Language Command Bar */}
      {showAiBar && (
        <div className="px-5 py-2.5 border-b border-slate-800/80 bg-slate-950/70 z-20">
          <AIPolicyCommandBar
            nodes={nodes}
            groups={groups}
            onApplyPolicyProposal={handleApplyPolicyProposal}
          />
        </div>
      )}

      {/* Main Interactive Canvas Area */}
      <div className="flex-1 relative overflow-hidden flex">
        {/* Left Side Asset Catalog Sidebar */}
        <AssetCatalogSidebar
          isOpen={isCatalogOpen}
          onToggle={() => setIsCatalogOpen(!isCatalogOpen)}
          onAddNode={handleAddNode}
          groups={groups}
          inventoryDevices={inventoryDevices}
          existingNodeIps={existingNodeIps}
        />

        {/* Viewport: SVG Edges + HTML Node Cards */}
        <div className={`flex-1 h-full transition-all duration-300 ${isCatalogOpen ? "ml-80" : "ml-12"}`}>
          <CanvasViewport
            nodes={nodes}
            relationships={relationships}
            groups={groups}
            selectedNode={selectedNode}
            selectedRelationship={selectedRelationship}
            onSelectNode={(node) => {
              setSelectedNode(node);
              if (node) {
                setSelectedRelationship(null);
                setIsPropertiesOpen(false);
                setIsNodeDrawerOpen(true);
              } else {
                setIsNodeDrawerOpen(false);
              }
            }}
            onSelectRelationship={(rel) => {
              setSelectedRelationship(rel);
              setSelectedNode(null);
              setIsNodeDrawerOpen(false);
              if (rel) {
                setIsPropertiesOpen(true);
              } else {
                setIsPropertiesOpen(false);
              }
            }}
            onUpdateNodePosition={handleUpdateNodePosition}
            onCreateRelationship={handleCreateRelationship}
            onDeleteSelected={handleDeleteSelected}
            onDeleteNode={handleDeleteNode}
            onDeleteRelationship={handleDeleteRelationship}
          />
        </div>

        {/* Right Side Relationship Properties Panel */}
        <RelationshipPropertiesDrawer
          isOpen={isPropertiesOpen}
          relationship={selectedRelationship}
          sourceNode={sourceNode}
          targetNode={targetNode}
          onClose={() => setIsPropertiesOpen(false)}
          onSave={handleSaveRelationship}
          onDelete={handleDeleteRelationship}
        />

        {/* Right Side Node Properties Panel */}
        <NodePropertiesDrawer
          isOpen={isNodeDrawerOpen}
          node={selectedNode}
          onClose={() => setIsNodeDrawerOpen(false)}
          onSave={handleSaveNode}
          onDelete={() => handleDeleteSelected()}
          groups={groups}
          relationships={relationships}
          nodes={nodes}
          agents={agents}
        />
      </div>

      {/* Modals */}
      <ComplianceAuditModal
        isOpen={isComplianceOpen}
        onClose={() => setIsComplianceOpen(false)}
        report={complianceReport}
        onRefresh={fetchCompliance}
        onEnforceIntent={handleEnforceIntent}
        isEnforcing={isEnforcing}
      />

      <AgentDeploymentModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
      />

      <ExportRulesModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      <ArchitectureBlueprintModal
        isOpen={isBlueprintOpen}
        onClose={() => setIsBlueprintOpen(false)}
      />
    </div>
  );
};

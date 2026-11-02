import React, { useState } from "react";
import {
  X,
  Layers,
  Database,
  Server,
  Code,
  Cpu,
  Shield,
  Activity,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  GitBranch,
  Radio,
  Sparkles,
} from "lucide-react";

interface ArchitectureBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureBlueprintModal: React.FC<ArchitectureBlueprintModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "schema"
    | "react_tree"
    | "canvas_engine"
    | "agent_arch"
    | "translation"
    | "api_specs"
    | "websocket"
    | "ai_design"
    | "sequence_diagrams"
    | "roadmap"
  >("overview");

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyCode = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const navItems = [
    { id: "overview", label: "Full Architecture", icon: Layers },
    { id: "schema", label: "Database Schema (ERD)", icon: Database },
    { id: "react_tree", label: "React Component Hierarchy", icon: Code },
    { id: "canvas_engine", label: "Canvas Rendering System", icon: Radio },
    { id: "agent_arch", label: "Agent Architecture", icon: Cpu },
    { id: "translation", label: "Firewall Provider Architecture", icon: Shield },
    { id: "api_specs", label: "REST API Specifications", icon: Server },
    { id: "websocket", label: "WebSocket Protocol", icon: Activity },
    { id: "ai_design", label: "AI Integration Design", icon: Sparkles },
    { id: "sequence_diagrams", label: "Sequence Diagrams", icon: GitBranch },
    { id: "roadmap", label: "Implementation Roadmap", icon: Terminal },
  ] as const;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Network Relationship Canvas (NRC) Engineering Blueprint
                </h2>
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Architectural Specification
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400">
                Authoritative Zero Trust Intent Engine • Complete Subsystem Deliverables
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Sidebar Nav + Tab Pane */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sub-nav Sidebar */}
          <aside className="w-64 border-r border-slate-800 bg-slate-950/40 p-3 space-y-1 overflow-y-auto shrink-0 text-xs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                    isActive
                      ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-cyan-400" : "text-slate-500"}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
            {/* 1. OVERVIEW & FULL ARCHITECTURE */}
            {activeTab === "overview" && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-white">1. High-Level Subsystem Architecture</h3>
                  <p className="text-slate-400 mt-1 leading-relaxed">
                    The Network Relationship Canvas (NRC) reimagines firewall and network security
                    management by exposing <strong>Network Intent</strong> instead of low-level ACLs,
                    NAT tables, and objects. The visual diagram is the authoritative source of truth.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] leading-relaxed text-cyan-300 overflow-x-auto">
{`+-----------------------------------------------------------------------------------------+
|                               NETSENTINEL CONTROL PLANE                                 |
|                                                                                         |
|   +------------------------------------+       +------------------------------------+   |
|   |  Network Relationship Canvas (NRC)  |       |   AI Policy Assistant (Intent NLP) |   |
|   |  - Visual Directed Topology Graph  | <---> |   - Semantic intent extraction     |   |
|   |  - Zero Trust Default-Deny Model   |       |   - Port & service entity mapping  |   |
|   +-----------------+------------------+       +-----------------+------------------+   |
|                     |                                            |                      |
|                     v                                            v                      |
|   +------------------------------------+       +------------------------------------+   |
|   | SQLite Authoritative Graph Storage |       | Firewall Translation Layer (AST)   |   |
|   | - canvas_nodes & canvas_groups     | ----> | - Windows Defender Firewall (netsh)|   |
|   | - canvas_relationships (1st Class) |       | - Linux nftables & iptables        |   |
|   | - agent_nodes & telemetry          |       | - Ubuntu ufw / BSD macOS pf        |   |
|   +-----------------+------------------+       +-----------------+------------------+   |
+---------------------|--------------------------------------------|----------------------+
                      |                                            |
           Outbound HTTPS / WebSocket                   Compiled Policy Directives
                      |                                            |
                      +----------------------+---------------------+
                                             |
                                             v
+-----------------------------------------------------------------------------------------+
|                            MANAGED ENDPOINT FLEET (Outbound Only)                       |
|                                                                                         |
|   +----------------------------+   +----------------------------+   +---------------+   |
|   | Windows 11 Enterprise      |   | Linux Workstation / Server |   | macOS Laptop  |   |
|   | - netsentinel-agent.py     |   | - netsentinel-agent.py     |   | - Agent py    |   |
|   | - netsh advfirewall driver |   | - nftables / iptables      |   | - pf driver   |   |
|   | - Active socket telemetry  |   | - ss / lsof listener scan  |   | - Local rules |   |
|   +----------------------------+   +----------------------------+   +---------------+   |
+-----------------------------------------------------------------------------------------+`}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-white text-xs block">1. Server Core</span>
                    <p className="text-[11px] text-slate-400">
                      Stores canvas topology, enforces RBAC, tracks endpoint inventory, and hosts the
                      AI intent synthesis engine and multi-platform compilation pipeline.
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-emerald-400 text-xs block">2. Managed Agent</span>
                    <p className="text-[11px] text-slate-400">
                      Lightweight Python daemon communicating outbound-only over HTTPS/WS. Operates
                      behind NAT, inventories local sockets, and applies local firewall rules.
                    </p>
                  </div>
                  <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-cyan-400 text-xs block">3. Translation Layer</span>
                    <p className="text-[11px] text-slate-400">
                      Unified `IFirewallProvider` interface compiling visual edges into syntactically
                      correct firewall rules for Windows Defender, nftables, iptables, ufw, and pf.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. DATABASE SCHEMA */}
            {activeTab === "schema" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">2. SQLite Database Schema & Entity Relationships</h3>
                    <p className="text-slate-400 mt-0.5">Relationships are stored as first-class queryable entities.</p>
                  </div>
                  <button
                    onClick={() =>
                      copyCode(
                        `CREATE TABLE canvas_nodes (
    id TEXT PRIMARY KEY,
    device_mac TEXT,
    node_type TEXT NOT NULL,
    label TEXT NOT NULL,
    ip_or_cidr TEXT NOT NULL,
    pos_x REAL NOT NULL DEFAULT 100.0,
    pos_y REAL NOT NULL DEFAULT 100.0,
    status TEXT NOT NULL DEFAULT 'managed',
    group_id TEXT DEFAULT '',
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE canvas_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#06b6d4',
    description TEXT DEFAULT '',
    created_at TEXT NOT NULL
);

CREATE TABLE canvas_relationships (
    id TEXT PRIMARY KEY,
    source_node_id TEXT NOT NULL,
    target_node_id TEXT NOT NULL,
    direction TEXT NOT NULL DEFAULT 'one_way',
    protocol TEXT NOT NULL DEFAULT 'tcp',
    allowed_ports TEXT NOT NULL DEFAULT '["443"]',
    triggered_ports TEXT NOT NULL DEFAULT '[]',
    is_stateful INTEGER NOT NULL DEFAULT 1,
    logging_enabled INTEGER NOT NULL DEFAULT 1,
    ids_enabled INTEGER NOT NULL DEFAULT 0,
    schedule TEXT DEFAULT 'always',
    ai_notes TEXT DEFAULT '',
    traffic_status TEXT DEFAULT 'expected',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(source_node_id) REFERENCES canvas_nodes(id) ON DELETE CASCADE,
    FOREIGN KEY(target_node_id) REFERENCES canvas_nodes(id) ON DELETE CASCADE
);

CREATE TABLE agent_nodes (
    agent_id TEXT PRIMARY KEY,
    device_mac TEXT,
    hostname TEXT NOT NULL,
    os_type TEXT NOT NULL,
    os_version TEXT DEFAULT '',
    firewall_provider TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'connected',
    last_heartbeat TEXT NOT NULL,
    compliance_score REAL DEFAULT 100.0,
    active_listeners TEXT NOT NULL DEFAULT '[]',
    applied_rule_count INTEGER DEFAULT 0,
    discrepancy_count INTEGER DEFAULT 0
);`,
                        "schema_sql"
                      )
                    }
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono flex items-center gap-1 transition-colors"
                  >
                    {copiedKey === "schema_sql" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === "schema_sql" ? "Copied SQL" : "Copy SQL"}</span>
                  </button>
                </div>

                <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto whitespace-pre-wrap leading-relaxed">
{`-- 1. Canvas Nodes Table
CREATE TABLE canvas_nodes (
    id TEXT PRIMARY KEY,               -- e.g. 'node_ws_win11', 'node_srv_db'
    device_mac TEXT,                   -- Linked hardware MAC from discovery
    node_type TEXT NOT NULL,           -- 'managed_device' | 'unmanaged_device' | 'group' | 'network' | 'internet'
    label TEXT NOT NULL,               -- Display label (e.g. 'WS-DEV-WIN11')
    ip_or_cidr TEXT NOT NULL,          -- IPv4/v6 or CIDR boundary
    pos_x REAL NOT NULL DEFAULT 100.0, -- Viewport horizontal coordinate
    pos_y REAL NOT NULL DEFAULT 100.0, -- Viewport vertical coordinate
    status TEXT NOT NULL,              -- 'managed' 🟢 | 'unmanaged' 🔴 | 'warning' 🟡 | 'offline' ⚪ | 'threat' 🚨
    group_id TEXT DEFAULT '',          -- Foreign key to canvas_groups.id
    metadata TEXT NOT NULL DEFAULT '{}'
);

-- 2. Canvas Groups Table
CREATE TABLE canvas_groups (
    id TEXT PRIMARY KEY,               -- e.g. 'grp_workstations', 'grp_app_tier'
    name TEXT NOT NULL,                -- Group title (e.g. 'Workstations & Endpoints')
    color TEXT NOT NULL DEFAULT '#06b6d4',
    description TEXT DEFAULT ''
);

-- 3. Authoritative Relationships Table (First-Class Entities)
CREATE TABLE canvas_relationships (
    id TEXT PRIMARY KEY,               -- e.g. 'rel_ws_web_https'
    source_node_id TEXT NOT NULL,      -- Origin node or group ID
    target_node_id TEXT NOT NULL,      -- Destination node or group ID
    direction TEXT NOT NULL,           -- 'one_way' (->) | 'bidirectional' (<===>) | 'reverse' (<-)
    protocol TEXT NOT NULL,            -- 'tcp' | 'udp' | 'icmp' | 'any'
    allowed_ports TEXT NOT NULL,       -- JSON array: '["80", "443"]'
    triggered_ports TEXT NOT NULL,     -- Dynamic notation: '["1024-65535"]'
    is_stateful INTEGER DEFAULT 1,     -- 1: State tracking enabled
    logging_enabled INTEGER DEFAULT 1, -- 1: Audit logging enabled
    ids_enabled INTEGER DEFAULT 0,     -- 1: IDS packet inspection
    schedule TEXT DEFAULT 'always',    -- 'Always' | 'Business Hours' | 'Maintenance'
    ai_notes TEXT DEFAULT '',          -- Generated natural-language explanation
    traffic_status TEXT DEFAULT 'expected' -- 'expected' | 'high' | 'new' | 'threat' | 'inactive'
);`}
                </pre>
              </div>
            )}

            {/* 3. REACT COMPONENT HIERARCHY */}
            {activeTab === "react_tree" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white">3. React Component Hierarchy & State Flow</h3>
                <p className="text-slate-400">
                  Clean modular breakdown with unidirectional data flow and background synchronization:
                </p>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-cyan-300 leading-relaxed overflow-x-auto">
{`<App />
 └── <NetworkRelationshipCanvas />
      │   [State: nodes, relationships, groups, agents, complianceReport]
      │
      ├── <TopControlDeck />               (Quick stats, layout switchers, action modals)
      │
      ├── <AIPolicyCommandBar />           (Natural language prompt -> /api/canvas/ai-policy)
      │
      ├── <AssetCatalogSidebar />          (Palette of objects, unplaced devices, & groups)
      │
      ├── <CanvasViewport />               (Infinite pan/zoom SVG + DOM transform container)
      │    ├── <svg.enclosures>            (Group boundaries & policy color zones)
      │    ├── <CanvasRelationshipEdge />  (SVG connector lines, markers, [triggered] badges, traffic particles)
      │    └── <CanvasNodeCard />          (DOM cards with 🟢🔴🟡⚪🚨 badges, drag anchors, ports)
      │
      ├── <RelationshipPropertiesDrawer /> (Properties inspector, port toggles, live code preview)
      ├── <ComplianceAuditModal />         (Expected vs Actual policy diff & violation list)
      ├── <AgentDeploymentModal />         (One-line installers for Windows 11, Linux, macOS)
      └── <ExportRulesModal />             (Native firewall script generators: .bat, .sh, .conf)`}
                </div>
              </div>
            )}

            {/* 4. CANVAS RENDERING SYSTEM */}
            {activeTab === "canvas_engine" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white">4. Canvas Rendering & Edge Mathematics</h3>
                <p className="text-slate-400 leading-relaxed">
                  The canvas uses a hybrid SVG/HTML5 DOM rendering pipeline. HTML DOM cards handle
                  rich interactions, click events, and drag-and-drop, while SVG vectors draw
                  interpolated connector lines, bidirectional trust double-strokes, and particle
                  flow animations.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span className="font-bold text-white text-xs block">Edge Anchor Math</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                      dx = Target.x - Source.x; dy = Target.y - Source.y;<br />
                      dist = sqrt(dx^2 + dy^2);<br />
                      ux = dx / dist; uy = dy / dist;<br />
                      startX = Source.x + ux * (cardWidth / 2);<br />
                      endX = Target.x - ux * (cardWidth / 2);
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Calculates exact border intersections so edge lines terminate crisply on node
                      card boundaries without overlapping cards.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span className="font-bold text-white text-xs block">Traffic Particle Kinetics</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                      &lt;animateMotion path="M sx sy L ex ey" dur="1.2s" /&gt;
                    </p>
                    <p className="text-[11px] text-slate-400">
                      SVG SMIL particle animation runs directly on the GPU, avoiding React re-render
                      cycles and guaranteeing 60 FPS performance even with 50+ concurrent active edges.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 5. AGENT ARCHITECTURE */}
            {activeTab === "agent_arch" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white">5. NetSentinel Agent Architecture (`netsentinel-agent.py`)</h3>
                <p className="text-slate-400">
                  Zero-dependency Python daemon designed to run behind asymmetric NAT and firewalls.
                </p>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 leading-relaxed overflow-x-auto">
{`class NetSentinelAgent:
    def __init__(self, server_url, secret_token):
        self.server_url = server_url
        self.os_type = platform.system().lower() # 'windows', 'linux', 'darwin'
        self.firewall = self._detect_firewall_provider()
    
    def collect_telemetry(self):
        # 1. Query local socket listeners without root (ss / netstat / lsof)
        listeners = self._enumerate_listening_ports()
        
        # 2. Query active firewall status
        fw_status = self.firewall.get_status()
        
        return {
            "hostname": socket.gethostname(),
            "os_type": self.os_type,
            "active_listeners": listeners,
            "firewall_active": fw_status["enabled"],
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def poll_and_enforce(self):
        # Outbound-only POST request
        response = http.post(f"{self.server_url}/api/agent/telemetry", json=self.collect_telemetry())
        
        # Apply received firewall directives
        if response.directives:
            for rule in response.directives:
                self.firewall.apply_rule(rule)
`}
                </div>
              </div>
            )}

            {/* 6. TRANSLATION LAYER */}
            {activeTab === "translation" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white">6. Multi-Platform Firewall Translation Layer (`IFirewallProvider`)</h3>
                <p className="text-slate-400">
                  Translates visual edges into native rule definitions across 5 distinct firewall drivers.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-cyan-400 font-bold block mb-1">Windows Defender Firewall</span>
                    <code>netsh advfirewall firewall add rule name="NRC-..." dir=in action=allow protocol=TCP localport=443 remoteip=192.168.1.50</code>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-emerald-400 font-bold block mb-1">Linux nftables</span>
                    <code>nft add rule inet nrc_filter input ip saddr 192.168.1.50 tcp dport 443 ct state new,established accept</code>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-purple-400 font-bold block mb-1">Ubuntu UFW</span>
                    <code>ufw allow from 192.168.1.50 to any port 443 proto tcp</code>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-amber-400 font-bold block mb-1">BSD / macOS pf (Packet Filter)</span>
                    <code>pass in quick proto tcp from 192.168.1.50 to 192.168.1.100 port 443 flags S/SA keep state</code>
                  </div>
                </div>
              </div>
            )}

            {/* 7. REST API SPECIFICATIONS */}
            {activeTab === "api_specs" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white">7. Complete REST API Specifications</h3>
                <div className="space-y-2 font-mono text-[11px]">
                  {[
                    { method: "GET", path: "/api/canvas/topology", desc: "Retrieves complete canvas state (nodes, groups, relationships, agents, stats)" },
                    { method: "POST", path: "/api/canvas/nodes", desc: "Creates or updates a canvas node (position, type, IP, status, group)" },
                    { method: "DELETE", path: "/api/canvas/nodes/:id", desc: "Deletes a canvas node and cascades deletion of connecting relationships" },
                    { method: "POST", path: "/api/canvas/groups", desc: "Creates or updates a logical group container" },
                    { method: "DELETE", path: "/api/canvas/groups/:id", desc: "Deletes a group container and unassigns member nodes" },
                    { method: "POST", path: "/api/canvas/relationships", desc: "Creates or updates an authoritative policy edge" },
                    { method: "DELETE", path: "/api/canvas/relationships/:id", desc: "Removes a relationship, instantly reverting that path to Default Deny" },
                    { method: "POST", path: "/api/canvas/compile", desc: "Compiles active canvas graph into native script for target provider" },
                    { method: "POST", path: "/api/canvas/ai-policy", desc: "Translates natural language intent strings into relationship proposals" },
                    { method: "GET", path: "/api/canvas/compliance", desc: "Runs compliance audit comparing canvas intent against active agent listeners" },
                    { method: "POST", path: "/api/agent/telemetry", desc: "Outbound agent heartbeat receiving socket lists and returning firewall rules" },
                    { method: "GET", path: "/api/agent/script", desc: "Serves standalone Python agent daemon script for endpoint installation" },
                  ].map((ep, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${ep.method === "GET" ? "bg-cyan-500/20 text-cyan-400" : ep.method === "POST" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                          {ep.method}
                        </span>
                        <span className="text-white font-bold">{ep.path}</span>
                      </div>
                      <span className="text-slate-400 text-[10px] text-right truncate">{ep.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 8. WEBSOCKET PROTOCOL */}
            {activeTab === "websocket" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white">8. Real-Time WebSocket Frame Protocol</h3>
                <p className="text-slate-400">
                  Enables instantaneous bi-directional event distribution between the control plane,
                  canvases, and agent fleets:
                </p>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-purple-300 leading-relaxed overflow-x-auto">
{`// 1. Client -> Server: Subscribe to Canvas Events
{
  "type": "SUBSCRIBE_CANVAS",
  "canvasId": "default_canvas",
  "clientToken": "sess_91823901"
}

// 2. Server -> Client: Real-Time Traffic Telemetry Pulse
{
  "type": "TRAFFIC_PULSE",
  "relationshipId": "rel_ws_web_https",
  "metrics": {
    "bytesPerSecond": 491029,
    "activeConnections": 12,
    "trafficStatus": "high" // triggers yellow particle acceleration
  }
}

// 3. Agent -> Server: Intrusion or Violation Detected
{
  "type": "VIOLATION_ALERT",
  "agentId": "agent-win11-01",
  "violation": {
    "type": "unauthorized_listener",
    "port": 4444,
    "process": "nc.exe",
    "severity": "critical"
  }
}`}
                </div>
              </div>
            )}

            {/* 9. AI INTEGRATION DESIGN */}
            {activeTab === "ai_design" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white">9. AI Natural Language Policy Synthesis Design</h3>
                <p className="text-slate-400 leading-relaxed">
                  The AI Policy Assistant bridges human business requirements and mathematical
                  graph theory. It analyzes natural-language prompts against the live topology
                  inventory using semantic entity grounding:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span className="font-bold text-purple-400 font-mono text-[11px]">Prompt: "Allow workstations to access web servers on HTTPS only."</span>
                    <ul className="text-[11px] text-slate-300 space-y-1 list-disc pl-4 font-mono">
                      <li>Source intent: 'workstations' → resolves to group `grp_workstations`</li>
                      <li>Target intent: 'web servers' → resolves to `node_srv_web`</li>
                      <li>Protocol: TCP</li>
                      <li>Ports: ["443"] (strict HTTPS)</li>
                      <li>Direction: One-Way (WS → SRV)</li>
                      <li>Confidence Score: 0.94</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span className="font-bold text-purple-400 font-mono text-[11px]">Prompt: "Developers need SSH access to all Linux servers."</span>
                    <ul className="text-[11px] text-slate-300 space-y-1 list-disc pl-4 font-mono">
                      <li>Source intent: 'Developers' → `node_ws_linux`</li>
                      <li>Target intent: 'Linux servers' → `grp_app_tier` / `grp_db_tier`</li>
                      <li>Protocol: TCP</li>
                      <li>Ports: ["22"] (SSH)</li>
                      <li>Direction: One-Way</li>
                      <li>Confidence Score: 0.96</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 10. SEQUENCE DIAGRAMS */}
            {activeTab === "sequence_diagrams" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white">10. End-to-End Policy Lifecycle Sequence Diagram</h3>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-cyan-300 leading-relaxed overflow-x-auto">
{`Administrator           Canvas UI           NRC Backend         Agent Daemon        Local Firewall
      |                      |                   |                   |                    |
      |-- 1. Draw Edge ----->|                   |                   |                    |
      |   (or AI Prompt)     |-- 2. POST Rel --->|                   |                    |
      |                      |                   |-- 3. Save Graph ->|                    |
      |                      |                   |   (SQLite)        |                    |
      |                      |                   |-- 4. Compile ---->|                    |
      |                      |                   |   (IFirewallProv) |                    |
      |                      |                   |                   |                    |
      |                      |                   |<-- 5. Heartbeat --|                    |
      |                      |                   |-- 6. Directives ->|                    |
      |                      |                   |                   |-- 7. Apply Rule -->|
      |                      |                   |                   |<-- 8. Success -----|
      |<-- 9. Animate Green -|<-- 10. Compliant -|<-- 11. Telemetry -|                    |
      |                      |                   |                   |                    |`}
                </div>
              </div>
            )}

            {/* 11. ROADMAP */}
            {activeTab === "roadmap" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-white">11. Implementation Roadmap & Milestones</h3>
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-emerald-500/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400 text-xs">Phase 1: Core Subsystem & Graph Engine</span>
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-emerald-500/20 text-emerald-300">COMPLETED</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      SQLite relational graph storage, interactive SVG/HTML canvas, relationship notation, properties inspector, and Default Deny baseline.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-xl border border-emerald-500/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400 text-xs">Phase 2: Translation & Agents</span>
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-emerald-500/20 text-emerald-300">COMPLETED</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      `IFirewallProvider` drivers for Windows Defender, nftables, iptables, ufw, pf. Standalone `netsentinel-agent.py` daemon with Windows 11 / Linux / macOS support.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-950 rounded-xl border border-cyan-500/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-400 text-xs">Phase 3: Hardware Router Connectors</span>
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-cyan-500/20 text-cyan-300">NEXT</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Direct SSH/API policy pushing to Cisco IOS-XE, Firewalla, Fortinet, and MikroTik RouterOS hardware appliances.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Complete Architecture, Schema, Components, & Protocol Specifications Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-white font-medium transition-colors"
          >
            Close Blueprint
          </button>
        </div>
      </div>
    </div>
  );
};

# Implementation Plan: Network Relationship Canvas (NRC) Subsystem

Architectural design and execution plan for the **Network Relationship Canvas (NRC)** in NetSentinel. NRC introduces a paradigm shift from traditional, low-level firewall rule management (ACLs, port tuples, NAT tables, IP objects) to an **Intent-Driven Network Topology Model**, where an interactive, high-fidelity diagram serves as the authoritative source of truth from which multi-platform firewall rules are automatically synthesized, verified, and continuously enforced.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions define how the Network Relationship Canvas integrates into NetSentinel while avoiding duplicate code:

- **Authoritative Source of Truth**: The canvas topology and its explicit relationship edges represent the declared network security policy. Absence of an edge implies strict **Default Deny**.
- **Agent Architecture**: Lightweight, outbound-only WebSocket client (Python/FastAPI daemon) that functions behind standard NATs without requiring incoming open ports.
- **Firewall Translation Abstraction (`IFirewallProvider`)**: A modular driver interface translating high-level intent into platform-native commands (`netsh advfirewall` on Windows 11, `nftables` / `iptables` / `ufw` on Linux, `pf` on macOS/BSD, and REST API calls for pfSense/OPNsense).
- **Existing NetSentinel Integration**: Devices discovered through NetSentinel's existing ARP/ICMP sweeps and IPv6 NDP engine automatically seed the canvas asset catalog. Discovered devices can be dragged onto the canvas or auto-laid out into subnet clusters without duplicating the underlying SQLite inventory database.

---

## 1. Overview & Core Concept

### What It Does
The **Network Relationship Canvas (NRC)** transforms network security management into an intuitive, Visio/ERD-like visual experience. Operators drag managed and unmanaged devices, subnet boundaries, and server groups onto an infinite interactive canvas and draw directional relationships between them. 

Each relationship line visually denotes permitted communication (e.g., `A ----80,443----> B`). The system automatically compiles these visual relationships into concrete firewall rules, synchronizes them with managed endpoint agents, audits compliance in real time, and animates live traffic flows with threat alerts.

```
       TRADITIONAL FIREWALL CONSOLE                NETWORK RELATIONSHIP CANVAS (NRC)
 ┌────────────────────────────────────────┐       ┌────────────────────────────────────────┐
 │ Inbound Rule #420:                     │       │                                        │
 │   Source: 192.168.1.0/24               │  ==>  │  [Workstations] ──443──> [Web Servers] │
 │   Dest: 10.0.0.15                      │  ==>  │       🟢                     🟢        │
 │   Port: 443 (TCP)                      │       │                                        │
 │   Action: ACCEPT                       │       │  Intent is immediately legible in 10s! │
 └────────────────────────────────────────┘       └────────────────────────────────────────┘
```

### Target Audience & Persona
- **Security Operations & Network Engineers**: Rapidly model zero-trust perimeters, audit rogue listeners, and verify cross-subnet isolation.
- **IT Administrators & Non-Network Specialists**: Comprehend an entire network's security posture and inter-device dependencies within 10 seconds without deciphering thousands of raw firewall rules.

### Key Value
- **Zero-Friction Zero-Trust**: Everything not explicitly connected is denied by default.
- **Cross-Platform Parity**: A single visual diagram enforces consistent rules across heterogeneous fleets (Windows 11, Ubuntu, macOS, pfSense).
- **Continuous Compliance Verification**: The canvas visualizes discrepancies between declared intent and actual on-host firewall configurations.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Canvas Modeling & Auto-Layout**:
   - The operator opens the new **Relationship Canvas** tab in NetSentinel.
   - The asset sidebar lists all discovered endpoints from NetSentinel's inventory.
   - Dragging an endpoint or group onto the grid places a node. Nodes display status rings: Managed (🟢 Green), Unmanaged (🔴 Red), Warning (🟡 Yellow), Offline (⚪ Gray), or Threat Detected (🚨 Pulsing Red).
   - An "Auto-Arrange" button clusters devices into logical zones (DMZ, Workstations, Database Tier, IoT/Surveillance).

2. **Relationship Drawing & Intent Expression**:
   - Dragging from a node's anchor port to a target opens a connector line.
   - Quick-picker tags select common services (`HTTPS: 443`, `SSH: 22`, `DNS: 53`, `RTSP: 554`) or custom ports.
   - The line automatically renders the intent notation:
     - One-way: `A ───443───> B`
     - Multi-port: `A ───80,443───> B`
     - Bidirectional trust: `A <═══80═══> B`
     - Ephemeral / Triggered notation: `A ───443───> B [1024-65535]`
   - Clicking any relationship opens the **Relationship Properties Panel** with stateful filtering, logging, IDS inspection, and schedule options.

3. **Natural Language AI Policy Assistant**:
   - An intent bar allows prompt-driven rule creation: *"Allow developer laptops to access internal GitLab on HTTPS and SSH"*.
   - The AI parser resolves the referenced groups, validates addresses, draws the connectors, and presents an intent confirmation preview.

4. **Compliance Audit & Real-Time Traffic Visualization**:
   - Toggle **Compliance Mode**: Nodes and links highlight green when actual host rules match the canvas, or red when unapproved open ports or unauthorized connections are active.
   - Real-time packet telemetry animates active flows:
     - 🟢 *Green pulse*: Authorized, expected traffic.
     - 🟡 *Yellow pulse*: High bandwidth / spike traffic.
     - 🟠 *Orange pulse*: Unmapped / newly discovered communication.
     - 🚨 *Flashing red pulse*: Violation / blocked unauthorized attempt.

### Canvas Wireframe (ASCII)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 🌐 NetSentinel NRC ─── Network Intent Studio              [ 🤖 AI Policy ] [ 📐 Auto-Layout ] [ 💾 Deploy ] │
├──────────────────────────┬───────────────────────────────────────────────────────────────┬──────────────────┤
│ ASSET CATALOG (INVENTORY)│ INTERACTIVE RELATIONSHIP CANVAS (SVG / HTML5)                 │ PROPERTIES PANEL │
├──────────────────────────┤                                                               ├──────────────────┤
│ 🔍 Filter assets...      │   ┌───────────────┐                  ┌──────────────────┐     │ Relationship #12 │
│                          │   │ Workstations  │───80,443────────>│ Web Servers      │     ├──────────────────┤
│ 🟢 Managed (4)           │   │ 🟢 12 Devices │                  │ 🟢 3 Servers     │     │ Source:          │
│   • WS-DEV-01 (Win11)    │   └───────────────┘                  └──────────────────┘     │   Workstations   │
│   • WS-DEV-02 (Ubuntu)   │           │                                   │               │ Destination:     │
│   • SRV-APP-01 (Debian)  │           │ 22                                │ 5432          │   Web Servers    │
│   • SRV-DB-01 (Ubuntu)   │           v                                   v               │ Protocol: TCP    │
│                          │   ┌───────────────┐                  ┌──────────────────┐     │ Ports: 80, 443   │
│ 🔴 Unmanaged (3)         │   │ Bastion Host  │                  │ PostgreSQL Tier  │     │ Mode: One-Way    │
│   • IP-CAM-01 (Reolink)  │   │ 🟢 10.0.0.5   │                  │ 🟢 10.0.0.20     │     │ Stateful: YES    │
│   • ROUTER-GATEWAY       │   └───────────────┘                  └──────────────────┘     │ Logging: YES     │
│   • GUEST-PHONE-A2       │                                                               │ Compliance: 100% │
│                          │   ┌───────────────┐                  ┌──────────────────┐     ├──────────────────┤
│ 🏷️ Groups (3)            │   │ Guest Wi-Fi   │ ──X── DENIED ──> │ Internal LAN     │     │ Generated Rules: │
│   • [Workstations]       │   │ 🟡 192.168.2.0│                  │ 🟢 10.0.0.0/16   │     │  • iptables -A   │
│   • [Web Servers]        │   └───────────────┘                  └──────────────────┘     │  • netsh advf... │
│   • [Databases]          │                                                               │                  │
└──────────────────────────┴───────────────────────────────────────────────────────────────┴──────────────────┘
```

---

## 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Rationale | Alternatives Considered |
|---|---|---|---|
| **Canvas State Representation** | React Flow / Native SVG graph engine with custom edge renderers | High performance with hundreds of nodes, precise sub-pixel connector routing, built-in minimap, and smooth pan/zoom. | Canvas 2D bitmap (poor DOM accessibility) or heavy WebGL (overkill for 2D topology diagrams). |
| **Relationship Storage** | First-class relational tables (`canvas_relationships`) in SQLite with WAL mode | Direct foreign keys to devices/groups, relational integrity, zero impedance mismatch with NetSentinel backend. | Storing diagram as an opaque JSON blob (loses SQL queryability and compliance indexing). |
| **Firewall Generation** | Declarative Intent-to-Provider Compiler | Decouples diagram intent from platform quirks. Adding a new provider (e.g. pfSense) requires only implementing `IFirewallProvider`. | Hardcoding script templates into UI components (unmaintainable across operating systems). |
| **Agent Communication** | Outbound-only TLS WebSocket with HMAC heartbeat | Guaranteed traversal through NATs, firewalls, and carrier CGNATs without opening host ports. | Inbound SSH/REST (fails when target machine is behind home or hotel NAT). |
| **Default Security Stance** | Authoritative Default Deny | Guarantees true Zero Trust. If an edge does not connect Node A and Node B on Port X, that port is locked down on the agent. | Permissive / Monitor-Only default (leaves security holes open). |

---

## 4. Technical Architecture & Data Strategy

### System Component Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                 NETSENTINEL SERVER                                       │
│                                                                                          │
│  ┌───────────────────────┐   ┌──────────────────────────┐   ┌─────────────────────────┐  │
│  │ Interactive Web UI    │   │ Policy Compiler Engine   │   │ Compliance Evaluator    │  │
│  │  • React Flow Canvas  │   │  • Intent AST Generator  │   │  • Actual vs Expected   │  │
│  │  • Relationship Panel │   │  • Multi-Provider Matrix │   │  • Discrepancy Auditing │  │
│  │  • AI Intent Prompt   │   │  • Rule Synthesizer      │   │  • Violation Alerts     │  │
│  └───────────┬───────────┘   └────────────┬─────────────┘   └────────────┬────────────┘  │
│              │ REST / WebSocket           │                              │               │
│  ┌───────────┴────────────────────────────┴──────────────────────────────┴────────────┐  │
│  │ SQLite WAL Data Store (netsentinel.db)                                             │  │
│  │  • devices  • canvas_nodes  • canvas_groups  • canvas_relationships  • agent_state │  │
│  └────────────────────────────────────────┬───────────────────────────────────────────┘  │
│                                           │ Outbound TLS WebSocket Gateway (Port 3000)   │
└───────────────────────────────────────────┼──────────────────────────────────────────────┘
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               │ WSS (Outbound-only)        │ WSS (Outbound-only)        │ WSS (Outbound-only)
               v                            v                            v
┌──────────────────────────────┐ ┌──────────────────────────────┐ ┌──────────────────────────────┐
│ WINDOWS 11 MANAGED AGENT     │ │ LINUX MANAGED AGENT          │ │ ROUTER / GATEWAY ADAPTER     │
│  • Python / Win32 Service    │ │  • Python Systemd Daemon     │ │  • pfSense / OPNセンス REST  │
│  • Provider: netsh advfirew. │ │  • Provider: nftables/iptab. │ │  • Provider: pf / XML-RPC    │
│  • Local Port Auditor        │ │  • Local Socket Auditor      │ │  • Gateway Ruleset Deploy    │
└──────────────────────────────┘ └──────────────────────────────┘ └──────────────────────────────┘
```

### Relational Database Schema (`netsentinel.db`)

Relationships, nodes, and compliance records are stored as first-class relational tables:

```sql
-- Canvas Nodes (Positioning and presentation on the canvas)
CREATE TABLE IF NOT EXISTS canvas_nodes (
    id TEXT PRIMARY KEY,
    device_mac TEXT REFERENCES devices(mac) ON DELETE SET NULL,
    node_type TEXT NOT NULL, -- 'managed_device', 'unmanaged_device', 'group', 'network', 'internet', 'external_service'
    label TEXT NOT NULL,
    ip_or_cidr TEXT,
    pos_x REAL NOT NULL DEFAULT 100.0,
    pos_y REAL NOT NULL DEFAULT 100.0,
    status TEXT NOT NULL DEFAULT 'offline', -- 'managed', 'unmanaged', 'warning', 'offline', 'threat'
    group_id TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Canvas Groups
CREATE TABLE IF NOT EXISTS canvas_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#06b6d4',
    description TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- First-Class Relationships (Authoritative Intent)
CREATE TABLE IF NOT EXISTS canvas_relationships (
    id TEXT PRIMARY KEY,
    source_node_id TEXT NOT NULL REFERENCES canvas_nodes(id) ON DELETE CASCADE,
    target_node_id TEXT NOT NULL REFERENCES canvas_nodes(id) ON DELETE CASCADE,
    direction TEXT NOT NULL DEFAULT 'one_way', -- 'one_way', 'bidirectional', 'reverse'
    protocol TEXT NOT NULL DEFAULT 'tcp', -- 'tcp', 'udp', 'icmp', 'any'
    allowed_ports TEXT NOT NULL, -- JSON array: ["443", "80"] or ["22"]
    triggered_ports TEXT, -- JSON array: ["1024-65535"] (informational / dynamic)
    is_stateful INTEGER NOT NULL DEFAULT 1,
    logging_enabled INTEGER NOT NULL DEFAULT 1,
    ids_enabled INTEGER NOT NULL DEFAULT 0,
    schedule TEXT DEFAULT 'always',
    ai_notes TEXT,
    traffic_status TEXT DEFAULT 'inactive', -- 'expected', 'high', 'new_comm', 'threat', 'inactive'
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Agent Registration & Compliance Records
CREATE TABLE IF NOT EXISTS agent_nodes (
    agent_id TEXT PRIMARY KEY,
    device_mac TEXT UNIQUE REFERENCES devices(mac) ON DELETE CASCADE,
    hostname TEXT NOT NULL,
    os_type TEXT NOT NULL, -- 'windows', 'linux', 'darwin'
    os_version TEXT,
    firewall_provider TEXT NOT NULL, -- 'windows_firewall', 'nftables', 'iptables', 'ufw', 'pf'
    status TEXT NOT NULL DEFAULT 'connected', -- 'connected', 'disconnected', 'degraded'
    last_heartbeat TEXT NOT NULL,
    compliance_score REAL DEFAULT 100.0,
    active_listeners TEXT, -- JSON array of [{ port: 443, proto: 'tcp', process: 'nginx' }]
    applied_rule_count INTEGER DEFAULT 0,
    discrepancy_count INTEGER DEFAULT 0
);

-- Compliance Violations Audit Trail
CREATE TABLE IF NOT EXISTS compliance_violations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id TEXT REFERENCES agent_nodes(agent_id),
    violation_type TEXT NOT NULL, -- 'unauthorized_listener', 'missing_rule', 'unexpected_traffic', 'firewall_disabled'
    severity TEXT NOT NULL, -- 'critical', 'warning', 'info'
    details TEXT NOT NULL, -- JSON payload
    timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved INTEGER DEFAULT 0
);
```

### Firewall Translation Layer Architecture (`IFirewallProvider`)

Each target platform is implemented as a clean, stateless driver implementing a standardized interface:

```typescript
export interface FirewallRule {
  id: string;
  name: string;
  direction: 'inbound' | 'outbound';
  action: 'allow' | 'deny';
  protocol: 'tcp' | 'udp' | 'icmp' | 'any';
  localPorts?: string[];
  remotePorts?: string[];
  remoteAddresses?: string[];
  stateful: boolean;
  logging: boolean;
  enabled: boolean;
  description?: string;
}

export interface IFirewallProvider {
  providerName: string;
  platform: 'windows' | 'linux' | 'darwin' | 'bsd' | 'appliance';
  getRules(): Promise<FirewallRule[]>;
  generateRuleSyntax(rules: FirewallRule[]): string[];
  applyRules(rules: FirewallRule[]): Promise<{ success: boolean; errors?: string[] }>;
  flushManagedRules(): Promise<boolean>;
  verifyCompliance(expectedRules: FirewallRule[]): Promise<{
    compliant: boolean;
    missingRules: FirewallRule[];
    extraRules: FirewallRule[];
    score: number;
  }>;
}
```

#### Provider Syntax Generators:
1. **Windows Firewall (`WindowsFirewallProvider`)**:
   - `netsh advfirewall firewall add rule name="NRC-In-443" dir=in action=allow protocol=TCP localport=443 remoteip=192.168.1.50 profile=any`
2. **Linux `nftables` (`NftablesProvider`)**:
   - `nft add rule inet filter input ip saddr 192.168.1.50 tcp dport { 80, 443 } ct state new,established accept`
3. **Linux `ufw` (`UfwProvider`)**:
   - `ufw allow from 192.168.1.50 to any port 443 proto tcp comment 'NRC-Rule-12'`
4. **pf / OPNsense / pfSense (`PfProvider`)**:
   - `pass in quick proto tcp from 192.168.1.50 to any port { 80 443 } flags S/SA keep state`

### Agent Architecture (Python / Daemon)

The agent runs as a standalone, zero-dependency background daemon (`netsentinel-agent`):
- **Outbound Connection**: Initiates a persistent TLS WebSocket to `wss://<netsentinel-server>/api/agent/ws`.
- **Heartbeat & Telemetry**: Emits a telemetry frame every 10 seconds:
  ```json
  {
    "agent_id": "agent-win11-8f92",
    "mac": "EC:71:DB:5F:10:8C",
    "hostname": "DEV-WORKSTATION",
    "os": "windows",
    "listeners": [
      { "port": 443, "proto": "tcp", "pid": 1044, "process": "node.exe" },
      { "port": 22, "proto": "tcp", "pid": 820, "process": "sshd.exe" }
    ],
    "firewall_active": true
  }
  ```
- **Rule Enforcement**: When server detects a canvas change, it pushes a `DEPLOY_POLICY` payload with compiled `FirewallRule[]`. The agent runs the local provider, updates local rules, and responds with a signed compliance status.

### Sequence Diagram: Intent Creation to Enforcement

```
User (Canvas)          Server Engine          Database            Managed Agent         Host Firewall
    │                       │                     │                     │                     │
    │ 1. Draw edge A ──> B  │                     │                     │                     │
    │    Ports: 80, 443     │                     │                     │                     │
    ├──────────────────────>│                     │                     │                     │
    │                       │ 2. Insert edge      │                     │                     │
    │                       ├────────────────────>│                     │                     │
    │                       │                     │                     │                     │
    │                       │ 3. Compile intent into FirewallRule[]     │                     │
    │                       │    Target A: Allow Outbound 80, 443       │                     │
    │                       │    Target B: Allow Inbound 80, 443        │                     │
    │                       │                                           │                     │
    │                       │ 4. Push DEPLOY_POLICY over active WS      │                     │
    │                       ├──────────────────────────────────────────>│                     │
    │                       │                                           │ 5. Translate via    │
    │                       │                                           │    FirewallProvider │
    │                       │                                           ├────────────────────>│
    │                       │                                           │    (netsh / nft)    │
    │                       │                                           │<────────────────────┤
    │                       │ 6. Send COMPLIANCE_REPORT                 │    Rules enforced   │
    │                       │<──────────────────────────────────────────┤                     │
    │ 7. Animate link: 🟢   │                     │                     │                     │
    │<──────────────────────┤                     │                     │                     │
```

---

## 5. React Component Hierarchy

```
src/components/canvas/
├── NetworkRelationshipCanvas.tsx        <-- Main full-screen view (Toolbar, Canvas, Sidebar, Inspector)
├── CanvasViewport.tsx                   <-- Interactive SVG/DOM container with Pan, Zoom, Grid, Drag & Drop
├── CanvasNodeRenderer.tsx               <-- Node component: Icon, Status Ring (🟢🔴🟡⚪🚨), Label, Ports
├── CanvasRelationshipEdge.tsx           <-- Custom SVG Path: Directional arrows, port pills, animated traffic dots
├── AssetCatalogSidebar.tsx              <-- Drawer listing Discovered Devices, Unassigned Nodes, Groups
├── RelationshipPropertiesPanel.tsx      <-- Slide-out inspector (Source, Target, Ports, Stateful, Schedule)
├── AIPolicyCommandBar.tsx               <-- Natural language prompt input with preview and acceptance
├── ComplianceAuditModal.tsx             <-- Expected vs Actual policy auditor, violation diff table
└── AgentDeploymentModal.tsx             <-- Agent download scripts (.bat, .sh) and token generator
```

---

## 6. Implementation Phasing & Roadmap

### Phase 1: Database Foundation & Canvas Core Engine
- Create database tables: `canvas_nodes`, `canvas_groups`, `canvas_relationships`, `agent_nodes`, `compliance_violations`.
- Implement REST API endpoints in `server.ts`:
  - `GET /api/canvas/topology`: Full canvas state (nodes, groups, relationships).
  - `POST /api/canvas/nodes`: Create / update node position, type, and grouping.
  - `POST /api/canvas/relationships`: Create / update intent relationship edge.
  - `DELETE /api/canvas/relationships/:id`: Remove relationship (reverts to Default Deny).
- Build the React Canvas viewport with smooth drag-and-drop, zoom/pan navigation, and snap-to-grid.

### Phase 2: Relationship Notation & Interactive Property Panel
- Implement custom SVG connectors rendering the exact notation:
  - One-Way (`A ──443──> B`)
  - Multi-Port (`A ──80,443──> B`)
  - Bidirectional Trust (`A <══80══> B`)
  - Triggered Port brackets (`[1024-65535]`)
- Build the **Relationship Properties Panel** with protocol selection, stateful flags, logging, and inspection properties.
- Implement Group-to-Group relationship inheritance (`[Workstations] ──443──> [Web Servers]`).

### Phase 3: Firewall Translation Layer & Policy Compiler
- Implement TypeScript compilation engine (`src/services/firewall/`):
  - Abstract `IFirewallProvider` interface.
  - `WindowsFirewallProvider` generating `netsh advfirewall` rules.
  - `NftablesProvider` and `IptablesProvider` generating Linux packet filter rules.
  - `PfProvider` generating BSD / pfSense / OPNsense rules.
- Add `/api/canvas/compile` endpoint returning platform-native rulesets for any selected node or group.

### Phase 4: Agent Daemon & Outbound WebSocket Gateway
- Implement server-side agent gateway in `server.ts` (`/api/agent/ws` WebSocket router).
- Create lightweight agent script (`netsentinel-agent.py`) supporting Windows, Linux, and macOS.
- Implement agent local listener discovery (scanning `netstat` / `ss` / `lsof` for active ports).
- Implement remote rule application and verification handshake.

### Phase 5: AI-Assisted Policy Design & Compliance Engine
- Implement natural language intent endpoint `/api/canvas/ai-policy` translating operator prompts into node relationships.
- Build the real-time **Compliance Engine** comparing declared canvas intent against active agent port telemetry.
- Animate live traffic flows (Green = Normal, Yellow = Spike, Orange = Unmapped, Red = Violation).
- Integrate the Canvas seamlessly into NetSentinel's main tab bar alongside Devices, Port Scan, Cameras, and Logs.

/**
 * Type definitions for the Network Relationship Canvas (NRC) subsystem.
 */

export type CanvasNodeType =
  | "managed_device"
  | "unmanaged_device"
  | "group"
  | "network"
  | "internet"
  | "external_service"
  | "application";

export type CanvasNodeStatus =
  | "managed" // 🟢 Green
  | "unmanaged" // 🔴 Red
  | "warning" // 🟡 Yellow
  | "offline" // ⚪ Gray
  | "threat" // 🚨 Pulsing Red
  | "threat_detected";

export interface CanvasNode {
  id: string;
  device_mac?: string;
  mac?: string;
  node_type?: CanvasNodeType;
  type?: CanvasNodeType;
  label: string;
  ip_or_cidr?: string;
  ip?: string;
  cidr?: string;
  pos_x?: number;
  pos_y?: number;
  x: number;
  y: number;
  status: CanvasNodeStatus;
  group_id?: string;
  groupId?: string;
  groupName?: string;
  os?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface CanvasGroup {
  id: string;
  name: string;
  color?: string;
  policyColor?: string;
  description?: string;
  members?: string[];
  created_at?: string;
}

export type RelationshipDirection = "one_way" | "bidirectional" | "reverse";
export type RelationshipProtocol = "tcp" | "udp" | "icmp" | "any";
export type TrafficAnimationStatus = "expected" | "high" | "new" | "new_comm" | "threat" | "inactive";

export interface CanvasRelationship {
  id: string;
  source_node_id?: string;
  sourceId: string;
  target_node_id?: string;
  targetId: string;
  direction: RelationshipDirection;
  protocol: RelationshipProtocol;
  allowed_ports?: string[];
  ports: string[];
  triggered_ports?: string[];
  triggeredPorts?: string;
  is_stateful?: boolean;
  stateful: boolean;
  logging_enabled?: boolean;
  logging: boolean;
  ids_enabled?: boolean;
  ids: boolean;
  schedule?: string;
  ai_notes?: string;
  aiNotes?: string;
  traffic_status?: TrafficAnimationStatus;
  trafficState?: TrafficAnimationStatus;
  created_at?: string;
  updated_at?: string;
}

export interface AgentListener {
  port: number;
  proto: string;
  pid?: string | number;
  process?: string;
}

export interface AgentNode {
  id?: string;
  agent_id?: string;
  device_mac?: string;
  hostname: string;
  ip?: string;
  os?: string;
  os_type?: "windows" | "linux" | "darwin";
  os_version?: string;
  firewall_provider?: string;
  firewallType?: string;
  status?: "connected" | "disconnected" | "degraded";
  last_heartbeat?: string;
  lastHeartbeat: string;
  compliance_status?: string;
  complianceStatus?: string;
  compliance_score?: number;
  complianceScore?: number;
  active_listeners?: AgentListener[];
  activePorts?: number[];
  applied_rule_count?: number;
  discrepancy_count?: number;
}

export interface CanvasStats {
  total_nodes: number;
  total_relationships: number;
  total_groups: number;
  managed_count: number;
  unmanaged_count: number;
  threat_count: number;
  offline_count: number;
  active_agents: number;
  network_compliance_score: number;
}

export interface CanvasTopology {
  nodes: CanvasNode[];
  groups: CanvasGroup[];
  relationships: CanvasRelationship[];
  agents: AgentNode[];
  stats?: CanvasStats;
}

export interface ComplianceViolation {
  id?: string;
  agent_id?: string;
  hostname?: string;
  nodeLabel?: string;
  device_ip?: string;
  type?: "unauthorized_listener" | "missing_rule" | "unexpected_traffic" | "firewall_disabled";
  severity: "critical" | "warning" | "info";
  message?: string;
  description?: string;
  port?: number;
  process?: string;
}

export interface ComplianceAuditReport {
  compliance_score?: number;
  complianceScore?: number;
  expected_rules_count?: number;
  total_active_listeners?: number;
  violations_count?: number;
  expectedPolicies?: Array<{ source: string; destination: string; ports: string[] }>;
  actualPolicies?: Array<{ node: string; ruleSummary: string }>;
  violations: ComplianceViolation[];
  status?: "compliant" | "non_compliant";
}

export interface CompiledFirewallRule {
  id: string;
  name: string;
  relationship_id?: string;
  source: string;
  source_ip: string;
  target: string;
  target_ip: string;
  protocol: string;
  ports: string[];
  triggered_ports?: string[];
  direction: "inbound" | "outbound";
  action: "allow" | "deny";
  native_command: string;
  notes?: string;
}

export interface CompiledRulesetResponse {
  provider: string;
  target_node_id?: string;
  total_rules: number;
  rules: CompiledFirewallRule[];
  script_content: string;
}

export interface AIPolicyResponse {
  success: boolean;
  prompt: string;
  intent_visual: string;
  proposed_relationship: Partial<CanvasRelationship> & {
    source_label: string;
    target_label: string;
  };
  confidence_score: number;
  explanation: string;
}

export interface IFirewallProvider {
  getRules(): Promise<CompiledFirewallRule[]>;
  addRule(rule: Partial<CompiledFirewallRule>): Promise<{ success: boolean; ruleId: string }>;
  removeRule(ruleId: string): Promise<{ success: boolean }>;
  enableRule(ruleId: string): Promise<{ success: boolean }>;
  disableRule(ruleId: string): Promise<{ success: boolean }>;
}

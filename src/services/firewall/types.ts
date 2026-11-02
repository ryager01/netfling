/**
 * Interface definition for all Firewall Translation Providers.
 * Abstract all firewall implementations into a unified interface.
 */

export interface FirewallRuleObject {
  id: string;
  name: string;
  direction: "inbound" | "outbound";
  action: "allow" | "deny";
  protocol: "tcp" | "udp" | "icmp" | "any";
  localPorts?: string[];
  presentedPort?: string;
  actualPort?: string;
  isRedirect?: boolean;
  isLoopback?: boolean;
  destinationAddress?: string;
  remoteAddresses?: string[];
  stateful: boolean;
  logging: boolean;
  enabled: boolean;
  description?: string;
}

export interface IFirewallProvider {
  providerName: string;
  platform: "windows" | "linux" | "darwin" | "bsd" | "appliance";
  getRules(): Promise<FirewallRuleObject[]>;
  generateRuleSyntax(rules: FirewallRuleObject[]): string[];
  addRule(rule: FirewallRuleObject): Promise<{ success: boolean; command: string }>;
  removeRule(ruleId: string): Promise<{ success: boolean }>;
  enableRule(ruleId: string): Promise<{ success: boolean }>;
  disableRule(ruleId: string): Promise<{ success: boolean }>;
}

import { FirewallRuleObject, IFirewallProvider } from "./types";

/**
 * Windows Defender Firewall Translation Provider (netsh advfirewall)
 */
export class WindowsFirewallProvider implements IFirewallProvider {
  providerName = "Windows Defender Firewall";
  platform: "windows" = "windows";

  async getRules(): Promise<FirewallRuleObject[]> {
    return [];
  }

  generateRuleSyntax(rules: FirewallRuleObject[]): string[] {
    const lines: string[] = [
      "rem --- NetSentinel NRC Windows 11 Firewall Configuration ---",
      "netsh advfirewall set allprofiles firewallpolicy blockinbound,allowoutbound",
    ];

    for (const r of rules) {
      const portStr = (r.localPorts || []).join(",");
      const remoteStr = (r.remoteAddresses || ["any"]).join(",");
      const cmd = `netsh advfirewall firewall add rule name="${r.name}" dir=${r.direction === "inbound" ? "in" : "out"} action=${r.action} protocol=${r.protocol.toUpperCase()} localport=${portStr || "any"} remoteip=${remoteStr} enable=${r.enabled ? "yes" : "no"} profile=any`;
      lines.push(cmd);
    }
    return lines;
  }

  async addRule(rule: FirewallRuleObject): Promise<{ success: boolean; command: string }> {
    const lines = this.generateRuleSyntax([rule]);
    return { success: true, command: lines[lines.length - 1] };
  }

  async removeRule(ruleId: string): Promise<{ success: boolean }> {
    return { success: true };
  }

  async enableRule(ruleId: string): Promise<{ success: boolean }> {
    return { success: true };
  }

  async disableRule(ruleId: string): Promise<{ success: boolean }> {
    return { success: true };
  }
}

/**
 * Linux nftables Translation Provider (Modern Linux Kernel 5.x+)
 */
export class NftablesProvider implements IFirewallProvider {
  providerName = "Linux nftables";
  platform: "linux" = "linux";

  async getRules(): Promise<FirewallRuleObject[]> {
    return [];
  }

  generateRuleSyntax(rules: FirewallRuleObject[]): string[] {
    const lines: string[] = [
      "#!/usr/sbin/nft -f",
      "# NetSentinel NRC nftables ruleset (Strict Default Deny)",
      "flush ruleset",
      "table inet nrc_filter {",
      "  chain input {",
      "    type filter hook input priority 0; policy drop;",
      "    ct state established,related accept",
      "    iifname lo accept",
    ];

    for (const r of rules) {
      const ports = (r.localPorts || []).join(", ");
      const saddr = (r.remoteAddresses || ["0.0.0.0/0"])[0];
      const portClause = ports ? `${r.protocol} dport { ${ports} } ` : "";
      const saddrClause = saddr && saddr !== "any" && saddr !== "0.0.0.0/0" ? `ip saddr ${saddr} ` : "";
      lines.push(`    ${saddrClause}${portClause}ct state new,established accept`);
    }

    lines.push("  }");
    lines.push("}");
    return lines;
  }

  async addRule(rule: FirewallRuleObject): Promise<{ success: boolean; command: string }> {
    const lines = this.generateRuleSyntax([rule]);
    return { success: true, command: lines[lines.length - 3] };
  }

  async removeRule(ruleId: string): Promise<{ success: boolean }> {
    return { success: true };
  }

  async enableRule(ruleId: string): Promise<{ success: boolean }> {
    return { success: true };
  }

  async disableRule(ruleId: string): Promise<{ success: boolean }> {
    return { success: true };
  }
}

/**
 * Linux iptables Translation Provider
 */
export class IptablesProvider implements IFirewallProvider {
  providerName = "Linux iptables";
  platform: "linux" = "linux";

  async getRules(): Promise<FirewallRuleObject[]> {
    return [];
  }

  generateRuleSyntax(rules: FirewallRuleObject[]): string[] {
    const lines: string[] = [
      "#!/bin/bash",
      "# NetSentinel NRC iptables baseline",
      "iptables -F",
      "iptables -P INPUT DROP",
      "iptables -P FORWARD DROP",
      "iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT",
      "iptables -A INPUT -i lo -j ACCEPT",
    ];

    for (const r of rules) {
      const ports = (r.localPorts || []).join(",");
      const saddr = (r.remoteAddresses || ["any"])[0];
      const sClause = saddr && saddr !== "any" ? `-s ${saddr} ` : "";
      const portClause = ports ? `-m multiport --dports ${ports} ` : "";
      lines.push(`iptables -A INPUT -p ${r.protocol} ${sClause}${portClause}-m conntrack --ctstate NEW,ESTABLISHED -j ACCEPT`);
    }
    return lines;
  }

  async addRule(rule: FirewallRuleObject): Promise<{ success: boolean; command: string }> {
    const lines = this.generateRuleSyntax([rule]);
    return { success: true, command: lines[lines.length - 1] };
  }

  async removeRule(ruleId: string): Promise<{ success: boolean }> {
    return { success: true };
  }

  async enableRule(ruleId: string): Promise<{ success: boolean }> {
    return { success: true };
  }

  async disableRule(ruleId: string): Promise<{ success: boolean }> {
    return { success: true };
  }
}

/**
 * Ubuntu / Debian UFW Translation Provider
 */
export class UfwProvider implements IFirewallProvider {
  providerName = "Ubuntu / Debian UFW";
  platform: "linux" = "linux";

  async getRules(): Promise<FirewallRuleObject[]> {
    return [];
  }

  generateRuleSyntax(rules: FirewallRuleObject[]): string[] {
    const lines: string[] = [
      "#!/bin/bash",
      "# NetSentinel NRC UFW configuration",
      "ufw default deny incoming",
      "ufw default allow outgoing",
    ];

    for (const r of rules) {
      const ports = (r.localPorts || []).join(",");
      const saddr = (r.remoteAddresses || ["any"])[0];
      lines.push(`ufw allow from ${saddr} to any port ${ports} proto ${r.protocol} comment '${r.name}'`);
    }
    lines.push("ufw reload");
    return lines;
  }

  async addRule(rule: FirewallRuleObject): Promise<{ success: boolean; command: string }> {
    const lines = this.generateRuleSyntax([rule]);
    return { success: true, command: lines[lines.length - 2] };
  }

  async removeRule(ruleId: string): Promise<{ success: boolean }> {
    return { success: true };
  }

  async enableRule(ruleId: string): Promise<{ success: boolean }> {
    return { success: true };
  }

  async disableRule(ruleId: string): Promise<{ success: boolean }> {
    return { success: true };
  }
}

/**
 * BSD / macOS / pfSense / OPNsense pf (Packet Filter) Provider
 */
export class PfProvider implements IFirewallProvider {
  providerName = "BSD / macOS / pfSense (pf)";
  platform: "bsd" = "bsd";

  async getRules(): Promise<FirewallRuleObject[]> {
    return [];
  }

  generateRuleSyntax(rules: FirewallRuleObject[]): string[] {
    const lines: string[] = [
      "# NetSentinel NRC pf.conf (Strict Default Deny)",
      "set skip on lo0",
      "block in log all",
      "pass out quick all keep state",
    ];

    for (const r of rules) {
      const ports = (r.localPorts || []).join(" ");
      const saddr = (r.remoteAddresses || ["any"])[0];
      lines.push(`pass in quick proto ${r.protocol} from ${saddr} to any port { ${ports} } flags S/SA keep state`);
    }
    return lines;
  }

  async addRule(rule: FirewallRuleObject): Promise<{ success: boolean; command: string }> {
    const lines = this.generateRuleSyntax([rule]);
    return { success: true, command: lines[lines.length - 1] };
  }

  async removeRule(ruleId: string): Promise<{ success: boolean }> {
    return { success: true };
  }

  async enableRule(ruleId: string): Promise<{ success: boolean }> {
    return { success: true };
  }

  async disableRule(ruleId: string): Promise<{ success: boolean }> {
    return { success: true };
  }
}

export function getFirewallProvider(name: string): IFirewallProvider {
  switch (name.toLowerCase()) {
    case "windows_firewall":
    case "windows":
      return new WindowsFirewallProvider();
    case "nftables":
    case "nft":
      return new NftablesProvider();
    case "iptables":
      return new IptablesProvider();
    case "ufw":
      return new UfwProvider();
    case "pf":
    case "pfsense":
    case "opnsense":
    case "darwin":
      return new PfProvider();
    default:
      return new WindowsFirewallProvider();
  }
}

export * from "./types";

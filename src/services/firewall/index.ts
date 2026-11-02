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
      const remoteStr = (r.remoteAddresses || ["any"]).join(",");
      const ports = r.localPorts || ["443"];
      
      for (const p of ports) {
        if (p.includes(":") || r.isRedirect) {
          const parts = p.includes(":") ? p.split(":") : [r.presentedPort || "8080", r.actualPort || "80"];
          const presented = parts[0].trim();
          const actual = parts[1].trim();
          if (r.isLoopback || r.destinationAddress === "127.0.0.1") {
            lines.push(`rem --- NRC Loopback Redirect (Intra-Host: ${presented} -> ${actual}) ---`);
            lines.push(`netsh interface portproxy add v4tov4 listenport=${presented} listenaddress=127.0.0.1 connectport=${actual} connectaddress=127.0.0.1`);
            lines.push(`netsh advfirewall firewall add rule name="${r.name}_LOOPBACK_${presented}" dir=in action=allow protocol=TCP localport=${presented} remoteip=127.0.0.1 enable=yes profile=any`);
          } else {
            const targetIp = r.destinationAddress || "192.168.1.100";
            lines.push(`rem --- NRC Remote Port Redirect / Port Forward (${presented} -> ${actual}) ---`);
            lines.push(`netsh interface portproxy add v4tov4 listenport=${presented} listenaddress=0.0.0.0 connectport=${actual} connectaddress=${targetIp}`);
            lines.push(`netsh advfirewall firewall add rule name="${r.name}_REDIRECT_${presented}" dir=in action=allow protocol=TCP localport=${presented} remoteip=${remoteStr} enable=yes profile=any`);
          }
        } else {
          const cmd = `netsh advfirewall firewall add rule name="${r.name}" dir=${r.direction === "inbound" ? "in" : "out"} action=${r.action} protocol=${r.protocol.toUpperCase()} localport=${p || "any"} remoteip=${remoteStr} enable=${r.enabled ? "yes" : "no"} profile=any`;
          lines.push(cmd);
        }
      }
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
      "# NetSentinel NRC nftables ruleset (Strict Default Deny & Port Redirects)",
      "flush ruleset",
      "table inet nrc_filter {",
      "  chain input {",
      "    type filter hook input priority 0; policy drop;",
      "    ct state established,related accept",
      "    iifname lo accept",
    ];

    for (const r of rules) {
      const saddr = (r.remoteAddresses || ["0.0.0.0/0"])[0];
      const saddrClause = saddr && saddr !== "any" && saddr !== "0.0.0.0/0" ? `ip saddr ${saddr} ` : "";
      const ports = r.localPorts || ["443"];

      for (const p of ports) {
        if (p.includes(":") || r.isRedirect) {
          const parts = p.includes(":") ? p.split(":") : [r.presentedPort || "8080", r.actualPort || "80"];
          const presented = parts[0].trim();
          const actual = parts[1].trim();
          if (r.isLoopback) {
            lines.push(`    # Loopback Redirect: localhost:${presented} -> :${actual}`);
            lines.push(`    iifname lo ${r.protocol} dport ${actual} accept`);
          } else {
            lines.push(`    # Remote Redirect: ${presented} -> ${actual}`);
            lines.push(`    ${saddrClause}${r.protocol} dport ${actual} ct state new,established accept`);
          }
        } else {
          lines.push(`    ${saddrClause}${r.protocol} dport { ${p} } ct state new,established accept`);
        }
      }
    }

    lines.push("  }");
    lines.push("}");
    lines.push("");
    lines.push("table inet nrc_nat {");
    lines.push("  chain prerouting {");
    lines.push("    type nat hook prerouting priority dstnat;");
    for (const r of rules) {
      const saddr = (r.remoteAddresses || ["0.0.0.0/0"])[0];
      const ports = r.localPorts || [];
      for (const p of ports) {
        if (p.includes(":") || r.isRedirect) {
          const parts = p.includes(":") ? p.split(":") : [r.presentedPort || "8080", r.actualPort || "80"];
          const presented = parts[0].trim();
          const actual = parts[1].trim();
          if (r.isLoopback) {
            lines.push(`    iifname "lo" ${r.protocol} dport ${presented} redirect to :${actual}`);
          } else {
            const tgtIp = r.destinationAddress || "192.168.1.100";
            const saddrClause = saddr && saddr !== "any" && saddr !== "0.0.0.0/0" ? `ip saddr ${saddr} ` : "";
            lines.push(`    ${saddrClause}${r.protocol} dport ${presented} dnat to ${tgtIp}:${actual}`);
          }
        }
      }
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
      "# NetSentinel NRC iptables baseline & NAT port redirects",
      "iptables -F",
      "iptables -t nat -F",
      "iptables -P INPUT DROP",
      "iptables -P FORWARD DROP",
      "iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT",
      "iptables -A INPUT -i lo -j ACCEPT",
    ];

    for (const r of rules) {
      const saddr = (r.remoteAddresses || ["any"])[0];
      const sClause = saddr && saddr !== "any" ? `-s ${saddr} ` : "";
      const ports = r.localPorts || ["443"];

      for (const p of ports) {
        if (p.includes(":") || r.isRedirect) {
          const parts = p.includes(":") ? p.split(":") : [r.presentedPort || "8080", r.actualPort || "80"];
          const presented = parts[0].trim();
          const actual = parts[1].trim();
          if (r.isLoopback) {
            lines.push(`iptables -t nat -A PREROUTING -p ${r.protocol} -i lo --dport ${presented} -j REDIRECT --to-ports ${actual}`);
            lines.push(`iptables -A INPUT -p ${r.protocol} -i lo --dport ${actual} -j ACCEPT`);
          } else {
            const tgtIp = r.destinationAddress || "192.168.1.100";
            lines.push(`iptables -t nat -A PREROUTING -p ${r.protocol} ${sClause}--dport ${presented} -j DNAT --to-destination ${tgtIp}:${actual}`);
            lines.push(`iptables -A FORWARD -p ${r.protocol} ${sClause}-d ${tgtIp} --dport ${actual} -m conntrack --ctstate NEW,ESTABLISHED -j ACCEPT`);
          }
        } else {
          lines.push(`iptables -A INPUT -p ${r.protocol} ${sClause}--dport ${p} -m conntrack --ctstate NEW,ESTABLISHED -j ACCEPT`);
        }
      }
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
      "# NetSentinel NRC UFW configuration & NAT redirects",
      "ufw default deny incoming",
      "ufw default allow outgoing",
    ];

    for (const r of rules) {
      const saddr = (r.remoteAddresses || ["any"])[0];
      const ports = r.localPorts || ["443"];

      for (const p of ports) {
        if (p.includes(":") || r.isRedirect) {
          const parts = p.includes(":") ? p.split(":") : [r.presentedPort || "8080", r.actualPort || "80"];
          const presented = parts[0].trim();
          const actual = parts[1].trim();
          if (r.isLoopback) {
            lines.push(`# [UFW Loopback NAT] -A PREROUTING -p ${r.protocol} -i lo --dport ${presented} -j REDIRECT --to-port ${actual}`);
            lines.push(`ufw allow in on lo proto ${r.protocol} to 127.0.0.1 port ${actual} comment '${r.name}_LOOPBACK'`);
          } else {
            const tgtIp = r.destinationAddress || "192.168.1.100";
            lines.push(`# [UFW Remote DNAT] -A PREROUTING -p ${r.protocol} -s ${saddr} --dport ${presented} -j DNAT --to-destination ${tgtIp}:${actual}`);
            lines.push(`ufw route allow proto ${r.protocol} from ${saddr} to ${tgtIp} port ${actual} comment '${r.name}_DNAT'`);
          }
        } else {
          lines.push(`ufw allow from ${saddr} to any port ${p} proto ${r.protocol} comment '${r.name}'`);
        }
      }
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
      "# NetSentinel NRC pf.conf (Strict Default Deny & Redirects)",
      "set skip on lo0",
      "block in log all",
      "pass out quick all keep state",
      "",
      "# --- NRC NAT / Redirect Translations ---",
    ];

    for (const r of rules) {
      const saddr = (r.remoteAddresses || ["any"])[0];
      const ports = r.localPorts || ["443"];

      for (const p of ports) {
        if (p.includes(":") || r.isRedirect) {
          const parts = p.includes(":") ? p.split(":") : [r.presentedPort || "8080", r.actualPort || "80"];
          const presented = parts[0].trim();
          const actual = parts[1].trim();
          if (r.isLoopback) {
            lines.push(`rdr on lo0 proto ${r.protocol} from any to any port ${presented} -> 127.0.0.1 port ${actual}`);
            lines.push(`pass in quick on lo0 proto ${r.protocol} from any to 127.0.0.1 port ${actual} keep state`);
          } else {
            const tgtIp = r.destinationAddress || "192.168.1.100";
            lines.push(`rdr on $ext_if proto ${r.protocol} from ${saddr} to any port ${presented} -> ${tgtIp} port ${actual}`);
            lines.push(`pass in quick proto ${r.protocol} from ${saddr} to ${tgtIp} port ${actual} keep state`);
          }
        } else {
          lines.push(`pass in quick proto ${r.protocol} from ${saddr} to any port ${p} flags S/SA keep state`);
        }
      }
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

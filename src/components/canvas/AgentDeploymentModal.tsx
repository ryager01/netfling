import React, { useState, useEffect } from "react";
import { AgentNode } from "../../types/canvas";
import {
  X,
  Laptop,
  Copy,
  Check,
  Download,
  Terminal,
  Shield,
  Activity,
  Server,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

interface AgentDeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AgentDeploymentModal: React.FC<AgentDeploymentModalProps> = ({ isOpen, onClose }) => {
  const [platform, setPlatform] = useState<"windows" | "linux" | "macos">("windows");
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentNode[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchAgents();
    }
  }, [isOpen]);

  const fetchAgents = async () => {
    setIsLoadingAgents(true);
    try {
      const res = await fetch("/api/canvas/topology");
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
      }
    } catch (err) {
      console.error("Failed to load agents", err);
    } finally {
      setIsLoadingAgents(false);
    }
  };

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const getInstallCommand = () => {
    const serverUrl = window.location.origin;
    switch (platform) {
      case "windows":
        return `# In Windows PowerShell (Run as Administrator):
irm "${serverUrl}/api/agent/script" -OutFile netsentinel-agent.py
python netsentinel-agent.py --server "${serverUrl}" --install-service`;
      case "linux":
        return `# In Linux Terminal (Ubuntu/Debian/RHEL):
curl -fsSL "${serverUrl}/api/agent/script" -o netsentinel-agent.py
sudo python3 netsentinel-agent.py --server "${serverUrl}" --install-systemd`;
      case "macos":
        return `# In macOS Terminal:
curl -fsSL "${serverUrl}/api/agent/script" -o netsentinel-agent.py
sudo python3 netsentinel-agent.py --server "${serverUrl}" --install-launchd`;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 font-sans">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                NetSentinel Agent Deployment & Management
              </h2>
              <p className="text-xs font-mono text-slate-400">
                Lightweight Outbound-Only Background Daemon (Windows, Linux, macOS)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Agent Architecture Overview */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="text-[11px] font-semibold text-emerald-400 font-mono uppercase tracking-wider">
              Agent Capabilities & Security Guarantees
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              The NetSentinel Agent runs as an unprivileged or system service that communicates{" "}
              <strong>outbound only</strong> to the NetSentinel server. It operates seamlessly behind
              NAT, firewalls, and proxy boundaries without requiring inbound open ports.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[10px] font-mono text-slate-300">
              <div className="p-2 bg-slate-900 rounded border border-slate-800 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Outbound Only (NAT)</span>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Query Listeners</span>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span>Enforce Firewall</span>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Audit Inventory</span>
              </div>
            </div>
          </div>

          {/* Quick Install Command Box */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Target Operating System</span>
              <div className="flex gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
                {(["windows", "linux", "macos"] as const).map((plat) => (
                  <button
                    key={plat}
                    onClick={() => setPlatform(plat)}
                    className={`px-3 py-1 rounded text-[11px] font-medium uppercase font-mono transition-all ${
                      platform === plat
                        ? "bg-cyan-500 text-slate-950 font-bold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {plat === "windows" ? "Windows 11" : plat}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {getInstallCommand()}
              </pre>
              <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                <button
                  onClick={() => copyToClipboard(getInstallCommand(), "cmd")}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] font-mono flex items-center gap-1 transition-colors"
                >
                  {copiedCmd === "cmd" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Command</span>
                    </>
                  )}
                </button>
                <a
                  href="/api/agent/script"
                  download="netsentinel-agent.py"
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] font-mono flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Download .py</span>
                </a>
              </div>
            </div>
          </div>

          {/* Connected Agents Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Registered Agents Telemetry</span>
              <button
                onClick={fetchAgents}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingAgents ? "animate-spin" : ""}`} />
                <span>Refresh Fleet</span>
              </button>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left font-mono text-[11px]">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-900/60 text-slate-400">
                    <th className="py-2.5 px-3">Hostname / IP</th>
                    <th className="py-2.5 px-3">OS Platform</th>
                    <th className="py-2.5 px-3">Firewall Engine</th>
                    <th className="py-2.5 px-3">Active Ports</th>
                    <th className="py-2.5 px-3">Compliance</th>
                    <th className="py-2.5 px-3 text-right">Heartbeat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white">{agent.hostname}</div>
                        <div className="text-[10px] text-slate-500">{agent.ip}</div>
                      </td>
                      <td className="py-2.5 px-3 capitalize">{agent.os}</td>
                      <td className="py-2.5 px-3 text-cyan-400">{agent.firewallType}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                          {(agent.activePorts?.length ?? agent.active_listeners?.length ?? 0)} listening
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                            agent.complianceStatus === "compliant"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                          }`}
                        >
                          {agent.complianceStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400 text-[10px]">
                        {new Date(agent.lastHeartbeat).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                  {agents.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500">
                        No agents registered yet. Execute the install command on an endpoint to connect.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

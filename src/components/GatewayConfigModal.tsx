import React, { useState, useEffect } from "react";
import {
  X,
  Wifi,
  Globe,
  Check,
  RefreshCw,
  AlertTriangle,
  Server,
  Zap,
  Sliders,
  Radio,
  ArrowRight,
  Play,
} from "lucide-react";

interface GatewayConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGateway: string;
  currentSubnet: string;
  currentInterface: string;
  onSuccess: (updated: {
    gateway_ip: string;
    subnet_cidr: string;
    interface: string;
  }) => void;
  showToast: (msg: string) => void;
  onSaveAndSweep?: (subnet: string) => void;
}

interface DetectedSubnet {
  cidr: string;
  interface: string;
  is_primary: boolean;
  label: string;
  recommended: boolean;
}

export const GatewayConfigModal: React.FC<GatewayConfigModalProps> = ({
  isOpen,
  onClose,
  currentGateway,
  currentSubnet,
  currentInterface,
  onSuccess,
  showToast,
  onSaveAndSweep,
}) => {
  const [gatewayIp, setGatewayIp] = useState<string>(currentGateway || "192.168.1.1");
  const [subnetCidr, setSubnetCidr] = useState<string>(currentSubnet || "192.168.1.0/24");
  const [ifaceName, setIfaceName] = useState<string>(currentInterface || "Wi-Fi");
  const [autoDetect, setAutoDetect] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingInterfaces, setIsLoadingInterfaces] = useState<boolean>(false);
  const [detectedSubnets, setDetectedSubnets] = useState<DetectedSubnet[]>([]);

  const fallbackDetected: DetectedSubnet[] = [
    { cidr: "192.168.1.0/24", label: "Primary LAN (192.168.1.0/24)", interface: "Wi-Fi/Ethernet", is_primary: true, recommended: true },
    { cidr: "192.168.0.0/24", label: "TP-Link / Netgear LAN (192.168.0.0/24)", interface: "Secondary LAN", is_primary: false, recommended: true },
    { cidr: "10.0.0.0/24", label: "Xfinity / Comcast / AT&T Fiber (10.0.0.0/24)", interface: "Cable/Fiber LAN", is_primary: false, recommended: false },
    { cidr: "192.168.50.0/24", label: "ASUS RT / ROG Router LAN (192.168.50.0/24)", interface: "ASUS LAN", is_primary: false, recommended: false },
  ];

  useEffect(() => {
    if (isOpen) {
      setGatewayIp(currentGateway === "127.0.0.1" ? "192.168.1.1" : currentGateway);
      setSubnetCidr(currentSubnet === "127.0.0.1/32" ? "192.168.1.0/24" : currentSubnet);
      setIfaceName(currentInterface || "Wi-Fi");
      fetchInterfaces();
    }
  }, [isOpen, currentGateway, currentSubnet, currentInterface]);

  const fetchInterfaces = async () => {
    setIsLoadingInterfaces(true);
    try {
      const res = await fetch("/api/network-interfaces");
      if (res.ok) {
        const data = await res.json();
        if (data.subnets && Array.isArray(data.subnets) && data.subnets.length > 0) {
          setDetectedSubnets(data.subnets);
          return;
        }
      }
      setDetectedSubnets(fallbackDetected);
    } catch {
      setDetectedSubnets(fallbackDetected);
    } finally {
      setIsLoadingInterfaces(false);
    }
  };

  if (!isOpen) return null;

  const presets = [
    {
      label: "Home / Residential LAN",
      gw: "192.168.1.1",
      cidr: "192.168.1.0/24",
      desc: "Standard for Netgear, Asus, Linksys, Comcast, Verizon",
    },
    {
      label: "Alternate Home Router",
      gw: "192.168.0.1",
      cidr: "192.168.0.0/24",
      desc: "Standard for TP-Link, D-Link, Ubiquiti UniFi",
    },
    {
      label: "Fiber / Telco Gateway",
      gw: "192.168.1.254",
      cidr: "192.168.1.0/24",
      desc: "Standard for AT&T Fiber, Motorola, BT Smart Hub",
    },
    {
      label: "Private 10.x Subnet",
      gw: "10.0.0.1",
      cidr: "10.0.0.0/24",
      desc: "Standard for Comcast Xfinity xFi Gateway, Apple AirPort",
    },
  ];

  const applyPreset = (gw: string, cidr: string) => {
    setGatewayIp(gw);
    setSubnetCidr(cidr);
    setAutoDetect(false);
  };

  const normalizeCidr = (input: string): string => {
    let trimmed = input.trim();
    if (!trimmed) return "192.168.1.0/24";
    if (!trimmed.includes("/")) {
      const parts = trimmed.split(".");
      if (parts.length >= 3) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
      }
      return `${trimmed}/24`;
    }
    return trimmed;
  };

  const handleSave = async (runSweepAfter: boolean = false) => {
    if (!gatewayIp.trim()) {
      showToast("Please enter a valid Gateway IP address.");
      return;
    }

    const cleanSubnet = normalizeCidr(subnetCidr);
    setIsSaving(true);
    try {
      const res = await fetch("/api/network-environment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gateway_ip: gatewayIp.trim(),
          subnet_cidr: cleanSubnet,
          interface: ifaceName.trim(),
          auto_detect: autoDetect,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const updated = data.network || {
          gateway_ip: gatewayIp.trim(),
          subnet_cidr: cleanSubnet,
          interface: ifaceName.trim(),
        };
        showToast(
          runSweepAfter
            ? `Gateway set to ${updated.gateway_ip}. Starting discovery sweep on ${cleanSubnet}...`
            : `Gateway set to ${updated.gateway_ip} (${updated.subnet_cidr})`
        );
        onSuccess(updated);
        if (runSweepAfter && onSaveAndSweep) {
          onSaveAndSweep(cleanSubnet);
        }
        onClose();
      } else {
        showToast("Error updating gateway configuration.");
      }
    } catch {
      showToast("Network request failed while saving gateway.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Configure Target Gateway & Subnet
              </h2>
              <p className="text-xs text-slate-400">
                Specify your active Wi-Fi / Ethernet router IP for vulnerability auditing and discovery
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Loopback Warning if currently 127.0.0.1 */}
          {currentGateway === "127.0.0.1" && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-semibold text-amber-300">
                  Loopback (127.0.0.1) Fallback Detected
                </span>
                <p className="text-slate-300 leading-relaxed">
                  The local environment resolved to 127.0.0.1 because outbound routing probes fell back to loopback.
                  Select your residential/office router below (most commonly <code className="text-cyan-300 font-mono">192.168.1.1</code> or <code className="text-cyan-300 font-mono">192.168.0.1</code>) to perform sweeps and router audits against your actual hardware.
                </p>
              </div>
            </div>
          )}

          {/* Quick 1-Click Router Presets */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Popular Router & Gateway Presets
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {presets.map((p) => {
                const isSelected = gatewayIp === p.gw && subnetCidr === p.cidr;
                return (
                  <button
                    key={p.gw}
                    type="button"
                    onClick={() => applyPreset(p.gw, p.cidr)}
                    className={`p-3 text-left rounded-xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? "bg-cyan-500/20 border-cyan-500/60 shadow-sm shadow-cyan-900/30"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="text-xs font-bold text-white">{p.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                    </div>
                    <div className="font-mono text-[11px] text-cyan-300">
                      GW: {p.gw} · {p.cidr}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">{p.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual IP / CIDR Configuration Form */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="text-xs font-semibold text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                Active IP Parameters
              </span>
              <button
                type="button"
                onClick={() => {
                  setAutoDetect(true);
                  setGatewayIp("127.0.0.1");
                  setSubnetCidr("Auto");
                }}
                className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors ${
                  autoDetect
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                    : "text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                {autoDetect ? "✓ Auto-Detect Enabled" : "Enable Auto-Detect"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Default Gateway IP Address
                </label>
                <input
                  type="text"
                  value={gatewayIp}
                  onChange={(e) => {
                    setGatewayIp(e.target.value);
                    setAutoDetect(false);
                  }}
                  placeholder="e.g. 192.168.1.1"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Target Subnet CIDR
                </label>
                <input
                  type="text"
                  value={subnetCidr}
                  onChange={(e) => {
                    setSubnetCidr(e.target.value);
                    setAutoDetect(false);
                  }}
                  placeholder="e.g. 192.168.1.0/24"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Active Adapter / Interface Name
              </label>
              <input
                type="text"
                value={ifaceName}
                onChange={(e) => setIfaceName(e.target.value)}
                placeholder="e.g. Wi-Fi, Ethernet, or eth0"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Detected Subnets from OS */}
          {detectedSubnets.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-300">
                  Host Adapters & Subnets Discovered
                </label>
                <button
                  type="button"
                  onClick={fetchInterfaces}
                  disabled={isLoadingInterfaces}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingInterfaces ? "animate-spin" : ""}`} />
                  <span>Refresh Adapters</span>
                </button>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {detectedSubnets.map((sub, idx) => {
                  const ipParts = sub.cidr.split("/")[0].split(".");
                  const suggestedGw = ipParts.length >= 3 ? `${ipParts.slice(0, 3).join(".")}.1` : "192.168.1.1";
                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Radio className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-mono text-cyan-300">{sub.cidr}</span>
                        <span className="text-[11px] text-slate-400">({sub.label})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSubnetCidr(sub.cidr);
                          const prefix = sub.cidr.split("/")[0].split(".").slice(0, 3).join(".");
                          const gw = (sub as any).gateway || `${prefix}.1`;
                          setGatewayIp(gw);
                          setIfaceName(sub.interface);
                          setAutoDetect(false);
                        }}
                        className="px-2 py-1 text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors flex items-center gap-1"
                      >
                        <span>Select</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Config</span>
            </button>

            <button
              type="button"
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-lg shadow-sm flex items-center gap-2 transition-colors"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Applying...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Save & Sweep Subnet</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

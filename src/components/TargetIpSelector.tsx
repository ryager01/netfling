import React, { useState, useRef, useEffect } from "react";
import {
  Laptop,
  Server,
  Smartphone,
  Search,
  ChevronDown,
  X,
  Check,
  ShieldAlert,
  Wifi,
  Radio,
} from "lucide-react";

export interface NetworkDevice {
  mac: string;
  ip: string;
  hostname: string;
  vendor: string;
  device_type?: string;
  nickname?: string;
  status?: string;
  is_quarantined?: number;
  is_trusted?: number;
  [key: string]: any;
}

interface TargetIpSelectorProps {
  value: string;
  onChange: (val: string, selectedDevice?: NetworkDevice) => void;
  devices: NetworkDevice[];
  placeholder?: string;
  label?: string;
  id?: string;
  className?: string;
  helpText?: string;
  allowDomainOrEmail?: boolean;
}

export const TargetIpSelector: React.FC<TargetIpSelectorProps> = ({
  value,
  onChange,
  devices = [],
  placeholder = "e.g. 192.168.1.1, 8.8.8.8, or hostname",
  label,
  id,
  className = "",
  helpText,
  allowDomainOrEmail = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "online" | "quarantined">("all");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredDevices = devices.filter((d) => {
    if (activeFilter === "online" && d.status !== "online") return false;
    if (activeFilter === "quarantined" && d.is_quarantined !== 1) return false;

    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    return (
      d.ip?.toLowerCase().includes(q) ||
      d.hostname?.toLowerCase().includes(q) ||
      d.nickname?.toLowerCase().includes(q) ||
      d.vendor?.toLowerCase().includes(q) ||
      d.mac?.toLowerCase().includes(q)
    );
  });

  const handleSelectDevice = (device: NetworkDevice) => {
    onChange(device.ip, device);
    setIsOpen(false);
  };

  const getDeviceIcon = (dev: NetworkDevice) => {
    const type = (dev.device_type || "").toLowerCase();
    if (type.includes("mobile") || type.includes("phone")) return <Smartphone className="w-3.5 h-3.5" />;
    if (type.includes("server") || type.includes("router") || type.includes("gateway")) return <Server className="w-3.5 h-3.5" />;
    if (type.includes("iot") || type.includes("camera")) return <Radio className="w-3.5 h-3.5" />;
    return <Laptop className="w-3.5 h-3.5" />;
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor={id} className="text-xs font-semibold text-slate-300">
            {label}
          </label>
          <span className="text-[11px] text-slate-400 font-mono">
            {devices.length} seen network {devices.length === 1 ? "device" : "devices"}
          </span>
        </div>
      )}

      {/* Main Input Row */}
      <div className="relative flex items-center">
        <input
          id={id}
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-900/90 border border-slate-700/80 hover:border-slate-600 focus:border-cyan-500 rounded-lg px-3.5 py-2.5 text-sm font-mono text-cyan-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 pr-28 transition-all"
        />

        {/* Action Buttons Inside Input */}
        <div className="absolute right-1.5 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 transition-colors"
              title="Clear target"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              isOpen
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600"
            }`}
            title="Pick from discovered devices"
          >
            <Wifi className="w-3 h-3 text-cyan-400" />
            <span>Select</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {helpText && <p className="text-[11px] text-slate-400 mt-1">{helpText}</p>}

      {/* Popover Dropdown of Discovered Devices */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full min-w-[320px] sm:min-w-[420px] right-0 bg-slate-900 border border-cyan-500/30 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header & Quick Search */}
          <div className="p-3 border-b border-slate-800 bg-slate-950/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                Select Discovered Device
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {filteredDevices.length} matched
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter by IP, hostname, vendor, MAC..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                autoFocus
              />
            </div>

            {/* Quick Filter Pills */}
            <div className="flex items-center gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  activeFilter === "all"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
                }`}
              >
                All ({devices.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("online")}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  activeFilter === "online"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
                }`}
              >
                Online ({devices.filter((d) => d.status === "online").length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("quarantined")}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  activeFilter === "quarantined"
                    ? "bg-red-500/20 text-red-300 border border-red-500/40"
                    : "bg-slate-800/80 text-slate-400 hover:text-slate-200"
                }`}
              >
                Quarantined ({devices.filter((d) => d.is_quarantined === 1).length})
              </button>
            </div>
          </div>

          {/* Device List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60">
            {filteredDevices.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No matching devices found in network inventory.
              </div>
            ) : (
              filteredDevices.map((device) => {
                const isSelected = value === device.ip;
                const isOnline = device.status === "online";
                const isQuarantined = device.is_quarantined === 1;

                return (
                  <button
                    key={device.mac || device.ip}
                    type="button"
                    onClick={() => handleSelectDevice(device)}
                    className={`w-full text-left p-2.5 px-3 flex items-center justify-between hover:bg-slate-800/70 transition-colors ${
                      isSelected ? "bg-cyan-950/40 border-l-2 border-cyan-400" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Status indicator */}
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isOnline ? "bg-emerald-400 ring-2 ring-emerald-400/20" : "bg-slate-500"
                        }`}
                        title={isOnline ? "Online" : "Offline"}
                      />

                      <div className="p-1.5 rounded bg-slate-800 text-slate-300 shrink-0">
                        {getDeviceIcon(device)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-slate-200 truncate">
                            {device.nickname || device.hostname || "Unknown Device"}
                          </span>
                          {isQuarantined && (
                            <span className="flex items-center gap-0.5 text-[9px] px-1 py-0.2 rounded bg-red-500/20 text-red-400 font-bold">
                              <ShieldAlert className="w-2.5 h-2.5" />
                              Quarantined
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                          <span className="text-cyan-400 font-semibold">{device.ip}</span>
                          <span>•</span>
                          <span className="truncate max-w-[110px]">{device.vendor || "Generic"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-right ml-2">
                      <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                        {device.mac}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer with Manual Quick Actions */}
          <div className="p-2 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Or type custom IP / host directly</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onChange("127.0.0.1");
                  setIsOpen(false);
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
              >
                Localhost
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange("8.8.8.8");
                  setIsOpen(false);
                }}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
              >
                8.8.8.8
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from "react";
import {
  CanvasNode,
  CanvasNodeType,
  CanvasGroup,
} from "../../types/canvas";
import {
  Plus,
  Server,
  Laptop,
  Globe,
  Cloud,
  Radio,
  Layers,
  Box,
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
  FolderPlus,
  ShieldAlert,
} from "lucide-react";

interface AssetCatalogSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onAddNode: (node: Partial<CanvasNode>) => void;
  groups: CanvasGroup[];
  inventoryDevices: Array<{
    ip: string;
    hostname: string;
    mac: string;
    vendor: string;
    device_type: string;
    status: string;
  }>;
  existingNodeIps: Set<string>;
}

export const AssetCatalogSidebar: React.FC<AssetCatalogSidebarProps> = ({
  isOpen,
  onToggle,
  onAddNode,
  groups,
  inventoryDevices,
  existingNodeIps,
}) => {
  const [activeTab, setActiveTab] = useState<"objects" | "inventory" | "groups">("objects");
  const [search, setSearch] = useState<string>("");

  // Quick Object Templates
  const objectTemplates: Array<{
    type: CanvasNodeType;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    defaultIp?: string;
  }> = [
    {
      type: "managed_device",
      label: "Managed Device",
      sublabel: "Agent installed (🟢 Green)",
      icon: <Laptop className="w-4 h-4 text-emerald-400" />,
      defaultIp: "192.168.1.150",
    },
    {
      type: "unmanaged_device",
      label: "Unmanaged Device",
      sublabel: "Rogue/external (🔴 Red)",
      icon: <Server className="w-4 h-4 text-red-400" />,
      defaultIp: "192.168.1.200",
    },
    {
      type: "network",
      label: "Network / Subnet",
      sublabel: "CIDR boundary",
      icon: <Radio className="w-4 h-4 text-amber-400" />,
      defaultIp: "192.168.1.0/24",
    },
    {
      type: "group",
      label: "Device Group",
      sublabel: "Collective policy container",
      icon: <Layers className="w-4 h-4 text-purple-400" />,
    },
    {
      type: "internet",
      label: "Public Internet",
      sublabel: "0.0.0.0/0 WAN",
      icon: <Globe className="w-4 h-4 text-cyan-400" />,
      defaultIp: "0.0.0.0/0",
    },
    {
      type: "external_service",
      label: "External Service",
      sublabel: "Cloud API / SaaS",
      icon: <Cloud className="w-4 h-4 text-sky-400" />,
      defaultIp: "api.cloud.external",
    },
    {
      type: "application",
      label: "Application Service",
      sublabel: "Container / Microservice",
      icon: <Box className="w-4 h-4 text-pink-400" />,
    },
  ];

  const filteredInventory = inventoryDevices.filter(
    (d) =>
      d.ip.toLowerCase().includes(search.toLowerCase()) ||
      d.hostname.toLowerCase().includes(search.toLowerCase()) ||
      d.vendor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className={`fixed inset-y-0 left-0 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 z-30 flex transition-all duration-300 font-sans shadow-2xl ${
        isOpen ? "w-80" : "w-12"
      }`}
      style={{ top: "57px" }}
    >
      {/* Collapsed State Bar */}
      {!isOpen ? (
        <div className="w-full flex flex-col items-center py-4 gap-4">
          <button
            onClick={onToggle}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Expand Canvas Asset Catalog"
          >
            <ChevronRight className="w-4 h-4 text-cyan-400" />
          </button>
          <div className="writing-vertical text-[11px] font-mono uppercase tracking-widest text-slate-500 select-none">
            Asset Catalog
          </div>
        </div>
      ) : (
        /* Expanded State Container */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">Asset Catalog</h2>
              <p className="text-[10px] font-mono text-slate-400">Drag or click to place on Canvas</p>
            </div>
            <button
              onClick={onToggle}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Subtabs */}
          <div className="grid grid-cols-3 p-2 gap-1 border-b border-slate-800 bg-slate-950/40 text-xs">
            <button
              onClick={() => setActiveTab("objects")}
              className={`py-1.5 rounded text-[11px] font-medium transition-all ${
                activeTab === "objects"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Objects
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`py-1.5 rounded text-[11px] font-medium transition-all flex items-center justify-center gap-1 ${
                activeTab === "inventory"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Discovered</span>
              {inventoryDevices.length > 0 && (
                <span className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-300">
                  {inventoryDevices.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("groups")}
              className={`py-1.5 rounded text-[11px] font-medium transition-all ${
                activeTab === "groups"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Groups
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {activeTab === "objects" && (
              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase text-slate-500 font-semibold mb-1">
                  Supported Canvas Entities
                </div>
                {objectTemplates.map((template, idx) => (
                  <div
                    key={idx}
                    onClick={() =>
                      onAddNode({
                        label: template.label,
                        type: template.type,
                        ip: template.defaultIp,
                        status: template.type === "unmanaged_device" ? "unmanaged" : "managed",
                      })
                    }
                    className="group cursor-pointer p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-cyan-500/40 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-700/60 group-hover:border-cyan-500/30">
                        {template.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white group-hover:text-cyan-300 truncate">
                          {template.label}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {template.sublabel}
                        </div>
                      </div>
                    </div>
                    <button className="p-1 rounded-md bg-slate-800 group-hover:bg-cyan-500 group-hover:text-slate-950 text-slate-400 transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "inventory" && (
              <div className="space-y-2">
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search discovered LAN devices..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {filteredInventory.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    No matching devices found in inventory.
                  </div>
                ) : (
                  filteredInventory.map((dev) => {
                    const isAlreadyOnCanvas = existingNodeIps.has(dev.ip);
                    return (
                      <div
                        key={dev.ip}
                        className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                          isAlreadyOnCanvas
                            ? "bg-slate-950/30 border-slate-800/40 opacity-70"
                            : "bg-slate-950/60 hover:bg-slate-800/80 border-slate-800/80 hover:border-emerald-500/40 cursor-pointer"
                        }`}
                        onClick={() => {
                          if (!isAlreadyOnCanvas) {
                            onAddNode({
                              label: dev.hostname || dev.vendor || dev.ip,
                              type: "managed_device",
                              ip: dev.ip,
                              status: "managed",
                            });
                          }
                        }}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-white truncate">
                              {dev.hostname || dev.vendor || "Device"}
                            </span>
                            {isAlreadyOnCanvas && (
                              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1 rounded border border-emerald-800/40">
                                Placed
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 truncate">
                            {dev.ip} · {dev.mac.slice(0, 8)}
                          </div>
                        </div>

                        {!isAlreadyOnCanvas && (
                          <button className="p-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500 hover:text-slate-950 transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === "groups" && (
              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase text-slate-500 font-semibold mb-1">
                  Active Canvas Groups
                </div>
                {groups.map((group) => (
                  <div
                    key={group.id}
                    onClick={() =>
                      onAddNode({
                        label: group.name,
                        type: "group",
                        groupId: group.id,
                        groupName: group.name,
                      })
                    }
                    className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-purple-500/40 cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-800/40 text-purple-400">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          {group.name}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {group.members?.length || 0} members · {group.policyColor || group.color || "Policy"}
                        </div>
                      </div>
                    </div>
                    <button className="p-1 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500 hover:text-white transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

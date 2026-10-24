import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Radio,
  Wifi,
  Power,
  Search,
  RefreshCw,
  AlertTriangle,
  Lock,
  Unlock,
  Key,
  Globe,
  Tag,
  Clock,
  Laptop,
  Server,
  Smartphone,
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  Edit2,
  Check,
  Plus,
  ExternalLink,
} from "lucide-react";
import { TargetIpSelector, NetworkDevice } from "./TargetIpSelector";

interface QuarantineViewProps {
  devices: NetworkDevice[];
  onRefresh: () => void;
  onUpdateQuarantine: (mac: string, quarantined: boolean, reason?: string) => Promise<void>;
  onTogglePause: (mac: string, currentPaused: boolean) => Promise<void>;
  onSelectDeviceForScan: (ip: string) => void;
  onInspectDevice: (device: NetworkDevice) => void;
  showToast: (msg: string) => void;
}

export const QuarantineView: React.FC<QuarantineViewProps> = ({
  devices,
  onRefresh,
  onUpdateQuarantine,
  onTogglePause,
  onSelectDeviceForScan,
  onInspectDevice,
  showToast,
}) => {
  const [filterMode, setFilterMode] = useState<"all" | "online" | "offline">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isQuarantineModalOpen, setIsQuarantineModalOpen] = useState(false);
  const [selectedDeviceToQuarantine, setSelectedDeviceToQuarantine] = useState<string>("");
  const [quarantineReasonInput, setQuarantineReasonInput] = useState<string>(
    "Suspicious network behavior or unapproved hardware endpoint"
  );
  const [editingReasonMac, setEditingReasonMac] = useState<string | null>(null);
  const [editedReason, setEditedReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter quarantined devices
  const quarantinedDevices = devices.filter((d) => d.is_quarantined === 1);
  const onlineQuarantined = quarantinedDevices.filter((d) => d.status === "online");
  const offlineQuarantined = quarantinedDevices.filter((d) => d.status !== "online");

  const displayedDevices = quarantinedDevices.filter((d) => {
    if (filterMode === "online" && d.status !== "online") return false;
    if (filterMode === "offline" && d.status === "online") return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.ip?.toLowerCase().includes(q) ||
      d.hostname?.toLowerCase().includes(q) ||
      d.nickname?.toLowerCase().includes(q) ||
      d.vendor?.toLowerCase().includes(q) ||
      d.mac?.toLowerCase().includes(q) ||
      d.quarantine_reason?.toLowerCase().includes(q)
    );
  });

  const handleManualQuarantine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeviceToQuarantine) {
      showToast("Please choose a device to place into quarantine.");
      return;
    }
    const dev = devices.find((d) => d.ip === selectedDeviceToQuarantine || d.mac === selectedDeviceToQuarantine);
    if (!dev) {
      showToast("Device not found in inventory.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdateQuarantine(dev.mac, true, quarantineReasonInput);
      setIsQuarantineModalOpen(false);
      setSelectedDeviceToQuarantine("");
      setQuarantineReasonInput("Suspicious network behavior or unapproved hardware endpoint");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveReason = async (mac: string) => {
    if (!editedReason.trim()) return;
    setIsSubmitting(true);
    try {
      await onUpdateQuarantine(mac, true, editedReason.trim());
      setEditingReasonMac(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDeviceIcon = (dev: NetworkDevice) => {
    const type = (dev.device_type || "").toLowerCase();
    if (type.includes("mobile") || type.includes("phone")) return <Smartphone className="w-5 h-5 text-red-400" />;
    if (type.includes("server") || type.includes("router")) return <Server className="w-5 h-5 text-red-400" />;
    return <Laptop className="w-5 h-5 text-red-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Executive Report Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-red-500/30 rounded-2xl p-5 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 shadow-inner">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Quarantine Command Deck
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-mono border border-red-500/30">
                  {quarantinedDevices.length} ISOLATED
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Zero-trust endpoint isolation vault: Monitor active online and dormant offline quarantined devices.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setIsQuarantineModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-950 transition-all border border-red-400/40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Quarantine Device</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/70 border border-red-500/30 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Quarantined</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-400">{quarantinedDevices.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Total endpoints held in security isolation</div>
        </div>

        <div className="bg-slate-900/70 border border-red-500/40 rounded-xl p-4 shadow-sm bg-gradient-to-br from-red-950/20 to-transparent">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Online Quarantined</span>
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-300">{onlineQuarantined.length}</div>
          <div className="text-[11px] text-red-400 font-medium mt-1">Active network endpoints under live block</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Offline Quarantined</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-300">{offlineQuarantined.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Dormant endpoints retained in jail registry</div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Internet Policy</span>
            <Lock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-lg font-bold font-mono text-cyan-300">
            {quarantinedDevices.filter((d) => d.is_paused).length} Traffic Paused
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Enforced gateway drop rules</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
        {/* Pills */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterMode === "all"
                ? "bg-red-500/20 text-red-300 border border-red-500/40"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            All Quarantined ({quarantinedDevices.length})
          </button>
          <button
            onClick={() => setFilterMode("online")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterMode === "online"
                ? "bg-red-600/30 text-red-200 border border-red-500/50 shadow-sm"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Online ({onlineQuarantined.length})</span>
          </button>
          <button
            onClick={() => setFilterMode("offline")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterMode === "offline"
                ? "bg-slate-700 text-slate-200 border border-slate-600"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>Offline ({offlineQuarantined.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search quarantined devices..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* Main Quarantined Devices Report */}
      {displayedDevices.length === 0 ? (
        <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white">
            {quarantinedDevices.length === 0
              ? "All Network Endpoints Secure & Verified"
              : "No Quarantined Devices Match Filter Criteria"}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-5">
            {quarantinedDevices.length === 0
              ? "No rogue devices, intruders, or suspicious hardware endpoints are currently held in quarantine. You can isolate any device whenever unverified traffic is observed."
              : "Try switching between the All, Online, or Offline tabs, or adjusting your search keyword."}
          </p>
          {quarantinedDevices.length === 0 && (
            <button
              onClick={() => setIsQuarantineModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/40 text-xs font-semibold transition-all"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Quarantine a Suspicious Device</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displayedDevices.map((dev) => {
            const isOnline = dev.status === "online";
            const isPaused = Boolean(dev.is_paused);
            const isEditingReason = editingReasonMac === dev.mac;

            return (
              <div
                key={dev.mac}
                className={`bg-slate-900/90 border rounded-2xl p-5 transition-all shadow-lg ${
                  isOnline
                    ? "border-red-500/50 shadow-red-950/20 hover:border-red-400"
                    : "border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Device Header & Identity */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 shrink-0 mt-0.5">
                      {getDeviceIcon(dev)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Online/Offline Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase font-mono ${
                            isOnline
                              ? "bg-red-500/20 text-red-300 border border-red-500/40"
                              : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isOnline ? "bg-red-400 animate-pulse" : "bg-slate-500"
                            }`}
                          />
                          {isOnline ? "ONLINE THREAT" : "OFFLINE / DORMANT"}
                        </span>

                        <span className="text-base font-bold text-white truncate">
                          {dev.nickname || dev.hostname || "Unlabeled Endpoint"}
                        </span>

                        {isPaused && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1">
                            <Pause className="w-2.5 h-2.5" />
                            Traffic Blocked
                          </span>
                        )}
                      </div>

                      {/* Technical Specs & Details */}
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-400 font-mono mt-1.5">
                        <span className="text-cyan-400 font-semibold">{dev.ip}</span>
                        <span>•</span>
                        <span>{dev.mac}</span>
                        <span>•</span>
                        <span className="text-slate-300 font-sans">{dev.vendor || "Unknown Vendor"}</span>
                        <span>•</span>
                        <span className="text-slate-400 font-sans">
                          Last seen: {new Date(dev.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Quarantine Reason Callout */}
                      <div className="mt-3 bg-red-950/30 border border-red-500/30 rounded-xl p-3 text-xs">
                        <div className="flex items-center justify-between text-red-400 font-semibold mb-1">
                          <span className="flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Quarantine Isolation Reason:
                          </span>
                          {!isEditingReason && (
                            <button
                              onClick={() => {
                                setEditingReasonMac(dev.mac);
                                setEditedReason(dev.quarantine_reason || "");
                              }}
                              className="text-[10px] text-red-300 hover:text-white flex items-center gap-1 hover:underline"
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </button>
                          )}
                        </div>

                        {isEditingReason ? (
                          <div className="flex items-center gap-2 mt-1.5">
                            <input
                              type="text"
                              value={editedReason}
                              onChange={(e) => setEditedReason(e.target.value)}
                              className="w-full bg-slate-900 border border-red-500 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
                              placeholder="Enter reason for isolation..."
                            />
                            <button
                              onClick={() => handleSaveReason(dev.mac)}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingReasonMac(null)}
                              className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <p className="text-slate-300 italic">
                            "{dev.quarantine_reason || "Flagged as unverified or high risk."}"
                          </p>
                        )}
                      </div>

                      {/* Default Credentials Hint if Present */}
                      {dev.default_credentials?.has_defaults && (
                        <div className="mt-2.5 flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono">
                          <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>
                            Factory Credentials Known: <strong>{dev.default_credentials.default_username}</strong> /{" "}
                            <strong>{dev.default_credentials.default_password}</strong>
                          </span>
                        </div>
                      )}

                      {/* Custom Metadata Badges */}
                      {dev.custom_metadata && Object.keys(dev.custom_metadata).length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {Object.entries(dev.custom_metadata).map(([k, v]) => (
                            <span
                              key={k}
                              className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono"
                            >
                              {k}: <strong className="text-cyan-300">{String(v)}</strong>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Quick Action Controls */}
                  <div className="flex flex-wrap lg:flex-col items-stretch gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-800 pt-3 lg:pt-0 lg:pl-4">
                    {/* Release from Quarantine */}
                    <button
                      onClick={() => onUpdateQuarantine(dev.mac, false)}
                      className="flex-1 lg:flex-none px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                      title="Release device from quarantine back to network inventory"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Release from Quarantine</span>
                    </button>

                    {/* Pause / Resume Internet */}
                    <button
                      onClick={() => onTogglePause(dev.mac, isPaused)}
                      className={`flex-1 lg:flex-none px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 border ${
                        isPaused
                          ? "bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border-amber-500/40"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                      }`}
                    >
                      {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                      <span>{isPaused ? "Resume Internet" : "Cut Internet (Pause)"}</span>
                    </button>

                    {/* Deep Scan Target */}
                    <button
                      onClick={() => onSelectDeviceForScan(dev.ip)}
                      className="flex-1 lg:flex-none px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center justify-center gap-1.5"
                    >
                      <Globe className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Scan Ports / Inspect</span>
                    </button>

                    {/* Full Device Inspector */}
                    <button
                      onClick={() => onInspectDevice(dev)}
                      className="flex-1 lg:flex-none px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center justify-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Edit Device Meta</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Quarantine Modal */}
      {isQuarantineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-red-500/40 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-base">
                <span className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
                  <ShieldAlert className="w-5 h-5" />
                </span>
                Quarantine Network Endpoint
              </div>
              <button
                onClick={() => setIsQuarantineModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualQuarantine} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Select Target Endpoint:
                </label>
                <TargetIpSelector
                  value={selectedDeviceToQuarantine}
                  onChange={(ip) => setSelectedDeviceToQuarantine(ip)}
                  devices={devices.filter((d) => d.is_quarantined !== 1)}
                  placeholder="Select any seen network device or enter IP"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Quarantine Reason & Incident Notes:
                </label>
                <textarea
                  rows={3}
                  value={quarantineReasonInput}
                  onChange={(e) => setQuarantineReasonInput(e.target.value)}
                  placeholder="Provide rationale for security isolation (e.g. rogue mac, unauthorized port 8080 exposure, unknown vendor)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-xl text-xs text-red-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span>
                  Placing an endpoint in quarantine will flag it with high-priority intrusion alerts, log
                  audit entries, and restrict normal network permissions.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsQuarantineModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedDeviceToQuarantine}
                  className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-red-950 flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Enforce Quarantine</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

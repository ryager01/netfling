import React, { useState, useEffect, useRef } from "react";
import {
  Terminal as TerminalIcon,
  Play,
  RotateCcw,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Trash2,
  HelpCircle,
  Activity,
  Layers,
  ShieldAlert,
  Radio,
  Eye,
  Gauge,
  Sparkles,
  CornerDownLeft,
} from "lucide-react";

interface TerminalHistoryEntry {
  id: string;
  command: string;
  output: string;
  exitCode: number;
  timestamp: string;
}

interface EmbeddedTerminalProps {
  showToast: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

const PRESET_COMMANDS = [
  { label: "Help Guide", cmd: "help", icon: HelpCircle, color: "text-slate-400" },
  { label: "List Devices", cmd: "devices", icon: Radio, color: "text-emerald-400" },
  { label: "DNS Hijack Audit", cmd: "dnshijack", icon: Activity, color: "text-cyan-400" },
  { label: "RAT Trojan Check", cmd: "rat-check", icon: ShieldAlert, color: "text-red-400" },
  { label: "Hidden Cameras", cmd: "cameras", icon: Eye, color: "text-purple-400" },
  { label: "Discovery Sweep", cmd: "scan", icon: Sparkles, color: "text-amber-400" },
  { label: "Speedtest", cmd: "speedtest", icon: Gauge, color: "text-emerald-400" },
  { label: "System Status", cmd: "status", icon: Activity, color: "text-indigo-400" },
  { label: "Clear Screen", cmd: "clear", icon: Trash2, color: "text-slate-500" },
];

export const EmbeddedTerminal: React.FC<EmbeddedTerminalProps> = ({
  showToast,
  onNavigateTab,
}) => {
  const [inputCommand, setInputCommand] = useState<string>("");
  const [history, setHistory] = useState<TerminalHistoryEntry[]>([
    {
      id: "init-0",
      command: "welcome",
      output: `NetSentinel Enterprise Command Shell [Version 2.4.0-audit]
(c) 2026 NetSentinel Network Intelligence. All rights reserved.

Connected to local engine runtime (127.0.0.1:3000).
Type 'help' for command reference or click preset macro buttons below.
Available tools: discovery scan, ping, traceroute, dnshijack, rat-check, cameras, ports, speedtest.`,
      exitCode: 0,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [isCrtEffect, setIsCrtEffect] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new entries
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isExecuting]);

  // Keep input focused when clicking the terminal body
  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  const executeCommand = async (cmdToRun: string) => {
    const trimmed = cmdToRun.trim();
    if (!trimmed) return;

    // Handle 'clear' locally
    if (trimmed.toLowerCase() === "clear" || trimmed.toLowerCase() === "cls") {
      setHistory([]);
      setInputCommand("");
      return;
    }

    // Add to command history buffer
    setCommandHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);
    setInputCommand("");
    setIsExecuting(true);

    try {
      const res = await fetch("/api/terminal/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: trimmed }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.output === "__CLEAR__") {
          setHistory([]);
        } else {
          setHistory((prev) => [
            ...prev,
            {
              id: `${Date.now()}-${Math.random()}`,
              command: trimmed,
              output: data.output || "Completed with no output.",
              exitCode: data.exitCode ?? 0,
              timestamp: new Date().toLocaleTimeString(),
            },
          ]);
        }
      } else {
        setHistory((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            command: trimmed,
            output: `Error executing '${trimmed}': Server returned HTTP ${res.status}`,
            exitCode: 1,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    } catch (err: any) {
      setHistory((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          command: trimmed,
          output: `Fatal connection error: ${err.message}`,
          exitCode: 1,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setIsExecuting(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      executeCommand(inputCommand);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex =
        historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInputCommand(commandHistory[nextIndex] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex >= commandHistory.length) {
        setHistoryIndex(-1);
        setInputCommand("");
      } else {
        setHistoryIndex(nextIndex);
        setInputCommand(commandHistory[nextIndex] || "");
      }
    }
  };

  const handleCopyLog = () => {
    const fullLog = history
      .map((h) => `[${h.timestamp}] $ ${h.command}\n${h.output}`)
      .join("\n\n");
    navigator.clipboard.writeText(fullLog);
    showToast("Terminal session log copied to clipboard");
  };

  return (
    <div
      className={`space-y-4 font-sans ${
        isFullscreen ? "fixed inset-0 z-50 p-6 bg-slate-950 overflow-y-auto" : ""
      }`}
    >
      {/* Top Header Card */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
              Command Execution Console & Interactive Shell
            </div>
            <h1 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
              <TerminalIcon className="w-5 h-5 text-cyan-400" />
              <span>NetSentinel Interactive Embedded Terminal</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Direct CLI interaction with Python network engines, DNS hijacking probes, RAT scanners, and system tools
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCrtEffect(!isCrtEffect)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors ${
                isCrtEffect
                  ? "bg-purple-950/40 border-purple-500/40 text-purple-300"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
              }`}
              title="Toggle Retro CRT Scanlines"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>CRT Scanlines</span>
            </button>

            <button
              onClick={handleCopyLog}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
              title="Copy Terminal History"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Log</span>
            </button>

            <button
              onClick={() => setHistory([])}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-red-950/40 hover:text-red-300 text-slate-400 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
              title="Clear Terminal Display"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Terminal"}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Quick Launch Command Macro Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pt-4 mt-4 border-t border-slate-800/80 no-scrollbar">
          <span className="text-[11px] font-mono text-slate-500 uppercase shrink-0 font-bold">
            Macros:
          </span>
          {PRESET_COMMANDS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => executeCommand(item.cmd)}
                disabled={isExecuting}
                className="px-2.5 py-1 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-mono text-slate-300 flex items-center gap-1.5 shrink-0 transition-colors active:scale-95 disabled:opacity-50"
              >
                <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Terminal Viewport */}
      <div
        onClick={handleTerminalClick}
        className={`relative bg-black rounded-xl border border-slate-800 shadow-2xl overflow-hidden font-mono text-xs flex flex-col cursor-text ${
          isFullscreen ? "h-[calc(100vh-200px)]" : "h-[540px]"
        }`}
      >
        {/* Terminal Header Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-slate-400 select-none shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="ml-2 text-[11px] font-bold text-slate-300">
              root@netsentinel:~ (bash interactive)
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
            <span>Encoding: UTF-8</span>
            <span>·</span>
            <span>Host: 127.0.0.1:3000</span>
          </div>
        </div>

        {/* CRT Scanline Overlay */}
        {isCrtEffect && (
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.35)_50%)] bg-[length:100%_4px] pointer-events-none z-10 opacity-70" />
        )}

        {/* Terminal Output Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-slate-200 selection:bg-cyan-500 selection:text-black">
          {history.map((entry) => (
            <div key={entry.id} className="space-y-1">
              {/* Command Prompt Line */}
              {entry.command !== "welcome" && (
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <span className="text-emerald-400">netsentinel@sentinel-lan:~$</span>
                  <span className="text-white">{entry.command}</span>
                  <span className="text-[10px] text-slate-600 ml-auto font-normal">
                    {entry.timestamp}
                  </span>
                </div>
              )}

              {/* Command Output Block */}
              <div
                className={`whitespace-pre-wrap leading-relaxed ${
                  entry.exitCode !== 0
                    ? "text-red-400 bg-red-950/20 p-2.5 rounded border border-red-500/30"
                    : entry.command === "welcome"
                    ? "text-cyan-300/90 font-mono"
                    : "text-slate-300 font-mono"
                }`}
              >
                {entry.output}
              </div>
            </div>
          ))}

          {/* Running Spinner indicator */}
          {isExecuting && (
            <div className="flex items-center gap-2 text-cyan-400 py-1">
              <span className="text-emerald-400">netsentinel@sentinel-lan:~$</span>
              <span className="animate-pulse">Executing engine subshell...</span>
              <span className="inline-block w-2 h-4 bg-cyan-400 animate-ping" />
            </div>
          )}

          <div ref={terminalEndRef} />
        </div>

        {/* Active Command Input Bar */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center gap-2 shrink-0 z-20">
          <span className="text-emerald-400 font-bold shrink-0 text-xs">
            netsentinel@sentinel-lan:~$
          </span>
          <input
            ref={inputRef}
            type="text"
            value={inputCommand}
            onChange={(e) => setInputCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isExecuting}
            placeholder={isExecuting ? "Command in progress..." : "Type command (e.g. dnshijack, rat-check, scan, devices, ping 8.8.8.8)..."}
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-600 focus:outline-none font-mono caret-cyan-400"
            autoFocus
          />
          <button
            onClick={() => executeCommand(inputCommand)}
            disabled={!inputCommand.trim() || isExecuting}
            className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs rounded transition-colors flex items-center gap-1 shrink-0"
          >
            <span>Execute</span>
            <CornerDownLeft className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

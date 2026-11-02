import React, { useState } from "react";
import { Sparkles, ArrowRight, Loader2, HelpCircle, Check, AlertCircle } from "lucide-react";
import { CanvasRelationship, CanvasNode, CanvasGroup } from "../../types/canvas";

interface AIPolicyCommandBarProps {
  nodes: CanvasNode[];
  groups: CanvasGroup[];
  onApplyPolicyProposal: (proposal: {
    source: string;
    destination: string;
    ports: string[];
    protocol: string;
    direction: "one_way" | "bidirectional" | "reverse";
    explanation: string;
    confidence: number;
  }) => void;
}

export const AIPolicyCommandBar: React.FC<AIPolicyCommandBarProps> = ({
  nodes,
  groups,
  onApplyPolicyProposal,
}) => {
  const [prompt, setPrompt] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
    proposal?: any;
  } | null>(null);

  const samplePrompts = [
    "Allow workstations to access web servers on HTTPS only.",
    "Developers need SSH access to all Linux servers.",
    "Firewall --- 443:8443 ---> ReverseProxy",
    "ReverseProxy --- 8443:8080 ---> WebApp",
    "WebServer --- 80:8080 ---> WebServer",
    "Redirect external port 8080 to internal 80 on WebApp",
  ];

  const handleExecuteIntent = async (textToRun?: string) => {
    const query = (textToRun || prompt).trim();
    if (!query) return;

    setIsLoading(true);
    setLastResult(null);

    try {
      const response = await fetch("/api/canvas/ai-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: query,
          context: {
            nodes: nodes.map((n) => ({ id: n.id, label: n.label, type: n.type })),
            groups: groups.map((g) => ({ id: g.id, name: g.name })),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`AI policy server returned ${response.status}`);
      }

      const data = await response.json();
      const proposalObj = data.proposed_relationship || data.proposal;
      if (data.success && proposalObj) {
        const normalizedProposal = {
          source: proposalObj.source_label || proposalObj.source || "Workstations",
          destination: proposalObj.target_label || proposalObj.destination || "Servers",
          ports: proposalObj.allowed_ports || proposalObj.ports || ["443"],
          protocol: proposalObj.protocol || "tcp",
          direction: proposalObj.direction || "one_way",
          explanation: data.explanation || proposalObj.explanation || "Intent successfully synthesized.",
          confidence: data.confidence_score ?? proposalObj.confidence ?? 0.95,
        };

        setLastResult({
          success: true,
          message: normalizedProposal.explanation,
          proposal: normalizedProposal,
        });
        onApplyPolicyProposal(normalizedProposal);
        setPrompt("");
      } else {
        setLastResult({
          success: false,
          message: data.error || "Could not synthesize policy intent.",
        });
      }
    } catch (err: any) {
      setLastResult({
        success: false,
        message: err.message || "Failed to communicate with AI policy engine.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-lg backdrop-blur-md">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Left: Input Box */}
        <div className="flex-1 relative flex items-center">
          <div className="absolute left-3.5 text-purple-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleExecuteIntent();
            }}
            placeholder="Type natural language intent: e.g. 'Allow workstations to access web servers on HTTPS only'..."
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg pl-10 pr-24 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors font-sans"
          />
          <button
            onClick={() => handleExecuteIntent()}
            disabled={isLoading || !prompt.trim()}
            className="absolute right-1.5 px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <span>Synthesize</span>
                <ArrowRight className="w-3 h-3" />
              </>
            )}
          </button>
        </div>

        {/* Right: Quick Prompts Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 shrink-0">
          <span className="text-[10px] font-mono text-slate-500 shrink-0">Presets:</span>
          {[
            { label: "Workstations → Web (443)", text: samplePrompts[0] },
            { label: "Devs → Linux (22)", text: samplePrompts[1] },
            { label: "NAT 443:8443", text: samplePrompts[2] },
            { label: "Loopback 80:8080", text: samplePrompts[4] },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPrompt(item.text);
                handleExecuteIntent(item.text);
              }}
              className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] whitespace-nowrap transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result notification banner */}
      {lastResult && (
        <div
          className={`mt-2 p-2 rounded-lg border text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200 ${
            lastResult.success
              ? "bg-purple-950/40 border-purple-500/40 text-purple-200"
              : "bg-red-950/40 border-red-500/40 text-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {lastResult.success ? (
              <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
            )}
            <span className="leading-snug">{lastResult.message}</span>
          </div>
          {lastResult.proposal && (
            <span className="text-[10px] font-mono bg-purple-900/60 px-1.5 py-0.5 rounded border border-purple-700/60 shrink-0">
              Confidence: {Math.round(lastResult.proposal.confidence * 100)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
};

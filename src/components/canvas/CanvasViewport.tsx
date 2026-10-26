import React, { useState, useRef, useEffect } from "react";
import { CanvasNode, CanvasRelationship, CanvasGroup } from "../../types/canvas";
import { CanvasNodeCard } from "./CanvasNodeCard";
import { CanvasRelationshipEdge } from "./CanvasRelationshipEdge";
import { ZoomIn, ZoomOut, Maximize2, Move, MousePointer, Plus } from "lucide-react";

interface CanvasViewportProps {
  nodes: CanvasNode[];
  relationships: CanvasRelationship[];
  groups: CanvasGroup[];
  selectedNode: CanvasNode | null;
  selectedRelationship: CanvasRelationship | null;
  onSelectNode: (node: CanvasNode | null) => void;
  onSelectRelationship: (rel: CanvasRelationship | null) => void;
  onUpdateNodePosition: (id: string, x: number, y: number) => void;
  onCreateRelationship: (sourceId: string, targetId: string) => void;
  onDeleteSelected: () => void;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  nodes,
  relationships,
  groups,
  selectedNode,
  selectedRelationship,
  onSelectNode,
  onSelectRelationship,
  onUpdateNodePosition,
  onCreateRelationship,
  onDeleteSelected,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Viewport transformation: pan and zoom
  const [scale, setScale] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 120, y: 80 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dragging node state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragNodeInitialPos, setDragNodeInitialPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  // Connecting line interactive state
  const [connectingSource, setConnectingSource] = useState<CanvasNode | null>(null);
  const [mouseCanvasPos, setMouseCanvasPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Handle Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    const newScale = e.deltaY < 0 ? scale * zoomFactor : scale / zoomFactor;
    const clampedScale = Math.min(Math.max(newScale, 0.4), 2.2);
    setScale(clampedScale);
  };

  // Convert client mouse coordinates to Canvas coordinates
  const clientToCanvasCoord = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - offset.x) / scale;
    const y = (clientY - rect.top - offset.y) / scale;
    return { x, y };
  };

  // Mouse Down on Canvas (Start Pan or Deselect)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && (e.target === containerRef.current || (e.target as any).tagName === "svg")) {
      onSelectNode(null);
      onSelectRelationship(null);
      if (connectingSource) {
        setConnectingSource(null);
      }
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    } else if (e.button === 1 || e.button === 2) {
      // Middle or right click always pans
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  // Mouse Move
  const handleMouseMove = (e: React.MouseEvent) => {
    const canvasPos = clientToCanvasCoord(e.clientX, e.clientY);
    setMouseCanvasPos(canvasPos);

    if (isPanning) {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (draggingNodeId) {
      const dx = (e.clientX - dragStartPos.x) / scale;
      const dy = (e.clientY - dragStartPos.y) / scale;
      const newX = Math.round((dragNodeInitialPos.x + dx) / 10) * 10;
      const newY = Math.round((dragNodeInitialPos.y + dy) / 10) * 10;
      onUpdateNodePosition(draggingNodeId, newX, newY);
    }
  };

  // Mouse Up
  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Start Node Dragging
  const handleNodeDragStart = (node: CanvasNode, e: React.MouseEvent) => {
    e.stopPropagation();
    if (connectingSource) {
      if (connectingSource.id !== node.id) {
        onCreateRelationship(connectingSource.id, node.id);
      }
      setConnectingSource(null);
      return;
    }
    setDraggingNodeId(node.id);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setDragNodeInitialPos({ x: node.x, y: node.y });
    onSelectNode(node);
    onSelectRelationship(null);
  };

  // Start Connecting Line
  const handleStartConnect = (node: CanvasNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setConnectingSource(node);
  };

  // Key shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setConnectingSource(null);
        onSelectNode(null);
        onSelectRelationship(null);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA"
        ) {
          onDeleteSelected();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [connectingSource, onDeleteSelected, onSelectNode, onSelectRelationship]);

  // Map nodes to easy ID lookup
  const nodeMap = new Map<string, CanvasNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative w-full h-full bg-slate-950 overflow-hidden select-none cursor-default"
      style={{
        backgroundImage: `
          radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.12) 1px, transparent 0)
        `,
        backgroundSize: `${28 * scale}px ${28 * scale}px`,
        backgroundPosition: `${offset.x}px ${offset.y}px`,
      }}
    >
      {/* Interactive Transform Layer */}
      <div
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          transformOrigin: "0 0",
        }}
        className="absolute inset-0 pointer-events-none"
      >
        {/* SVG Relationship Edge Layer */}
        <svg className="absolute inset-0 w-[8000px] h-[8000px] overflow-visible pointer-events-auto">
          {/* Render All Relationships */}
          {relationships.map((rel) => {
            const src = nodeMap.get(rel.sourceId);
            const dst = nodeMap.get(rel.targetId);
            if (!src || !dst) return null;
            return (
              <CanvasRelationshipEdge
                key={rel.id}
                relationship={rel}
                sourceNode={src}
                targetNode={dst}
                isSelected={selectedRelationship?.id === rel.id}
                onSelect={(r) => {
                  onSelectRelationship(r);
                  onSelectNode(null);
                }}
                scale={scale}
              />
            );
          })}

          {/* Interactive Dragging Guide Line when creating relationship */}
          {connectingSource && (
            <line
              x1={connectingSource.x + 120}
              y1={connectingSource.y + 55}
              x2={mouseCanvasPos.x}
              y2={mouseCanvasPos.y}
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeDasharray="6,4"
              className="animate-pulse"
            />
          )}
        </svg>

        {/* DOM Node Cards Layer */}
        <div className="absolute inset-0 pointer-events-auto">
          {nodes.map((node) => (
            <CanvasNodeCard
              key={node.id}
              node={node}
              isSelected={selectedNode?.id === node.id}
              onSelect={(n) => {
                if (connectingSource && connectingSource.id !== n.id) {
                  onCreateRelationship(connectingSource.id, n.id);
                  setConnectingSource(null);
                } else {
                  onSelectNode(n);
                  onSelectRelationship(null);
                }
              }}
              onStartConnect={handleStartConnect}
              onDragStart={handleNodeDragStart}
            />
          ))}
        </div>
      </div>

      {/* Floating Canvas Navigation & Zoom Controls */}
      <div className="absolute bottom-5 right-5 flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-xl p-1.5 shadow-xl backdrop-blur-md z-30">
        <button
          onClick={() => setScale((s) => Math.min(s * 1.15, 2.2))}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono text-cyan-400 px-2 select-none">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale((s) => Math.max(s / 1.15, 0.4))}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-slate-800 mx-1" />
        <button
          onClick={() => {
            setScale(1);
            setOffset({ x: 120, y: 80 });
          }}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          title="Reset Viewport to Origin"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Connecting banner alert */}
      {connectingSource && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-cyan-500/20 border border-cyan-500/50 backdrop-blur-md text-cyan-200 text-xs px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 z-40 animate-in fade-in slide-in-from-top-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>
            Click target node to create relationship from{" "}
            <strong className="text-white">{connectingSource.label}</strong>
          </span>
          <button
            onClick={() => setConnectingSource(null)}
            className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 ml-2"
          >
            Esc to Cancel
          </button>
        </div>
      )}
    </div>
  );
};

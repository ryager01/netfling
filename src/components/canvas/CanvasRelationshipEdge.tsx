import React from "react";
import { CanvasRelationship, CanvasNode } from "../../types/canvas";

interface CanvasRelationshipEdgeProps {
  relationship: CanvasRelationship;
  sourceNode: CanvasNode;
  targetNode: CanvasNode;
  isSelected: boolean;
  onSelect: (rel: CanvasRelationship) => void;
  scale: number;
}

export const CanvasRelationshipEdge: React.FC<CanvasRelationshipEdgeProps> = ({
  relationship,
  sourceNode,
  targetNode,
  isSelected,
  onSelect,
}) => {
  // Center coordinates of cards (node card width ~240px, height ~110px)
  const nodeWidth = 240;
  const nodeHeight = 110;

  const sx = sourceNode.x + nodeWidth / 2;
  const sy = sourceNode.y + nodeHeight / 2;
  const tx = targetNode.x + nodeWidth / 2;
  const ty = targetNode.y + nodeHeight / 2;

  // Calculate angle and distance
  const dx = tx - sx;
  const dy = ty - sy;
  const distance = Math.hypot(dx, dy);

  if (distance === 0) return null;

  // Calculate edge intersection with bounding boxes
  const ux = dx / distance;
  const uy = dy / distance;

  // Offset start and end points so lines dock nicely at card borders
  const startX = sx + ux * (nodeWidth / 2.2);
  const startY = sy + uy * (nodeHeight / 2.2);
  const endX = tx - ux * (nodeWidth / 2.2);
  const endY = ty - uy * (nodeHeight / 2.2);

  // Midpoint for badges and labels
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;

  // Control point for subtle curve if needed or straight line
  const isBidirectional = relationship.direction === "bidirectional";
  const isReverse = relationship.direction === "reverse";

  // Traffic status color mapping
  const trafficState = relationship.trafficState || "expected";
  const getTrafficColor = () => {
    switch (trafficState) {
      case "high":
        return "#eab308"; // Yellow
      case "new":
        return "#f97316"; // Orange
      case "threat":
        return "#ef4444"; // Red
      case "inactive":
        return "#64748b"; // Slate / Gray
      case "expected":
      default:
        return isSelected ? "#38bdf8" : "#10b981"; // Emerald Green or Cyan when selected
    }
  };

  const strokeColor = getTrafficColor();

  // Port label representation
  const portsLabel = relationship.ports.length > 0 ? relationship.ports.join(", ") : "ALL";
  const protocolLabel = relationship.protocol.toUpperCase();
  const triggeredLabel = relationship.triggeredPorts ? `[${relationship.triggeredPorts}]` : null;

  // Unique marker IDs
  const markerForwardId = `marker-fwd-${relationship.id}`;
  const markerBackId = `marker-back-${relationship.id}`;

  return (
    <g
      className="cursor-pointer group select-none transition-all duration-200"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(relationship);
      }}
    >
      <defs>
        {/* Forward arrowhead */}
        <marker
          id={markerForwardId}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={strokeColor} />
        </marker>
        {/* Backward arrowhead for bidirectional trust */}
        <marker
          id={markerBackId}
          viewBox="0 0 10 10"
          refX="2"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M 10 1.5 L 1 5 L 10 8.5 z" fill={strokeColor} />
        </marker>
      </defs>

      {/* Hitbox for easy clicking */}
      <line
        x1={startX}
        y1={startY}
        x2={endX}
        y2={endY}
        stroke="transparent"
        strokeWidth="24"
      />

      {/* Outer selection halo */}
      {isSelected && (
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="#0284c7"
          strokeWidth="8"
          strokeOpacity="0.4"
          strokeLinecap="round"
        />
      )}

      {/* Main Connection Line */}
      {isBidirectional ? (
        // Bidirectional trust notation: Double line <====80====>
        <>
          <line
            x1={startX}
            y1={startY - 2}
            x2={endX}
            y2={endY - 2}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeDasharray={relationship.trafficState === "inactive" ? "4,4" : undefined}
          />
          <line
            x1={startX}
            y1={startY + 2}
            x2={endX}
            y2={endY + 2}
            stroke={strokeColor}
            strokeWidth="2.5"
            markerStart={`url(#${markerBackId})`}
            markerEnd={`url(#${markerForwardId})`}
            strokeDasharray={relationship.trafficState === "inactive" ? "4,4" : undefined}
          />
        </>
      ) : (
        // One-Way Connection (or Reverse)
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke={strokeColor}
          strokeWidth={isSelected ? 3 : 2.5}
          markerStart={isReverse ? `url(#${markerBackId})` : undefined}
          markerEnd={!isReverse ? `url(#${markerForwardId})` : undefined}
          strokeDasharray={relationship.trafficState === "inactive" ? "4,4" : undefined}
        />
      )}

      {/* Animated Traffic Particles */}
      {trafficState !== "inactive" && (
        <circle r={trafficState === "high" ? "4" : "3"} fill={strokeColor}>
          <animateMotion
            path={`M ${isReverse ? endX : startX} ${isReverse ? endY : startY} L ${
              isReverse ? startX : endX
            } ${isReverse ? startY : endY}`}
            dur={trafficState === "high" ? "1.2s" : "2.4s"}
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Midpoint Badge: Relationship notation (Ports, Protocol, & Triggered Brackets) */}
      <g transform={`translate(${midX}, ${midY})`}>
        {/* Background pill */}
        <rect
          x="-58"
          y={triggeredLabel ? "-24" : "-16"}
          width="116"
          height={triggeredLabel ? "48" : "32"}
          rx="8"
          className="fill-slate-900/95 stroke-slate-700/90 group-hover:stroke-cyan-400/80 transition-all duration-200"
          strokeWidth={isSelected ? "1.5" : "1"}
          filter="drop-shadow(0 4px 6px rgba(0, 0, 0, 0.4))"
        />

        {/* Direction Indicator Glyph */}
        <text
          x="-48"
          y="-3"
          className="fill-slate-400 font-mono text-[9px] font-bold"
        >
          {isBidirectional ? "⇄" : isReverse ? "←" : "→"}
        </text>

        {/* Ports Label */}
        <text
          x="-34"
          y="-3"
          className="fill-cyan-300 font-mono text-[11px] font-bold group-hover:fill-cyan-200"
        >
          {portsLabel}
        </text>

        {/* Protocol Tag */}
        <text
          x="32"
          y="-3"
          className="fill-slate-400 font-mono text-[8px] uppercase tracking-wider font-semibold"
          textAnchor="middle"
        >
          {protocolLabel}
        </text>

        {/* Dynamic / Triggered Ports Bracket Notation: [1024-65535] */}
        {triggeredLabel && (
          <text
            x="0"
            y="14"
            className="fill-amber-400 font-mono text-[9px] tracking-tight font-medium"
            textAnchor="middle"
          >
            {triggeredLabel}
          </text>
        )}
      </g>
    </g>
  );
};

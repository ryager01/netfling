import React from "react";
import { CanvasRelationship, CanvasNode } from "../../types/canvas";

interface CanvasRelationshipEdgeProps {
  relationship: CanvasRelationship;
  sourceNode: CanvasNode;
  targetNode: CanvasNode;
  isSelected: boolean;
  onSelect: (rel: CanvasRelationship) => void;
  scale?: number;
  edgeIndex?: number;
  totalParallelEdges?: number;
}

export const CanvasRelationshipEdge: React.FC<CanvasRelationshipEdgeProps> = ({
  relationship,
  sourceNode,
  targetNode,
  isSelected,
  onSelect,
  edgeIndex = 0,
  totalParallelEdges = 1,
}) => {
  // Center coordinates of cards (node card width ~240px, height ~110px)
  const nodeWidth = 240;
  const nodeHeight = 110;

  const isLoopback = sourceNode.id === targetNode.id;

  const sx = sourceNode.x + nodeWidth / 2;
  const sy = sourceNode.y + nodeHeight / 2;
  const tx = targetNode.x + nodeWidth / 2;
  const ty = targetNode.y + nodeHeight / 2;

  // Direction and traffic status
  const isBidirectional = relationship.direction === "bidirectional";
  const isReverse = relationship.direction === "reverse";
  const trafficState = relationship.trafficState || relationship.traffic_status || "expected";

  const getTrafficColor = () => {
    switch (trafficState) {
      case "high":
        return "#eab308"; // Yellow
      case "new":
      case "new_comm":
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

  // Port label representation & redirect parsing
  const rawPorts = relationship.ports || relationship.allowed_ports || ["443"];
  const hasRedirect = rawPorts.some((p) => p.includes(":"));
  const portsLabel = rawPorts.length > 0 ? rawPorts.join(", ") : "ALL";
  const protocolLabel = (relationship.protocol || "tcp").toUpperCase();
  const triggeredLabel = relationship.triggeredPorts || relationship.triggered_ports?.join(", ");

  // Unique marker IDs
  const markerForwardId = `marker-fwd-${relationship.id}`;
  const markerBackId = `marker-back-${relationship.id}`;

  // =========================================================================
  // CASE 1: LOOPBACK / SELF-REFERENTIAL RELATIONSHIP (A --- 8080:80 ---> A)
  // =========================================================================
  if (isLoopback) {
    // Generate smooth loopback arc sprouting out of top edge and returning to right edge
    const loopStartX = sourceNode.x + nodeWidth * 0.7;
    const loopStartY = sourceNode.y;
    const loopEndX = sourceNode.x + nodeWidth;
    const loopEndY = sourceNode.y + nodeHeight * 0.35;

    // Expand loop arc slightly if multiple loopbacks exist on the same node
    const loopSpread = edgeIndex * 25;
    const c1x = loopStartX + 10;
    const c1y = loopStartY - (75 + loopSpread);
    const c2x = loopEndX + (75 + loopSpread);
    const c2y = loopEndY - 35;

    const loopPath = `M ${loopStartX} ${loopStartY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${loopEndX} ${loopEndY}`;

    // Midpoint for loop badge
    const badgeX = sourceNode.x + nodeWidth + 20 + loopSpread * 0.5;
    const badgeY = sourceNode.y - 40 - loopSpread * 0.5;

    return (
      <g
        className="cursor-pointer group select-none transition-all duration-200"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(relationship);
        }}
      >
        <defs>
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
        </defs>

        {/* Clickable Hitbox */}
        <path d={loopPath} stroke="transparent" strokeWidth="26" fill="none" />

        {/* Selection Glow */}
        {isSelected && (
          <path
            d={loopPath}
            stroke="#0284c7"
            strokeWidth="9"
            strokeOpacity="0.45"
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* Main Loopback Curve */}
        <path
          d={loopPath}
          stroke={strokeColor}
          strokeWidth={isSelected ? 3 : 2.5}
          fill="none"
          markerEnd={`url(#${markerForwardId})`}
          strokeDasharray={trafficState === "inactive" ? "4,4" : undefined}
        />

        {/* Animated Traffic Particle */}
        {trafficState !== "inactive" && (
          <circle r={trafficState === "high" ? "4" : "3"} fill={strokeColor}>
            <animateMotion
              path={loopPath}
              dur={trafficState === "high" ? "1.2s" : "2.2s"}
              repeatCount="indefinite"
            />
          </circle>
        )}

        {/* Loopback Badge: [⟲ 8080:80 Loopback] */}
        <g transform={`translate(${badgeX}, ${badgeY})`}>
          <rect
            x="-65"
            y={triggeredLabel ? "-24" : "-16"}
            width="130"
            height={triggeredLabel ? "48" : "32"}
            rx="8"
            className="fill-slate-900/95 stroke-cyan-500/60 group-hover:stroke-cyan-400 transition-all duration-200"
            strokeWidth={isSelected ? "2" : "1.2"}
            filter="drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5))"
          />

          {/* Loopback Symbol */}
          <text x="-54" y="-3" className="fill-amber-400 font-mono text-[10px] font-bold">
            ⟲
          </text>

          {/* Port Notation */}
          <text
            x="-38"
            y="-3"
            className="fill-cyan-300 font-mono text-[11px] font-bold group-hover:fill-cyan-200"
          >
            {portsLabel}
          </text>

          {/* Protocol Tag */}
          <text
            x="44"
            y="-3"
            className="fill-slate-400 font-mono text-[8px] uppercase tracking-wider font-semibold"
            textAnchor="middle"
          >
            {protocolLabel}
          </text>

          {/* Loopback Explanatory Subtitle or Triggered Ports */}
          <text
            x="0"
            y="9"
            className="fill-emerald-400 font-mono text-[8px] tracking-tight font-medium"
            textAnchor="middle"
          >
            {triggeredLabel ? `[${triggeredLabel}]` : "LOOPBACK REDIRECT"}
          </text>
        </g>
      </g>
    );
  }

  // =========================================================================
  // CASE 2: REGULAR RELATIONSHIP (A --- 8080:80 ---> B or A <=== 80 ===> B)
  // =========================================================================
  const dx = tx - sx;
  const dy = ty - sy;
  const distance = Math.hypot(dx, dy) || 1;

  // Calculate edge intersection with bounding boxes
  const ux = dx / distance;
  const uy = dy / distance;

  // Offset start and end points so lines dock nicely at card borders
  const startX = sx + ux * (nodeWidth / 2.2);
  const startY = sy + uy * (nodeHeight / 2.2);
  const endX = tx - ux * (nodeWidth / 2.2);
  const endY = ty - uy * (nodeHeight / 2.2);

  // Midpoint for badges and labels
  const baseMidX = (startX + endX) / 2;
  const baseMidY = (startY + endY) / 2;

  // Curvature offset for parallel relationships between the same node pair
  const isCurved = totalParallelEdges > 1;
  const curveOffset = isCurved ? (edgeIndex - (totalParallelEdges - 1) / 2) * 45 : 0;
  const midX = baseMidX - uy * curveOffset;
  const midY = baseMidY + ux * curveOffset;

  const edgePath = isCurved
    ? `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`
    : `M ${startX} ${startY} L ${endX} ${endY}`;

  // Double-line offset for bidirectional trust
  const bidiOffset = 2.5;
  const bidiPath1 = isCurved
    ? `M ${startX - uy * bidiOffset} ${startY + ux * bidiOffset} Q ${midX - uy * bidiOffset} ${midY + ux * bidiOffset} ${endX - uy * bidiOffset} ${endY + ux * bidiOffset}`
    : `M ${startX - uy * bidiOffset} ${startY + ux * bidiOffset} L ${endX - uy * bidiOffset} ${endY + ux * bidiOffset}`;
  const bidiPath2 = isCurved
    ? `M ${startX + uy * bidiOffset} ${startY - ux * bidiOffset} Q ${midX + uy * bidiOffset} ${midY - ux * bidiOffset} ${endX + uy * bidiOffset} ${endY - ux * bidiOffset}`
    : `M ${startX + uy * bidiOffset} ${startY - ux * bidiOffset} L ${endX + uy * bidiOffset} ${endY - ux * bidiOffset}`;

  // Width of badge calculated for comfort
  const badgeWidth = Math.max(116, portsLabel.length * 8 + 48);

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
        {/* Backward arrowhead for bidirectional trust or reverse */}
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
      <path d={edgePath} stroke="transparent" strokeWidth="26" fill="none" />

      {/* Outer selection halo */}
      {isSelected && (
        <path
          d={edgePath}
          stroke="#0284c7"
          strokeWidth="9"
          strokeOpacity="0.4"
          strokeLinecap="round"
          fill="none"
        />
      )}

      {/* Main Connection Line(s) */}
      {isBidirectional ? (
        // Bidirectional trust notation: Double line <====80====>
        <>
          <path
            d={bidiPath1}
            stroke={strokeColor}
            strokeWidth="2.5"
            fill="none"
            markerStart={`url(#${markerBackId})`}
            strokeDasharray={trafficState === "inactive" ? "4,4" : undefined}
          />
          <path
            d={bidiPath2}
            stroke={strokeColor}
            strokeWidth="2.5"
            fill="none"
            markerEnd={`url(#${markerForwardId})`}
            strokeDasharray={trafficState === "inactive" ? "4,4" : undefined}
          />
        </>
      ) : (
        // One-Way Connection (or Reverse)
        <path
          d={edgePath}
          stroke={strokeColor}
          strokeWidth={isSelected ? 3 : 2.5}
          fill="none"
          markerStart={isReverse ? `url(#${markerBackId})` : undefined}
          markerEnd={!isReverse ? `url(#${markerForwardId})` : undefined}
          strokeDasharray={trafficState === "inactive" ? "4,4" : undefined}
        />
      )}

      {/* Animated Traffic Particles */}
      {trafficState !== "inactive" && (
        <circle r={trafficState === "high" ? "4" : "3"} fill={strokeColor}>
          <animateMotion
            path={isReverse ? (isCurved ? `M ${endX} ${endY} Q ${midX} ${midY} ${startX} ${startY}` : `M ${endX} ${endY} L ${startX} ${startY}`) : edgePath}
            dur={trafficState === "high" ? "1.2s" : "2.4s"}
            repeatCount="indefinite"
          />
        </circle>
      )}

      {/* Midpoint Badge: Relationship notation (Ports, Redirect Indicator, Protocol) */}
      <g transform={`translate(${midX}, ${midY})`}>
        {/* Background pill */}
        <rect
          x={-badgeWidth / 2}
          y={triggeredLabel ? "-24" : "-16"}
          width={badgeWidth}
          height={triggeredLabel ? "48" : "32"}
          rx="8"
          className="fill-slate-900/95 stroke-slate-700/90 group-hover:stroke-cyan-400/80 transition-all duration-200"
          strokeWidth={isSelected ? "1.5" : "1"}
          filter="drop-shadow(0 4px 6px rgba(0, 0, 0, 0.45))"
        />

        {/* Direction Indicator Glyph */}
        <text
          x={-badgeWidth / 2 + 10}
          y={triggeredLabel ? "-3" : "0"}
          className="fill-slate-400 font-mono text-[9px] font-bold"
          dominantBaseline="middle"
        >
          {isBidirectional ? "⇄" : isReverse ? "←" : "→"}
        </text>

        {/* Ports Label (Highlights port redirects Presented:Actual) */}
        <text
          x={-badgeWidth / 2 + 24}
          y={triggeredLabel ? "-3" : "0"}
          className={`font-mono text-[11px] font-bold group-hover:fill-cyan-200 ${
            hasRedirect ? "fill-amber-300" : "fill-cyan-300"
          }`}
          dominantBaseline="middle"
        >
          {portsLabel}
        </text>

        {/* Protocol Tag */}
        <text
          x={badgeWidth / 2 - 14}
          y={triggeredLabel ? "-3" : "0"}
          className="fill-slate-400 font-mono text-[8px] uppercase tracking-wider font-semibold"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {protocolLabel}
        </text>

        {/* Redirect Flag or Triggered Ephemeral Ports Bracket Notation: [1024-65535] */}
        {triggeredLabel ? (
          <text
            x="0"
            y="14"
            className="fill-amber-400 font-mono text-[9px] tracking-tight font-medium"
            textAnchor="middle"
          >
            [{triggeredLabel}]
          </text>
        ) : hasRedirect ? (
          <text
            x="0"
            y="9"
            className="fill-emerald-400 font-mono text-[7.5px] uppercase tracking-tight font-semibold"
            textAnchor="middle"
          >
            REDIRECT (NAT)
          </text>
        ) : null}
      </g>
    </g>
  );
};

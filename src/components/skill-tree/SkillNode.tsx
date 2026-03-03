import type { SkillNode as SkillNodeType } from "@/types/graph";
import type { Tier, Branch } from "@/types/skill";
import React from "react";

const BRANCH_COLORS: Record<Branch, string> = {
  attack: "#ef4444",
  movement: "#06b6d4",
  defend: "#22c55e",
};

const NODE_RADII: Record<Tier, number> = {
  0: 28,
  1: 22,
  2: 20,
  3: 18,
};

const MAX_INSIDE_CHARS = 8;

type NodeVisualState = "base" | "unlocked" | "available";

interface SkillNodeProps {
  node: SkillNodeType;
  unlockedSkillIds: Set<string>;
  highlighted?: boolean;
  onHover: (
    skill: SkillNodeType["skill"],
    event: React.MouseEvent
  ) => void;
  onHoverEnd: () => void;
  onClick: (skillId: string) => void;
}

function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    pts.push(
      `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`
    );
  }
  return pts.join(" ");
}

function getNodeState(
  node: SkillNodeType,
  unlockedSet: Set<string>
): NodeVisualState {
  if (node.skill.isBase) return "base";
  if (unlockedSet.has(node.skill.id)) return "unlocked";
  return "available";
}

export function SkillNode({
  node,
  unlockedSkillIds,
  highlighted = false,
  onHover,
  onHoverEnd,
  onClick,
}: SkillNodeProps) {
  const { skill, x, y } = node;
  const tier = skill.tier as Tier;
  const r = NODE_RADII[tier];
  const branchColor = BRANCH_COLORS[skill.branch] ?? "#888888";
  const hasSecondary = Boolean(skill.secondaryBranch);

  const state = getNodeState(node, unlockedSkillIds);

  let fill: string;
  let fillOpacity: number;
  let stroke: string;
  let strokeWidth: number;
  let strokeDasharray: string | undefined;
  let opacity: number;
  let cursor: string;
  let glowFilter: string | undefined;

  switch (state) {
    case "base":
      fill = branchColor;
      fillOpacity = 0.95;
      stroke = "#ffffff";
      strokeWidth = 2.5;
      strokeDasharray = undefined;
      opacity = 1;
      cursor = "default";
      glowFilter = "url(#glow)";
      break;
    case "unlocked":
      fill = branchColor;
      fillOpacity = 0.9;
      stroke = "#ffffff";
      strokeWidth = 2;
      strokeDasharray = undefined;
      opacity = 1;
      cursor = "pointer";
      glowFilter = "url(#glow)";
      break;
    case "available":
      fill = "#1f2937";
      fillOpacity = 0.7;
      stroke = "#ffffff";
      strokeWidth = 1.5;
      strokeDasharray = "4 3";
      opacity = 1;
      cursor = "pointer";
      glowFilter = undefined;
      break;
  }

  // When highlighted (prereq chain), boost visibility
  if (highlighted) {
    fill = branchColor;
    fillOpacity = state === "available" ? 0.5 : fillOpacity;
    stroke = "#ffffff";
    strokeWidth = 2.5;
    strokeDasharray = undefined;
    glowFilter = "url(#glow)";
  }

  const handleMouseEnter = (e: React.MouseEvent) => {
    onHover(skill, e);
  };

  const handleClick = () => {
    if (state === "base") return;
    onClick(skill.id);
  };

  const isShortName = skill.name.length <= MAX_INSIDE_CHARS;

  return (
    <g
      opacity={opacity}
      style={{ cursor }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onHoverEnd}
      onClick={handleClick}
      aria-label={skill.name}
      role="button"
      tabIndex={state === "base" ? -1 : 0}
    >
      {/* Hexagonal node */}
      <polygon
        points={hexPoints(x, y, r)}
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        filter={glowFilter}
      />

      {/* Secondary branch indicator */}
      {hasSecondary && skill.secondaryBranch && (
        <polygon
          points={hexPoints(x + r * 0.6, y - r * 0.6, r * 0.3)}
          fill={BRANCH_COLORS[skill.secondaryBranch]}
          stroke="#00000060"
          strokeWidth={0.5}
        />
      )}

      {/* Skill name */}
      {isShortName ? (
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#ffffff"
          fontSize={9}
          fontWeight="600"
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          {skill.name}
        </text>
      ) : (
        <text
          x={x}
          y={y + r + 8}
          textAnchor="middle"
          dominantBaseline="hanging"
          fill="#ffffffcc"
          fontSize={9}
          fontWeight="500"
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          {skill.name}
        </text>
      )}
    </g>
  );
}

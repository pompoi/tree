import type { SkillNode as SkillNodeType } from "@/types/graph";
import type { Tier, Branch } from "@/types/skill";
import { canUnlock } from "@/lib/graph-utils";
import React from "react";

const BRANCH_COLORS: Record<Branch, string> = {
  attack: "#ef4444",
  movement: "#06b6d4",
  defend: "#22c55e",
};

const NODE_RADII: Record<Tier, number> = {
  0: 20,
  1: 16,
  2: 14,
  3: 12,
};

// Maximum characters to fit inside the circle before placing text below
const MAX_INSIDE_CHARS = 6;

type NodeVisualState = "base" | "unlocked" | "available" | "locked";

interface SkillNodeProps {
  node: SkillNodeType;
  unlockedSkillIds: Set<string>;
  onHover: (
    skill: SkillNodeType["skill"],
    event: React.MouseEvent
  ) => void;
  onHoverEnd: () => void;
  onClick: (skillId: string) => void;
}

function getNodeState(
  node: SkillNodeType,
  unlockedSet: Set<string>
): NodeVisualState {
  if (node.skill.isBase) return "base";
  if (unlockedSet.has(node.skill.id)) return "unlocked";
  if (canUnlock(node.skill.id, unlockedSet)) return "available";
  return "locked";
}

export function SkillNode({
  node,
  unlockedSkillIds,
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

  // Visual properties based on state
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
      glowFilter = undefined;
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
    case "locked":
      fill = "#6b7280";
      fillOpacity = 0.6;
      stroke = "#6b7280";
      strokeWidth = 1;
      strokeDasharray = undefined;
      opacity = 0.5;
      cursor = "default";
      glowFilter = undefined;
      break;
  }

  const handleMouseEnter = (e: React.MouseEvent) => {
    onHover(skill, e);
  };

  const handleClick = () => {
    if (state === "base") return;
    onClick(skill.id);
  };

  // Determine label placement
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
      tabIndex={state === "locked" || state === "base" ? -1 : 0}
    >
      {/* Main node circle */}
      <circle
        cx={x}
        cy={y}
        r={r}
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        filter={glowFilter}
      />

      {/* Secondary branch indicator -- small dot in corner */}
      {hasSecondary && skill.secondaryBranch && (
        <circle
          cx={x + r * 0.6}
          cy={y - r * 0.6}
          r={r * 0.3}
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
          fontSize={7}
          fontWeight="600"
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          {skill.name}
        </text>
      ) : (
        <text
          x={x}
          y={y + r + 7}
          textAnchor="middle"
          dominantBaseline="hanging"
          fill="#ffffffcc"
          fontSize={8}
          fontWeight="500"
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          {skill.name}
        </text>
      )}
    </g>
  );
}

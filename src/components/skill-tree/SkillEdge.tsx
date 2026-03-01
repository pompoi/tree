import type { SkillNode } from "@/types/graph";
import type { Branch } from "@/types/skill";

const BRANCH_COLORS: Record<Branch, string> = {
  attack: "#ef4444",
  movement: "#06b6d4",
  defend: "#22c55e",
};

type EdgeState = "active" | "available" | "inactive";

interface SkillEdgeProps {
  fromNode: SkillNode;
  toNode: SkillNode;
  unlockedSkillIds: Set<string>;
}

function getEdgeState(
  fromId: string,
  toId: string,
  unlockedSet: Set<string>
): EdgeState {
  const fromUnlocked = unlockedSet.has(fromId);
  const toUnlocked = unlockedSet.has(toId);

  if (fromUnlocked && toUnlocked) return "active";
  if (fromUnlocked && !toUnlocked) return "available";
  return "inactive";
}

export function SkillEdge({ fromNode, toNode, unlockedSkillIds }: SkillEdgeProps) {
  const x1 = fromNode.x;
  const y1 = fromNode.y;
  const x2 = toNode.x;
  const y2 = toNode.y;

  // Midpoint
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;

  // Direction from center to midpoint gives "outward" direction
  const len = Math.sqrt(mx * mx + my * my);
  const curveOffset = 30;

  let cpx: number;
  let cpy: number;

  if (len < 1) {
    // Midpoint is at center -- use perpendicular of edge direction
    const dx = x2 - x1;
    const dy = y2 - y1;
    const edgeLen = Math.sqrt(dx * dx + dy * dy);
    cpx = mx + (-dy / edgeLen) * curveOffset;
    cpy = my + (dx / edgeLen) * curveOffset;
  } else {
    // Offset control point outward from center
    cpx = mx + (mx / len) * curveOffset;
    cpy = my + (my / len) * curveOffset;
  }

  const state = getEdgeState(fromNode.skill.id, toNode.skill.id, unlockedSkillIds);
  const strokeColor = BRANCH_COLORS[toNode.skill.branch] ?? "#ffffff";
  const d = `M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`;

  let strokeOpacity: number;
  let strokeDasharray: string | undefined;
  let strokeWidth: number;

  switch (state) {
    case "active":
      strokeOpacity = 0.7;
      strokeDasharray = undefined;
      strokeWidth = 2;
      break;
    case "available":
      strokeOpacity = 0.4;
      strokeDasharray = "6 4";
      strokeWidth = 1.5;
      break;
    case "inactive":
      strokeOpacity = 0.15;
      strokeDasharray = undefined;
      strokeWidth = 1;
      break;
  }

  return (
    <path
      d={d}
      fill="none"
      stroke={strokeColor}
      strokeOpacity={strokeOpacity}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
    />
  );
}

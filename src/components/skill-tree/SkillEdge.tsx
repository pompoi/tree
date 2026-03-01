import type { SkillNode } from "@/types/graph";
import type { Branch } from "@/types/skill";

const BRANCH_COLORS: Record<Branch, string> = {
  attack: "#ef4444",
  movement: "#06b6d4",
  defend: "#22c55e",
};

type EdgeState = "active" | "available";

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
  return "available";
}

export function SkillEdge({ fromNode, toNode, unlockedSkillIds }: SkillEdgeProps) {
  const state = getEdgeState(fromNode.skill.id, toNode.skill.id, unlockedSkillIds);
  const strokeColor = BRANCH_COLORS[toNode.skill.branch] ?? "#ffffff";

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
  }

  return (
    <line
      x1={fromNode.x}
      y1={fromNode.y}
      x2={toNode.x}
      y2={toNode.y}
      stroke={strokeColor}
      strokeOpacity={strokeOpacity}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
    />
  );
}

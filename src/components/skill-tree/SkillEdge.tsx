import type { SkillNode } from "@/types/graph";

const BRANCH_COLORS: Record<string, string> = {
  attack: "#ef4444",
  movement: "#06b6d4",
  defend: "#22c55e",
};

interface SkillEdgeProps {
  fromNode: SkillNode;
  toNode: SkillNode;
}

export function SkillEdge({ fromNode, toNode }: SkillEdgeProps) {
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
    // Midpoint is at center — use perpendicular of edge direction
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

  const strokeColor = BRANCH_COLORS[toNode.skill.branch] ?? "#ffffff";
  const d = `M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`;

  return (
    <path
      d={d}
      fill="none"
      stroke={strokeColor}
      strokeOpacity={0.4}
      strokeWidth={1.5}
    />
  );
}

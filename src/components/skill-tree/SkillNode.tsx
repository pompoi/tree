import type { SkillNode as SkillNodeType } from "@/types/graph";
import type { Tier } from "@/types/skill";

const BRANCH_COLORS: Record<string, string> = {
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

interface SkillNodeProps {
  node: SkillNodeType;
}

export function SkillNode({ node }: SkillNodeProps) {
  const { skill, x, y } = node;
  const tier = skill.tier as Tier;
  const r = NODE_RADII[tier];
  const fillColor = BRANCH_COLORS[skill.branch] ?? "#888888";
  const isBase = skill.isBase;
  const hasSecondary = Boolean(skill.secondaryBranch);

  // Determine label placement: short names inside, longer names below
  const isShortName = skill.name.length <= MAX_INSIDE_CHARS;

  return (
    <g>
      {/* Main node circle */}
      <circle
        cx={x}
        cy={y}
        r={r}
        fill={fillColor}
        fillOpacity={0.85}
        stroke={isBase ? "#ffffff" : "#00000040"}
        strokeWidth={isBase ? 2.5 : 1}
      />

      {/* Secondary branch indicator — small dot in corner */}
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

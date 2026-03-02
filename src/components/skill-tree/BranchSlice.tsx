import { polarToCartesian } from "@/lib/polar";

const OUTER_RADIUS = 380;
const LABEL_RADIUS = 415;

// Border lines sit at the midpoint between branch center angles.
// Attack=0, Movement=2pi/3, Defend=4pi/3 → borders at pi/3, pi, 5pi/3
const BORDER_ANGLES = [Math.PI / 3, Math.PI, (5 * Math.PI) / 3];

const BRANCH_LABELS: { angle: number; label: string; color: string }[] = [
  { angle: 0, label: "ATTACK", color: "#ef4444" },
  { angle: (2 * Math.PI) / 3, label: "MOVEMENT", color: "#06b6d4" },
  { angle: (4 * Math.PI) / 3, label: "DEFEND", color: "#22c55e" },
];

export function BranchSlice() {
  return (
    <g>
      {BORDER_ANGLES.map((angle) => {
        const outer = polarToCartesian(angle, OUTER_RADIUS);
        return (
          <line
            key={angle}
            x1={0}
            y1={0}
            x2={outer.x}
            y2={outer.y}
            stroke="#ffffff18"
            strokeWidth={1}
          />
        );
      })}

      {BRANCH_LABELS.map(({ angle, label, color }) => {
        const pos = polarToCartesian(angle, LABEL_RADIUS);
        return (
          <text
            key={label}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={color}
            fontSize={11}
            fontWeight="600"
            letterSpacing="0.08em"
            opacity={0.85}
          >
            {label}
          </text>
        );
      })}
    </g>
  );
}

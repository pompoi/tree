import type { Branch } from "@/types/skill";

const LEGEND_ITEMS: { branch: Branch; label: string; color: string }[] = [
  { branch: "attack", label: "Attack", color: "#ef4444" },
  { branch: "movement", label: "Movement", color: "#22c55e" },
  { branch: "defend", label: "Defend", color: "#06b6d4" },
];

export function TreeLegend() {
  return (
    <g transform="translate(-420, -420)">
      {LEGEND_ITEMS.map((item, i) => (
        <g key={item.branch} transform={`translate(0, ${i * 18})`}>
          <rect
            x={0}
            y={0}
            width={10}
            height={10}
            rx={2}
            fill={item.color}
            fillOpacity={0.8}
          />
          <text
            x={16}
            y={5}
            dominantBaseline="middle"
            fill="#ffffff"
            fillOpacity={0.5}
            fontSize={10}
            fontWeight="500"
          >
            {item.label}
          </text>
        </g>
      ))}
    </g>
  );
}

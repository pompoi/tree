import type { HexCell, HexCellType } from "@/types/hex-card";
import type { Branch } from "@/types/skill";
import { hexToPixel, hexPoints, HEX_SIZE } from "@/lib/hex-to-pixel";

const CELL_STYLES: Record<
  HexCellType,
  { fill: string; stroke: string; opacity: number; strokeDash?: string }
> = {
  player: { fill: "#ffffff", stroke: "#ffffff", opacity: 0.95 },
  damage: { fill: "#ef4444", stroke: "#fca5a5", opacity: 0.8 },
  movement: { fill: "#06b6d4", stroke: "#67e8f9", opacity: 0.8 },
  block: { fill: "#22c55e", stroke: "#86efac", opacity: 0.8 },
  conditional: {
    fill: "transparent",
    stroke: "#fbbf24",
    opacity: 0.6,
    strokeDash: "4 2",
  },
  empty: { fill: "#1f2937", stroke: "#374151", opacity: 0.25 },
};

const BRANCH_FILLS: Record<Branch, string> = {
  attack: "#ef4444",
  movement: "#06b6d4",
  defend: "#22c55e",
};

interface HexCellSVGProps {
  cell: HexCell;
  branch: Branch;
  animate?: boolean;
  size?: number;
}

export function HexCellSVG({
  cell,
  branch,
  animate = true,
  size = HEX_SIZE,
}: HexCellSVGProps) {
  const { x, y } = hexToPixel(cell.coord, size);
  const style = CELL_STYLES[cell.type];
  const fill = cell.type === "player" ? BRANCH_FILLS[branch] : style.fill;

  const delay = cell.animationDelay ?? 0;
  const rotateClass = cell.animateRotate && animate ? "hex-cell-rotate" : "";
  const animClass = animate && !cell.animateRotate ? "hex-cell-animated" : "";
  const glowClass = cell.type === "player" && animate && !cell.animateRotate ? " hex-player-glow" : "";
  const dashClass =
    cell.type === "conditional" && animate ? " hex-conditional-dash" : "";

  return (
    <g
      className={`${rotateClass}${animClass}${glowClass}`}
      style={
        animate
          ? ({ "--hex-delay": delay, opacity: 0 } as React.CSSProperties)
          : undefined
      }
    >
      <polygon
        points={hexPoints(x, y, size * 0.92)}
        fill={fill}
        stroke={style.stroke}
        strokeWidth={1.5}
        opacity={style.opacity}
        strokeDasharray={style.strokeDash}
        className={dashClass}
      />
      {cell.label && (
        <text
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#ffffff"
          fontSize={cell.label.length > 2 ? 7 : 10}
          fontWeight="bold"
          style={{ pointerEvents: "none" }}
        >
          {cell.label}
        </text>
      )}
    </g>
  );
}

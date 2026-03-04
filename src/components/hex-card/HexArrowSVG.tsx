import type { HexArrow } from "@/types/hex-card";
import { hexToPixel, HEX_SIZE } from "@/lib/hex-to-pixel";

const ARROW_STYLES: Record<
  HexArrow["style"],
  { stroke: string; strokeWidth: number; dash?: string }
> = {
  facing: { stroke: "#ffffff", strokeWidth: 1.5, dash: "3 2" },
  move: { stroke: "#86efac", strokeWidth: 2, dash: "5 3" },
  attack: { stroke: "#fca5a5", strokeWidth: 2.5 },
  counter: { stroke: "#fbbf24", strokeWidth: 1.5, dash: "2 2" },
};

interface HexArrowSVGProps {
  arrow: HexArrow;
  animate?: boolean;
  size?: number;
  markerId: string;
}

export function HexArrowSVG({
  arrow,
  animate = true,
  size = HEX_SIZE,
  markerId,
}: HexArrowSVGProps) {
  const from = hexToPixel(arrow.from, size);
  const to = hexToPixel(arrow.to, size);
  const style = ARROW_STYLES[arrow.style];

  // Shorten arrow so it doesn't overlap hex centers
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const shrink = size * 0.45;
  const nx = dx / len;
  const ny = dy / len;

  const x1 = from.x + nx * shrink;
  const y1 = from.y + ny * shrink;
  const x2 = to.x - nx * shrink;
  const y2 = to.y - ny * shrink;

  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={style.stroke}
      strokeWidth={style.strokeWidth}
      strokeDasharray={style.dash}
      strokeLinecap="round"
      markerEnd={`url(#${markerId})`}
      className={animate ? "hex-arrow-animated" : undefined}
      style={animate ? { opacity: 0 } : undefined}
    />
  );
}

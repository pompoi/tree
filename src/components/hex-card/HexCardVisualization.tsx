import type { HexCardPattern } from "@/types/hex-card";
import type { Branch } from "@/types/skill";
import { hexBounds, HEX_SIZE } from "@/lib/hex-to-pixel";
import { HexCellSVG } from "./HexCellSVG";
import { HexArrowSVG } from "./HexArrowSVG";

interface HexCardVisualizationProps {
  pattern: HexCardPattern;
  branch: Branch;
  animate?: boolean;
  size?: number;
}

export function HexCardVisualization({
  pattern,
  branch,
  animate = true,
  size = HEX_SIZE,
}: HexCardVisualizationProps) {
  const coords = pattern.cells.map((c) => c.coord);
  const { minX, minY, maxX, maxY } = hexBounds(coords, size);

  const pad = size * 0.6;
  const vbX = minX - pad;
  const vbY = minY - pad;
  const vbW = maxX - minX + pad * 2;
  const vbH = maxY - minY + pad * 2;

  const markerId = `arrow-${pattern.skillId}`;

  return (
    <svg
      viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
      className="w-full h-full"
      aria-label={`Hex diagram for ${pattern.skillId}`}
    >
      <defs>
        {/* Glow filter for player hex */}
        <filter id={`glow-${pattern.skillId}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Arrow marker */}
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" className="text-white/80" />
        </marker>
      </defs>

      {/* Render cells: empty first, then active, player last */}
      {pattern.cells
        .slice()
        .sort((a, b) => {
          const order = { empty: 0, conditional: 1, movement: 2, block: 3, damage: 4, player: 5 };
          return order[a.type] - order[b.type];
        })
        .map((cell, i) => (
          <HexCellSVG
            key={`${cell.coord.q},${cell.coord.r}-${i}`}
            cell={cell}
            branch={branch}
            animate={animate}
            size={size}
          />
        ))}

      {/* Render arrows on top */}
      {pattern.arrows.map((arrow, i) => (
        <HexArrowSVG
          key={`arrow-${i}`}
          arrow={arrow}
          animate={animate}
          size={size}
          markerId={markerId}
        />
      ))}
    </svg>
  );
}

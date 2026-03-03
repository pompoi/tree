import type { HexCoord } from "@/types/hex-card";

/** Hex size (center to corner) for card visualization */
export const HEX_SIZE = 24;

/** Flat-top hex: convert axial (q, r) to pixel center (x, y) */
export function hexToPixel(
  coord: HexCoord,
  size: number = HEX_SIZE
): { x: number; y: number } {
  const x = size * ((3 / 2) * coord.q);
  const y = size * ((Math.sqrt(3) / 2) * coord.q + Math.sqrt(3) * coord.r);
  return { x, y };
}

/** Generate SVG polygon points string for a flat-top hex at (cx, cy) */
export function hexPoints(
  cx: number,
  cy: number,
  size: number = HEX_SIZE
): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    const px = cx + size * Math.cos(angle);
    const py = cy + size * Math.sin(angle);
    pts.push(`${px.toFixed(2)},${py.toFixed(2)}`);
  }
  return pts.join(" ");
}

/** Get bounding box of a set of hex coords (in pixel space) */
export function hexBounds(
  coords: HexCoord[],
  size: number = HEX_SIZE
): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const coord of coords) {
    const { x, y } = hexToPixel(coord, size);
    minX = Math.min(minX, x - size);
    minY = Math.min(minY, y - size);
    maxX = Math.max(maxX, x + size);
    maxY = Math.max(maxY, y + size);
  }

  return { minX, minY, maxX, maxY };
}

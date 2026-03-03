/**
 * Hex grid layout — manual axial coordinates for all 30 skills.
 *
 * Every prerequisite pair is adjacent in the hex grid (shares an edge).
 * Flat-top hexagons with axial coordinates (q, r).
 *
 * Pixel conversion (flat-top):
 *   x = R * 3/2 * q
 *   y = R * √3 * (r + q/2)
 *
 * Adjacency (6 neighbors):
 *   (q+1,r), (q+1,r-1), (q,r-1), (q-1,r), (q-1,r+1), (q,r+1)
 */

// ─── Hex Radius ──────────────────────────────────────────────────────────────

/** Circumradius of each hex — ~66px wide, good mobile touch target. */
export const HEX_R = 38;

// ─── Axial Coordinates ───────────────────────────────────────────────────────

export const SKILL_POSITIONS: Record<string, { q: number; r: number }> = {
  // Base skills (Tier 0) — triangle around empty center
  "melee-attack": { q: 0, r: -1 },
  "move": { q: 1, r: 0 },
  "defend": { q: -1, r: 1 },

  // Attack branch — spreads north/northwest
  "power-hit": { q: -1, r: -1 },
  "quick-jab": { q: 0, r: -2 },
  "feint": { q: 1, r: -1 },
  "sharpen": { q: 1, r: -2 },
  "lunge": { q: -1, r: -2 },
  "combo-strike": { q: 0, r: -3 },
  "feint-strike": { q: 2, r: -2 },
  "executioner": { q: -1, r: -3 }, // dual: lunge + combo-strike
  "whirlwind": { q: 1, r: -3 },

  // Movement branch — spreads east/southeast
  "swift-feet": { q: 2, r: 0 },
  "flanking": { q: 2, r: -1 },
  "dash": { q: 1, r: 1 },
  "pivot": { q: 0, r: 1 },
  "charge": { q: 3, r: -1 },
  "withdraw": { q: 1, r: 2 },
  "shadow-step": { q: 0, r: 2 },
  "phantom-step": { q: 0, r: 3 }, // dual: shadow-step + withdraw
  "overrun": { q: 4, r: -1 },

  // Defend branch — spreads west/southwest
  "iron-skin": { q: -2, r: 2 },
  "parry": { q: -2, r: 1 },
  "brace": { q: -1, r: 2 },
  "sidestep": { q: -1, r: 0 },
  "riposte": { q: -3, r: 2 },
  "deflect": { q: -2, r: 3 },
  "anticipate": { q: -2, r: 0 },
  "mirror-guard": { q: -3, r: 1 }, // dual: riposte + anticipate
  "fortress": { q: -3, r: 3 },
};

// ─── Axial Directions ────────────────────────────────────────────────────────

const AXIAL_DIRS: readonly { q: number; r: number }[] = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

// ─── Coordinate Conversion ───────────────────────────────────────────────────

const SQRT3 = Math.sqrt(3);

export function axialToPixel(
  q: number,
  r: number,
  R: number = HEX_R
): { x: number; y: number } {
  return {
    x: R * (3 / 2) * q,
    y: R * SQRT3 * (r + q / 2),
  };
}

// ─── Adjacency ───────────────────────────────────────────────────────────────

export function areAdjacent(
  a: { q: number; r: number },
  b: { q: number; r: number }
): boolean {
  const dq = b.q - a.q;
  const dr = b.r - a.r;
  return AXIAL_DIRS.some((d) => d.q === dq && d.r === dr);
}

/**
 * Find which direction index (0-5) b is from a.
 * Returns -1 if not adjacent.
 */
function directionIndex(
  a: { q: number; r: number },
  b: { q: number; r: number }
): number {
  const dq = b.q - a.q;
  const dr = b.r - a.r;
  return AXIAL_DIRS.findIndex((d) => d.q === dq && d.r === dr);
}

// ─── Shared Edge ─────────────────────────────────────────────────────────────

/**
 * Returns the two pixel endpoints of the shared edge between adjacent hexes.
 * For flat-top hexagons, vertex i is at angle (60° * i) from center.
 *
 * Direction 0 (q+1,r+0): shared edge uses vertices 0 and 5 of hex a
 * Direction 1 (q+1,r-1): shared edge uses vertices 1 and 0 of hex a
 * Direction 2 (q+0,r-1): shared edge uses vertices 2 and 1 of hex a
 * Direction 3 (q-1,r+0): shared edge uses vertices 3 and 2 of hex a
 * Direction 4 (q-1,r+1): shared edge uses vertices 4 and 3 of hex a
 * Direction 5 (q+0,r+1): shared edge uses vertices 5 and 4 of hex a
 */
const DIR_TO_VERTICES: [number, number][] = [
  [0, 5], // dir 0: right
  [1, 0], // dir 1: upper-right
  [2, 1], // dir 2: upper-left
  [3, 2], // dir 3: left
  [4, 3], // dir 4: lower-left
  [5, 4], // dir 5: lower-right
];

function hexVertex(cx: number, cy: number, R: number, i: number): { x: number; y: number } {
  const angle = (Math.PI / 3) * i;
  return {
    x: cx + R * Math.cos(angle),
    y: cy + R * Math.sin(angle),
  };
}

export function getSharedEdge(
  aPos: { q: number; r: number },
  bPos: { q: number; r: number },
  R: number = HEX_R
): [{ x: number; y: number }, { x: number; y: number }] | null {
  const dir = directionIndex(aPos, bPos);
  if (dir === -1) return null;

  const aPixel = axialToPixel(aPos.q, aPos.r, R);
  const [v1Idx, v2Idx] = DIR_TO_VERTICES[dir];

  return [
    hexVertex(aPixel.x, aPixel.y, R, v1Idx),
    hexVertex(aPixel.x, aPixel.y, R, v2Idx),
  ];
}

// ─── Hex Polygon ─────────────────────────────────────────────────────────────

/** Generate SVG polygon points string for a flat-top hexagon. */
export function hexPoints(cx: number, cy: number, R: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i;
    pts.push(
      `${(cx + R * Math.cos(angle)).toFixed(1)},${(cy + R * Math.sin(angle)).toFixed(1)}`
    );
  }
  return pts.join(" ");
}

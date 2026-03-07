/**
 * Hex grid layout — axial coordinates for all 57 skills.
 *
 * Flat-top hexagons with axial coordinates (q, r).
 * Adjacent prerequisite pairs share a hex edge (highlighted with shared-edge glow).
 * Non-adjacent prerequisite pairs are connected with line connections.
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
  // ─── Tier 0: Base Skills ──────────────────────────────────────────────────
  "melee-attack": { q: 0, r: -1 },
  "move": { q: 1, r: 0 },
  "defend": { q: -1, r: 1 },

  // ─── Boost Passives ───────────────────────────────────────────────────────
  "sharpen": { q: 1, r: -1 },
  "swift-feet": { q: 0, r: 1 },
  "iron-skin": { q: -1, r: 0 },

  // ─── T1: Attack Branch (north) ────────────────────────────────────────────
  "feint": { q: -1, r: -1 },
  "power-hit": { q: 0, r: -2 },
  "quick-jab": { q: 1, r: -2 },

  // ─── T1: Movement Branch (east/southeast) ─────────────────────────────────
  "flanking": { q: 2, r: -1 },
  "pivot": { q: 2, r: 0 },
  "dash": { q: 1, r: 1 },

  // ─── T1: Defense Branch (west/southwest) ──────────────────────────────────
  "sidestep": { q: -2, r: 1 },
  "parry": { q: -2, r: 2 },
  "brace": { q: -1, r: 2 },

  // ─── T2: Attack Within-Branch ─────────────────────────────────────────────
  "lunge": { q: 0, r: -3 },         // power-hit + quick-jab
  "combo-strike": { q: 1, r: -3 },  // quick-jab + feint
  "feint-strike": { q: -1, r: -2 }, // feint + power-hit

  // ─── T2: Movement Within-Branch ───────────────────────────────────────────
  "shadow-step": { q: 3, r: -1 },   // flanking + pivot
  "withdraw": { q: 3, r: 0 },       // pivot + dash
  "charge": { q: 2, r: 1 },         // dash + flanking

  // ─── T2: Defense Within-Branch ────────────────────────────────────────────
  "anticipate": { q: -3, r: 2 },    // sidestep + parry
  "riposte": { q: -2, r: 3 },       // parry + brace
  "deflect": { q: -1, r: 3 },       // brace + sidestep

  // ─── T2: AD Cross-Branch (northwest gap) ──────────────────────────────────
  "counterstrike": { q: -2, r: 0 },   // power-hit + parry
  "bait-and-punish": { q: -2, r: -1 }, // feint + brace
  "step-through": { q: -3, r: 0 },    // quick-jab + sidestep

  // ─── T2: AM Cross-Branch (northeast gap) ──────────────────────────────────
  "blitz": { q: 2, r: -2 },           // power-hit + dash
  "hit-and-run": { q: 3, r: -2 },     // quick-jab + pivot
  "ambush": { q: 2, r: -3 },          // feint + flanking

  // ─── T2: DM Cross-Branch (south gap) ──────────────────────────────────────
  "intercept": { q: 0, r: 2 },        // parry + flanking
  "phaseout": { q: 0, r: 3 },         // sidestep + dash
  "shield-advance": { q: 1, r: 2 },   // brace + pivot

  // ─── T3: Deep Attack (extending north) ────────────────────────────────────
  "killshot": { q: 1, r: -4 },           // lunge + power-hit
  "blinding-combo": { q: 0, r: -4 },     // combo-strike + power-hit
  "smoke-and-daggers": { q: -1, r: -3 }, // feint-strike + feint
  "blur": { q: 2, r: -4 },               // combo-strike + quick-jab

  // ─── T3: Deep Movement (extending east) ───────────────────────────────────
  "ghost-walk": { q: 4, r: -2 },    // shadow-step + flanking
  "warp-strike": { q: 4, r: -1 },   // shadow-step + pivot
  "slip-away": { q: 4, r: 0 },      // withdraw + dash
  "juggernaut": { q: 3, r: 1 },     // charge + dash

  // ─── T3: Deep Defense (extending southwest) ───────────────────────────────
  "bulwark": { q: -3, r: 3 },       // riposte + parry
  "repel": { q: -2, r: 4 },         // deflect + parry
  "iron-curtain": { q: -1, r: 4 },  // deflect + brace
  "mirror-wall": { q: -4, r: 3 },   // anticipate + sidestep

  // ─── T3: AD Boundary (northwest) ──────────────────────────────────────────
  "vengeance": { q: -3, r: 1 },     // counterstrike + parry
  "iron-feint": { q: -2, r: -2 },   // bait-and-punish + power-hit
  "flicker-stance": { q: -4, r: 1 }, // step-through + sidestep
  "war-dance": { q: -3, r: -1 },    // counterstrike + feint

  // ─── T3: AM Boundary (northeast) ──────────────────────────────────────────
  "storm-blade": { q: 3, r: -3 },   // blitz + power-hit
  "hurricane": { q: 4, r: -3 },     // hit-and-run + quick-jab
  "death-from-shadows": { q: 3, r: -4 }, // ambush + flanking
  "whiplash": { q: 4, r: -4 },      // hit-and-run + feint

  // ─── T3: DM Boundary (south) ──────────────────────────────────────────────
  "guardian-step": { q: 1, r: 3 },   // intercept + flanking
  "vanishing-guard": { q: 0, r: 4 }, // phaseout + dash
  "fortress-march": { q: 1, r: 4 },  // shield-advance + brace
  "displacement": { q: 2, r: 2 },    // intercept + pivot
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

/**
 * Hex layout — nested hexagons, BFS from base skills.
 *
 * Flat-top hex: ATK edge at top (0°), MOV at 120°, DEF at 240°.
 * Border edges between branches at 60°, 180°, 300°.
 *
 * 1. BFS from base skills computes depth.
 * 2. Each depth maps to a hex ring at increasing radius.
 * 3. Each skill maps to a hex edge (branch → side, hybrid → border).
 * 4. Siblings on the same (depth, edge) spread evenly along the edge.
 *
 * Fully deterministic: same visible set → same positions.
 */

import type { Skill, Branch } from "@/types/skill";

// ─── Constants ───────────────────────────────────────────────────────────────

const BASE_RADIUS = 80;
const LAYER_SPACING = 90;

const EDGE_PADDING = 0.15; // fraction of edge to pad from each vertex

/** 6 hex vertex angles (degrees, 0°=top, clockwise) for flat-top hex. */
const HEX_VERTEX_DEGS = [330, 30, 90, 150, 210, 270];

/** Convert our convention (0°=top, CW) to radians for trig. */
function degToRad(deg: number): number {
  return ((deg - 90) * Math.PI) / 180;
}

/** Get (x, y) for a hex vertex at given angle and radius. */
function hexVertex(vertexDeg: number, radius: number): { x: number; y: number } {
  const rad = degToRad(vertexDeg);
  return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius };
}

/** Get all 6 vertices of a hex at given radius. */
export function hexVertices(radius: number): { x: number; y: number }[] {
  return HEX_VERTEX_DEGS.map((deg) => hexVertex(deg, radius));
}

/** Lerp between two points. */
function lerp(
  a: { x: number; y: number },
  b: { x: number; y: number },
  t: number
): { x: number; y: number } {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

// ─── Edge Assignment ─────────────────────────────────────────────────────────

/**
 * 6 edges indexed 0-5:
 *   0: ATK (top)       — vertices 0→1 (330°→30°)
 *   1: ATK–MOV border  — vertices 1→2 (30°→90°)
 *   2: MOV             — vertices 2→3 (90°→150°)
 *   3: MOV–DEF border  — vertices 3→4 (150°→210°)
 *   4: DEF             — vertices 4→5 (210°→270°)
 *   5: DEF–ATK border  — vertices 5→0 (270°→330°)
 */

const BRANCH_EDGE: Record<Branch, number> = {
  attack: 0,
  movement: 2,
  defend: 4,
};

/** Map a pair of branches to their shared border edge. */
function borderEdge(a: Branch, b: Branch): number {
  const pair = [a, b].sort().join(",");
  switch (pair) {
    case "attack,movement":
      return 1;
    case "defend,movement":
      return 3;
    case "attack,defend":
      return 5;
    default:
      return 0;
  }
}

/**
 * Pure branch skills → branch edge (0, 2, 4).
 * Hybrids → border edge between their two branches (1, 3, 5).
 */
function getEdgeIndex(skill: Skill): number {
  if (skill.secondaryBranch) {
    return borderEdge(skill.branch, skill.secondaryBranch);
  }
  return BRANCH_EDGE[skill.branch];
}

// ─── Layout ──────────────────────────────────────────────────────────────────

/**
 * Project a node's prerequisite centroid onto an edge direction.
 * Returns a scalar: lower = closer to v1, higher = closer to v2.
 */
function prereqProjection(
  skillId: string,
  skillById: Map<string, Skill>,
  placed: Map<string, HexPosition>,
  edgeDx: number,
  edgeDy: number
): number {
  const skill = skillById.get(skillId);
  if (!skill) return 0;

  let cx = 0;
  let cy = 0;
  let count = 0;

  for (const pid of skill.prerequisites) {
    const pos = placed.get(pid);
    if (pos) {
      cx += pos.x;
      cy += pos.y;
      count++;
    }
  }

  if (count === 0) return 0;
  cx /= count;
  cy /= count;

  // Dot product of centroid with edge direction
  return cx * edgeDx + cy * edgeDy;
}

export interface HexPosition {
  x: number;
  y: number;
  depth: number;
}

export function computeHexLayout(
  visibleSkills: Skill[]
): Map<string, HexPosition> {
  const result = new Map<string, HexPosition>();
  const depths = new Map<string, number>();
  const visibleIds = new Set(visibleSkills.map((s) => s.id));

  // ─── 1. BFS to assign depth ──────────────────────────────────────
  for (const skill of visibleSkills) {
    if (skill.isBase) {
      depths.set(skill.id, 0);
    }
  }

  const placed = new Set<string>(
    visibleSkills.filter((s) => s.isBase).map((s) => s.id)
  );
  let changed = true;

  while (changed) {
    changed = false;
    for (const skill of visibleSkills) {
      if (placed.has(skill.id)) continue;

      const visiblePrereqs = skill.prerequisites.filter((id) =>
        visibleIds.has(id)
      );
      if (visiblePrereqs.length === 0) continue;
      if (!visiblePrereqs.every((id) => placed.has(id))) continue;

      let maxDepth = 0;
      for (const pid of visiblePrereqs) {
        const d = depths.get(pid) ?? 0;
        if (d > maxDepth) maxDepth = d;
      }
      depths.set(skill.id, maxDepth + 1);

      placed.add(skill.id);
      changed = true;
    }
  }

  // ─── 2. Group by (depth, edge) ───────────────────────────────────
  const groups = new Map<string, string[]>(); // key: "depth:edge"

  for (const skill of visibleSkills) {
    const depth = depths.get(skill.id);
    if (depth === undefined) continue;
    const edge = getEdgeIndex(skill);
    const key = `${depth}:${edge}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(skill.id);
  }

  // ─── 3. Place nodes on hex edges (process depths in order) ────────
  const skillById = new Map(visibleSkills.map((s) => [s.id, s]));
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    const da = parseInt(a.split(":")[0]);
    const db = parseInt(b.split(":")[0]);
    return da - db;
  });

  for (const key of sortedKeys) {
    const ids = groups.get(key)!;
    const [depthStr, edgeStr] = key.split(":");
    const depth = parseInt(depthStr);
    const edgeIdx = parseInt(edgeStr);
    const radius = BASE_RADIUS + depth * LAYER_SPACING;

    const verts = hexVertices(radius);
    const v1 = verts[edgeIdx];
    const v2 = verts[(edgeIdx + 1) % 6];

    // Sort by prerequisite centroid projected onto the edge direction.
    // This keeps children near their parents, avoiding edge crossings.
    const edgeDx = v2.x - v1.x;
    const edgeDy = v2.y - v1.y;

    ids.sort((a, b) => {
      const projA = prereqProjection(a, skillById, result, edgeDx, edgeDy);
      const projB = prereqProjection(b, skillById, result, edgeDx, edgeDy);
      if (projA !== projB) return projA - projB;
      return a.localeCompare(b); // stable tiebreak
    });

    const count = ids.length;
    const usableRange = 1 - 2 * EDGE_PADDING;

    for (let i = 0; i < count; i++) {
      const t =
        count === 1
          ? 0.5
          : EDGE_PADDING + (usableRange * i) / (count - 1);

      const pos = lerp(v1, v2, t);
      result.set(ids[i], { x: pos.x, y: pos.y, depth });
    }
  }

  return result;
}

/** Get hex radii for all depths that have visible nodes. */
export function getHexRadii(positions: Map<string, HexPosition>): number[] {
  const depths = new Set<number>();
  for (const pos of positions.values()) {
    depths.add(pos.depth);
  }
  return Array.from(depths)
    .sort((a, b) => a - b)
    .map((d) => BASE_RADIUS + d * LAYER_SPACING);
}

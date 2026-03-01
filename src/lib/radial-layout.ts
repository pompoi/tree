/**
 * Radial tree layout — BFS from base skills.
 *
 * 1. Base skills pinned at their branch angles on an inner ring.
 * 2. BFS computes depth (distance from nearest base).
 * 3. Each depth ring is placed at BASE_RADIUS + depth * LAYER_SPACING.
 * 4. A node's angle = average of its prerequisite angles.
 * 5. Siblings at the same depth are spread to avoid overlap.
 *
 * Fully deterministic: same visible set → same positions.
 */

import type { Skill, Branch } from "@/types/skill";
import { SKILL_MAP } from "@/data/skills";
import { normalizeAngle, averageAngles } from "@/lib/polar";

// ─── Constants ───────────────────────────────────────────────────────────────

const BASE_RADIUS = 80;
const LAYER_SPACING = 100;

/** Minimum arc distance (px) between node centers on the same ring. */
const MIN_NODE_GAP = 45;

const BRANCH_ANGLES: Record<Branch, number> = {
  attack: 0,
  movement: (2 * Math.PI) / 3,
  defend: (4 * Math.PI) / 3,
};

// ─── Layout ──────────────────────────────────────────────────────────────────

export interface RadialPosition {
  angle: number;
  radius: number;
  x: number;
  y: number;
}

export function computeRadialLayout(
  visibleSkills: Skill[]
): Map<string, RadialPosition> {
  const result = new Map<string, RadialPosition>();
  const angles = new Map<string, number>();
  const depths = new Map<string, number>();
  const visibleIds = new Set(visibleSkills.map((s) => s.id));

  // ─── 1. Place base skills ──────────────────────────────────────────
  for (const skill of visibleSkills) {
    if (skill.isBase) {
      const angle = BRANCH_ANGLES[skill.branch];
      angles.set(skill.id, angle);
      depths.set(skill.id, 0);
    }
  }

  // ─── 2. BFS to assign depth + base angle ───────────────────────────
  // Process nodes in topological order (all prereqs placed before children).
  const placed = new Set<string>(
    visibleSkills.filter((s) => s.isBase).map((s) => s.id)
  );
  let changed = true;

  while (changed) {
    changed = false;
    for (const skill of visibleSkills) {
      if (placed.has(skill.id)) continue;

      // Check if all visible prerequisites are placed
      const visiblePrereqs = skill.prerequisites.filter((id) =>
        visibleIds.has(id)
      );
      if (visiblePrereqs.length === 0) continue;
      if (!visiblePrereqs.every((id) => placed.has(id))) continue;

      // Depth = max prereq depth + 1
      let maxDepth = 0;
      for (const pid of visiblePrereqs) {
        const d = depths.get(pid) ?? 0;
        if (d > maxDepth) maxDepth = d;
      }
      depths.set(skill.id, maxDepth + 1);

      // Angle = average of prerequisite angles
      const prereqAngles = visiblePrereqs.map((id) => angles.get(id) ?? 0);
      let angle: number;
      if (prereqAngles.length === 1) {
        angle = prereqAngles[0];
      } else {
        // Iteratively average to handle wraparound
        angle = prereqAngles[0];
        for (let i = 1; i < prereqAngles.length; i++) {
          angle = averageAngles(angle, prereqAngles[i]);
        }
      }
      angles.set(skill.id, angle);

      placed.add(skill.id);
      changed = true;
    }
  }

  // ─── 3. Group by depth and spread siblings ─────────────────────────
  const byDepth = new Map<number, string[]>();
  for (const skill of visibleSkills) {
    const d = depths.get(skill.id);
    if (d === undefined) continue;
    if (!byDepth.has(d)) byDepth.set(d, []);
    byDepth.get(d)!.push(skill.id);
  }

  for (const [depth, ids] of byDepth) {
    const radius = BASE_RADIUS + depth * LAYER_SPACING;

    if (ids.length === 1) {
      // Single node at this depth — use its computed angle as-is
      const id = ids[0];
      const angle = angles.get(id) ?? 0;
      result.set(id, {
        angle,
        radius,
        x: Math.sin(angle) * radius,
        y: -Math.cos(angle) * radius,
      });
      continue;
    }

    // Sort by angle for deterministic ordering
    ids.sort((a, b) => (angles.get(a) ?? 0) - (angles.get(b) ?? 0));

    // Compute minimum angular separation at this radius
    const minSep = MIN_NODE_GAP / radius;

    // Spread nodes: if two nodes are too close, push them apart
    const finalAngles = ids.map((id) => angles.get(id) ?? 0);

    // Multiple passes to resolve overlaps
    for (let pass = 0; pass < 5; pass++) {
      for (let i = 0; i < finalAngles.length; i++) {
        for (let j = i + 1; j < finalAngles.length; j++) {
          let diff = normalizeAngle(finalAngles[j] - finalAngles[i]);
          if (diff > Math.PI) diff -= 2 * Math.PI;

          const absDiff = Math.abs(diff);
          if (absDiff < minSep) {
            const push = (minSep - absDiff) / 2;
            const sign = diff >= 0 ? 1 : -1;
            finalAngles[i] = normalizeAngle(finalAngles[i] - sign * push);
            finalAngles[j] = normalizeAngle(finalAngles[j] + sign * push);
          }
        }
      }
    }

    // Write final positions
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const angle = finalAngles[i];
      angles.set(id, angle); // Update for downstream children
      result.set(id, {
        angle,
        radius,
        x: Math.sin(angle) * radius,
        y: -Math.cos(angle) * radius,
      });
    }
  }

  return result;
}

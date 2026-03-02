import type { Skill, Branch, Tier } from "@/types/skill";
import { SKILLS } from "./skills";
import { normalizeAngle, averageAngles } from "@/lib/polar";

// ─── Constants ───────────────────────────────────────────────────────────────

/** Center angle (radians) for each branch. Attack points up (north). */
export const BRANCH_ANGLES: Record<Branch, number> = {
  attack: 0,
  movement: (2 * Math.PI) / 3,
  defend: (4 * Math.PI) / 3,
};

/** Each branch occupies 120° (2π/3 radians). */
export const SLICE_WIDTH = (2 * Math.PI) / 3;

/** Radius in SVG units for each tier. */
export const TIER_RADII: Record<Tier, number> = {
  0: 60,
  1: 160,
  2: 260,
  3: 360,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Return all skills that are "pure" siblings of the given skill:
 * same primary branch, same tier, and no secondaryBranch.
 */
function getPureSiblings(skill: Skill): Skill[] {
  return SKILLS.filter(
    (s) =>
      s.branch === skill.branch &&
      s.tier === skill.tier &&
      s.secondaryBranch === undefined
  );
}

/**
 * Return all cross-branch (hybrid) skills that sit on the same border
 * (same primary branch + same secondary branch) at the same tier.
 */
function getHybridSiblings(skill: Skill): Skill[] {
  if (!skill.secondaryBranch) return [];
  return SKILLS.filter(
    (s) =>
      s.tier === skill.tier &&
      ((s.branch === skill.branch && s.secondaryBranch === skill.secondaryBranch) ||
        (s.branch === skill.secondaryBranch &&
          s.secondaryBranch === skill.branch))
  );
}

// ─── Position Calculation ────────────────────────────────────────────────────

/**
 * Compute the polar (angle, radius) for a skill based on its branch/tier/siblings.
 *
 * Pure-branch skills are spread evenly within their branch slice.
 * Cross-branch skills are placed at the midpoint angle between their two branches,
 * with a small radial offset when multiple hybrids share the same border+tier.
 */
export function getSkillPosition(
  skill: Skill
): { angle: number; radius: number } {
  const radius = TIER_RADII[skill.tier];

  if (!skill.secondaryBranch) {
    // ── Pure branch skill ───────────────────────────────────────────────────
    const siblings = getPureSiblings(skill);
    const count = siblings.length;
    const index = siblings.findIndex((s) => s.id === skill.id);

    const center = BRANCH_ANGLES[skill.branch];

    if (count === 1) {
      return { angle: normalizeAngle(center), radius };
    }

    // Spread siblings symmetrically within the slice.
    // Leave some margin so nodes don't crowd the border.
    const margin = SLICE_WIDTH * 0.15;
    const usableArc = SLICE_WIDTH - 2 * margin;
    const step = usableArc / (count - 1);
    const startAngle = center - usableArc / 2;
    const angle = startAngle + step * index;

    return { angle: normalizeAngle(angle), radius };
  }

  // ── Cross-branch (hybrid) skill ─────────────────────────────────────────
  const primaryAngle = BRANCH_ANGLES[skill.branch];
  const secondaryAngle = BRANCH_ANGLES[skill.secondaryBranch];
  const midAngle = averageAngles(primaryAngle, secondaryAngle);

  const siblings = getHybridSiblings(skill);
  const count = siblings.length;
  const index = siblings.findIndex((s) => s.id === skill.id);

  if (count === 1) {
    return { angle: normalizeAngle(midAngle), radius };
  }

  // Offset multiple hybrids along the arc so they don't overlap.
  const spread = (SLICE_WIDTH * 0.1) * (count - 1);
  const step = count > 1 ? spread / (count - 1) : 0;
  const startAngle = midAngle - spread / 2;
  const angle = startAngle + step * index;

  return { angle: normalizeAngle(angle), radius };
}

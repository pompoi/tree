import type { HexCardPattern } from "@/types/hex-card";

/**
 * Hex card patterns for all 30 skills.
 *
 * Coordinate convention (flat-top axial):
 *   q=+1 → right, q=-1 → left
 *   r=-1 → upper-right, r=+1 → lower-left
 *
 * Player always sits at {q:0, r:0} facing toward {q:1, r:0} (right).
 * "Behind" the target = {q:-1, r:0} relative to target.
 */

export const HEX_PATTERNS: HexCardPattern[] = [
  // ─── Tier 0: Core Skills ────────────────────────────────────────────────

  {
    skillId: "melee-attack",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "damage", animationDelay: 1 },
    ],
    arrows: [{ from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "facing" }],
    note: "1 damage to adjacent facing hex",
  },
  {
    skillId: "move",
    cells: [
      { coord: { q: 0, r: 0 }, type: "empty", animationDelay: 0 },
      { coord: { q: 1, r: 0 }, type: "empty", animationDelay: 0 },
      {
        coord: { q: 1, r: 0 },
        type: "player",
        animateFrom: { q: 0, r: 0 },
        animationDelay: 2,
      },
    ],
    arrows: [{ from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "move" }],
    note: "Move 1 hex in facing direction",
  },
  {
    skillId: "defend",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "block", animationDelay: 1 },
    ],
    arrows: [{ from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "facing" }],
    note: "Block 1 damage from facing direction",
  },

  // ─── Tier 1: Boost Skills ──────────────────────────────────────────────

  {
    skillId: "sharpen",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "damage", label: "×2", animationDelay: 1 },
    ],
    arrows: [{ from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "attack" }],
    note: "Melee Attack deals 2 damage",
  },
  {
    skillId: "swift-feet",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "movement", animationDelay: 1 },
      { coord: { q: 2, r: 0 }, type: "movement", animationDelay: 2 },
    ],
    arrows: [{ from: { q: 0, r: 0 }, to: { q: 2, r: 0 }, style: "move" }],
    note: "Move covers 2 hexes",
  },
  {
    skillId: "iron-skin",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "block", label: "×2", animationDelay: 1 },
    ],
    arrows: [{ from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "facing" }],
    note: "Defend blocks 2 damage",
  },

  // ─── Tier 1: Attack Branch ─────────────────────────────────────────────

  {
    skillId: "power-hit",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "damage", label: "💥", animationDelay: 1 },
    ],
    arrows: [{ from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "attack" }],
    note: "Breaks Parry — slow, committed",
  },
  {
    skillId: "quick-jab",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "damage", label: "⚡", animationDelay: 1 },
    ],
    arrows: [{ from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "attack" }],
    note: "Resolves before other attacks",
  },
  {
    skillId: "feint",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "conditional", label: "?", animationDelay: 1 },
    ],
    arrows: [],
    note: "DEF → Advantage · ATK → exposed · MOV → nothing",
  },

  // ─── Tier 1: Defense Branch ────────────────────────────────────────────

  {
    skillId: "parry",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "block", animationDelay: 1 },
    ],
    arrows: [
      { from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "facing" },
      { from: { q: 1, r: 0 }, to: { q: 0, r: 0 }, style: "counter" },
    ],
    note: "Block + 1 counter-damage to attacker",
  },
  {
    skillId: "brace",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "block", animationDelay: 1 },
      { coord: { q: 1, r: -1 }, type: "block", animationDelay: 2 },
      { coord: { q: 0, r: -1 }, type: "block", animationDelay: 3 },
      { coord: { q: -1, r: 0 }, type: "block", animationDelay: 4 },
      { coord: { q: -1, r: 1 }, type: "block", animationDelay: 5 },
      { coord: { q: 0, r: 1 }, type: "block", animationDelay: 6 },
    ],
    arrows: [],
    note: "All-direction damage reduction · immobile next round",
  },
  {
    skillId: "sidestep",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 0, r: -1 }, type: "movement", animationDelay: 1 },
      { coord: { q: 0, r: 1 }, type: "movement", animationDelay: 1 },
    ],
    arrows: [
      { from: { q: 0, r: 0 }, to: { q: 0, r: -1 }, style: "move" },
      { from: { q: 0, r: 0 }, to: { q: 0, r: 1 }, style: "move" },
    ],
    note: "Perpendicular dodge · keeps facing",
  },

  // ─── Tier 1: Movement Branch ───────────────────────────────────────────

  {
    skillId: "flanking",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "empty", animationDelay: 1 },
      { coord: { q: 2, r: 0 }, type: "conditional", label: "T", animationDelay: 2 },
      { coord: { q: 3, r: 0 }, type: "damage", animationDelay: 3 },
    ],
    arrows: [
      { from: { q: 0, r: 0 }, to: { q: 3, r: 0 }, style: "move" },
    ],
    note: "Move behind target → 1 damage",
  },
  {
    skillId: "dash",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "movement", animationDelay: 1 },
      { coord: { q: 2, r: 0 }, type: "movement", animationDelay: 2 },
      { coord: { q: 3, r: 0 }, type: "movement", animationDelay: 3 },
    ],
    arrows: [{ from: { q: 0, r: 0 }, to: { q: 3, r: 0 }, style: "move" }],
    note: "Up to 3 hexes · can't change facing",
  },
  {
    skillId: "pivot",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "conditional", animationDelay: 1 },
      { coord: { q: 1, r: -1 }, type: "conditional", animationDelay: 2 },
      { coord: { q: 0, r: -1 }, type: "conditional", animationDelay: 3 },
      { coord: { q: -1, r: 0 }, type: "conditional", animationDelay: 4 },
      { coord: { q: -1, r: 1 }, type: "conditional", animationDelay: 5 },
      { coord: { q: 0, r: 1 }, type: "conditional", animationDelay: 6 },
    ],
    arrows: [],
    note: "Rotate to any direction · may block from new facing",
  },

  // ─── Tier 2: Attack Branch ─────────────────────────────────────────────

  {
    skillId: "lunge",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "movement", animationDelay: 1 },
      { coord: { q: 2, r: 0 }, type: "damage", animationDelay: 2 },
    ],
    arrows: [{ from: { q: 0, r: 0 }, to: { q: 2, r: 0 }, style: "attack" }],
    note: "2-hex reach · move into adjacent hex",
  },
  {
    skillId: "combo-strike",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "damage", label: "×2", animationDelay: 1 },
    ],
    arrows: [{ from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "attack" }],
    note: "2 damage if ATK used last round",
  },
  {
    skillId: "feint-strike",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "conditional", animationDelay: 1 },
      { coord: { q: 1, r: 0 }, type: "damage", animationDelay: 2 },
    ],
    arrows: [],
    note: "DEF → 1 damage · ATK → both resolve · MOV → nothing",
  },

  // ─── Tier 2: Defense Branch ────────────────────────────────────────────

  {
    skillId: "riposte",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "block", animationDelay: 1 },
    ],
    arrows: [
      { from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "facing" },
      { from: { q: 1, r: 0 }, to: { q: 0, r: 0 }, style: "counter" },
    ],
    note: "Block + 2 counter-damage (high-risk Parry)",
  },
  {
    skillId: "deflect",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "block", animationDelay: 1 },
      { coord: { q: -1, r: 0 }, type: "damage", animationDelay: 2 },
      { coord: { q: 0, r: -1 }, type: "damage", animationDelay: 2 },
      { coord: { q: 0, r: 1 }, type: "damage", animationDelay: 2 },
    ],
    arrows: [
      { from: { q: 1, r: 0 }, to: { q: 0, r: 0 }, style: "facing" },
    ],
    note: "Absorb 1 · redirect 1 to adjacent target",
  },
  {
    skillId: "anticipate",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "conditional", label: "ATK?", animationDelay: 1 },
      { coord: { q: 0, r: -1 }, type: "conditional", label: "MOV?", animationDelay: 2 },
      { coord: { q: -1, r: 1 }, type: "conditional", label: "DEF?", animationDelay: 3 },
    ],
    arrows: [],
    note: "Guess right → negate + Advantage · wrong → Stunned",
  },

  // ─── Tier 2: Movement Branch ───────────────────────────────────────────

  {
    skillId: "charge",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "movement", animationDelay: 1 },
      { coord: { q: 2, r: 0 }, type: "damage", animationDelay: 2 },
    ],
    arrows: [{ from: { q: 0, r: 0 }, to: { q: 2, r: 0 }, style: "move" }],
    note: "Close distance + 1 damage on arrival",
  },
  {
    skillId: "withdraw",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: -1, r: 0 }, type: "movement", animationDelay: 1 },
      { coord: { q: -2, r: 0 }, type: "movement", animationDelay: 2 },
    ],
    arrows: [{ from: { q: 0, r: 0 }, to: { q: -2, r: 0 }, style: "move" }],
    note: "Retreat · melee ATK misses · +1 DEF next round",
  },
  {
    skillId: "shadow-step",
    cells: [
      { coord: { q: 2, r: 0 }, type: "conditional", label: "T", animationDelay: 0 },
      { coord: { q: 3, r: 0 }, type: "movement", animationDelay: 1 },
      { coord: { q: 3, r: -1 }, type: "movement", animationDelay: 1 },
      { coord: { q: 2, r: -1 }, type: "movement", animationDelay: 1 },
      { coord: { q: 1, r: 0 }, type: "movement", animationDelay: 1 },
      { coord: { q: 1, r: 1 }, type: "damage", animationDelay: 2 },
      { coord: { q: 2, r: 1 }, type: "movement", animationDelay: 1 },
      { coord: { q: 0, r: 0 }, type: "player" },
    ],
    arrows: [],
    note: "Teleport adjacent to target · behind = 1 damage",
  },

  // ─── Tier 3: Attack Branch ─────────────────────────────────────────────

  {
    skillId: "executioner",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "damage", label: "×3", animationDelay: 1 },
    ],
    arrows: [{ from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "attack" }],
    note: "3 damage · requires Advantage (consumed)",
  },
  {
    skillId: "whirlwind",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "damage", animationDelay: 1 },
      { coord: { q: 1, r: -1 }, type: "damage", animationDelay: 2 },
      { coord: { q: 0, r: -1 }, type: "damage", animationDelay: 3 },
      { coord: { q: -1, r: 0 }, type: "damage", animationDelay: 4 },
      { coord: { q: -1, r: 1 }, type: "damage", animationDelay: 5 },
      { coord: { q: 0, r: 1 }, type: "damage", animationDelay: 6 },
    ],
    arrows: [],
    note: "1 damage to ALL 6 adjacent hexes",
  },

  // ─── Tier 3: Defense Branch ────────────────────────────────────────────

  {
    skillId: "mirror-guard",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "block", animationDelay: 1 },
    ],
    arrows: [
      { from: { q: 1, r: 0 }, to: { q: 0, r: 0 }, style: "attack" },
      { from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "counter" },
    ],
    note: "Copy attacker's skill back at them",
  },
  {
    skillId: "fortress",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "block", animationDelay: 1 },
      { coord: { q: 1, r: -1 }, type: "block", animationDelay: 2 },
      { coord: { q: 0, r: -1 }, type: "block", animationDelay: 3 },
      { coord: { q: -1, r: 0 }, type: "block", animationDelay: 4 },
      { coord: { q: -1, r: 1 }, type: "block", animationDelay: 5 },
      { coord: { q: 0, r: 1 }, type: "block", animationDelay: 6 },
    ],
    arrows: [],
    note: "Block ALL damage · immobile 2 rounds after",
  },

  // ─── Tier 3: Movement Branch ───────────────────────────────────────────

  {
    skillId: "phantom-step",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "movement", animationDelay: 1 },
      { coord: { q: 2, r: 0 }, type: "movement", animationDelay: 2 },
      { coord: { q: 3, r: 0 }, type: "movement", animationDelay: 3 },
      { coord: { q: 0, r: -1 }, type: "movement", animationDelay: 1 },
      { coord: { q: -1, r: 0 }, type: "movement", animationDelay: 2 },
      { coord: { q: 0, r: 1 }, type: "movement", animationDelay: 1 },
    ],
    arrows: [],
    note: "Any hex within 3 · free facing · untargetable",
  },
  {
    skillId: "overrun",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "damage", animationDelay: 1 },
      { coord: { q: 2, r: 0 }, type: "conditional", label: "push", animationDelay: 2 },
    ],
    arrows: [{ from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "move" }],
    note: "Move through · push target 1 hex · 1 damage",
  },
];

export const HEX_PATTERN_MAP = new Map(
  HEX_PATTERNS.map((p) => [p.skillId, p])
);

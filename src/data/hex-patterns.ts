import type { HexCardPattern } from "@/types/hex-card";

/**
 * Hex card patterns for all skills.
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

  // ─── Tier 2: Cross-Branch AD ───────────────────────────────────────────

  {
    skillId: "counterstrike",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "block", animationDelay: 1 },
      { coord: { q: 1, r: 0 }, type: "damage", label: "!", animationDelay: 2 },
    ],
    arrows: [
      { from: { q: 1, r: 0 }, to: { q: 0, r: 0 }, style: "attack" },
      { from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "counter" },
    ],
    note: "Block then counter-strike",
  },
  {
    skillId: "bait-and-punish",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 0, r: 0 }, type: "damage", label: "hit", animationDelay: 1 },
      { coord: { q: 1, r: 0 }, type: "damage", label: "=", animationDelay: 2 },
    ],
    arrows: [
      { from: { q: 1, r: 0 }, to: { q: 0, r: 0 }, style: "attack" },
      { from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "counter" },
    ],
    note: "Absorb hit, return equal damage",
  },
  {
    skillId: "step-through",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 0, r: 1 }, type: "movement", animationDelay: 1 },
      { coord: { q: 1, r: 0 }, type: "damage", animationDelay: 2 },
    ],
    arrows: [
      { from: { q: 0, r: 0 }, to: { q: 0, r: 1 }, style: "move" },
      { from: { q: 0, r: 1 }, to: { q: 1, r: 0 }, style: "attack" },
    ],
    note: "Dodge sideways, strike",
  },

  // ─── Tier 2: Cross-Branch AM ───────────────────────────────────────────

  {
    skillId: "blitz",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "movement", animationDelay: 1 },
      { coord: { q: 2, r: 0 }, type: "damage", label: "2", animationDelay: 2 },
    ],
    arrows: [
      { from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "move" },
      { from: { q: 1, r: 0 }, to: { q: 2, r: 0 }, style: "attack" },
    ],
    note: "Move 2, deal 2 damage",
  },
  {
    skillId: "hit-and-run",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "damage", animationDelay: 1 },
      { coord: { q: 0, r: 0 }, type: "movement", label: "↻", animationDelay: 2 },
    ],
    arrows: [
      { from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "attack" },
    ],
    note: "Strike, rotate 180°",
  },
  {
    skillId: "ambush",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "movement", animationDelay: 1 },
      { coord: { q: 2, r: -1 }, type: "conditional", label: "!", animationDelay: 2 },
    ],
    arrows: [
      { from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "move" },
      { from: { q: 1, r: 0 }, to: { q: 2, r: -1 }, style: "attack" },
    ],
    note: "Reads as MOV, resolves as ATK",
  },

  // ─── Tier 2: Cross-Branch DM ───────────────────────────────────────────

  {
    skillId: "intercept",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: -1 }, type: "movement", animationDelay: 1 },
      { coord: { q: 1, r: -1 }, type: "block", animationDelay: 2 },
      { coord: { q: 2, r: -1 }, type: "damage", label: "!", animationDelay: 3 },
    ],
    arrows: [
      { from: { q: 0, r: 0 }, to: { q: 1, r: -1 }, style: "move" },
      { from: { q: 1, r: -1 }, to: { q: 2, r: -1 }, style: "counter" },
    ],
    note: "Move to block flank, counter",
  },
  {
    skillId: "phaseout",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 0, r: 1 }, type: "movement", animationDelay: 1 },
      { coord: { q: 0, r: 2 }, type: "movement", animationDelay: 2 },
    ],
    arrows: [
      { from: { q: 0, r: 0 }, to: { q: 0, r: 1 }, style: "move" },
      { from: { q: 0, r: 1 }, to: { q: 0, r: 2 }, style: "move" },
    ],
    note: "2 hex perpendicular, untargetable",
  },
  {
    skillId: "shield-advance",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "block", animationDelay: 1 },
      { coord: { q: 1, r: -1 }, type: "block", animationDelay: 1 },
      { coord: { q: 0, r: -1 }, type: "block", animationDelay: 1 },
      { coord: { q: -1, r: 0 }, type: "block", animationDelay: 1 },
      { coord: { q: -1, r: 1 }, type: "block", animationDelay: 1 },
      { coord: { q: 0, r: 1 }, type: "block", animationDelay: 1 },
    ],
    arrows: [],
    note: "Omnidirectional block + rotate",
  },

  // ─── Tier 3: Deep Attack ────────────────────────────────────────────────

  {
    skillId: "killshot",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "empty" },
      { coord: { q: 2, r: 0 }, type: "damage", label: "3", animationDelay: 1 },
    ],
    arrows: [{ from: { q: 0, r: 0 }, to: { q: 2, r: 0 }, style: "attack" }],
    note: "3 damage at range 2, breaks Parry",
  },
  {
    skillId: "blinding-combo",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "damage", label: "1", animationDelay: 1 },
      { coord: { q: 1, r: 0 }, type: "damage", label: "2", animationDelay: 2 },
      { coord: { q: 1, r: 0 }, type: "damage", label: "3", animationDelay: 3 },
    ],
    arrows: [{ from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "attack" }],
    note: "3-hit combo, gains Advantage",
  },
  {
    skillId: "smoke-and-daggers",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "conditional", label: "?", animationDelay: 1 },
      { coord: { q: 1, r: 0 }, type: "conditional", label: "?", animationDelay: 2 },
      { coord: { q: 1, r: 0 }, type: "damage", label: "4", animationDelay: 3 },
    ],
    arrows: [{ from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "attack" }],
    note: "If DEF×2 rounds, deal 4",
  },
  {
    skillId: "blur",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "damage", label: "⚡", animationDelay: 1 },
      { coord: { q: 1, r: 0 }, type: "damage", label: "2", animationDelay: 2 },
    ],
    arrows: [{ from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "attack" }],
    note: "Movement-phase combo, ignores Parry",
  },

  // ─── Tier 3: Deep Defend ────────────────────────────────────────────────

  {
    skillId: "bulwark",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "block", animationDelay: 1 },
      { coord: { q: 1, r: -1 }, type: "block", animationDelay: 1 },
      { coord: { q: 1, r: 0 }, type: "damage", label: "3", animationDelay: 2 },
    ],
    arrows: [
      { from: { q: 1, r: 0 }, to: { q: 0, r: 0 }, style: "attack" },
      { from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "counter" },
    ],
    note: "Block all frontal, return 3",
  },
  {
    skillId: "iron-curtain",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "block", animationDelay: 1 },
      { coord: { q: 1, r: -1 }, type: "block", animationDelay: 1 },
      { coord: { q: 0, r: -1 }, type: "block", animationDelay: 1 },
      { coord: { q: -1, r: 0 }, type: "block", animationDelay: 1 },
      { coord: { q: -1, r: 1 }, type: "block", animationDelay: 1 },
      { coord: { q: 0, r: 1 }, type: "block", animationDelay: 1 },
    ],
    arrows: [],
    note: "All damage to 0, immobile 1 round",
  },
  {
    skillId: "mirror-wall",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "conditional", label: "?", animationDelay: 1 },
      { coord: { q: -1, r: 1 }, type: "movement", animationDelay: 2 },
      { coord: { q: -1, r: 1 }, type: "damage", label: "2", animationDelay: 3 },
    ],
    arrows: [
      { from: { q: 0, r: 0 }, to: { q: -1, r: 1 }, style: "move" },
    ],
    note: "Predict branch, dodge behind, deal 2",
  },
  {
    skillId: "repel",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 0, r: 0 }, type: "block", animationDelay: 1 },
      { coord: { q: 1, r: 0 }, type: "damage", label: "1", animationDelay: 2 },
      { coord: { q: 1, r: -1 }, type: "damage", label: "1", animationDelay: 2 },
      { coord: { q: 0, r: -1 }, type: "damage", label: "1", animationDelay: 2 },
      { coord: { q: -1, r: 0 }, type: "damage", label: "1", animationDelay: 2 },
      { coord: { q: -1, r: 1 }, type: "damage", label: "1", animationDelay: 2 },
      { coord: { q: 0, r: 1 }, type: "damage", label: "1", animationDelay: 2 },
    ],
    arrows: [],
    note: "Redirect damage as splash to adjacents",
  },

  // ─── Tier 3: Deep Move ──────────────────────────────────────────────────

  {
    skillId: "ghost-walk",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "movement", animationDelay: 1 },
      { coord: { q: 2, r: -1 }, type: "movement", animationDelay: 2 },
      { coord: { q: 2, r: 0 }, type: "movement", animationDelay: 3 },
    ],
    arrows: [
      { from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "move" },
      { from: { q: 1, r: 0 }, to: { q: 2, r: -1 }, style: "move" },
    ],
    note: "5-hex range, untargetable",
  },
  {
    skillId: "juggernaut",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "movement", animationDelay: 1 },
      { coord: { q: 2, r: 0 }, type: "damage", label: "2", animationDelay: 2 },
      { coord: { q: 2, r: 0 }, type: "movement", label: "push", animationDelay: 3 },
    ],
    arrows: [
      { from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "move" },
      { from: { q: 1, r: 0 }, to: { q: 2, r: 0 }, style: "attack" },
    ],
    note: "Move through, push 2, deal 2",
  },
  {
    skillId: "warp-strike",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "empty", label: "T" },
      { coord: { q: 1, r: 0 }, type: "damage", label: "2", animationDelay: 1 },
    ],
    arrows: [
      { from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "move" },
    ],
    note: "Teleport adjacent, 2 damage any facing",
  },
  {
    skillId: "slip-away",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: -1, r: 0 }, type: "movement", animationDelay: 1 },
      { coord: { q: -2, r: 0 }, type: "movement", animationDelay: 2 },
      { coord: { q: -3, r: 0 }, type: "movement", animationDelay: 3 },
      { coord: { q: -3, r: 0 }, type: "block", label: "+2", animationDelay: 4 },
    ],
    arrows: [
      { from: { q: 0, r: 0 }, to: { q: -1, r: 0 }, style: "move" },
      { from: { q: -1, r: 0 }, to: { q: -2, r: 0 }, style: "move" },
      { from: { q: -2, r: 0 }, to: { q: -3, r: 0 }, style: "move" },
    ],
    note: "4 hex escape, +2 Defend next round",
  },

  // ─── Tier 3: AD Boundary ────────────────────────────────────────────────

  {
    skillId: "vengeance",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 0, r: 0 }, type: "block", animationDelay: 1 },
      { coord: { q: 1, r: 0 }, type: "damage", label: "×2", animationDelay: 2 },
    ],
    arrows: [
      { from: { q: 1, r: 0 }, to: { q: 0, r: 0 }, style: "attack" },
      { from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "counter" },
    ],
    note: "Block, return 2× blocked damage",
  },
  {
    skillId: "iron-feint",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 0, r: 0 }, type: "block", label: "hit", animationDelay: 1 },
      { coord: { q: 1, r: 0 }, type: "damage", label: "💥", animationDelay: 2 },
    ],
    arrows: [
      { from: { q: 1, r: 0 }, to: { q: 0, r: 0 }, style: "attack" },
      { from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "counter" },
    ],
    note: "Absorb hit, Power Hit back",
  },
  {
    skillId: "flicker-stance",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 0, r: 1 }, type: "movement", animationDelay: 1 },
      { coord: { q: 1, r: 0 }, type: "damage", label: "1", animationDelay: 2 },
    ],
    arrows: [
      { from: { q: 0, r: 0 }, to: { q: 0, r: 1 }, style: "move" },
      { from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "attack" },
    ],
    note: "Dodge + strike, remove Advantage",
  },
  {
    skillId: "war-dance",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "conditional", label: "A", animationDelay: 1 },
      { coord: { q: 0, r: 1 }, type: "conditional", label: "B", animationDelay: 1 },
    ],
    arrows: [
      { from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "counter" },
      { from: { q: 0, r: 0 }, to: { q: 0, r: 1 }, style: "attack" },
    ],
    note: "Choose: block+punish OR feint",
  },

  // ─── Tier 3: AM Boundary ────────────────────────────────────────────────

  {
    skillId: "storm-blade",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "movement", animationDelay: 1 },
      { coord: { q: 2, r: 0 }, type: "movement", animationDelay: 2 },
      { coord: { q: 3, r: 0 }, type: "damage", label: "3", animationDelay: 3 },
    ],
    arrows: [
      { from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "move" },
      { from: { q: 1, r: 0 }, to: { q: 2, r: 0 }, style: "move" },
      { from: { q: 2, r: 0 }, to: { q: 3, r: 0 }, style: "attack" },
    ],
    note: "Move 3, deal 3 damage",
  },
  {
    skillId: "hurricane",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "damage", label: "1", animationDelay: 1 },
      { coord: { q: 0, r: 0 }, type: "movement", label: "↻", animationDelay: 2 },
      { coord: { q: -1, r: 0 }, type: "damage", label: "1", animationDelay: 3 },
    ],
    arrows: [
      { from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "attack" },
      { from: { q: 0, r: 0 }, to: { q: -1, r: 0 }, style: "attack" },
    ],
    note: "Strike, pivot, strike again",
  },
  {
    skillId: "death-from-shadows",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "movement", animationDelay: 1 },
      { coord: { q: 1, r: 1 }, type: "movement", animationDelay: 2 },
      { coord: { q: 1, r: 1 }, type: "damage", label: "2", animationDelay: 3 },
    ],
    arrows: [
      { from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "move" },
      { from: { q: 1, r: 0 }, to: { q: 1, r: 1 }, style: "attack" },
    ],
    note: "Reads as MOV, 2 damage from behind",
  },
  {
    skillId: "whiplash",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "damage", label: "1", animationDelay: 1 },
      { coord: { q: 1, r: 0 }, type: "conditional", label: "?", animationDelay: 2 },
    ],
    arrows: [
      { from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "attack" },
    ],
    note: "Strike, fake 2nd hit for Advantage",
  },

  // ─── Tier 3: DM Boundary ────────────────────────────────────────────────

  {
    skillId: "guardian-step",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: -1 }, type: "movement", animationDelay: 1 },
      { coord: { q: 1, r: -1 }, type: "block", animationDelay: 2 },
    ],
    arrows: [
      { from: { q: 0, r: 0 }, to: { q: 1, r: -1 }, style: "move" },
    ],
    note: "Flank attacker while blocking",
  },
  {
    skillId: "vanishing-guard",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "movement", animationDelay: 1 },
      { coord: { q: 2, r: 0 }, type: "movement", animationDelay: 2 },
      { coord: { q: 3, r: 0 }, type: "movement", animationDelay: 3 },
      { coord: { q: 3, r: 0 }, type: "block", label: "+1", animationDelay: 4 },
    ],
    arrows: [
      { from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "move" },
      { from: { q: 1, r: 0 }, to: { q: 2, r: 0 }, style: "move" },
      { from: { q: 2, r: 0 }, to: { q: 3, r: 0 }, style: "move" },
    ],
    note: "3 hex move, untargetable, +1 Defend",
  },
  {
    skillId: "fortress-march",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "block", animationDelay: 1 },
      { coord: { q: 0, r: -1 }, type: "block", animationDelay: 1 },
      { coord: { q: -1, r: 0 }, type: "block", animationDelay: 1 },
      { coord: { q: 0, r: 1 }, type: "block", animationDelay: 1 },
      { coord: { q: 1, r: 0 }, type: "movement", animationDelay: 2 },
      { coord: { q: 2, r: 0 }, type: "movement", animationDelay: 3 },
    ],
    arrows: [
      { from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "move" },
    ],
    note: "Move 2 with omnidirectional block",
  },
  {
    skillId: "displacement",
    cells: [
      { coord: { q: 0, r: 0 }, type: "player" },
      { coord: { q: 1, r: 0 }, type: "block", animationDelay: 1 },
      { coord: { q: 1, r: -1 }, type: "block", animationDelay: 1 },
      { coord: { q: 0, r: -1 }, type: "block", animationDelay: 1 },
      { coord: { q: -1, r: 0 }, type: "block", animationDelay: 1 },
      { coord: { q: -1, r: 1 }, type: "block", animationDelay: 1 },
      { coord: { q: 0, r: 1 }, type: "block", animationDelay: 1 },
      { coord: { q: 1, r: 0 }, type: "damage", label: "!", animationDelay: 2 },
    ],
    arrows: [
      { from: { q: 0, r: 0 }, to: { q: 1, r: 0 }, style: "counter" },
    ],
    note: "Face any direction, counter from any side",
  },
];

export const HEX_PATTERN_MAP = new Map(
  HEX_PATTERNS.map((p) => [p.skillId, p])
);

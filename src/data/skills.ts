import type { Skill } from "@/types/skill";

export const SKILLS: Skill[] = [
  // ─── Tier 0: Core Skills ───────────────────────────────────────────────────
  {
    id: "melee-attack",
    name: "Melee Attack",
    tier: 0,
    branch: "attack",
    actionType: "melee",
    hexRange: 1,
    description:
      "Deal 1 damage to the target in the adjacent hex you face.",
    statBonus: "damage",
    statBonusAmount: 1,
    cooldown: 0,
    prerequisites: [],
    isBase: true,
  },
  {
    id: "move",
    name: "Move",
    tier: 0,
    branch: "movement",
    actionType: "move",
    hexRange: 1,
    description:
      "Change facing, then move 1 hex in your facing direction.",
    statBonus: "movement",
    statBonusAmount: 1,
    cooldown: 0,
    prerequisites: [],
    isBase: true,
  },
  {
    id: "defend",
    name: "Defend",
    tier: 0,
    branch: "defend",
    actionType: "dodge",
    hexRange: 0,
    description:
      "Block 1 damage from attacks originating in your facing direction.",
    statBonus: "reduction",
    statBonusAmount: 1,
    cooldown: 0,
    prerequisites: [],
    isBase: true,
  },

  // ─── Tier 1: Boost Skills ─────────────────────────────────────────────────
  {
    id: "sharpen",
    name: "Sharpen",
    tier: 1,
    branch: "attack",
    actionType: "passive",
    hexRange: 0,
    description:
      "Your Melee Attack deals +1 damage (total 2).",
    statBonus: "damage",
    statBonusAmount: 1,
    cooldown: 0,
    prerequisites: ["melee-attack"],
    isBase: false,
  },
  {
    id: "swift-feet",
    name: "Swift Feet",
    tier: 1,
    branch: "movement",
    actionType: "passive",
    hexRange: 0,
    description:
      "Your Move covers +1 hex (total 2 hexes).",
    statBonus: "movement",
    statBonusAmount: 1,
    cooldown: 0,
    prerequisites: ["move"],
    isBase: false,
  },
  {
    id: "iron-skin",
    name: "Iron Skin",
    tier: 1,
    branch: "defend",
    actionType: "passive",
    hexRange: 0,
    description:
      "Your Defend reduces an additional 1 damage (total 2 blocked).",
    statBonus: "reduction",
    statBonusAmount: 1,
    cooldown: 0,
    prerequisites: ["defend"],
    isBase: false,
  },

  // ─── Tier 1: Attack Branch ────────────────────────────────────────────────
  {
    id: "power-hit",
    name: "Power Hit",
    tier: 1,
    branch: "attack",
    actionType: "melee",
    hexRange: 1,
    description:
      "Deal 1 damage to the adjacent hex you face. Breaks through Parry (counter-damage is negated).",
    statBonus: "damage",
    statBonusAmount: 1,
    cooldown: 0,
    prerequisites: ["melee-attack"],
    isBase: false,
    interactionNotes:
      "Loses to movement (target moves away). Beats Parry. Blocked normally by Defend.",
  },
  {
    id: "quick-jab",
    name: "Quick Jab",
    tier: 1,
    branch: "attack",
    actionType: "melee",
    hexRange: 1,
    description:
      "Deal 1 damage to the adjacent hex you face. Resolves before other attacks (during movement phase).",
    statBonus: "damage",
    statBonusAmount: 1,
    cooldown: 0,
    prerequisites: ["melee-attack"],
    isBase: false,
    interactionNotes:
      "Beats Power Hit (speed beats slow windup). Loses to Defend (fully blocked). Cannot benefit from Sharpen.",
  },
  {
    id: "feint",
    name: "Feint",
    tier: 1,
    branch: "attack",
    actionType: "melee",
    hexRange: 0,
    description:
      "Fake an attack. If opponent selected DEF → gain Advantage. If ATK → you take their attack undefended. If MOV → no effect.",
    statBonus: "damage",
    statBonusAmount: 1,
    cooldown: 0,
    prerequisites: ["melee-attack"],
    isBase: false,
    interactionNotes:
      "High reward against defensive opponents, high risk against aggressive ones.",
  },

  // ─── Tier 1: Defense Branch ───────────────────────────────────────────────
  {
    id: "parry",
    name: "Parry",
    tier: 1,
    branch: "defend",
    secondaryBranch: "attack",
    actionType: "dodge",
    hexRange: 1,
    description:
      "Block 1 damage from melee-range attack in facing direction. On successful block, deal 1 damage back.",
    statBonus: "reduction",
    statBonusAmount: 1,
    cooldown: 0,
    prerequisites: ["defend"],
    isBase: false,
    interactionNotes:
      "Loses to Power Hit. Beats Melee Attack (blocks + punishes). No effect against Flanking.",
  },
  {
    id: "brace",
    name: "Brace",
    tier: 1,
    branch: "defend",
    actionType: "dodge",
    hexRange: 0,
    description:
      "Reduce all incoming damage by 1 this round, regardless of direction. Cannot move next round.",
    statBonus: "reduction",
    statBonusAmount: 1,
    cooldown: 0,
    prerequisites: ["defend"],
    isBase: false,
    interactionNotes:
      "Beats Flanking (all-direction reduction). Loses to Feint (reads defensive commitment).",
  },
  {
    id: "sidestep",
    name: "Sidestep",
    tier: 1,
    branch: "defend",
    secondaryBranch: "movement",
    actionType: "dodge",
    hexRange: 1,
    description:
      "Move 1 hex perpendicular to facing (left or right). Does not change facing. Counts as DEF.",
    statBonus: "reduction",
    statBonusAmount: 1,
    cooldown: 0,
    prerequisites: ["defend"],
    isBase: false,
    interactionNotes:
      "Dodges Melee Attack and Power Hit. Loses to Quick Jab (resolves before you move).",
  },

  // ─── Tier 1: Movement Branch ──────────────────────────────────────────────
  {
    id: "flanking",
    name: "Flanking",
    tier: 1,
    branch: "movement",
    actionType: "move",
    hexRange: 2,
    description:
      "Move up to 2 hexes. If you end behind target (opposite facing), deal 1 damage.",
    statBonus: "movement",
    statBonusAmount: 1,
    cooldown: 0,
    prerequisites: ["move"],
    isBase: false,
    interactionNotes:
      "Beats Defend and Parry (from behind). Loses to Brace (all-direction). Loses to Pivot.",
  },
  {
    id: "dash",
    name: "Dash",
    tier: 1,
    branch: "movement",
    actionType: "move",
    hexRange: 3,
    description:
      "Move up to 3 hexes in facing direction. Cannot change facing afterward.",
    statBonus: "movement",
    statBonusAmount: 1,
    cooldown: 0,
    prerequisites: ["move"],
    isBase: false,
    interactionNotes:
      "Escapes melee range. Vulnerable on arrival if adjacent to opponent.",
  },
  {
    id: "pivot",
    name: "Pivot",
    tier: 1,
    branch: "movement",
    actionType: "move",
    hexRange: 0,
    description:
      "Stay on current hex. Change facing to any of 6 directions. May block as Defend if attacked from new facing.",
    statBonus: "movement",
    statBonusAmount: 1,
    cooldown: 0,
    prerequisites: ["move"],
    isBase: false,
    interactionNotes:
      "Counters Flanking (rotate to face flanker). Loses to Feint. Sets up Parry next round.",
  },

  // ─── Tier 2: Attack Branch ────────────────────────────────────────────────
  {
    id: "lunge",
    name: "Lunge",
    tier: 2,
    branch: "attack",
    secondaryBranch: "movement",
    actionType: "melee",
    hexRange: 2,
    description:
      "Deal 1 damage to target up to 2 hexes away in facing direction. Move into adjacent hex toward target.",
    statBonus: "damage",
    statBonusAmount: 2,
    cooldown: 0,
    prerequisites: ["power-hit"],
    isBase: false,
    interactionNotes:
      "Extended range catches short Dash. Loses to Sidestep. Beaten by Parry (unlike Power Hit).",
  },
  {
    id: "combo-strike",
    name: "Combo Strike",
    tier: 2,
    branch: "attack",
    actionType: "melee",
    hexRange: 1,
    description:
      "If you used an ATK skill last round, deal 2 damage to adjacent hex. Otherwise deal 1.",
    statBonus: "damage",
    statBonusAmount: 2,
    cooldown: 0,
    prerequisites: ["quick-jab"],
    isBase: false,
    interactionNotes:
      "Rewards aggressive sequences. Loses to Parry and Sidestep.",
  },
  {
    id: "feint-strike",
    name: "Feint Strike",
    tier: 2,
    branch: "attack",
    actionType: "melee",
    hexRange: 0,
    description:
      "Fake an attack. If opponent selected DEF → deal 1 damage. If ATK → both resolve. If MOV → no effect.",
    statBonus: "damage",
    statBonusAmount: 2,
    cooldown: 0,
    prerequisites: ["feint"],
    isBase: false,
    interactionNotes:
      "Upgraded Feint that punishes passive play with damage. Loses to Pivot.",
  },

  // ─── Tier 2: Defense Branch ───────────────────────────────────────────────
  {
    id: "riposte",
    name: "Riposte",
    tier: 2,
    branch: "defend",
    secondaryBranch: "attack",
    actionType: "dodge",
    hexRange: 1,
    description:
      "Block 1 damage from facing direction. On successful block, deal 2 damage back.",
    statBonus: "reduction",
    statBonusAmount: 2,
    cooldown: 0,
    prerequisites: ["parry"],
    isBase: false,
    interactionNotes:
      "High-risk Parry. Still loses to Power Hit. Feint leaves you exposed.",
  },
  {
    id: "deflect",
    name: "Deflect",
    tier: 2,
    branch: "defend",
    actionType: "dodge",
    hexRange: 1,
    description:
      "Reduce incoming damage by 1. Redirect 1 damage to any single target on an adjacent hex.",
    statBonus: "reduction",
    statBonusAmount: 2,
    cooldown: 0,
    prerequisites: ["brace"],
    isBase: false,
    interactionNotes:
      "Turns defense into offense. Loses to Feint. Beats Quick Jab (absorb + redirect).",
  },
  {
    id: "anticipate",
    name: "Anticipate",
    tier: 2,
    branch: "defend",
    actionType: "dodge",
    hexRange: 0,
    description:
      "Declare a branch (ATK/DEF/MOV). If correct, gain Advantage and negate their skill entirely. If wrong, Stunned next round.",
    statBonus: "reduction",
    statBonusAmount: 2,
    cooldown: 1,
    prerequisites: ["sidestep"],
    isBase: false,
    interactionNotes:
      "Ultimate read. Massive payoff or massive punishment. Cannot use two rounds in a row.",
  },

  // ─── Tier 2: Movement Branch ──────────────────────────────────────────────
  {
    id: "charge",
    name: "Charge",
    tier: 2,
    branch: "movement",
    secondaryBranch: "attack",
    actionType: "move",
    hexRange: 2,
    description:
      "Move up to 2 hexes toward target. If you end adjacent, deal 1 damage.",
    statBonus: "movement",
    statBonusAmount: 2,
    cooldown: 0,
    prerequisites: ["dash"],
    isBase: false,
    interactionNotes:
      "Aggressive movement. Beaten by Brace and Sidestep.",
  },
  {
    id: "withdraw",
    name: "Withdraw",
    tier: 2,
    branch: "movement",
    actionType: "move",
    hexRange: 2,
    description:
      "Move up to 2 hexes away from nearest opponent. Melee ATK skills miss. +1 Defend next round.",
    statBonus: "movement",
    statBonusAmount: 2,
    cooldown: 0,
    prerequisites: ["pivot"],
    isBase: false,
    interactionNotes:
      "Safe retreat. Loses to Lunge (extended reach). Sets up defense.",
  },
  {
    id: "shadow-step",
    name: "Shadow Step",
    tier: 2,
    branch: "movement",
    actionType: "move",
    hexRange: 1,
    description:
      "Move to any hex adjacent to target, face them. If you arrive behind them, deal 1 damage.",
    statBonus: "movement",
    statBonusAmount: 2,
    cooldown: 0,
    prerequisites: ["flanking"],
    isBase: false,
    interactionNotes:
      "Teleport-style repositioning. Countered by Brace and Anticipate (if MOV called).",
  },

  // ─── Tier 3: Attack Branch ────────────────────────────────────────────────
  {
    id: "executioner",
    name: "Executioner",
    tier: 3,
    branch: "attack",
    actionType: "melee",
    hexRange: 1,
    description:
      "Deal 3 damage to adjacent facing hex. Only usable with Advantage (consumed).",
    statBonus: "damage",
    statBonusAmount: 3,
    cooldown: 0,
    prerequisites: ["feint-strike"],
    isBase: false,
    interactionNotes:
      "Finisher. Requires setup through reads. Can be Parried. Misses if target moves.",
  },
  {
    id: "whirlwind",
    name: "Whirlwind",
    tier: 3,
    branch: "attack",
    actionType: "melee",
    hexRange: 1,
    description:
      "Deal 1 damage to ALL adjacent hexes (up to 6 targets).",
    statBonus: "damage",
    statBonusAmount: 3,
    cooldown: 1,
    prerequisites: ["combo-strike"],
    isBase: false,
    interactionNotes:
      "Area attack ignores facing. Parry only works if in facing hex. Brace reduces it.",
  },

  // ─── Tier 3: Defense Branch ───────────────────────────────────────────────
  {
    id: "mirror-guard",
    name: "Mirror Guard",
    tier: 3,
    branch: "defend",
    secondaryBranch: "attack",
    actionType: "dodge",
    hexRange: 1,
    description:
      "If attacked, copy the attacker's skill and resolve it against them simultaneously. No effect vs MOV.",
    statBonus: "reduction",
    statBonusAmount: 3,
    cooldown: 1,
    prerequisites: ["anticipate"],
    isBase: false,
    interactionNotes:
      "Reflection. Useless if opponent doesn't attack. Feint destroys this.",
  },
  {
    id: "fortress",
    name: "Fortress",
    tier: 3,
    branch: "defend",
    actionType: "dodge",
    hexRange: 0,
    description:
      "Block ALL incoming damage from every direction this round. Immobile for 2 rounds afterward.",
    statBonus: "reduction",
    statBonusAmount: 3,
    cooldown: 2,
    prerequisites: ["deflect"],
    isBase: false,
    interactionNotes:
      "Total defense. Opponent freely repositions for 2 rounds. Best vs burst turns.",
  },

  // ─── Tier 3: Movement Branch ──────────────────────────────────────────────
  {
    id: "phantom-step",
    name: "Phantom Step",
    tier: 3,
    branch: "movement",
    actionType: "move",
    hexRange: 3,
    description:
      "Move to any hex within 3 hexes. Set facing freely. If started adjacent, opponent can't target you with ATK this round.",
    statBonus: "movement",
    statBonusAmount: 3,
    cooldown: 1,
    prerequisites: ["shadow-step"],
    isBase: false,
    interactionNotes:
      "Ultimate mobility. No direct damage. Sets up Flanking or Charge next round.",
  },
  {
    id: "overrun",
    name: "Overrun",
    tier: 3,
    branch: "movement",
    secondaryBranch: "attack",
    actionType: "move",
    hexRange: 1,
    description:
      "Move through opponent's hex, push them 1 hex in your direction. Deal 1 damage. End on their hex.",
    statBonus: "movement",
    statBonusAmount: 3,
    cooldown: 1,
    prerequisites: ["charge"],
    isBase: false,
    interactionNotes:
      "Displacement attack. Countered by Brace (no push). Beats Parry (attack from pass-through).",
  },
];

export const SKILL_MAP = new Map(SKILLS.map((s) => [s.id, s]));
export const BASE_SKILL_IDS = SKILLS.filter((s) => s.isBase).map((s) => s.id);

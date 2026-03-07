---
name: skill-tree-v3
description: Fibonacci-based skill prerequisite system with cross-branch hybrids, progressive reveal in Build mode, and single-skill Play mode selection
status: backlog
created: 2026-03-07T12:39:24Z
---

# PRD: Skill Tree v3 — Fibonacci Prerequisites & Cross-Branch Hybrids

## Executive Summary

Redesign the Yomi Tower skill tree around a Fibonacci-weighted prerequisite system where each tier's "cost" follows the sequence (1, 1, 2, 3, 5). T2 skills require two T1 parents, T3 skills require a T2 + T1. This creates two natural progression paths per skill: **intensify** (deepen one chain) or **combine** (merge different capabilities). The redesign also introduces 9 cross-branch T2 hybrids and 24 T3 skills, replaces the current 6 T3s, changes Build mode to progressive reveal, and simplifies Play mode to single-skill selection.

## Problem Statement

The current skill tree has three issues:

1. **Linear prerequisites**: Each T2/T3 only requires one parent, making progression feel like 3 parallel ladders rather than a branching decision tree.
2. **No cross-branch synergy**: All skills stay within their branch. Players who invest in Attack and Defend never get skills that combine both, missing the core appeal of build customization.
3. **Play mode selects entire prerequisite chains**: Confirming a skill also confirms all ancestors, which doesn't match the physical board game where you play one skill per turn.
4. **Build mode shows everything**: All 30 skills are always visible, making the tree feel static rather than something that grows with your choices.

## User Stories

### US-1: Fibonacci Prerequisite Progression
**As a** player building a character,
**I want** T2 skills to require two T1 parents and T3 skills to require a T2 + T1,
**So that** my build path feels like meaningful decisions rather than a linear checklist.

**Acceptance Criteria:**
- T2 skills list exactly 2 T1 prerequisites
- T3 skills list exactly 1 T2 + 1 T1 prerequisite
- `canUnlock` validates all prerequisites are in the unlocked set
- Unlocking a T2 requires both T1 parents to be unlocked first
- The hex grid positions T2 skills adjacent to both their T1 parents

### US-2: Cross-Branch Hybrid Skills
**As a** player,
**I want** skills that combine Attack+Defend, Attack+Move, or Defend+Move,
**So that** my build reflects a unique combat style rather than being locked into one branch.

**Acceptance Criteria:**
- 9 new cross-branch T2 skills exist (3 per branch pair: AD, AM, DM)
- Cross-branch T2s are positioned on the hex grid between their parent branches
- Each cross-branch T2 has a unique mechanic that blends both branches' identities
- YOMI matchup tables updated for all new skills

### US-3: Expanded T3 Tier
**As a** player who has invested deeply,
**I want** powerful T3 skills that represent mastery of my chosen path,
**So that** late-game builds feel distinct and rewarding.

**Acceptance Criteria:**
- 24 T3 skills replace the current 6
- T3s are organized in 6 zones of 4: Deep Attack, Deep Defend, Deep Move, AD Boundary, AM Boundary, DM Boundary
- Each T3 = T2 + T1 following Fibonacci weight 3
- T3 skills positioned on ring 4 of the hex grid

### US-4: Progressive Reveal in Build Mode
**As a** player exploring the skill tree,
**I want** to only see skills I can unlock next (plus what I've already unlocked),
**So that** the tree feels like it grows organically with my decisions.

**Acceptance Criteria:**
- Unlocked skills are fully visible (filled hex, colored)
- Skills whose prerequisites are ALL met show as outlined/available hexes (next unlockable)
- Skills whose prerequisites are NOT met are hidden (no hex rendered)
- Base skills (T0) are always visible
- Boost passives (sharpen, swift-feet, iron-skin) appear as available once their T0 parent is unlocked
- When a skill is unlocked, newly available skills animate into view

### US-5: Single Skill Selection in Play Mode
**As a** player choosing an action for this round,
**I want** to select exactly one skill to play,
**So that** it matches the physical game where I play one skill card per turn.

**Acceptance Criteria:**
- Tapping a skill in Play mode selects ONLY that skill (not its prerequisite chain)
- The `confirmedSkillIds` array contains exactly one skill ID
- The ActionBar shows only the selected skill's info
- The `getPrereqChainIds` logic is removed from the confirm flow
- Target hex picker still works as before (letter + number → confirm)

### US-6: Boost Passives as Optional T1
**As a** player,
**I want** boost passives (Sharpen, Swift Feet, Iron Skin) to remain as optional T1 choices,
**So that** I can invest in raw stat upgrades without them being required for T2/T3 progression.

**Acceptance Criteria:**
- Sharpen, Swift Feet, Iron Skin remain as T1 skills with single T0 prerequisites
- They do NOT count toward Fibonacci prerequisite requirements for T2/T3
- They appear in progressive reveal when their T0 parent is unlocked
- Their stat bonuses still apply to the base skill card display
- They are selectable in Play mode like any other unlocked skill

## Functional Requirements

### FR-1: Skill Data Redesign

#### FR-1.1: Updated T2 Within-Branch Prerequisites (9 existing skills, new prereqs)

| Skill | Branch | New Prerequisites | Old Prereq |
|-------|--------|-------------------|------------|
| Lunge | attack | power-hit + quick-jab | power-hit |
| Combo Strike | attack | quick-jab + feint | quick-jab |
| Feint Strike | attack | feint + power-hit | feint |
| Riposte | defend | parry + brace | parry |
| Deflect | defend | brace + sidestep | brace |
| Anticipate | defend | sidestep + parry | sidestep |
| Charge | movement | dash + flanking | dash |
| Withdraw | movement | pivot + dash | pivot |
| Shadow Step | movement | flanking + pivot | flanking |

#### FR-1.2: New Cross-Branch T2 Skills (9 new)

**Attack + Defend (AD):**

| ID | Name | Prerequisites | Mechanic |
|----|------|---------------|----------|
| counterstrike | Counterstrike | power-hit + parry | Block then immediately power strike — if attacked, resolve both simultaneously |
| bait-and-punish | Bait and Punish | feint + brace | Absorb their attack intentionally, deal damage equal to what you took |
| step-through | Step-Through | quick-jab + sidestep | Dodge sideways while jabbing — evade and strike in one motion |

**Attack + Move (AM):**

| ID | Name | Prerequisites | Mechanic |
|----|------|---------------|----------|
| blitz | Blitz | power-hit + dash | Move 2 hexes, deal 2 damage on arrival — telegraphed but devastating |
| hit-and-run | Hit and Run | quick-jab + pivot | Strike, immediately rotate 180deg — opponent can't retaliate from that facing |
| ambush | Ambush | feint + flanking | Move as if repositioning, actually end in attack position — reads as MOV, resolves as ATK |

**Defend + Move (DM):**

| ID | Name | Prerequisites | Mechanic |
|----|------|---------------|----------|
| intercept | Intercept | parry + flanking | Move to block a flank path — if opponent flanks into your new facing, counter-damage |
| phaseout | Phaseout | sidestep + dash | Full evasion — move 2 hexes perpendicular, untargetable by ATK this round |
| shield-advance | Shield Advance | brace + pivot | Rotate to face any direction while reducing all damage — slow but impenetrable repositioning |

#### FR-1.3: New T3 Skills (24 new, replacing existing 6)

**Deep Attack (4) — pure attack deepening:**

| ID | Name | T2 Parent | +T1 | Mechanic |
|----|------|-----------|-----|----------|
| killshot | Killshot | lunge | power-hit | Deal 3 damage at range 2, breaks Parry and Riposte |
| blinding-combo | Blinding Combo | combo-strike | power-hit | 3-hit combo ending in power blow, winner gains Advantage |
| smoke-and-daggers | Smoke & Daggers | feint-strike | feint | Double-layer fake — if opponent chose DEF two rounds in a row, deal 4 damage |
| blur | Blur | combo-strike | quick-jab | 3-hit combo resolving in movement phase — can't be Parried |

**Deep Defend (4) — pure defend deepening:**

| ID | Name | T2 Parent | +T1 | Mechanic |
|----|------|-----------|-----|----------|
| bulwark | Bulwark | riposte | parry | Block all frontal attacks, return 3 damage. Still loses to Power Hit |
| iron-curtain | Iron Curtain | deflect | brace | Omnidirectional block with only 1 round immobility |
| mirror-wall | Mirror Wall | anticipate | sidestep | Correct prediction + dodge = teleport behind attacker, deal 2 damage |
| repel | Repel | deflect | parry | Redirect ALL incoming damage as 1 damage splash to all adjacents |

**Deep Move (4) — pure movement deepening:**

| ID | Name | T2 Parent | +T1 | Mechanic |
|----|------|-----------|-----|----------|
| ghost-walk | Ghost Walk | shadow-step | flanking | Move anywhere within 5 hexes, untargetable the entire round |
| juggernaut | Juggernaut | charge | dash | Move through, push target 2 hexes, deal 2 damage, maintain momentum |
| warp-strike | Warp Strike | shadow-step | pivot | Teleport adjacent to target and deal 2 damage regardless of facing |
| slip-away | Slip Away | withdraw | dash | Move 4 hexes, +2 Defend next round, opponent cannot follow this round |

**AD Boundary (4) — attack/defend hybrids:**

| ID | Name | T2 Parent | +T1 | Mechanic |
|----|------|-----------|-----|----------|
| vengeance | Vengeance | counterstrike | parry | If blocked, deal 2x what was blocked |
| iron-feint | Iron Feint | bait-and-punish | power-hit | Absorb hit, return a Power Hit that breaks guard. Upside: punishes aggression hard / Downside: a feint leaves you fully exposed |
| flicker-stance | Flicker Stance | step-through | sidestep | Dodge and strike simultaneously. Opponent loses Advantage regardless of outcome |
| war-dance | War Dance | counterstrike | feint | Declare after reveal: block+punish OR feint. Opponent can never read which — but if you pick wrong it fully backfires |

**AM Boundary (4) — attack/movement hybrids:**

| ID | Name | T2 Parent | +T1 | Mechanic |
|----|------|-----------|-----|----------|
| storm-blade | Storm Blade | blitz | power-hit | Move 3 hexes, deal 3 damage on arrival. Loses to Brace and Sidestep |
| hurricane | Hurricane | hit-and-run | quick-jab | Strike, pivot, strike again — 2 damage in one action. Second strike can miss if target moved |
| death-from-shadows | Death from Shadows | ambush | flanking | Reads as MOV, resolves as 2-damage flanking ATK from behind. Loses to Brace |
| whiplash | Whiplash | hit-and-run | feint | Strike then fake a second hit — if opponent chose DEF after first strike, gain Advantage next round |

**DM Boundary (4) — defend/movement hybrids:**

| ID | Name | T2 Parent | +T1 | Mechanic |
|----|------|-----------|-----|----------|
| guardian-step | Guardian Step | intercept | flanking | Flank the attacker while blocking — position and defend simultaneously. Loses to Feint |
| vanishing-guard | Vanishing Guard | phaseout | dash | Move 3 hexes, untargetable, gain +1 Defend on arrival |
| fortress-march | Fortress March | shield-advance | brace | Move 2 hexes while maintaining omnidirectional block. Very slow but impenetrable |
| displacement | Displacement | intercept | pivot | Rotate to face any attacker mid-round, counter from any direction — but commits facing afterward |

#### FR-1.4: Removed Skills

| ID | Reason |
|----|--------|
| executioner | Replaced by Killshot (T3) |
| whirlwind | Replaced by Blinding Combo / Blur (T3) |
| mirror-guard | Replaced by Mirror Wall (T3) |
| fortress | Replaced by Iron Curtain (T3) |
| phantom-step | Replaced by Ghost Walk (T3) |
| overrun | Replaced by Juggernaut (T3) |

#### FR-1.5: Skill Totals

| Tier | Count | Notes |
|------|-------|-------|
| T0 | 3 | Unchanged base skills |
| T1 | 12 | 9 active + 3 boost passives (optional, not required for progression) |
| T2 | 18 | 9 within-branch (updated prereqs) + 9 cross-branch (new) |
| T3 | 24 | All new, replacing 6 old |
| **Total** | **57** | Up from 30 |

### FR-2: Hex Grid Layout Expansion

The hex grid must be redesigned to accommodate 57 skills across 5 tiers (including T0).

**Layout Principles:**
- T0 base skills remain at center triangle
- T1 skills on ring 1-2 around base skills, within their branch sector
- T2 within-branch skills further out in their sector
- T2 cross-branch skills positioned at the boundary between their two parent branch sectors
- T3 skills on ring 4 (outermost), in 6 zones of 4
- Every prerequisite pair MUST be adjacent in the hex grid (shared edge)
- Boost passives positioned adjacent to their T0 parent but not blocking progression paths

**Sector Layout (120deg each):**
```
              [Deep ATK zone - 4]
         [AM zone - 4]    [AD zone - 4]
    [Deep MOV zone - 4]    [Deep DEF zone - 4]
              [DM zone - 4]
```

### FR-3: Progressive Reveal (Build Mode)

**Visibility Rules:**
1. **Always visible**: T0 base skills (melee-attack, move, defend)
2. **Visible when unlockable**: Skills whose ALL prerequisites are in the player's unlocked set — rendered as outlined/available hexes with branch color stroke, no fill
3. **Hidden**: Skills whose prerequisites are NOT all met — no hex rendered at all
4. **Unlocked**: Fully filled hex with branch color

**Interaction:**
- Clicking an available (outlined) skill unlocks it
- Newly revealed skills (whose prereqs just became met) animate into view
- The tree grows outward as the player makes choices
- Boost passives appear as available immediately (their only prereq is a T0 base)

**Implementation:**
- Compute `availableSkillIds` = skills where `prerequisites.every(p => unlockedSet.has(p))` AND not already unlocked
- `visibleSkillIds` = `unlockedSkillIds` + `availableSkillIds`
- Only render hexes for visible skills
- Available but not unlocked: hollow hex with dashed stroke

### FR-4: Single Skill Selection (Play Mode)

**Current behavior (to change):** Confirming a skill also confirms all ancestors via `getPrereqChainIds()`.

**New behavior:** Confirming selects ONLY the tapped skill. The confirm flow becomes:
1. Tap an unlocked skill → selected (highlighted)
2. Pick target hex (letter + number)
3. CONFIRM → `confirmedSkillIds = [selectedSkillId]` (single element)
4. RESET clears everything

**Changes needed:**
- Remove `getPrereqChainIds` call from `handleConfirm` in ActionBar
- Remove `getPrereqChainIds` call from DesktopSidePanel confirm
- `setConfirmedSkills([skill.id])` instead of `setConfirmedSkills(chain)`
- Confirmed state visual: only the selected skill gets the confirmed ring, not ancestors

### FR-5: Hex Card Patterns for New Skills

Each of the 33 new skills (9 T2 cross-branch + 24 T3) needs a `HexCardPattern` with:
- `cells`: Hex grid cells showing the skill's visual mechanic
- `arrows`: Direction indicators
- `note`: Brief mechanic summary

### FR-6: YOMI Matchup Tables

The `SKILL_BEATS` and `SKILL_LOSES_TO` maps in `UnifiedSkillGraph.tsx` must be updated to include all new skills. Each new skill's `interactionNotes` field describes its matchup rules.

### FR-7: Updated Skill Type

Add to the `Skill` interface:
```typescript
fibonacciWeight?: number; // 1 for T0/T1, 2 for T2, 3 for T3
isBoostPassive?: boolean; // true for sharpen, swift-feet, iron-skin
```

## Non-Functional Requirements

### NFR-1: Performance
- SVG rendering must remain smooth with 57 nodes (up from 30)
- Progressive reveal reduces visible nodes at any time, offsetting the total increase
- Pan/zoom/rotate must remain responsive

### NFR-2: Mobile Experience
- Touch targets remain at least 44px
- HEX_R may need adjustment for the larger grid — consider reducing from 38 to ~32 for mobile
- Progressive reveal keeps the visible area manageable on small screens

### NFR-3: Data Migration
- Existing builds in localStorage must gracefully handle the schema change
- Builds referencing removed skills (executioner, whirlwind, etc.) should reset to defaults
- Storage key should increment to `skill-tree-builds-v3`

### NFR-4: Backward Compatibility
- The print page (`/print`) must work with new skill data
- Build panel decision log must display new skill names correctly

## Success Criteria

1. **Fibonacci rule holds**: Every T2 has exactly 2 T1 prereqs, every T3 has exactly 1 T2 + 1 T1 prereq
2. **Adjacency constraint**: Every prereq pair shares a hex edge on the grid
3. **Progressive reveal**: At game start, only 3 base + 12 available T1 hexes visible. Tree grows as player unlocks.
4. **Single selection**: Play mode confirms exactly 1 skill
5. **All 57 skills have hex card patterns**: No missing visualizations
6. **Build/deploy succeeds**: `bun run build` passes with 0 errors
7. **Cross-branch skills positioned correctly**: AD hybrids sit between Attack and Defend sectors on the grid

## Constraints & Assumptions

- **Hex adjacency is the hard constraint**: The grid layout must ensure every prereq pair shares an edge. This may require iterative adjustment of coordinates.
- **The physical board game has hexes labeled A-J, 1-10**: Target hex picker unchanged.
- **D>A>M>D advantage triangle unchanged**: Base game loop is Defend beats Attack beats Move beats Defend.
- **Boost passives are NOT Fibonacci participants**: They're stat-stick T1s that don't feed into T2/T3 prerequisites.
- **No T4 tier in this version**: The Claude Chat conversation discussed T4 (Fibonacci weight 5) but this PRD covers only up to T3.

## Out of Scope

- **T4 skills**: Designed conceptually but not implemented in this version
- **Three-branch T3 hybrids**: All T3s combine at most 2 branches (per user decision)
- **Dynamic YOMI calculation**: Matchup tables remain hardcoded, not computed from skill properties
- **Multiplayer / networked play**: This is a local companion app
- **Sound effects or haptics**: Visual-only feedback
- **Skill rebalancing beyond what's specified**: Existing T0/T1 mechanics unchanged

## Dependencies

- **Hex grid layout redesign**: Must be done before any rendering work — all other changes depend on valid coordinates
- **Skill data file**: Central dependency — types, skills array, hex patterns, YOMI tables all derive from this
- **Zustand store migration**: Storage key bump and validation logic must handle old → new schema

## Files Affected

| File | Change Type | Description |
|------|-------------|-------------|
| `src/types/skill.ts` | Modify | Add `fibonacciWeight`, `isBoostPassive` fields |
| `src/data/skills.ts` | Major rewrite | Update T2 prereqs, add 9 cross-branch T2s, replace 6 T3s with 24 new T3s, remove old T3s |
| `src/data/hex-patterns.ts` | Major expansion | Add 33 new hex card patterns, remove 6 old T3 patterns |
| `src/lib/hex-grid-layout.ts` | Major rewrite | New coordinates for 57 skills, maintain adjacency constraint |
| `src/components/skill-tree/UnifiedSkillGraph.tsx` | Modify | Progressive reveal logic, single-skill selection, updated YOMI tables, adjust rendering for larger grid |
| `src/components/skill-tree/ActionBar.tsx` | Modify | Remove prereq chain from confirm, single skill confirm |
| `src/stores/build-store.ts` | Modify | Storage key bump to v3, migration/validation for new schema |
| `src/lib/graph-utils.ts` | Modify | Verify `canUnlock`/`canRemove` work with multi-prerequisite skills |
| `src/lib/storage.ts` | Modify | Update validation for new skill IDs |

---
name: skill-tree-v3
status: backlog
created: 2026-03-07T12:52:36Z
progress: 0%
prd: .claude/prds/skill-tree-v3.md
github: https://github.com/pompoi/tree/issues/16
---

# Epic: skill-tree-v3

## Overview

Redesign the Yomi Tower skill tree from 30 skills with linear prerequisites to 57 skills with Fibonacci-weighted multi-parent prerequisites, cross-branch hybrids, progressive reveal in Build mode, and single-skill Play mode selection.

The implementation follows a layered approach: data foundation first (types, skill definitions, grid coordinates), then UI behavior changes (progressive reveal, single selection), then content (hex card patterns, YOMI tables), then migration and integration.

## Architecture Decisions

### AD-1: Multi-prerequisite validation
The existing `canUnlock` already checks `skill.prerequisites.every(p => unlockedSet.has(p))`. Since T2 skills now have 2 prerequisites in the array, this logic works without modification. No new graph algorithm needed.

### AD-2: Progressive reveal computation
Compute visibility on each render using a simple set operation:
```
availableIds = SKILLS.filter(s => !unlocked.has(s.id) && s.prerequisites.every(p => unlocked.has(p)))
visibleIds = [...unlockedIds, ...availableIds]
```
This is O(n) with n=57, no memoization needed for this scale.

### AD-3: Hex grid coordinate strategy
The hardest constraint is adjacency: every prerequisite pair must share a hex edge. With cross-branch T2s requiring T1s from different branches, the grid must have "bridge" hexes between sectors. Strategy: manually place all 57 skills with adjacency verification via automated test.

### AD-4: Storage migration
Bump storage key to `skill-tree-builds-v3`. Any build referencing removed skill IDs (executioner, whirlwind, mirror-guard, fortress, phantom-step, overrun) fails validation and resets to defaults. Simple and safe.

### AD-5: Keep boost passives simple
Boost passives (sharpen, swift-feet, iron-skin) keep their single T0 prerequisite. Add `isBoostPassive: true` flag. They are excluded from Fibonacci chain logic but remain unlockable and selectable.

## Technical Approach

### Data Layer
- `src/types/skill.ts` — Add `isBoostPassive` field to `Skill` interface
- `src/data/skills.ts` — Major rewrite: update 9 T2 prereqs, add 9 cross-branch T2s, replace 6 T3s with 24 new T3s (57 total)
- `src/data/hex-patterns.ts` — Add 33 new hex card patterns (9 T2 cross-branch + 24 T3), remove 6 old T3 patterns

### Layout Layer
- `src/lib/hex-grid-layout.ts` — Complete redesign of `SKILL_POSITIONS` for 57 skills across 4 rings with cross-branch bridge positions

### UI Layer
- `src/components/skill-tree/UnifiedSkillGraph.tsx` — Progressive reveal filtering, updated YOMI tables, remove prereq chain from confirm
- `src/components/skill-tree/ActionBar.tsx` — Single skill confirm (remove `getPrereqChainIds`)
- `src/components/build/BuildPanel.tsx` — No structural changes needed (reads from store)

### Store Layer
- `src/stores/build-store.ts` — Storage key bump to v3
- `src/lib/storage.ts` — Update validation for new skill ID set

## Implementation Strategy

### Phase 1: Foundation (Tasks 1-2)
Skill data definitions and hex grid coordinates. These are the core dependencies — everything else reads from this data.

### Phase 2: Behavior (Tasks 3-4)
Progressive reveal and single skill selection. These are UI logic changes in the graph component and action bar.

### Phase 3: Content (Tasks 5-6)
Hex card patterns and YOMI matchup tables. Content-heavy work that can be parallelized.

### Phase 4: Migration & Integration (Tasks 7-8)
Store migration, validation updates, and final integration testing.

### Parallelization Opportunities
- Tasks 3 and 4 are independent of each other
- Tasks 5 and 6 are independent of each other
- Tasks 5 and 6 can run in parallel with tasks 3 and 4 (all depend only on tasks 1-2)

### Risk Mitigation
- **Adjacency constraint**: Build an automated verification script that checks every prereq pair shares a hex edge
- **Hex grid visual balance**: May need iterative coordinate adjustment — keep layout in a single file for easy tweaking
- **Large data file**: 57 skill definitions is substantial — organize by tier and branch with clear section comments

## Task Breakdown Preview

- [ ] **Task 1: Skill types and data definitions** — Update `Skill` interface, rewrite `skills.ts` with all 57 skills including updated prerequisites. Foundation for everything.
- [ ] **Task 2: Hex grid layout** — Design axial coordinates for 57 skills maintaining adjacency constraint. Include automated adjacency verification.
- [ ] **Task 3: Progressive reveal in Build mode** — Add visibility filtering to `UnifiedSkillGraph`. Only render unlocked + next-available skills. Animate newly revealed hexes.
- [ ] **Task 4: Single skill selection in Play mode** — Remove `getPrereqChainIds` from confirm flow in ActionBar and DesktopSidePanel. Confirm sets exactly one skill.
- [ ] **Task 5: Hex card patterns** — Create `HexCardPattern` entries for 33 new skills (9 cross-branch T2 + 24 T3). Remove 6 old T3 patterns.
- [ ] **Task 6: YOMI matchup tables** — Update `SKILL_BEATS` and `SKILL_LOSES_TO` maps for all new skills based on `interactionNotes`.
- [ ] **Task 7: Store migration and validation** — Bump storage key to v3, update `validateStoredState` for new skill IDs, handle removed skill graceful reset.
- [ ] **Task 8: Integration testing and deploy** — Verify build compiles, all 57 skills render, progressive reveal works, single selection works, deploy to GitHub Pages.

## Dependencies

```
Task 1 (types + data) ──┬──→ Task 2 (grid layout) ──┬──→ Task 3 (progressive reveal)
                         │                            ├──→ Task 4 (single selection)
                         │                            ├──→ Task 5 (hex patterns)
                         │                            └──→ Task 6 (YOMI tables)
                         │
                         └──→ Task 7 (store migration)

Tasks 3-7 ──→ Task 8 (integration + deploy)
```

## Success Criteria (Technical)

1. `bun run build` completes with 0 TypeScript errors
2. `SKILLS.length === 57` — all skills present
3. Every skill in `SKILL_POSITIONS` has coordinates
4. Every prereq pair passes `areAdjacent()` check
5. Progressive reveal: fresh build shows exactly 15 visible hexes (3 T0 + 12 T1)
6. Play mode confirm: `confirmedSkillIds.length === 1`
7. Old localStorage builds (v2) gracefully reset on v3 load
8. Deployed to pompoi.github.io/tree/ successfully

## Estimated Effort

- **Task 1** (Skill data): Large — 57 skill definitions with full metadata
- **Task 2** (Grid layout): Medium-Hard — adjacency constraint makes this tricky
- **Task 3** (Progressive reveal): Small — filtering logic + CSS animation
- **Task 4** (Single selection): Trivial — remove 2 function calls
- **Task 5** (Hex patterns): Large — 33 visual patterns to design
- **Task 6** (YOMI tables): Medium — ~50 new matchup entries
- **Task 7** (Store migration): Small — key bump + validation update
- **Task 8** (Integration): Small — testing and deploy

**Critical path:** Task 1 → Task 2 → Tasks 3-7 (parallel) → Task 8

## Tasks Created

| # | File | Name | Size | Parallel | Depends On |
|---|------|------|------|----------|------------|
| 1 | 001.md | Skill types and data definitions | L | No (blocks all) | — |
| 2 | 002.md | Hex grid layout for 57 skills | L | No (blocks 3-6) | 1 |
| 3 | 003.md | Progressive reveal in Build mode | M | Yes | 1, 2 |
| 4 | 004.md | Single skill selection in Play mode | XS | Yes | — |
| 5 | 005.md | Hex card patterns for new skills | L | Yes | 1 |
| 6 | 006.md | YOMI matchup tables for new skills | M | Yes | 1 |
| 7 | 007.md | Store migration and validation | S | Yes | 1 |
| 8 | 008.md | Integration testing and deploy | M | No (final) | 1-7 |

**Total: 8 tasks** — 3 sequential (1→2→8), 5 parallelizable (3-7)
**Parallel batches:** Task 4 can start immediately. Tasks 5-7 after Task 1. Tasks 3, 6 after Task 2.

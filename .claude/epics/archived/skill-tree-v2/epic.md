---
name: skill-tree-v2
status: complete
created: 2026-03-03T21:41:54Z
completed: 2026-03-03T22:05:00Z
progress: 100%
prd: .claude/prds/skill-tree-v2.md
github: https://github.com/pompoi/tree/issues/10
synced: 2026-03-03T21:50:00Z
---

# Epic: skill-tree-v2

## Overview

Add YOMI advantage/disadvantage highlighting to the unified hex skill tree. When hovering any skill, all visible skills of the branch it beats glow gold (#fbbf24) and all visible skills of the branch that beats it glow purple (#a855f7). This teaches the YOMI triangle (ATK→MOV→DEF→ATK) through interaction. Also: remove the redundant decorative branch hexes so the three base skills (Melee Attack, Move, Defend) directly form the central touching triangle.

## Architecture Decisions

- **Single file change for core feature**: All advantage highlighting logic lives in `UnifiedSkillGraph.tsx` — no new components needed. The highlighting is computed as derived state from `hoveredSkill.branch` and applied as additional SVG styling during render.
- **No state management changes**: Advantage highlighting is transient UI state (hover-driven), not persisted. No Zustand changes needed.
- **Base skills replace branch hexes**: Instead of 6 hexes at center (3 decorative + 3 base skills), collapse to 3. Base skills move to the touching-triangle positions currently occupied by branch hexes. This requires adjusting `radial-layout.ts` to position depth-0 skills at the smaller triangle radius (~41px from center) instead of the current BASE_RADIUS (160px).
- **Highlight priority system**: Multiple visual states can overlap. Priority order: confirmed outline > disadvantage (purple) > advantage (gold) > prereq chain (white) > base fill state. Implemented as cascading style overrides in the render function.
- **Legend as SVG group**: The advantage legend is rendered inside the SVG (not as HTML overlay) so it pans/zooms with the graph. Positioned at a fixed offset from the outermost hex ring.

## Technical Approach

### Modified Files

| File | Change |
|------|--------|
| `src/components/skill-tree/UnifiedSkillGraph.tsx` | Remove CORE_POSITIONS, branch hex rendering, coreEdges, hoveredBranch state. Add advantage highlight computation. Add gold/purple styling to skill nodes. Add advantage legend SVG group. Reposition advantage triangle wedges to use base skill positions. |
| `src/lib/radial-layout.ts` | Reduce BASE_RADIUS so base skills sit at touching-triangle positions (~41px from center). Adjust LAYER_SPACING if needed to prevent overlap with the now-closer base skills. |

### No New Files

All changes are modifications to existing code. No new components, hooks, or utilities needed.

### Advantage Highlight Computation

```typescript
// Derived from YOMI triangle — computed per-hover, no state needed
const BEATS: Record<Branch, Branch> = {
  attack: "movement",   // Attack beats Movement
  movement: "defend",   // Movement beats Defend
  defend: "attack",     // Defend beats Attack
};
const LOSES_TO: Record<Branch, Branch> = {
  attack: "defend",     // Attack loses to Defend
  movement: "attack",   // Movement loses to Attack
  defend: "movement",   // Defend loses to Movement
};

// In render: for each visible node, check if its branch matches
// the beaten branch (→ gold) or the beating branch (→ purple)
```

### Rendering Changes per Skill Node

The unified skill node render loop already handles all skills. Add two new visual states:

1. **Gold highlight** (advantage over): `stroke: #fbbf24`, `strokeWidth: 3`, `fillOpacity += 0.15`, subtle gold glow filter
2. **Purple highlight** (vulnerable to): `stroke: #a855f7`, `strokeWidth: 3`, `fillOpacity += 0.1`, subtle purple glow filter

These override the base style but are themselves overridden by prereq-chain highlight and confirmed outlines.

## Implementation Strategy

### Phase 1: Structural — Remove Branch Hexes (Task 1)
Remove the redundant decorative layer. Base skills become the triangle. This is the prerequisite for everything else because it simplifies the rendering code and eliminates the double-hex confusion.

**Risk**: Radial layout change could cause overlap if BASE_RADIUS is too small. Mitigation: test with all 30 skills visible, adjust LAYER_SPACING if needed.

### Phase 2: Core Feature — Advantage Highlighting (Tasks 2-3)
Add the gold/purple computation and apply it to all skill nodes and base skill hexes. This is the main deliverable.

**Risk**: Visual clutter with too many highlighted nodes. Mitigation: use subtle opacity/glow rather than solid fills; keep gold/purple as stroke-only highlights.

### Phase 3: Polish — Legend + Edge Cases (Tasks 4-5)
Add the legend overlay and handle edge cases (cross-branch skills, confirmed state interaction, Selection Wheel mode).

### Testing Approach
- Manual visual verification: hover each branch, confirm correct gold/purple distribution
- Build verification: `bun run build` must pass after each task
- Edge cases: cross-branch skills (secondaryBranch), confirmed state, Selection Wheel mode
- Performance: verify no jank with all 30 nodes highlighted simultaneously

## Task Breakdown Preview

- [ ] **Task 1 — Remove Decorative Branch Hexes**: Delete CORE_POSITIONS, branch hex rendering, coreEdges, hoveredBranch. Reposition base skills to touching-triangle. Adjust radial layout. Update advantage wedges. (US-7, FR-3)
- [ ] **Task 2 — Advantage Highlighting Engine**: Add BEATS/LOSES_TO maps. Compute gold/purple sets from hoveredSkill.branch. Apply gold/purple stroke styling to all visible skill nodes. (US-1, FR-1, FR-2)
- [ ] **Task 3 — Base Skill Advantage Borders**: Apply gold/purple border styling specifically to base skill hexes (Melee Attack, Move, Defend) based on hovered branch. (US-2, FR-3)
- [ ] **Task 4 — Advantage Legend**: Add SVG legend group showing gold = "Beats" and purple = "Vulnerable to". Position near outer hex ring. (US-3, FR-4)
- [ ] **Task 5 — Polish + Cleanup**: Handle cross-branch skill edge cases. Ensure advantage highlighting works with confirmed state. Remove dead code (SkillNode.tsx if unused). Verify Selection Wheel mode. (NFR-1, NFR-2)

## Dependencies

### External (already installed, no changes)
| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.1.6 | App Router, static export |
| react | 19.2.3 | UI rendering |
| zustand | 5.0.11 | State management (unchanged) |
| tailwindcss | 4 | Utility-first CSS |

### Internal
| Dependency | Location |
|------------|----------|
| V2 PRD | `.claude/prds/skill-tree-v2.md` |
| Unified skill graph | `src/components/skill-tree/UnifiedSkillGraph.tsx` |
| Radial layout | `src/lib/radial-layout.ts` |
| Skill data | `src/data/skills.ts` |

## Success Criteria (Technical)

| Criterion | Measurement |
|-----------|-------------|
| Branch hexes removed | No CORE_POSITIONS, no coreEdges, no hoveredBranch in code |
| Base skills touch at corners | Visual: 3 hexes share vertices, triangle void visible |
| Gold highlighting works | Hovering ATK skill → all MOV skills have gold stroke |
| Purple highlighting works | Hovering ATK skill → all DEF skills have purple stroke |
| Base skills react | Hovering ATK skill → Move hex gold border, Defend hex purple border |
| Legend visible | Gold/purple legend rendered in SVG, readable |
| No regressions | Confirm/reset, card preview, card bar, build panel, print all work |
| Build passes | `bun run build` succeeds with 0 errors |

## Estimated Effort

| Task | Complexity | Files | Parallelizable |
|------|-----------|-------|----------------|
| 1. Remove Branch Hexes | Medium | 2 (UnifiedSkillGraph, radial-layout) | No (foundation) |
| 2. Advantage Highlighting | Medium | 1 (UnifiedSkillGraph) | No (depends on 1) |
| 3. Base Skill Borders | Low | 1 (UnifiedSkillGraph) | Yes (with 4, after 2) |
| 4. Advantage Legend | Low | 1 (UnifiedSkillGraph) | Yes (with 3, after 2) |
| 5. Polish + Cleanup | Low | 1-2 | No (final) |

**Critical path**: Task 1 → Task 2 → Task 5
**Parallelizable**: Tasks 3 + 4 (both depend only on Task 2)

**Dependency Graph**:
```
1 → 2 → 3 ──┐
        └→ 4 ┘→ 5
```

## Tasks Created

| # | File | GitHub | Task | Size | Depends On | Parallel |
|---|------|--------|------|------|------------|----------|
| 1 | `011.md` | [#11](https://github.com/pompoi/tree/issues/11) | Remove Decorative Branch Hexes | M | — | No (foundation) |
| 2 | `012.md` | [#12](https://github.com/pompoi/tree/issues/12) | Advantage Highlighting Engine | M | #11 | No |
| 3 | `013.md` | [#13](https://github.com/pompoi/tree/issues/13) | Base Skill Advantage Borders | S | #12 | Yes (with #14) |
| 4 | `014.md` | [#14](https://github.com/pompoi/tree/issues/14) | Advantage Legend | S | #12 | Yes (with #13) |
| 5 | `015.md` | [#15](https://github.com/pompoi/tree/issues/15) | Polish + Cleanup | S | #13, #14 | No (final) |

**Summary**: 5 tasks (2M + 3S), 1 parallelizable pair (#13+#14), sequential critical path: #11→#12→#15

**Dependency Graph**:
```
#11 → #12 → #13 ──┐
            └→ #14 ┘→ #15
```

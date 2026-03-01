---
name: skill-tree-visualizer
status: backlog
created: 2026-03-01T19:50:07Z
progress: 0%
prd: .claude/prds/skill-tree-visualizer.md
github: [Will be updated when synced]
---

# Epic: skill-tree-visualizer

## Overview

Build an interactive circular skill tree visualizer as a Next.js 15 static web app. The app renders 31 skills in an SVG-based polar layout across 3 branch slices (Attack, Movement, Defend), supports build creation with prerequisite enforcement, persists 5 named build slots via Zustand + localStorage, and provides a printable card sheet. All client-side, zero backend.

## Architecture Decisions

- **SVG over Canvas**: 31 nodes is well within SVG performance limits. SVG gives us native DOM events (hover, click), CSS transitions, aria-labels for accessibility, and resolution-independent rendering for print. No hit-testing math needed.
- **Hand-built SVG, no library**: D3/Visx/etc. would fight the custom polar layout. 31 nodes + ~40 edges is trivial to manage manually. Keeps bundle minimal.
- **Polar coordinate layout**: Skills positioned by `(angle, radius)` where angle maps to branch slice and radius maps to tier ring. Cross-branch hybrids placed at the average angle of their two branches. Converted to cartesian for SVG: `x = r * sin(θ)`, `y = -r * cos(θ)`.
- **Derived graph**: Skills defined as a flat TypeScript array (single source of truth). Graph edges computed from `prerequisites[]` field — no separate edge definitions to keep in sync.
- **Zustand + persist**: State management with `persist` middleware for localStorage. Zod schemas validate on load for data integrity and future schema migrations.
- **Static export**: Next.js `output: 'export'` — deployable to any static host with zero server cost.

## Technical Approach

### Data Layer
- `src/types/skill.ts` — Core types: `Skill`, `Branch`, `Tier`, `ActionType`, `StatBonus`
- `src/types/graph.ts` — Graph types: `SkillNode` (skill + polar position + cartesian coords), `SkillEdge`, `SkillGraph`
- `src/types/player.ts` — Build types: `PlayerBuild`, `DecisionEntry`, `BuildSlot`
- `src/data/skills.ts` — All 31 skill definitions as a const array + `SKILL_MAP` lookup + `BASE_SKILL_IDS`
- `src/data/layout.ts` — `getSkillPosition(skill)` → `{ angle, radius }` using branch angles and tier radii
- `src/data/graph.ts` — `buildSkillGraph()` derives nodes (with positions) and edges from skill prerequisites

### Logic Layer
- `src/lib/polar.ts` — Polar ↔ cartesian conversion, angle averaging for hybrids, angle normalization
- `src/lib/graph-utils.ts` — `canUnlock(skillId, unlockedSet)`, `canRemove(skillId, unlockedSet)`, ancestor/descendant traversal
- `src/lib/storage.ts` — Zod schemas for `PlayerBuild[]`, validated read/write wrappers around localStorage
- `src/stores/build-store.ts` — Zustand store: active slot, 5 builds, unlock/lock actions, stat derivation, hovered skill

### Component Layer
- **Skill Tree** (`src/components/skill-tree/`): `SkillTreeSVG` (root container + viewBox + pan/zoom), `TierRing` (concentric circles), `BranchSlice` (separator lines + labels), `SkillNode` (interactive circle per skill), `SkillEdge` (bezier prerequisite paths), `DirectionLine` (cursor-following line from center)
- **Skill Cards** (`src/components/skill-card/`): `SkillCard` (reusable card at poker-card ratio), `CardHeader`/`CardBody`/`CardFooter` (card sections), `CardSheet` (print grid layout)
- **Build Panel** (`src/components/build/`): `BuildPanel` (sidebar), `BuildSlotPicker` (5 slot buttons), `BuildNameEditor` (inline editable), `DecisionLog` (ordered pick history)
- **UI Primitives** (`src/components/ui/`): `Tooltip` (positioned portal), `Button`, `Modal` (confirmation dialogs)

### Hooks
- `use-mouse-angle` — Track cursor angle relative to SVG center for directional selection
- `use-skill-tooltip` — Manage tooltip visibility, position, and active skill
- `use-print-mode` — Detect/trigger print media query

### Routes
- `/` — Main page: skill tree + build panel sidebar
- `/print` — Print-optimized card sheet (reads active build from store)

### Infrastructure
- Static export via `next.config.ts` → `output: 'export'`
- No API routes, no server components with data fetching
- Tree and build panel are client components (`"use client"`)
- Layout component handles fonts, metadata, and dark theme

## Implementation Strategy

### Phase 1: Foundation (Tasks 1-2)
Scaffold the project and define the complete data model. At the end of this phase, all 31 skills are defined, the graph is derivable, and `bun dev` serves the app. This is the critical path — everything else depends on it.

### Phase 2: Core Visualization (Tasks 3-4)
Build the static SVG tree and add interaction (hover cards, click to unlock). These can be partially parallelized: the SVG tree structure and the card component are independent. At the end of this phase, you can see the full tree and interact with it.

### Phase 3: State + UI (Tasks 5-6)
Wire up persistent state management and build the sidebar panel. These depend on the interaction system from Phase 2. At the end of this phase, builds persist and the full UI is functional.

### Phase 4: Print + Polish (Task 7)
Add the print view, directional cursor line, pan/zoom, and visual polish. This is the final layer on top of the working system.

### Risk Mitigation
- **Polar layout collisions**: If skills overlap, adjust spacing algorithm in `layout.ts`. Start with generous tier radii (60/160/260/360).
- **Cross-branch positioning**: Angle averaging can place hybrids on top of each other if both branches are adjacent. Add offset logic for skills sharing the same border.
- **Print fidelity**: Test early with `Cmd+P` in Chrome — print CSS quirks can be hard to debug late.

### Testing Approach
- Manual verification per milestone (no automated tests for v1 — visual/interactive app)
- Console.log graph structure to verify 31 nodes + correct edge count
- Test prerequisite enforcement: try to unlock Tier 2 without Tier 1 prereq
- Test localStorage: refresh page, verify state survives; corrupt localStorage manually, verify graceful reset
- Print test: verify card proportions and page breaks in Chrome print preview

## Task Breakdown Preview

- [ ] **Task 1 — Project Scaffolding**: Next.js 15 + TypeScript + Tailwind + Bun setup, directory skeleton, CLAUDE.md (FR: all, NFR-3)
- [ ] **Task 2 — Data Model + Skill Definitions**: Types, all 31 skills, polar layout engine, graph derivation, graph utilities (FR-1, FR-2)
- [ ] **Task 3 — Static SVG Tree**: SkillTreeSVG, TierRing, BranchSlice, SkillNode, SkillEdge components rendering the full circular tree (FR-3, US-1)
- [ ] **Task 4 — Node Interaction + Skill Cards**: Hover tooltip with SkillCard, click to unlock/lock, node visual states (FR-4, US-3, US-4)
- [ ] **Task 5 — State Management**: Zustand store with persist, prerequisite enforcement, stat computation, Zod validation (FR-5, US-4, US-5, NFR-5)
- [ ] **Task 6 — Build Panel Sidebar**: Save slots, slot picker, build name editor, decision log, stats display, reset with confirmation (US-5, US-6, US-8)
- [ ] **Task 7 — Print View, Direction Line + Polish**: `/print` route with card sheet, directional cursor line, pan/zoom, responsive layout, glow animations (FR-6, US-2, US-7, NFR-1, NFR-2)

## Dependencies

### External (npm packages)
| Package | Version | Purpose |
|---------|---------|---------|
| next | ^15 | App Router, static export |
| react / react-dom | ^19 | UI rendering |
| zustand | ^5 | State management + persist middleware |
| zod | ^4 | localStorage schema validation |
| tailwindcss | ^4 | Utility-first CSS |
| typescript | ^5.9 | Type safety |

### Internal
| Dependency | Location |
|------------|----------|
| PRD | `.claude/prds/skill-tree-visualizer.md` |
| Approved plan | `/Users/frederikjuhl/.claude/plans/polished-bouncing-feigenbaum.md` |

No external APIs, no databases, no backend services.

## Success Criteria (Technical)

| Criterion | Measurement |
|-----------|-------------|
| All skills render | 31 nodes visible in SVG, correct slice/tier positions |
| Graph is correct | Edge count matches total prerequisites across all skills |
| Prerequisite enforcement | Cannot unlock Tier N skill without Tier N-1 prereqs |
| State persistence | Build survives page refresh + browser restart |
| Print fidelity | Cards at poker-card ratio, no page-split, clean Cmd+P output |
| Interaction performance | Tooltip + direction line at 60fps during mouse movement |
| Bundle size | < 200KB gzipped (no heavy dependencies) |

## Estimated Effort

| Task | Complexity | Parallelizable |
|------|-----------|----------------|
| 1. Project Scaffolding | Low | No (foundation) |
| 2. Data Model + Skills | Medium | No (depends on 1) |
| 3. Static SVG Tree | Medium | Yes (after 2) |
| 4. Node Interaction + Cards | Medium | Partially (card component independent, interaction needs tree) |
| 5. State Management | Medium | Yes (after 2, parallel with 3) |
| 6. Build Panel Sidebar | Low-Medium | Yes (after 5) |
| 7. Print + Direction + Polish | Medium | Partially (print and direction line are independent) |

**Critical path**: Task 1 → Task 2 → Task 3 → Task 4 → integration

**Parallelization opportunities**:
- Tasks 3 + 5 can run in parallel (both depend only on Task 2)
- Task 6 can start as soon as Task 5 is done
- Print view (part of Task 7) can be built as soon as the SkillCard component exists (Task 4)

## Tasks Created

| # | Task | Size | Depends On | Parallel |
|---|------|------|------------|----------|
| 001 | Project Scaffolding | S | — | No (foundation) |
| 002 | Data Model + Skill Definitions | L | 001 | No (critical path) |
| 003 | Static SVG Tree | M | 002 | Yes (with 005) |
| 004 | Node Interaction + Skill Cards | M | 003 | No |
| 005 | State Management | M | 002 | Yes (with 003) |
| 006 | Build Panel Sidebar | M | 004, 005 | No (integration) |
| 007 | Print View, Direction Line + Polish | L | 006 | No (final layer) |

**Summary**: 7 tasks, 2 parallelizable pairs (003+005), sequential critical path: 001→002→003→004→006→007

**Dependency Graph**:
```
001 → 002 → 003 → 004 ──┐
              └→ 005 ──┘→ 006 → 007
```

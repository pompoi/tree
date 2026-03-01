---
name: skill-tree-visualizer
description: Interactive circular skill tree visualizer with printable cards for a hex-grid fighting game
status: backlog
created: 2026-03-01T19:37:27Z
---

# PRD: Skill Tree Visualizer

## Executive Summary

Build an interactive, web-based circular skill tree visualizer for the Yomi Tower fighting game. The tool lets players explore 31 skills across 3 build pillars (Attack, Movement, Defend), plan builds by unlocking skills through a prerequisite graph, preview skill details via hover cards, save up to 5 build loadouts, and print physical skill cards for tabletop prototyping. The circular layout uses directional selection — pointing toward a slice of the circle highlights that branch and its skills.

**Value Proposition**: Gives players and designers a tactile, visual tool to explore the skill system, plan builds, and produce physical cards — bridging digital and tabletop prototyping for the Yomi Tower game.

## Problem Statement

The Yomi Tower game has a rich skill tree (31 skills, 4 tiers, 3 pillars, cross-branch hybrids) that is currently only described in text and conversation notes. There is no interactive tool to:

1. **Visualize** the skill graph and prerequisite relationships
2. **Experiment** with build paths before playing
3. **Print** physical skill cards for tabletop playtesting
4. **Persist** build configurations across sessions

Without this tool, skill balance is hard to evaluate, new players can't explore the tree before committing, and physical prototyping requires manual card creation.

## User Stories

### US-1: Skill Tree Exploration
**As a** player or game designer,
**I want to** see all 31 skills arranged in a circular tree by branch and tier,
**So that** I can understand the full skill graph, prerequisites, and build paths at a glance.

**Acceptance Criteria:**
- Tree renders as a circle split into 3 slices (Attack top, Movement bottom-right, Defend bottom-left)
- Skills radiate outward from center: Tier 0 inner ring → Tier 3 outer ring
- Cross-branch/hybrid skills sit on slice borders
- Prerequisite edges are visible as curved lines between nodes
- Each branch has a distinct color (Attack=red, Movement=cyan, Defend=green)

### US-2: Directional Selection
**As a** player,
**I want to** point my cursor toward a section of the circle to highlight that branch,
**So that** I can focus on one pillar at a time using a natural directional gesture.

**Acceptance Criteria:**
- A direction line extends from the center to the cursor position
- The nearest branch slice and its skills are highlighted
- Dimming/fading applied to non-targeted branches
- The nearest individual skill node gets a glow effect

### US-3: Skill Card Preview
**As a** player,
**I want to** hover over a skill node to see its full card with stats and description,
**So that** I can evaluate a skill before committing to it.

**Acceptance Criteria:**
- Card appears on hover near the cursor, never clipped off-screen
- Card shows: name, tier badge, branch icon, action type, hex range, description, stat bonus, cooldown, prerequisites
- Card uses poker-card proportions (63mm x 88mm ratio)
- Card has branch-colored gradient header

### US-4: Build Creation
**As a** player,
**I want to** click skills to unlock them and build a loadout,
**So that** I can plan my tower progression path.

**Acceptance Criteria:**
- Base skills (Tier 0) are always unlocked
- Clicking an available skill unlocks it (prerequisites must be met)
- Clicking an unlocked skill locks it (only if no dependent skills are unlocked)
- Visual states: locked (gray), available (white dashed border), unlocked (branch-colored fill), base (always filled)
- Stat totals (damage/movement/reduction) update as skills are unlocked

### US-5: Save Slots
**As a** player,
**I want to** save up to 5 named build loadouts that persist across browser sessions,
**So that** I can compare different build strategies.

**Acceptance Criteria:**
- 5 save slots displayed in a sidebar
- Each slot has an editable name
- Active slot is highlighted
- Switching slots loads that build's unlocked skills and decision log
- State persists in localStorage across page refreshes
- Corrupt/outdated localStorage data is handled gracefully (validated with Zod)

### US-6: Decision Log
**As a** player,
**I want to** see the ordered list of skill picks I've made,
**So that** I can trace my build path and understand the tower-level progression.

**Acceptance Criteria:**
- Sidebar shows ordered list of skill unlocks (most recent last)
- Each entry shows skill name, tier, and branch icon
- Corresponds to tower levels (skill 1 = level 1, etc.)

### US-7: Printable Skill Cards
**As a** game designer,
**I want to** print physical skill cards for tabletop prototyping,
**So that** I can playtest with physical cards cut to standard card size.

**Acceptance Criteria:**
- Dedicated `/print` route shows a card sheet
- Only unlocked skills from the active build are shown
- Cards render at poker-card proportions on white background
- Print styles: no sidebar, no navigation, proper margins, page-break-after
- Cards don't split across pages
- Cmd+P produces clean output

### US-8: Build Management
**As a** player,
**I want to** reset builds, and navigate between the tree and print views,
**So that** I can manage my build experimentation.

**Acceptance Criteria:**
- "Reset Build" button with confirmation dialog clears non-base skills
- "Print Cards" button navigates to `/print`
- "Back to Tree" link on print page returns to main view

## Functional Requirements

### FR-1: Skill Data Model
- 31 skills defined as a single-source-of-truth TypeScript array
- Each skill has: id, name, tier (0-3), branch, secondaryBranch?, actionType, hexRange, description, statBonus, statBonusAmount, cooldown, prerequisites[], isBase
- Graph edges derived automatically from prerequisites — no duplicate definitions
- Lookup map for O(1) access by skill ID

### FR-2: Circular Layout Engine
- Polar coordinate system: angle = branch slice position, radius = tier ring
- Branch angles: Attack at 0deg (top), Movement at 120deg, Defend at 240deg
- Each slice spans 120deg
- Skills within a slice+tier are evenly spaced
- Cross-branch skills positioned at the average angle of their two branches
- Cartesian conversion: x = r * sin(θ), y = -r * cos(θ)

### FR-3: SVG Tree Rendering
- Root SVG with 800x800 viewBox centered at (0,0)
- 4 concentric tier rings (dashed circles)
- 3 branch slice separators (lines from center to outer ring) with labels
- Skill nodes as circles with branch-colored fill
- Prerequisite edges as quadratic bezier curves
- Direction line from center to cursor

### FR-4: Interaction System
- Mouse tracking computes angle from SVG center
- Nearest skill detection based on angular proximity
- Hover triggers tooltip card display
- Click triggers skill unlock/lock with prerequisite validation
- Node state transitions with visual feedback

### FR-5: State Management
- Zustand store with persist middleware (localStorage)
- 5 build slots with independent state
- Prerequisite enforcement: canUnlock() checks all prereqs met, canRemove() checks no dependents unlocked
- Derived stat computation from unlocked skills
- Zod schema validation on localStorage load for data integrity

### FR-6: Print System
- Dedicated Next.js route (`/print`)
- CSS Grid layout of SkillCard components
- @media print stylesheet
- Card proportions match poker-card standard (2.5:3.5 ratio)
- Page-break handling for multi-page printing

## Non-Functional Requirements

### NFR-1: Performance
- SVG with 31 nodes + ~40 edges renders at 60fps during mouse tracking
- No external SVG/charting libraries — hand-built for minimal bundle
- Direction line and tooltip update without perceptible lag

### NFR-2: Accessibility
- SVG nodes have aria-labels with skill names
- Keyboard navigation between nodes (arrow keys + Enter)
- Sufficient color contrast for all branch colors
- Print view uses high-contrast colors on white background

### NFR-3: Deployability
- Deployable as a static export (Next.js `output: 'export'`)
- Zero server cost — all client-side
- No backend, no API routes, no database for v1

### NFR-4: Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge — latest 2 versions)
- Touch support for tablet (pinch zoom, swipe pan)
- Print CSS tested in Chrome and Safari print preview

### NFR-5: Data Integrity
- localStorage data validated with Zod schemas on every load
- Graceful degradation if localStorage is corrupted (reset to defaults)
- Schema versioning to handle future data structure changes

## Success Criteria

1. **Functional tree**: All 31 skills render in correct positions with visible prerequisite edges
2. **Build creation works**: Can create a full build path from Tier 0 → Tier 3 capstone, prerequisites enforced
3. **Cards are printable**: `/print` produces a clean, cuttable card sheet at poker-card proportions
4. **State persists**: 5 independent builds survive page refresh and browser restart
5. **Directional selection works**: Cursor direction highlights nearest branch and skill
6. **Sub-second interaction**: Hover cards appear instantly, node state changes are immediate

## Constraints & Assumptions

### Constraints
- **Client-side only**: No server, no database — localStorage for v1
- **Bun package manager**: Per PAI stack preferences
- **TypeScript**: Per PAI stack preferences (TypeScript > Python)
- **No external SVG library**: Hand-built SVG for full layout control

### Assumptions
- The 31-skill tree design is final for v1 (skills may be rebalanced but count is fixed)
- Poker-card proportions (63mm x 88mm) are the target print format
- 5 save slots is sufficient for build experimentation
- Modern browser only (no IE11 or legacy support)
- Single-player build planning tool (no multiplayer or real-time features in v1)

## Out of Scope

- **Hex board visualization** — No game board, just the skill tree
- **Combat resolution** — No simultaneous resolution engine
- **Tower progression gameplay** — No actual tower levels or win conditions
- **Multiplayer** — No shared builds, no real-time collaboration
- **Backend/API** — No server, no database, no user accounts
- **Advantage mechanic** — No yes/no question system
- **Skill balance simulation** — No damage calculations or outcome modeling
- **Mobile-first design** — Responsive but designed for desktop-first (skill tree needs screen space)

## Dependencies

### External
- **Next.js 15** — App Router, static export capability
- **React 19** — Component rendering
- **Zustand 5** — State management with persist middleware
- **Zod 4** — localStorage schema validation
- **Tailwind CSS 4** — Utility-first styling
- **Bun** — Package manager and dev server

### Internal
- **Approved plan**: `/Users/frederikjuhl/.claude/plans/polished-bouncing-feigenbaum.md`
- **Game design source**: Claude conversation defining all 31 skills, their prerequisites, and the circular UI concept

## Implementation Milestones

| # | Milestone | Key Deliverable |
|---|-----------|-----------------|
| M1 | Project Scaffolding | Next.js app running with `bun dev` |
| M2 | Types + Skill Data | All 31 skills defined, graph derivable |
| M3 | Static SVG Tree | Circular tree renders with nodes and edges |
| M4 | Node Interaction + Cards | Hover cards, click to unlock/lock |
| M5 | Build State (Zustand) | Persistent state with prerequisite enforcement |
| M6 | Build Panel Sidebar | Save slots, decision log, stats |
| M7 | Direction Line | Cursor tracking, nearest skill highlight |
| M8 | Print View | Printable card sheet at `/print` |
| M9 | Pan/Zoom + Responsive | SVG pan/zoom, responsive layout |
| M10 | Polish | Animations, keyboard nav, export/import |

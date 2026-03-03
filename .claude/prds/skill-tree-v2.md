---
name: skill-tree-v2
description: V2 unified hex skill tree with YOMI advantage highlighting, visual game mechanics, and UX polish
status: in-progress
created: 2026-03-03T21:30:29Z
supersedes: skill-tree-visualizer
---

# PRD: Skill Tree V2 — Unified Hex Graph with YOMI Advantage Visualization

## Executive Summary

Evolve the Yomi Tower Skill Tree from a build-planning tool into a visual game mechanics communicator. The hex-based unified graph (already built) becomes the foundation for a layer of YOMI advantage/disadvantage highlighting, visual combat relationship cues, and UX polish that teaches players the game's core rock-paper-scissors system through interaction alone.

**Value Proposition**: Players understand the YOMI advantage triangle not by reading rules, but by seeing gold and purple highlights ripple across the skill tree as they explore branches. The tree becomes a teaching tool, not just a planning tool.

## Problem Statement

The skill tree visualizer (v1) successfully lets players explore skills and plan builds. But it doesn't communicate the game's most important mechanic: **the YOMI advantage triangle** (Attack beats Movement, Movement beats Defend, Defend beats Attack).

Currently:
1. The colored triangle between the three branch hexes shows advantage relationships, but it's static and subtle
2. Hovering a skill shows its card but doesn't reveal how it relates to the broader advantage system
3. Players must memorize which branch beats which — the UI doesn't reinforce this during exploration
4. The "Selection Wheel" mode hides skills instead of showing them as empty outlines (fixed in latest iteration)

**What's needed**: Dynamic, interactive visual feedback that makes the advantage triangle feel alive — hovering an Attack skill should instantly show you which skills you dominate (gold) and which skills threaten you (purple).

## Current State (Baseline)

The following is **already built** and working:

### Architecture
- Next.js 16 / React 19 / TypeScript strict / Tailwind v4 / Zustand 5 / Bun
- Static export (`output: "export"`)
- 30 skills across 3 branches (Attack, Movement, Defend), 4 tiers (0-3)

### Unified Hex Graph (`UnifiedSkillGraph.tsx`)
- Single component replacing the old separate SkillTreeSVG + SelectionWheel
- **No separate decorative branch hexes** — the three base skills (Melee Attack, Move, Defend) ARE the branch anchors, touching at corners to form the central YOMI advantage triangle
- Central advantage triangle with colored wedges between the three base skill hexes
- All skills rendered as uniform hexagons (BRANCH_HEX_R=36) with branch icons and names
- Two modes: "Skill Tree" (all unlockable visible) and "Selection Wheel" (same set, unlocked=filled, others=outline)
- Pan/zoom (mouse drag, scroll wheel, pinch, double-click reset)
- Prerequisite chain highlighting on hover (recursive walk up prereqs)
- Click-to-persist selection via `selectedSkillId`
- Confirm/Reset button that locks selection with fat glowing hex outlines
- Floating animated HexCardFull on hover via createPortal

### Other Components
- CardBar: horizontal card bar at bottom showing base + unlocked skills
- CardPreviewPanel: right-side 2D card preview (3D removed)
- BuildPanel: overlay with 5 build slots, decision log, stats
- Print view at `/print`, card gallery at `/cards`
- Hex card visualization system with animations (appear, rotate, glow, dash)

### Build State
- Zustand store with persist middleware (localStorage)
- 5 named build slots with unlock/lock actions
- Prerequisite enforcement: `canUnlock()`, `canRemove()`
- Stat aggregation (damage, movement, reduction)

## User Stories

### US-1: YOMI Advantage Highlighting
**As a** player exploring the skill tree,
**I want to** see which skills my hovered skill has advantage over and which have advantage over it,
**So that** I intuitively learn the YOMI triangle through visual feedback.

**Acceptance Criteria:**
- Hovering any skill highlights ALL visible skills of the branch it beats in **gold** (#fbbf24)
- Hovering any skill highlights ALL visible skills of the branch that beats it in **purple** (#a855f7)
- The hovered skill itself and its prerequisite chain retain their current highlight style
- The advantage triangle in the center subtly pulses or brightens the relevant wedges
- Highlighting is immediate (no animation delay) and clears on mouse leave
- Works in both Skill Tree and Selection Wheel modes
- Base skills (Melee Attack, Move, Defend) also trigger advantage highlighting
- Branch hexes (ATK/MOV/DEF decorative hexes) also trigger advantage highlighting for their branch

### US-2: Visual Advantage Feedback on Base Skill Hexes
**As a** player,
**I want** the three base skill hexes (Melee Attack, Move, Defend) to visually react when I hover skills from advantage/disadvantage branches,
**So that** the core triangle relationship is always reinforced.

**Acceptance Criteria:**
- When hovering an Attack skill: Move base hex gets a gold border, Defend base hex gets a purple border
- When hovering a Movement skill: Defend base hex gets gold, Melee Attack base hex gets purple
- When hovering a Defend skill: Melee Attack base hex gets gold, Move base hex gets purple
- The hovered skill's own base hex has its normal hover glow (existing behavior)
- Transitions are smooth (CSS transition or SVG animation)

### US-3: Advantage Legend
**As a** new player,
**I want** a small legend or key explaining what gold and purple mean,
**So that** I understand the highlighting without prior knowledge.

**Acceptance Criteria:**
- Small legend element near the graph (corner or below the YOMI triangle)
- Shows: gold hex = "Advantage over" / purple hex = "Vulnerable to"
- Non-intrusive — doesn't block skill nodes
- Can be hidden/toggled if desired

### US-4: Selection Wheel Fill-Toggle UX
**As a** player in Selection Wheel mode,
**I want to** see all available skills as outlines and fill them by clicking,
**So that** I can build my loadout without skills disappearing.

**Acceptance Criteria:**
- All unlockable skills visible in both modes (same layout positions)
- In Selection Wheel mode: unlocked skills are filled, others are transparent outlines with dashed stroke
- Clicking toggles fill state (unlock/lock) — skill never disappears
- Visual distinction between "filled/selected" and "outline/available" is clear
- YOMI advantage highlighting works on outlined (unfilled) skills too
- **Status: DONE** ✅ (implemented in current codebase)

### US-5: Confirm/Reset Selection Lock
**As a** player,
**I want to** lock my current skill selection with a visible outline and unlock it later,
**So that** I can explore other skills without losing my planned build.

**Acceptance Criteria:**
- Confirm button appears when skills are selected
- Clicking Confirm renders fat glowing hex outlines around all selected skills
- Button text changes to "Reset"
- While confirmed: clicking other skills does nothing (selection locked)
- Hover still shows card details and advantage highlighting
- Reset clears outlines and re-enables normal interaction
- **Status: DONE** ✅ (implemented in current codebase)

### US-6: Uniform Skill Hex Style
**As a** player,
**I want** all skills to be the same size and shape,
**So that** the visual hierarchy is clean and consistent.

**Acceptance Criteria:**
- All skills (base and non-base) rendered at BRANCH_HEX_R=36
- All show branch icon (⚔/⚡/🛡) and skill name
- Consistent hover/highlight behavior across all skills
- **Status: DONE** ✅ (implemented in current codebase)

### US-7: Base Skills as Touching Triangle (No Decorative Branch Hexes)
**As a** player,
**I want** the three base skills (Melee Attack, Move, Defend) to touch at corners forming the YOMI triangle directly,
**So that** there's no redundant layer between the triangle and the actual skills.

**Acceptance Criteria:**
- The separate decorative branch hexes (ATK/MOV/DEF) are **removed**
- Base skills (Melee Attack, Move, Defend) are positioned to touch at corners
- Central void between them filled with three colored advantage wedges
- Each wedge colored by which branch beats the adjacent base skill
- "YOMI" text at center
- Non-base skills radiate outward from their branch's base skill
- No decorative edges needed (base skills connect directly to child skills via prerequisite edges)
- **Status: PLANNED** (requires removing CORE_POSITIONS branch hexes, repositioning base skills to touching positions)

## Functional Requirements

### FR-1: Advantage Highlighting Engine
- Determine advantage relationships from skill branch:
  - Attack → beats Movement, loses to Defend
  - Movement → beats Defend, loses to Attack
  - Defend → beats Attack, loses to Movement
- On hover of any skill node:
  - Collect all visible nodes of the "beaten" branch → apply gold highlight
  - Collect all visible nodes of the "beats this" branch → apply purple highlight
  - Apply appropriate border colors to decorative branch hexes
- Highlight colors: Gold (#fbbf24) for advantage, Purple (#a855f7) for vulnerability
- Highlighting stacks with existing prereq chain highlighting (prereq chain in white, advantage in gold/purple)
- Clear all advantage highlighting on mouse leave
- No separate decorative branch hexes — base skills serve as the branch anchors

### FR-2: Advantage-Aware Rendering
- Each skill node needs to support 4 visual states simultaneously:
  1. Base fill state (filled/outline based on unlock status and mode)
  2. Prerequisite chain highlight (white glow, existing)
  3. Advantage highlight (gold stroke/fill overlay)
  4. Disadvantage highlight (purple stroke/fill overlay)
- Priority: disadvantage > advantage > prereq chain > base state
- Confirmed selection outlines render on top of all highlight states

### FR-3: Base Skill Hex Advantage Borders
- Base skill hexes (Melee Attack, Move, Defend) respond to advantage context:
  - Gold thick border when their branch is beaten by the hovered skill's branch
  - Purple thick border when their branch beats the hovered skill's branch
  - Normal style when same branch or no hover
- Smooth transition between states

### FR-4: Advantage Legend Component
- Small SVG or HTML overlay showing:
  - Gold hex icon + "Beats" or "Advantage over"
  - Purple hex icon + "Loses to" or "Vulnerable to"
- Positioned in lower-left or upper-right corner of the graph
- Semi-transparent background, non-blocking

## Non-Functional Requirements

### NFR-1: Performance
- Advantage highlighting must apply within a single frame (no visible delay)
- All 30 skill nodes + 3 branch hexes re-render smoothly during hover
- No layout shift or position recalculation on highlight state change

### NFR-2: Visual Clarity
- Gold and purple must be clearly distinguishable from branch colors (red, cyan, green)
- Highlighted skills must remain readable (name and icon visible)
- Advantage highlighting should not obscure the prereq chain highlighting

### NFR-3: Color Accessibility
- Gold (#fbbf24) and Purple (#a855f7) have sufficient contrast against dark background
- Consider adding a subtle icon or pattern to gold/purple highlights for colorblind users
- Minimum 4.5:1 contrast ratio for text on highlighted backgrounds

### NFR-4: Mobile
- Touch-hold could trigger advantage highlighting (equivalent to hover)
- Advantage legend readable on small screens
- Pan/zoom continues to work during highlight state

## Success Criteria

1. **Advantage is learnable**: A new player understands ATK→MOV→DEF→ATK within 30 seconds of hovering skills
2. **Colors are distinct**: Gold and purple are immediately distinguishable from each other and from branch colors
3. **No performance regression**: Hovering with 30 nodes visible feels instant
4. **Builds still work**: All existing functionality (unlock/lock, confirm/reset, card preview, print) unaffected
5. **Teaching through interaction**: The UI teaches the YOMI triangle without requiring text explanation

## Constraints & Assumptions

### Constraints
- Client-side only (no server, no database)
- Bun package manager, TypeScript, no external SVG library
- Must not break existing functionality (confirm/reset, card bar, build panel, print)
- Static export deployment

### Assumptions
- The YOMI advantage triangle is fixed (ATK→MOV→DEF→ATK) and won't change
- Gold (#fbbf24) and Purple (#a855f7) are the final highlight colors
- "Visual only" scope — no combat resolution engine in this phase
- Cross-branch skills (with `secondaryBranch`) highlight based on primary branch

## Out of Scope

- **Combat resolution engine** — No turn simulation, no HP tracking, no damage calculation
- **Hex board gameplay** — No tactical grid, no unit positioning
- **Multiplayer** — No shared builds, no real-time features
- **Skill balance simulation** — No outcome modeling or win-rate analysis
- **Sound effects** — No audio feedback for highlighting
- **3D visualization** — 3D hex preview removed, not coming back
- **New skills** — Working with existing 30-skill set

## Dependencies

### External (already installed)
| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.1.6 | App Router, static export |
| react | 19.2.3 | UI rendering |
| zustand | 5.0.11 | State management + persist |
| zod | 4.3.6 | localStorage validation |
| tailwindcss | 4 | Utility-first CSS |

### Internal
| Dependency | Location |
|------------|----------|
| V1 PRD (superseded) | `.claude/prds/skill-tree-visualizer.md` |
| Unified skill graph | `src/components/skill-tree/UnifiedSkillGraph.tsx` |
| Skill data (30 skills) | `src/data/skills.ts` |
| Build store | `src/stores/build-store.ts` |

## Implementation Milestones

| # | Milestone | Key Deliverable | Depends On |
|---|-----------|-----------------|------------|
| M1 | Remove decorative branch hexes | Delete ATK/MOV/DEF branch hexes; base skills (Melee Attack, Move, Defend) become the touching triangle with advantage wedges between them; remove CORE_POSITIONS, coreEdges, branch hex rendering; adjust radial layout so non-base skills radiate from base skill positions | — |
| M2 | Advantage highlighting engine | Gold/purple highlights on all visible skill nodes when hovering any skill | M1 |
| M3 | Base skill advantage borders | Base skill hexes show gold/purple borders based on hovered branch | M2 |
| M4 | Advantage legend | Small overlay explaining gold = beats, purple = loses to | M2 |
| M5 | Visual polish | Smooth transitions, edge cases (cross-branch skills, confirmed state) | M2-M4 |
| M6 | UX cleanup | Remove dead code (SkillNode.tsx if unused), update v1 epic status | M5 |

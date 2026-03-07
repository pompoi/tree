---
name: Bottom Card Bar (UI Enhancement)
created: 2026-03-01T20:10:00Z
status: noted
applies_to: [5, 7]
---

# UI Enhancement: Bottom Card Bar

## Description (from user)

"In the bottom of the screen, I want to see cards for the default skills, as well as the confirmed selections I have made in my selection."

## Implementation

Add a horizontal card bar at the bottom of the screen showing:
1. **Base skills** (always visible): Melee Attack, Ranged Attack, Movement, Dodge
2. **Unlocked skills** (confirmed selections): shown in order of selection (decision log order)

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│                    Circular Skill Tree                       │
│                                                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ [Melee] [Ranged] [Move] [Dodge] │ [Pick1] [Pick2] [Pick3]  │
│  base skills (always)           │  confirmed selections     │
└─────────────────────────────────────────────────────────────┘
                                                    [Sidebar]
```

### Component
- `src/components/build/CardBar.tsx` — horizontal scrollable row of mini SkillCards
- Mini card variant: smaller than the hover card, showing name + branch icon + tier
- Base skills have a distinct "base" badge
- Selections separated visually from base skills (divider or gap)
- Clicking a card in the bar highlights it on the tree

### Integration
- Reads from Zustand store (same as BuildPanel)
- Part of the main page layout, below the tree SVG
- Should be implemented during Task #7 (Build Panel Sidebar) or Task #8 (Polish)

# CLAUDE.md - Project Conventions

## Package Manager
- Use **Bun** exclusively (never npm, yarn, or pnpm)
- Install: `bun add <package>`
- Run: `bun run <script>` or `bunx <command>`

## Language
- **TypeScript** with strict mode enabled
- No `any` types — use proper interfaces and generics
- All files use `.ts` or `.tsx` extensions

## Styling
- **Tailwind CSS v4** — utility-first, no custom CSS unless necessary
- Use Tailwind's JIT mode; avoid arbitrary values where standard scale suffices

## State Management
- **Zustand** with `persist` middleware for build slot persistence
- Stores live in `src/stores/`
- Keep store slices focused and small

## Tree Rendering
- **Hand-built SVG** — no external charting or SVG libraries
- SVG logic lives in `src/components/skill-tree/`
- Use polar coordinates; see `src/lib/polar.ts` for helpers

## Branch Colors
| Branch    | Color   | Hex       |
|-----------|---------|-----------|
| Attack    | Red     | `#ef4444` |
| Movement  | Cyan    | `#06b6d4` |
| Defend    | Green   | `#22c55e` |
| Locked    | Gray    | `#6b7280` |

## Path Alias
- `@/` maps to `src/`
- Example: `import { SKILLS } from "@/data/skills"`

## Directory Structure
```
src/
  app/          # Next.js App Router pages
  components/   # React components
    skill-tree/ # SVG tree rendering
    skill-card/ # Skill detail card
    build/      # Build slot UI
    ui/         # Generic UI primitives
  data/         # Static skill data and graph
  hooks/        # Custom React hooks
  lib/          # Pure utility functions
  stores/       # Zustand stores
  types/        # TypeScript type definitions
```

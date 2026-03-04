import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { BASE_SKILL_IDS, SKILL_MAP } from "@/data/skills";
import { canUnlock, canRemove } from "@/lib/graph-utils";
import { validateStoredState } from "@/lib/storage";
import type { PlayerBuild, DecisionEntry } from "@/types/player";
import type { StatBonus } from "@/types/skill";

// ─── Constants ────────────────────────────────────────────────────────────────

const SLOT_COUNT = 5;
const STORAGE_KEY = "skill-tree-builds-v2";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createDefaultBuild(index: number): PlayerBuild {
  return {
    slotIndex: index,
    name: `Build ${index + 1}`,
    unlockedSkillIds: [...BASE_SKILL_IDS],
    decisionLog: BASE_SKILL_IDS.map(
      (skillId, i): DecisionEntry => ({
        skillId,
        towerLevel: i + 1,
        timestamp: Date.now(),
      })
    ),
    stats: computeStats(BASE_SKILL_IDS),
    updatedAt: Date.now(),
  };
}

function computeStats(
  unlockedSkillIds: string[]
): { damage: number; movement: number; reduction: number } {
  const totals: Record<StatBonus, number> = {
    damage: 0,
    movement: 0,
    reduction: 0,
  };

  for (const skillId of unlockedSkillIds) {
    const skill = SKILL_MAP.get(skillId);
    if (skill) {
      totals[skill.statBonus] += skill.statBonusAmount;
    }
  }

  return totals;
}

function createDefaultBuilds(): PlayerBuild[] {
  return Array.from({ length: SLOT_COUNT }, (_, i) => createDefaultBuild(i));
}

// ─── State interface ──────────────────────────────────────────────────────────

interface BuildState {
  activeSlot: number;
  builds: PlayerBuild[];
  hoveredSkillId: string | null;

  setActiveSlot: (index: number) => void;
  renameBuild: (index: number, name: string) => void;
  unlockSkill: (skillId: string) => void;
  lockSkill: (skillId: string) => void;
  resetBuild: (index: number) => void;
  setHoveredSkill: (skillId: string | null) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useBuildStore = create<BuildState>()(
  persist(
    (set, get) => ({
      activeSlot: 0,
      builds: createDefaultBuilds(),
      hoveredSkillId: null,

      setActiveSlot: (index: number) => {
        set({ activeSlot: index });
      },

      renameBuild: (index: number, name: string) => {
        const builds = get().builds;
        const updated = builds.map((build, i) =>
          i === index
            ? { ...build, name, updatedAt: Date.now() }
            : build
        );
        set({ builds: updated });
      },

      unlockSkill: (skillId: string) => {
        const { activeSlot, builds } = get();
        const activeBuild = builds[activeSlot];
        if (!activeBuild) return;

        const unlockedSkillIds = activeBuild.unlockedSkillIds;

        // Skip if already unlocked
        if (unlockedSkillIds.includes(skillId)) return;

        const unlockedSet = new Set(unlockedSkillIds);

        // Validate prerequisites
        if (!canUnlock(skillId, unlockedSet)) return;

        const newUnlockedSkillIds = [...unlockedSkillIds, skillId];
        const newTowerLevel = activeBuild.decisionLog.length + 1;

        const newEntry: DecisionEntry = {
          skillId,
          towerLevel: newTowerLevel,
          timestamp: Date.now(),
        };

        const updatedBuild: PlayerBuild = {
          ...activeBuild,
          unlockedSkillIds: newUnlockedSkillIds,
          decisionLog: [...activeBuild.decisionLog, newEntry],
          stats: computeStats(newUnlockedSkillIds),
          updatedAt: Date.now(),
        };

        const updatedBuilds = builds.map((build, i) =>
          i === activeSlot ? updatedBuild : build
        );

        set({ builds: updatedBuilds });
      },

      lockSkill: (skillId: string) => {
        const { activeSlot, builds } = get();
        const activeBuild = builds[activeSlot];
        if (!activeBuild) return;

        const unlockedSkillIds = activeBuild.unlockedSkillIds;

        // Skip if not unlocked
        if (!unlockedSkillIds.includes(skillId)) return;

        // Prevent removing base skills
        const skill = SKILL_MAP.get(skillId);
        if (!skill || skill.isBase) return;

        const unlockedSet = new Set(unlockedSkillIds);

        // Validate no dependents are still unlocked
        if (!canRemove(skillId, unlockedSet)) return;

        const newUnlockedSkillIds = unlockedSkillIds.filter(
          (id) => id !== skillId
        );

        // Remove from decision log and re-index towerLevel
        const newDecisionLog = activeBuild.decisionLog
          .filter((entry) => entry.skillId !== skillId)
          .map((entry, i) => ({ ...entry, towerLevel: i + 1 }));

        const updatedBuild: PlayerBuild = {
          ...activeBuild,
          unlockedSkillIds: newUnlockedSkillIds,
          decisionLog: newDecisionLog,
          stats: computeStats(newUnlockedSkillIds),
          updatedAt: Date.now(),
        };

        const updatedBuilds = builds.map((build, i) =>
          i === activeSlot ? updatedBuild : build
        );

        set({ builds: updatedBuilds });
      },

      resetBuild: (index: number) => {
        const builds = get().builds;
        const existingBuild = builds[index];
        const preservedName = existingBuild?.name;

        const freshBuild = createDefaultBuild(index);
        const resetBuild: PlayerBuild = preservedName
          ? { ...freshBuild, name: preservedName }
          : freshBuild;

        const updatedBuilds = builds.map((build, i) =>
          i === index ? resetBuild : build
        );

        set({ builds: updatedBuilds });
      },

      setHoveredSkill: (skillId: string | null) => {
        set({ hoveredSkillId: skillId });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => {
        // Guard against SSR — localStorage is not available on the server
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return window.localStorage;
      }),
      // Only persist the build data — exclude transient UI state
      partialize: (state) => ({
        activeSlot: state.activeSlot,
        builds: state.builds,
      }),
      // Custom merge: validate stored data, fall back to defaults if invalid
      merge: (persistedState, currentState) => {
        const validated = validateStoredState(persistedState);
        if (!validated) {
          // Stored state is corrupt or incompatible — start fresh
          return currentState;
        }
        return {
          ...currentState,
          activeSlot: validated.activeSlot,
          builds: validated.builds,
        };
      },
      // Skip automatic hydration to avoid SSR mismatch in Next.js
      skipHydration: true,
    }
  )
);

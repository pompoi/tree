"use client";

import { useMemo } from "react";
import { useBuildStore } from "@/stores/build-store";
import { canUnlock } from "@/lib/graph-utils";
import { SKILL_MAP } from "@/data/skills";
import type { Skill, Branch } from "@/types/skill";

const BRANCH_COLORS: Record<Branch, string> = {
  attack: "#ef4444",
  movement: "#06b6d4",
  defend: "#22c55e",
};

interface ConfirmButtonProps {
  skill: Skill | null;
}

export function ConfirmButton({ skill }: ConfirmButtonProps) {
  const builds = useBuildStore((s) => s.builds);
  const activeSlot = useBuildStore((s) => s.activeSlot);
  const unlockSkill = useBuildStore((s) => s.unlockSkill);

  const activeBuild = builds[activeSlot];
  const unlockedSet = useMemo(
    () => new Set(activeBuild?.unlockedSkillIds ?? []),
    [activeBuild?.unlockedSkillIds]
  );

  if (!skill) return null;

  const isAlreadyUnlocked = unlockedSet.has(skill.id);
  const isBase = skill.isBase;
  const canBeUnlocked = canUnlock(skill.id, unlockedSet);

  const missingPrereqs = skill.prerequisites.filter((pid) => !unlockedSet.has(pid));
  const missingNames = missingPrereqs
    .map((pid) => SKILL_MAP.get(pid)?.name ?? pid)
    .join(", ");

  if (isBase || isAlreadyUnlocked) {
    return (
      <div className="px-4 py-2 text-center">
        <span className="text-xs text-white/40 italic">
          {isBase ? "Base skill (always available)" : "Already confirmed"}
        </span>
      </div>
    );
  }

  const branchColor = BRANCH_COLORS[skill.branch];

  return (
    <div className="px-4 py-3 flex flex-col gap-2">
      {!canBeUnlocked && missingPrereqs.length > 0 && (
        <div className="text-[10px] text-yellow-400/70 text-center">
          Requires: {missingNames}
        </div>
      )}
      <button
        onClick={() => unlockSkill(skill.id)}
        disabled={!canBeUnlocked}
        className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all ${
          canBeUnlocked
            ? "text-white hover:brightness-110 active:scale-[0.98]"
            : "text-white/30 bg-white/5 cursor-not-allowed"
        }`}
        style={
          canBeUnlocked
            ? {
                background: `linear-gradient(135deg, ${branchColor}cc, ${branchColor})`,
                boxShadow: `0 0 20px ${branchColor}30`,
              }
            : undefined
        }
      >
        {canBeUnlocked ? `Confirm ${skill.name}` : "Prerequisites Not Met"}
      </button>
    </div>
  );
}

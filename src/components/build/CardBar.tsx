"use client";

import { useMemo } from "react";
import { useBuildStore } from "@/stores/build-store";
import { SKILL_MAP, SKILLS } from "@/data/skills";
import { SkillCard } from "@/components/skill-card/SkillCard";

const BASE_SKILLS = SKILLS.filter((s) => s.isBase);

export function CardBar() {
  const activeSlot = useBuildStore((s) => s.activeSlot);
  const builds = useBuildStore((s) => s.builds);
  const activeBuild = builds[activeSlot];

  // Get selected (non-base) skills in decision log order
  const selectedSkills = useMemo(() => {
    if (!activeBuild) return [];
    return activeBuild.decisionLog
      .map((entry) => SKILL_MAP.get(entry.skillId))
      .filter((skill) => skill && !skill.isBase)
      .filter(Boolean);
  }, [activeBuild]);

  return (
    <div className="h-40 bg-gray-950 border-t border-white/10 hidden md:flex items-center px-4 gap-3 overflow-x-auto flex-shrink-0">
      {/* Left: Base skills */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest mr-1 vertical-label">
          BASE
        </span>
        {BASE_SKILLS.map((skill) => (
          <SkillCard key={skill.id} skill={skill} compact />
        ))}
      </div>

      {/* Divider */}
      {selectedSkills.length > 0 && (
        <div className="w-px h-24 bg-white/10 flex-shrink-0" />
      )}

      {/* Right: Selected skills in decision log order */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {selectedSkills.map((skill) => (
          <SkillCard key={skill!.id} skill={skill!} compact />
        ))}
      </div>

      {/* Empty state */}
      {selectedSkills.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-xs text-white/20 italic">
            Click available nodes on the tree to add skills
          </span>
        </div>
      )}
    </div>
  );
}

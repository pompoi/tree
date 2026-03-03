"use client";

import { useMemo } from "react";
import { useBuildStore } from "@/stores/build-store";
import { SKILL_MAP, SKILLS } from "@/data/skills";
import { HEX_PATTERN_MAP } from "@/data/hex-patterns";
import { HexCardFull } from "@/components/hex-card/HexCardFull";
import type { Skill } from "@/types/skill";

const BASE_SKILLS = SKILLS.filter((s) => s.isBase);

interface CardBarProps {
  onPreviewSkill: (skill: Skill | null) => void;
}

export function CardBar({ onPreviewSkill }: CardBarProps) {
  const activeSlot = useBuildStore((s) => s.activeSlot);
  const builds = useBuildStore((s) => s.builds);
  const activeBuild = builds[activeSlot];

  const selectedSkills = useMemo(() => {
    if (!activeBuild) return [];
    return activeBuild.decisionLog
      .map((entry) => SKILL_MAP.get(entry.skillId))
      .filter((skill): skill is Skill => skill != null && !skill.isBase);
  }, [activeBuild]);

  const allCards = useMemo(() => [...BASE_SKILLS, ...selectedSkills], [selectedSkills]);

  return (
    <div className="h-44 bg-gray-950 border-t border-white/10 flex items-center px-3 gap-2 overflow-x-auto flex-shrink-0">
      {allCards.length > 0 ? (
        allCards.map((skill) => {
          const pattern = HEX_PATTERN_MAP.get(skill.id);
          if (!pattern) return null;
          return (
            <div
              key={skill.id}
              className="flex-shrink-0 transition-transform hover:scale-[1.04] cursor-pointer"
              style={{ transform: "scale(0.45)", transformOrigin: "center" }}
              onMouseEnter={() => onPreviewSkill(skill)}
              onMouseLeave={() => onPreviewSkill(null)}
              onClick={() => onPreviewSkill(skill)}
            >
              <HexCardFull skill={skill} pattern={pattern} animate={false} />
            </div>
          );
        })
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-xs text-white/20 italic">
            Click available nodes on the tree to add skills
          </span>
        </div>
      )}
    </div>
  );
}

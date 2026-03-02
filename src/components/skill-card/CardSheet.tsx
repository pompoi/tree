"use client";

import { useMemo } from "react";
import { SKILL_MAP } from "@/data/skills";
import { SkillCard } from "./SkillCard";
import type { Skill, Tier, Branch } from "@/types/skill";

// Sort order for tiers and branches
const TIER_ORDER: Tier[] = [0, 1, 2, 3];
const BRANCH_ORDER: Branch[] = ["attack", "movement", "defend"];

interface CardSheetProps {
  unlockedSkillIds: string[];
}

export function CardSheet({ unlockedSkillIds }: CardSheetProps) {
  const sortedSkills = useMemo(() => {
    const skills: Skill[] = [];

    for (const id of unlockedSkillIds) {
      const skill = SKILL_MAP.get(id);
      if (skill) skills.push(skill);
    }

    // Sort by tier, then by branch
    skills.sort((a, b) => {
      const tierDiff = TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier);
      if (tierDiff !== 0) return tierDiff;
      return (
        BRANCH_ORDER.indexOf(a.branch) - BRANCH_ORDER.indexOf(b.branch)
      );
    });

    return skills;
  }, [unlockedSkillIds]);

  return (
    <div className="card-sheet-grid">
      {sortedSkills.map((skill) => (
        <div key={skill.id} className="card-sheet-cell">
          <SkillCard skill={skill} />
        </div>
      ))}
    </div>
  );
}

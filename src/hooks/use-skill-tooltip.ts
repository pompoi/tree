import { useState, useCallback } from "react";
import type { Skill } from "@/types/skill";

interface TooltipState {
  tooltipSkill: Skill | null;
  tooltipPosition: { x: number; y: number };
  showTooltip: (skill: Skill, x: number, y: number) => void;
  hideTooltip: () => void;
}

export function useSkillTooltip(): TooltipState {
  const [tooltipSkill, setTooltipSkill] = useState<Skill | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const showTooltip = useCallback((skill: Skill, x: number, y: number) => {
    setTooltipSkill(skill);
    setTooltipPosition({ x, y });
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltipSkill(null);
  }, []);

  return { tooltipSkill, tooltipPosition, showTooltip, hideTooltip };
}

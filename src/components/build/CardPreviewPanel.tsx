"use client";

import { useMemo } from "react";
import { HEX_PATTERN_MAP } from "@/data/hex-patterns";
import { HexCardFull } from "@/components/hex-card/HexCardFull";
import type { Skill } from "@/types/skill";

interface CardPreviewPanelProps {
  skill: Skill | null;
}

export function CardPreviewPanel({ skill }: CardPreviewPanelProps) {
  const pattern = useMemo(
    () => (skill ? HEX_PATTERN_MAP.get(skill.id) ?? null : null),
    [skill]
  );

  if (!skill || !pattern) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">
        Hover a card to preview
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col overflow-auto">
      <div className="flex justify-center p-3 flex-shrink-0">
        <HexCardFull skill={skill} pattern={pattern} animate />
      </div>
    </div>
  );
}

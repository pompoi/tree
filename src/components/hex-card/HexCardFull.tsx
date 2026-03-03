"use client";

import type { Skill, Branch, Tier } from "@/types/skill";
import type { HexCardPattern } from "@/types/hex-card";
import { SKILL_MAP } from "@/data/skills";
import { HexCardVisualization } from "./HexCardVisualization";

const BRANCH_COLORS: Record<Branch, string> = {
  attack: "#ef4444",
  movement: "#06b6d4",
  defend: "#22c55e",
};

const BRANCH_GRADIENT_FROM: Record<Branch, string> = {
  attack: "#991b1b",
  movement: "#164e63",
  defend: "#14532d",
};

const BRANCH_GRADIENT_TO: Record<Branch, string> = {
  attack: "#dc2626",
  movement: "#0891b2",
  defend: "#16a34a",
};

const BRANCH_ICONS: Record<Branch, string> = {
  attack: "\u2694",
  movement: "\u26A1",
  defend: "\u{1F6E1}",
};

const BRANCH_LABELS: Record<Branch, string> = {
  attack: "ATK",
  movement: "MOV",
  defend: "DEF",
};

const TIER_BADGES: Record<Tier, string> = {
  0: "\u2605",
  1: "I",
  2: "II",
  3: "III",
};

const ACTION_TYPE_LABELS: Record<string, string> = {
  melee: "Melee",
  ranged: "Ranged",
  move: "Move",
  dodge: "Dodge",
  passive: "Passive",
};

interface HexCardFullProps {
  skill: Skill;
  pattern: HexCardPattern;
  animate?: boolean;
}

export function HexCardFull({
  skill,
  pattern,
  animate = true,
}: HexCardFullProps) {
  const branchColor = BRANCH_COLORS[skill.branch];
  const gradientFrom = BRANCH_GRADIENT_FROM[skill.branch];
  const gradientTo = BRANCH_GRADIENT_TO[skill.branch];
  const branchIcon = BRANCH_ICONS[skill.branch];
  const tierBadge = TIER_BADGES[skill.tier];

  const prerequisiteNames = skill.prerequisites
    .map((id) => SKILL_MAP.get(id)?.name ?? id)
    .filter(Boolean);

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden border border-white/15 shadow-2xl"
      style={{
        width: 240,
        height: 360,
        background: "#111827",
      }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 flex items-center justify-between flex-shrink-0"
        style={{
          background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
        }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-base flex-shrink-0">{branchIcon}</span>
          <span className="text-xs font-bold text-white truncate">
            {skill.name}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-[9px] font-bold text-white/70 uppercase tracking-wider">
            {BRANCH_LABELS[skill.branch]}
          </span>
          <span className="text-[10px] font-bold text-white/80 bg-black/20 px-1.5 py-0.5 rounded">
            {tierBadge}
          </span>
        </div>
      </div>

      {/* Hex Visualization */}
      <div
        className="flex-shrink-0 flex items-center justify-center px-2"
        style={{ height: 150, background: "rgba(0,0,0,0.3)" }}
      >
        <HexCardVisualization
          pattern={pattern}
          branch={skill.branch}
          animate={animate}
        />
      </div>

      {/* Note */}
      {pattern.note && (
        <div
          className="px-3 py-1 text-center flex-shrink-0"
          style={{ borderTop: `1px solid ${branchColor}30` }}
        >
          <span
            className="text-[9px] font-medium italic"
            style={{ color: branchColor }}
          >
            {pattern.note}
          </span>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 px-3 py-1.5 flex flex-col gap-1 overflow-hidden">
        {/* Action & Range row */}
        <div className="flex items-center gap-2 text-[10px] text-white/60">
          <span className="bg-white/10 px-1.5 py-0.5 rounded">
            {ACTION_TYPE_LABELS[skill.actionType]}
          </span>
          {skill.hexRange > 0 && (
            <span className="bg-white/10 px-1.5 py-0.5 rounded">
              Range: {skill.hexRange} hex
            </span>
          )}
          {skill.cooldown > 0 && (
            <span className="bg-white/10 px-1.5 py-0.5 rounded text-yellow-400/80">
              CD: {skill.cooldown}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-[9px] text-white/70 leading-relaxed flex-1">
          {skill.description}
        </p>

        {/* Interaction notes */}
        {skill.interactionNotes && (
          <p className="text-[8px] text-white/40 leading-relaxed italic">
            {skill.interactionNotes}
          </p>
        )}
      </div>

      {/* Footer: Prerequisites */}
      <div className="px-3 py-1.5 border-t border-white/10 flex-shrink-0">
        {prerequisiteNames.length > 0 ? (
          <div className="text-[9px] text-white/40">
            <span className="font-semibold text-white/50">Requires: </span>
            {prerequisiteNames.join(", ")}
          </div>
        ) : (
          <div className="text-[9px] text-white/30 italic">Base skill</div>
        )}
      </div>
    </div>
  );
}

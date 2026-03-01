import type { Skill, Branch, Tier } from "@/types/skill";
import { SKILL_MAP } from "@/data/skills";

// ─── Branch styling ──────────────────────────────────────────────────────────

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

// ─── Component ───────────────────────────────────────────────────────────────

interface SkillCardProps {
  skill: Skill;
  compact?: boolean;
}

export function SkillCard({ skill, compact = false }: SkillCardProps) {
  const branchColor = BRANCH_COLORS[skill.branch];
  const gradientFrom = BRANCH_GRADIENT_FROM[skill.branch];
  const gradientTo = BRANCH_GRADIENT_TO[skill.branch];
  const branchIcon = BRANCH_ICONS[skill.branch];
  const tierBadge = TIER_BADGES[skill.tier];

  const prerequisiteNames = skill.prerequisites
    .map((id) => SKILL_MAP.get(id)?.name ?? id)
    .filter(Boolean);

  if (compact) {
    return (
      <div
        className="flex flex-col rounded-lg overflow-hidden border border-white/10 bg-gray-900 flex-shrink-0"
        style={{ width: 100, height: 140 }}
      >
        {/* Color stripe */}
        <div
          className="h-2 w-full flex-shrink-0"
          style={{ background: branchColor }}
        />
        {/* Content */}
        <div className="flex flex-col items-center justify-center flex-1 p-1.5 gap-0.5">
          <span
            className="text-[9px] font-bold text-white/60 tracking-wider uppercase"
            style={{ color: branchColor }}
          >
            {tierBadge}
          </span>
          <span className="text-[10px] font-semibold text-white text-center leading-tight">
            {skill.name}
          </span>
          <span className="text-[8px] text-white/40 mt-auto">
            {ACTION_TYPE_LABELS[skill.actionType]}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden border border-white/15 shadow-2xl"
      style={{
        width: 200,
        height: 280,
        aspectRatio: "2.5 / 3.5",
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
        <span className="text-[10px] font-bold text-white/80 bg-black/20 px-1.5 py-0.5 rounded flex-shrink-0">
          {tierBadge}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 px-3 py-2 flex flex-col gap-1.5 overflow-hidden">
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
        </div>

        {/* Description */}
        <p className="text-[10px] text-white/80 leading-relaxed flex-1">
          {skill.description}
        </p>

        {/* Stat bonus */}
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-white/50">Stat:</span>
          <span className="font-semibold" style={{ color: branchColor }}>
            +{skill.statBonusAmount} {skill.statBonus}
          </span>
        </div>

        {/* Cooldown */}
        {skill.cooldown > 0 && (
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-white/50">Cooldown:</span>
            <span className="text-yellow-400/80">{skill.cooldown} round{skill.cooldown > 1 ? "s" : ""}</span>
          </div>
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

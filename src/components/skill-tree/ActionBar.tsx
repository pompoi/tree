"use client";

import { useState } from "react";
import { SKILL_MAP } from "@/data/skills";
import { HEX_PATTERN_MAP } from "@/data/hex-patterns";
import { HexCardFull } from "@/components/hex-card/HexCardFull";
import { useBuildStore } from "@/stores/build-store";
import type { Branch } from "@/types/skill";

const BRANCH_COLORS: Record<Branch, string> = {
  attack: "#ef4444",
  movement: "#22c55e",
  defend: "#06b6d4",
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

const TIER_BADGES: Record<number, string> = {
  0: "\u2605",
  1: "I",
  2: "II",
  3: "III",
};

// Maps base skill → its passive boost skill
const BASE_TO_BOOST: Record<string, { id: string; label: string }> = {
  "melee-attack": { id: "sharpen", label: "+1 Damage (Sharpen)" },
  "move": { id: "swift-feet", label: "+1 Hex (Swift Feet)" },
  "defend": { id: "iron-skin", label: "+1 Block (Iron Skin)" },
};

const TARGET_COLS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
const TARGET_ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

interface ActionBarProps {
  mode: "build" | "play";
}

export function ActionBar({ mode }: ActionBarProps) {
  const [expanded, setExpanded] = useState(false);

  const selectedSkillId = useBuildStore((s) => s.selectedSkillId);
  const confirmedSkillIds = useBuildStore((s) => s.confirmedSkillIds);
  const setConfirmedSkills = useBuildStore((s) => s.setConfirmedSkills);
  const targetHex = useBuildStore((s) => s.targetHex);
  const setTargetHex = useBuildStore((s) => s.setTargetHex);
  const resetPlayState = useBuildStore((s) => s.resetPlayState);

  const builds = useBuildStore((s) => s.builds);
  const activeSlot = useBuildStore((s) => s.activeSlot);
  const unlockedSet = new Set(builds[activeSlot]?.unlockedSkillIds ?? []);

  const isConfirmed = confirmedSkillIds.length > 0;
  const skill = selectedSkillId ? SKILL_MAP.get(selectedSkillId) : undefined;
  const pattern = selectedSkillId
    ? HEX_PATTERN_MAP.get(selectedSkillId)
    : undefined;

  // Boost label for base skills
  const boostLabel = skill
    ? (() => {
        const boost = BASE_TO_BOOST[skill.id];
        if (!boost) return undefined;
        return unlockedSet.has(boost.id) ? boost.label : undefined;
      })()
    : undefined;

  // Nothing selected — hide bar
  if (!skill) {
    return null;
  }

  const branchColor = BRANCH_COLORS[skill.branch];
  const hasTarget = targetHex !== null && targetHex.col !== "" && targetHex.row > 0;
  const canConfirm = mode !== "play" || hasTarget;

  const handleConfirm = () => {
    if (!canConfirm) return;
    if (isConfirmed) {
      resetPlayState();
      setExpanded(false);
    } else {
      const chain = getPrereqChainIds(skill.id);
      chain.push(skill.id);
      setConfirmedSkills(chain);
    }
  };

  return (
    <>
      {/* Floating Confirm / Reset button — above everything */}
      {mode === "play" && (
        <button
          onClick={handleConfirm}
          disabled={!canConfirm && !isConfirmed}
          className={`fixed left-1/2 -translate-x-1/2 z-40 px-8 py-3 rounded-full text-sm font-bold tracking-wide transition-all ${
            isConfirmed
              ? "bg-red-500/90 hover:bg-red-500 text-white shadow-lg shadow-red-500/30"
              : canConfirm
                ? "text-white shadow-lg"
                : "text-white/40 shadow-lg cursor-not-allowed"
          }`}
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)",
            ...(isConfirmed
              ? {}
              : {
                  background: canConfirm ? branchColor : `${branchColor}40`,
                  boxShadow: canConfirm
                    ? `0 4px 20px ${branchColor}50`
                    : "none",
                }),
          }}
        >
          {isConfirmed ? "RESET" : hasTarget ? `CONFIRM → ${targetHex!.col}${targetHex!.row}` : "CONFIRM"}
        </button>
      )}

      <div
        className="bg-gray-950 border-t border-white/10"
        style={{ borderTopColor: `${branchColor}40` }}
      >
        {/* Expanded card area */}
        {expanded && (
          <div
            className="action-bar-card-open overflow-y-auto"
            style={{ maxHeight: "65dvh" }}
          >
            <div className="relative p-3 flex items-center justify-center">
              <button
                onClick={() => setExpanded(false)}
                className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white"
              >
                ✕
              </button>
              {pattern && (
                <HexCardFull
                  skill={skill}
                  pattern={pattern}
                  animate
                  boostLabel={boostLabel}
                />
              )}
            </div>
          </div>
        )}

        {/* Collapsed action bar */}
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Branch color accent */}
          <div
            className="w-1 self-stretch rounded-full flex-shrink-0"
            style={{ background: branchColor }}
          />

          {/* Skill info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base flex-shrink-0">
                {BRANCH_ICONS[skill.branch]}
              </span>
              <span
                className="text-sm font-bold truncate"
                style={{ color: isConfirmed ? "#4ade80" : "#ffffff" }}
              >
                {isConfirmed
                  ? `CONFIRMED: ${skill.name}${targetHex ? ` → ${targetHex.col}${targetHex.row}` : ""}`
                  : skill.name}
              </span>
              <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider flex-shrink-0">
                {BRANCH_LABELS[skill.branch]} {TIER_BADGES[skill.tier]}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-white/40">
              {skill.hexRange > 0 && <span>Range: {skill.hexRange}</span>}
              {skill.statBonusAmount > 0 && (
                <span>
                  +{skill.statBonusAmount} {skill.statBonus}
                </span>
              )}
            </div>
          </div>

          {/* Info expand button */}
          {!isConfirmed && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/50 hover:text-white text-sm flex-shrink-0"
            >
              {expanded ? "▾" : "ⓘ"}
            </button>
          )}
        </div>

        {/* Target hex picker — Play mode only, before confirm */}
        {mode === "play" && !isConfirmed && (
          <div className="px-4 pb-3 flex flex-col gap-2">
            <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">
              Target
            </span>
            {/* Letter row */}
            <div className="flex gap-1">
              {TARGET_COLS.map((col) => (
                <button
                  key={col}
                  onClick={() =>
                    setTargetHex({
                      col,
                      row: targetHex?.row ?? 0,
                    })
                  }
                  className="flex-1 py-1.5 rounded text-xs font-bold transition-colors"
                  style={{
                    background:
                      targetHex?.col === col ? branchColor : "rgba(255,255,255,0.08)",
                    color:
                      targetHex?.col === col ? "#ffffff" : "rgba(255,255,255,0.5)",
                  }}
                >
                  {col}
                </button>
              ))}
            </div>
            {/* Number row */}
            <div className="flex gap-1">
              {TARGET_ROWS.map((row) => (
                <button
                  key={row}
                  onClick={() =>
                    setTargetHex({
                      col: targetHex?.col ?? "",
                      row,
                    })
                  }
                  className="flex-1 py-1.5 rounded text-xs font-bold transition-colors"
                  style={{
                    background:
                      targetHex?.row === row ? branchColor : "rgba(255,255,255,0.08)",
                    color:
                      targetHex?.row === row ? "#ffffff" : "rgba(255,255,255,0.5)",
                  }}
                >
                  {row}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Simple prereq chain walker (mirrors getPrereqChain in UnifiedSkillGraph)
function getPrereqChainIds(skillId: string): string[] {
  const chain: string[] = [];
  const visited = new Set<string>();
  function walk(id: string) {
    const skill = SKILL_MAP.get(id);
    if (!skill) return;
    for (const pid of skill.prerequisites) {
      if (!visited.has(pid)) {
        visited.add(pid);
        chain.push(pid);
        walk(pid);
      }
    }
  }
  walk(skillId);
  return chain;
}

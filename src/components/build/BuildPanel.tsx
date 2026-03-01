"use client";

import { useState, useCallback } from "react";
import { useBuildStore } from "@/stores/build-store";
import { SKILL_MAP } from "@/data/skills";
import { Modal } from "@/components/ui/Modal";
import Link from "next/link";
import type { Branch } from "@/types/skill";

// ─── Constants ───────────────────────────────────────────────────────────────

const SLOT_COUNT = 5;

const BRANCH_COLORS: Record<Branch, string> = {
  attack: "#ef4444",
  movement: "#06b6d4",
  defend: "#22c55e",
};

const TIER_BADGES: Record<number, string> = {
  0: "\u2605",
  1: "I",
  2: "II",
  3: "III",
};

// ─── BuildSlotPicker ─────────────────────────────────────────────────────────

function BuildSlotPicker() {
  const activeSlot = useBuildStore((s) => s.activeSlot);
  const builds = useBuildStore((s) => s.builds);
  const setActiveSlot = useBuildStore((s) => s.setActiveSlot);

  return (
    <div className="flex gap-1.5">
      {Array.from({ length: SLOT_COUNT }, (_, i) => {
        const build = builds[i];
        const isActive = activeSlot === i;
        const hasSkills =
          (build?.unlockedSkillIds.length ?? 4) > 4; // more than base skills

        return (
          <button
            key={i}
            onClick={() => setActiveSlot(i)}
            className={`
              flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all
              ${
                isActive
                  ? "bg-white/15 text-white ring-1 ring-white/30"
                  : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
              }
            `}
          >
            {i + 1}
            {hasSkills && !isActive && (
              <span className="ml-0.5 inline-block w-1 h-1 rounded-full bg-cyan-400 align-middle" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── BuildNameEditor ─────────────────────────────────────────────────────────

function BuildNameEditor() {
  const activeSlot = useBuildStore((s) => s.activeSlot);
  const builds = useBuildStore((s) => s.builds);
  const renameBuild = useBuildStore((s) => s.renameBuild);

  const activeBuild = builds[activeSlot];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const startEditing = () => {
    setDraft(activeBuild?.name ?? "");
    setEditing(true);
  };

  const commitEdit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== activeBuild?.name) {
      renameBuild(activeSlot, trimmed);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitEdit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commitEdit();
          if (e.key === "Escape") setEditing(false);
        }}
        className="w-full bg-white/5 border border-white/20 rounded-lg px-2 py-1 text-sm text-white font-semibold outline-none focus:border-white/40"
        maxLength={30}
      />
    );
  }

  return (
    <button
      onClick={startEditing}
      className="w-full text-left text-sm font-semibold text-white hover:text-white/80 truncate px-1"
      title="Click to rename"
    >
      {activeBuild?.name ?? "Build"}
      <span className="ml-1.5 text-white/30 text-xs">&#9998;</span>
    </button>
  );
}

// ─── DecisionLog ─────────────────────────────────────────────────────────────

function DecisionLog() {
  const activeSlot = useBuildStore((s) => s.activeSlot);
  const builds = useBuildStore((s) => s.builds);
  const activeBuild = builds[activeSlot];

  if (!activeBuild) return null;

  // Filter out base skills for the decision log display
  const nonBaseEntries = activeBuild.decisionLog.filter((entry) => {
    const skill = SKILL_MAP.get(entry.skillId);
    return skill && !skill.isBase;
  });

  if (nonBaseEntries.length === 0) {
    return (
      <p className="text-xs text-white/30 italic px-1">
        No skills selected yet. Click available nodes on the tree.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {nonBaseEntries.map((entry, index) => {
        const skill = SKILL_MAP.get(entry.skillId);
        if (!skill) return null;
        const branchColor = BRANCH_COLORS[skill.branch];

        return (
          <div
            key={entry.skillId}
            className="flex items-center gap-2 px-2 py-1 rounded bg-white/5"
          >
            <span className="text-[10px] text-white/30 font-mono w-4 text-right flex-shrink-0">
              {index + 1}
            </span>
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: branchColor }}
            />
            <span className="text-xs text-white/80 truncate flex-1">
              {skill.name}
            </span>
            <span className="text-[10px] text-white/30 flex-shrink-0">
              {TIER_BADGES[skill.tier]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── BuildPanel ──────────────────────────────────────────────────────────────

export function BuildPanel() {
  const activeSlot = useBuildStore((s) => s.activeSlot);
  const builds = useBuildStore((s) => s.builds);
  const resetBuild = useBuildStore((s) => s.resetBuild);

  const activeBuild = builds[activeSlot];
  const stats = activeBuild?.stats ?? { damage: 0, movement: 0, reduction: 0 };

  const [showResetModal, setShowResetModal] = useState(false);

  const handleReset = useCallback(() => {
    resetBuild(activeSlot);
  }, [resetBuild, activeSlot]);

  return (
    <aside className="w-72 flex-shrink-0 bg-gray-950 border-l border-white/10 flex flex-col h-full overflow-hidden">
      <div className="flex flex-col gap-4 p-4 flex-1 overflow-y-auto">
        {/* Section: Slot picker */}
        <div>
          <h3 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">
            Build Slots
          </h3>
          <BuildSlotPicker />
        </div>

        {/* Section: Name editor */}
        <div>
          <BuildNameEditor />
        </div>

        {/* Section: Stats */}
        <div>
          <h3 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">
            Stats
          </h3>
          <div className="flex gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-red-400 font-bold">ATK</span>
              <span className="text-white/70">+{stats.damage}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-cyan-400 font-bold">MOV</span>
              <span className="text-white/70">+{stats.movement}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-green-400 font-bold">DEF</span>
              <span className="text-white/70">+{stats.reduction}</span>
            </div>
          </div>
        </div>

        {/* Section: Decision Log */}
        <div className="flex-1 min-h-0">
          <h3 className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2">
            Decision Log
          </h3>
          <DecisionLog />
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-white/10 flex flex-col gap-2">
        <button
          onClick={() => setShowResetModal(true)}
          className="w-full py-2 text-xs font-semibold text-red-400 bg-red-400/10 hover:bg-red-400/20 rounded-lg transition-colors"
        >
          Reset Build
        </button>
        <Link
          href="/print"
          className="w-full py-2 text-xs font-semibold text-center text-white/60 bg-white/5 hover:bg-white/10 rounded-lg transition-colors block"
        >
          Print Cards
        </Link>
      </div>

      <Modal
        open={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleReset}
        title="Reset Build"
        message={`This will reset "${activeBuild?.name ?? "this build"}" to only base skills. This cannot be undone.`}
        confirmLabel="Reset"
      />
    </aside>
  );
}

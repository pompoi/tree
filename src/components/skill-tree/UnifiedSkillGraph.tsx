"use client";

import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import { SKILLS, SKILL_MAP } from "@/data/skills";
import { HEX_PATTERN_MAP } from "@/data/hex-patterns";
import { canUnlock } from "@/lib/graph-utils";
import {
  SKILL_POSITIONS,
  HEX_R,
  axialToPixel,
  hexPoints,
  getSharedEdge,
} from "@/lib/hex-grid-layout";
import { HexCardFull } from "@/components/hex-card/HexCardFull";
import { useBuildStore } from "@/stores/build-store";
import type { Skill, Branch } from "@/types/skill";

// ─── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_VB = { x: -400, y: -400, w: 800, h: 800 };
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const PAN_THRESHOLD = 5;

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


// ─── YOMI matchup maps ──────────────────────────────────────────────────────
// Default triangle: ATK > MOV > DEF > ATK
// Overrides are derived from each skill's interactionNotes.
//
// ATK (T0-T2 base): melee-attack, power-hit, quick-jab, feint, lunge,
//      combo-strike, feint-strike
// MOV (T0-T2 base): move, flanking, dash, pivot, charge, withdraw, shadow-step
// DEF (T0-T2 base): defend, parry, brace, sidestep, riposte, deflect, anticipate

const ALL_MOV = ["move", "flanking", "dash", "pivot", "charge", "withdraw", "shadow-step"];
const ALL_DEF = ["defend", "parry", "brace", "sidestep", "riposte", "deflect", "anticipate"];
const ALL_ATK = ["melee-attack", "power-hit", "quick-jab", "feint", "lunge", "combo-strike", "feint-strike"];

// Standard ATK that MOV loses to (excluding feint/feint-strike neutral, power-hit reversed)
const STD_ATK_VS_MOV = ["melee-attack", "quick-jab", "lunge", "combo-strike"];

const SKILL_BEATS: Record<string, string[]> = {
  // ─── T0-T1 Attack ───
  "melee-attack": [...ALL_MOV, "feint"],
  "power-hit":    ["parry", "riposte", "feint"],                       // breaks Parry/Riposte; loses to MOV
  "quick-jab":    [...ALL_MOV, "power-hit", "feint", "sidestep"],      // speed beats Power Hit; resolves before Sidestep
  "feint":        [...ALL_DEF, "pivot"],                                // beats all DEF; Pivot notes: "Loses to Feint"
  "lunge":        [...ALL_MOV, "feint"],
  "combo-strike": [...ALL_MOV, "feint"],
  "feint-strike": [...ALL_DEF, "feint"],                                // upgraded Feint: beats all DEF + Feint

  // ─── T0-T1 Movement ───
  "move":         [...ALL_DEF, "power-hit"],
  "flanking":     ALL_DEF.filter(s => s !== "brace").concat(["power-hit"]),
  "dash":         [...ALL_DEF, "power-hit"],
  "pivot":        [...ALL_DEF, "flanking", "feint-strike", "power-hit"],
  "charge":       ALL_DEF.filter(s => s !== "brace" && s !== "sidestep").concat(["power-hit"]),
  "withdraw":     [...ALL_DEF, "power-hit"],
  "shadow-step":  ALL_DEF.filter(s => s !== "brace" && s !== "anticipate").concat(["power-hit"]),

  // ─── T0-T1 Defend ───
  "defend":       ALL_ATK.filter(s => s !== "feint" && s !== "feint-strike"),
  "parry":        ALL_ATK.filter(s => s !== "power-hit" && s !== "feint" && s !== "feint-strike"),
  "brace":        ALL_ATK.filter(s => s !== "feint" && s !== "feint-strike").concat(["flanking", "charge", "shadow-step"]),
  "sidestep":     ALL_ATK.filter(s => s !== "quick-jab" && s !== "feint" && s !== "feint-strike").concat(["charge"]),
  "riposte":      ALL_ATK.filter(s => s !== "power-hit" && s !== "feint" && s !== "feint-strike"),
  "deflect":      ALL_ATK.filter(s => s !== "feint" && s !== "feint-strike"),
  "anticipate":   ALL_ATK.filter(s => s !== "feint" && s !== "feint-strike").concat(["shadow-step"]),

  // ─── T2 Cross-branch ───
  "counterstrike":    ["melee-attack", "quick-jab"],
  "bait-and-punish":  ["power-hit", "lunge"],
  "step-through":     ["melee-attack", "power-hit"],
  "blitz":            ["defend", "parry", "pivot"],
  "hit-and-run":      ["melee-attack", "power-hit"],
  "ambush":           ["defend", "parry"],
  "intercept":        ["flanking", "melee-attack"],
  "phaseout":         ["melee-attack", "power-hit", "quick-jab", "lunge", "combo-strike", "feint-strike"],
  "shield-advance":   ["flanking", "melee-attack"],

  // ─── T3 Attack branch ───
  "killshot":         ["parry", "riposte", "counterstrike"],
  "blinding-combo":   ["defend", "melee-attack"],
  "smoke-and-daggers":["defend", "brace", "parry"],
  "blur":             ["parry", "riposte", "counterstrike"],

  // ─── T3 Defense branch ───
  "bulwark":          ["melee-attack", "quick-jab", "lunge"],
  "iron-curtain":     ["melee-attack", "power-hit", "quick-jab", "lunge", "combo-strike"],
  "mirror-wall":      ["melee-attack", "power-hit", "flanking"],
  "repel":            ["melee-attack", "power-hit", "quick-jab"],

  // ─── T3 Movement branch ───
  "ghost-walk":       ["melee-attack", "power-hit", "lunge"],
  "juggernaut":       ["parry", "defend", "pivot"],
  "warp-strike":      ["defend", "parry", "brace"],
  "slip-away":        ["melee-attack", "power-hit"],

  // ─── T3 AD Boundary ───
  "vengeance":        ["power-hit", "lunge", "blitz"],
  "iron-feint":       ["power-hit", "lunge"],
  "flicker-stance":   ["melee-attack", "power-hit"],
  "war-dance":        ["melee-attack", "power-hit", "defend"],

  // ─── T3 AM Boundary ───
  "storm-blade":      ["defend", "parry", "pivot"],
  "hurricane":        ["defend", "parry"],
  "death-from-shadows":["defend", "parry"],
  "whiplash":         ["defend", "parry"],

  // ─── T3 DM Boundary ───
  "guardian-step":    ["melee-attack", "flanking"],
  "vanishing-guard":  ["melee-attack", "power-hit", "lunge"],
  "fortress-march":   ["melee-attack", "flanking"],
  "displacement":     ["flanking", "melee-attack", "quick-jab"],
};

const SKILL_LOSES_TO: Record<string, string[]> = {
  // ─── T0-T1 Attack ───
  "melee-attack": [
    ...ALL_DEF,
    // T2 cross-branch skills that beat melee-attack
    "counterstrike", "step-through", "hit-and-run", "intercept", "phaseout", "shield-advance",
    // T3 skills that beat melee-attack
    "blinding-combo", "smoke-and-daggers", "bulwark", "iron-curtain", "mirror-wall", "repel",
    "ghost-walk", "slip-away", "flicker-stance", "war-dance", "guardian-step", "vanishing-guard",
    "fortress-march", "displacement",
  ],
  "power-hit":    [
    ...ALL_MOV,
    ...ALL_DEF.filter(s => s !== "parry" && s !== "riposte"),
    "quick-jab",
    // T2 cross-branch that beats power-hit
    "counterstrike", "bait-and-punish", "step-through", "hit-and-run", "phaseout",
    // T3 that beats power-hit
    "bulwark", "iron-curtain", "mirror-wall", "repel", "ghost-walk", "slip-away",
    "vengeance", "iron-feint", "flicker-stance", "war-dance", "vanishing-guard",
    "guardian-step", "displacement",
  ],
  "quick-jab":    [
    ALL_DEF.filter(s => s !== "sidestep"),
    "counterstrike", "phaseout",
    "bulwark", "iron-curtain", "repel", "displacement",
  ].flat(),
  "feint":        [
    ALL_ATK.filter(s => s !== "feint"),
  ].flat(),
  "lunge":        [
    ...ALL_DEF,
    "bait-and-punish", "phaseout",
    "bulwark", "iron-curtain", "ghost-walk", "slip-away", "vengeance", "iron-feint",
    "vanishing-guard",
  ],
  "combo-strike": [
    ...ALL_DEF,
    "phaseout",
    "iron-curtain",
  ],
  "feint-strike": ["pivot", "phaseout", "iron-curtain"],

  // ─── T0-T1 Movement ───
  "move":         [...STD_ATK_VS_MOV, "bait-and-punish", "iron-feint"],
  "flanking":     [
    ...STD_ATK_VS_MOV, "brace", "pivot",
    "intercept", "shield-advance",
    "mirror-wall", "guardian-step", "fortress-march", "displacement",
  ],
  "dash":         [...STD_ATK_VS_MOV, "bait-and-punish"],
  "pivot":        [
    ...STD_ATK_VS_MOV, "feint",
    "blitz", "storm-blade", "juggernaut",
  ],
  "charge":       [
    ...STD_ATK_VS_MOV, "brace", "sidestep",
    "shield-advance", "fortress-march",
  ],
  "withdraw":     [...STD_ATK_VS_MOV],
  "shadow-step":  [...STD_ATK_VS_MOV, "brace", "anticipate"],

  // ─── T0-T1 Defend ───
  "defend":       [
    ...ALL_MOV, "feint", "feint-strike",
    "blitz", "hit-and-run", "ambush",
    "killshot", "blinding-combo", "smoke-and-daggers", "blur",
    "juggernaut", "warp-strike",
    "war-dance", "storm-blade", "hurricane", "death-from-shadows", "whiplash",
  ],
  "parry":        [
    ...ALL_MOV, "power-hit", "feint", "feint-strike",
    "blitz", "ambush",
    "killshot", "blinding-combo", "blur",
    "bulwark", "juggernaut", "warp-strike",
    "storm-blade", "hurricane", "death-from-shadows", "whiplash",
  ],
  "brace":        [
    ALL_MOV.filter(s => s !== "flanking" && s !== "charge" && s !== "shadow-step").concat(["feint", "feint-strike"]),
    "smoke-and-daggers",
    "warp-strike",
    "mirror-wall",
  ].flat(),
  "sidestep":     [
    ALL_MOV.filter(s => s !== "charge").concat(["quick-jab", "feint", "feint-strike"]),
    "killshot", "blinding-combo", "blur",
    "juggernaut", "storm-blade",
  ].flat(),
  "riposte":      [
    ...ALL_MOV, "power-hit", "feint", "feint-strike",
    "killshot", "blur",
  ],
  "deflect":      [...ALL_MOV, "feint", "feint-strike"],
  "anticipate":   [
    ALL_MOV.filter(s => s !== "shadow-step").concat(["feint", "feint-strike"]),
    "step-through", "ambush",
    "warp-strike",
    "flicker-stance",
    "phaseout", "vanishing-guard",
  ].flat(),

  // ─── T2 Cross-branch ───
  "counterstrike":    ["power-hit", "feint", "flanking", "killshot", "blur"],
  "bait-and-punish":  ["feint", "move", "dash", "flanking"],
  "step-through":     ["brace", "anticipate"],
  "blitz":            ["brace", "sidestep", "vengeance"],
  "hit-and-run":      ["brace", "flanking"],
  "ambush":           ["brace", "pivot", "anticipate"],
  "intercept":        ["feint", "power-hit"],
  "phaseout":         ["feint", "anticipate"],
  "shield-advance":   ["feint", "charge"],

  // ─── T3 Attack branch ───
  "killshot":         ["sidestep", "phaseout"],
  "blinding-combo":   ["parry", "sidestep"],
  "smoke-and-daggers":["melee-attack", "power-hit", "move", "flanking"],
  "blur":             ["brace", "sidestep"],

  // ─── T3 Defense branch ───
  "bulwark":          ["power-hit", "feint", "flanking"],
  "iron-curtain":     ["feint", "feint-strike"],
  "mirror-wall":      ["feint", "brace"],
  "repel":            ["feint", "flanking"],

  // ─── T3 Movement branch ───
  "ghost-walk":       ["anticipate"],
  "juggernaut":       ["brace", "sidestep"],
  "warp-strike":      ["brace", "anticipate"],
  "slip-away":        ["lunge", "blitz"],

  // ─── T3 AD Boundary ───
  "vengeance":        ["feint", "move", "flanking"],
  "iron-feint":       ["feint", "move", "flanking", "dash"],
  "flicker-stance":   ["brace", "anticipate"],
  "war-dance":        ["feint-strike", "flanking"],

  // ─── T3 AM Boundary ───
  "storm-blade":      ["brace", "sidestep"],
  "hurricane":        ["brace", "sidestep"],
  "death-from-shadows":["brace", "pivot"],
  "whiplash":         ["brace", "move", "flanking"],

  // ─── T3 DM Boundary ───
  "guardian-step":    ["feint", "power-hit"],
  "vanishing-guard":  ["anticipate", "feint"],
  "fortress-march":   ["feint", "charge"],
  "displacement":     ["feint", "power-hit"],
};

// Passive boost skills — hidden in Play mode, their effect shows on base skill cards
const PASSIVE_BOOST_IDS = new Set(["sharpen", "swift-feet", "iron-skin"]);

// Maps base skill → its passive boost skill
const BASE_TO_BOOST: Record<string, { id: string; label: string }> = {
  "melee-attack": { id: "sharpen", label: "+1 Damage (Sharpen)" },
  "move": { id: "swift-feet", label: "+1 Hex (Swift Feet)" },
  "defend": { id: "iron-skin", label: "+1 Block (Iron Skin)" },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Walk up the prerequisite chain and collect all ancestor IDs. */
function getPrereqChain(skillId: string): Set<string> {
  const chain = new Set<string>();
  function walk(id: string) {
    const skill = SKILL_MAP.get(id);
    if (!skill) return;
    for (const pid of skill.prerequisites) {
      if (!chain.has(pid)) {
        chain.add(pid);
        walk(pid);
      }
    }
  }
  walk(skillId);
  return chain;
}

/**
 * Collect all prerequisite edges (pairs) in the chain of a skill.
 * Returns edges as [parentId, childId] tuples.
 */
function getPrereqEdges(skillId: string): [string, string][] {
  const edges: [string, string][] = [];
  const visited = new Set<string>();

  function walk(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const skill = SKILL_MAP.get(id);
    if (!skill) return;
    for (const pid of skill.prerequisites) {
      edges.push([pid, id]);
      walk(pid);
    }
  }
  walk(skillId);
  return edges;
}

// ─── Component ──────────────────────────────────────────────────────────────

interface UnifiedSkillGraphProps {
  mode: "build" | "play";
}

export function UnifiedSkillGraph({ mode }: UnifiedSkillGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const [viewBox, setViewBox] = useState(DEFAULT_VB);
  const [isPanning, setIsPanning] = useState(false);
  const pointerDownRef = useRef(false);
  const hasPannedRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const viewBoxStartRef = useRef(DEFAULT_VB);
  const pinchStartDistRef = useRef(0);

  const [hoveredSkill, setHoveredSkill] = useState<Skill | null>(null);
  const selectedSkillId = useBuildStore((s) => s.selectedSkillId);
  const selectSkill = useBuildStore((s) => s.selectSkill);
  const confirmedSkillIds = useBuildStore((s) => s.confirmedSkillIds);
  const setConfirmedSkills = useBuildStore((s) => s.setConfirmedSkills);
  const resetPlayState = useBuildStore((s) => s.resetPlayState);
  const confirmedIds = useMemo(() => new Set(confirmedSkillIds), [confirmedSkillIds]);
  const isConfirmed = confirmedIds.size > 0;
  const [mounted, setMounted] = useState(false);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    setMounted(true);
    useBuildStore.persist.rehydrate();
  }, []);

  // Clear selection when switching modes
  useEffect(() => {
    resetPlayState();
  }, [mode, resetPlayState]);

  // Q/E keyboard rotation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "q" || e.key === "Q") {
        setRotation((r) => r - 60);
      } else if (e.key === "e" || e.key === "E") {
        setRotation((r) => r + 60);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const builds = useBuildStore((s) => s.builds);
  const activeSlot = useBuildStore((s) => s.activeSlot);
  const unlockSkill = useBuildStore((s) => s.unlockSkill);
  const lockSkill = useBuildStore((s) => s.lockSkill);

  const activeBuild = builds[activeSlot];
  const unlockedSet = useMemo(
    () => new Set(activeBuild?.unlockedSkillIds ?? []),
    [activeBuild?.unlockedSkillIds]
  );

  // The active skill for card display: hovered takes priority, then selected
  const activeSkill = hoveredSkill ?? (selectedSkillId ? SKILL_MAP.get(selectedSkillId) ?? null : null);

  // ─── Visible skills + pixel positions ──────────────────────────────
  const visibleSkills = useMemo(() => {
    const result: (Skill & { px: number; py: number })[] = [];

    for (const skill of SKILLS) {
      const pos = SKILL_POSITIONS[skill.id];
      if (!pos) continue;

      if (mode === "play") {
        // Play: only unlocked skills (base skills always shown), hide passive boosts
        if (PASSIVE_BOOST_IDS.has(skill.id)) continue;
        if (!skill.isBase && !unlockedSet.has(skill.id)) continue;
      }
      // Build: show ALL skills

      const { x, y } = axialToPixel(pos.q, pos.r);
      result.push({ ...skill, px: x, py: y });
    }
    return result;
  }, [unlockedSet, mode]);

  const visibleIds = useMemo(
    () => new Set(visibleSkills.map((s) => s.id)),
    [visibleSkills]
  );

  // ─── Highlighted IDs (prereq chain of hovered or selected) ─────────
  const highlightedIds = useMemo(() => {
    const ids = new Set<string>();
    const activeId = hoveredSkill?.id ?? selectedSkillId;
    if (activeId) {
      ids.add(activeId);
      for (const pid of getPrereqChain(activeId)) {
        ids.add(pid);
      }
    }
    return ids;
  }, [hoveredSkill, selectedSkillId]);

  // ─── Prereq edges to highlight ──────────────────────────────────────
  const highlightEdges = useMemo(() => {
    const activeId = hoveredSkill?.id ?? selectedSkillId;
    if (!activeId) return [];

    const pairs = getPrereqEdges(activeId);
    const edges: {
      x1: number; y1: number; x2: number; y2: number;
      color: string; type: "shared" | "line";
    }[] = [];

    for (const [parentId, childId] of pairs) {
      if (!visibleIds.has(parentId) || !visibleIds.has(childId)) continue;
      const parentPos = SKILL_POSITIONS[parentId];
      const childPos = SKILL_POSITIONS[childId];
      if (!parentPos || !childPos) continue;

      const childSkill = SKILL_MAP.get(childId);
      const color = childSkill ? BRANCH_COLORS[childSkill.branch] : "#ffffff";

      const shared = getSharedEdge(parentPos, childPos);
      if (shared) {
        // Adjacent: highlight the shared hex edge
        edges.push({
          x1: shared[0].x, y1: shared[0].y,
          x2: shared[1].x, y2: shared[1].y,
          color, type: "shared",
        });
      } else {
        // Non-adjacent: draw a center-to-center connection line
        const pp = axialToPixel(parentPos.q, parentPos.r);
        const cp = axialToPixel(childPos.q, childPos.r);
        edges.push({
          x1: pp.x, y1: pp.y,
          x2: cp.x, y2: cp.y,
          color, type: "line",
        });
      }
    }
    return edges;
  }, [hoveredSkill, selectedSkillId, visibleIds]);

  // ─── Advantage/disadvantage sets (YOMI highlighting) ───────────────
  const { advantageIds, disadvantageIds } = useMemo(() => {
    if (!hoveredSkill)
      return {
        advantageIds: new Set<string>(),
        disadvantageIds: new Set<string>(),
      };
    const beats = SKILL_BEATS[hoveredSkill.id] ?? [];
    const losesTo = SKILL_LOSES_TO[hoveredSkill.id] ?? [];
    const adv = new Set<string>(beats.filter((id) => visibleIds.has(id)));
    const dis = new Set<string>(losesTo.filter((id) => visibleIds.has(id)));
    return { advantageIds: adv, disadvantageIds: dis };
  }, [hoveredSkill, visibleIds]);

  // ─── YOMI advantage wedges between base skills ─────────────────────
  const advantageWedges = useMemo(() => {
    const atkPos = SKILL_POSITIONS["melee-attack"];
    const movPos = SKILL_POSITIONS["move"];
    const defPos = SKILL_POSITIONS["defend"];
    if (!atkPos || !movPos || !defPos) return [];

    const atk = axialToPixel(atkPos.q, atkPos.r);
    const mov = axialToPixel(movPos.q, movPos.r);
    const def = axialToPixel(defPos.q, defPos.r);

    const touchAM = { x: (atk.x + mov.x) / 2, y: (atk.y + mov.y) / 2 };
    const touchAD = { x: (atk.x + def.x) / 2, y: (atk.y + def.y) / 2 };
    const touchMD = { x: (mov.x + def.x) / 2, y: (mov.y + def.y) / 2 };

    const cx = (atk.x + mov.x + def.x) / 3;
    const cy = (atk.y + mov.y + def.y) / 3;

    return [
      {
        path: `M ${cx},${cy} L ${touchAM.x},${touchAM.y} L ${touchAD.x},${touchAD.y} Z`,
        color: BRANCH_COLORS.defend,
      },
      {
        path: `M ${cx},${cy} L ${touchAM.x},${touchAM.y} L ${touchMD.x},${touchMD.y} Z`,
        color: BRANCH_COLORS.attack,
      },
      {
        path: `M ${cx},${cy} L ${touchAD.x},${touchAD.y} L ${touchMD.x},${touchMD.y} Z`,
        color: BRANCH_COLORS.movement,
      },
    ];
  }, []);

  const yomiCenter = useMemo(() => {
    const atkPos = SKILL_POSITIONS["melee-attack"];
    const movPos = SKILL_POSITIONS["move"];
    const defPos = SKILL_POSITIONS["defend"];
    if (!atkPos || !movPos || !defPos) return { x: 0, y: 0 };
    const atk = axialToPixel(atkPos.q, atkPos.r);
    const mov = axialToPixel(movPos.q, movPos.r);
    const def = axialToPixel(defPos.q, defPos.r);
    return {
      x: (atk.x + mov.x + def.x) / 3,
      y: (atk.y + mov.y + def.y) / 3,
    };
  }, []);

  // ─── Handlers ─────────────────────────────────────────────────────
  const handleNodeHover = useCallback((skill: Skill) => {
    setHoveredSkill(skill);
  }, []);

  const handleNodeHoverEnd = useCallback(() => {
    setHoveredSkill(null);
  }, []);

  const handleNodeClick = useCallback(
    (skill: Skill) => {
      if (hasPannedRef.current) return;
      if (isConfirmed) return;

      if (mode === "play") {
        if (!unlockedSet.has(skill.id) && !skill.isBase) return;
        selectSkill(selectedSkillId === skill.id ? null : skill.id);
      } else {
        if (skill.isBase) return;

        if (unlockedSet.has(skill.id)) {
          // Deselect and lock
          lockSkill(skill.id);
          selectSkill(null);
        } else {
          // Unlock entire prereq chain (parents first by tier), then the skill itself
          const chain = getPrereqChain(skill.id);
          const toUnlock = [...chain, skill.id].filter(
            (id) => !unlockedSet.has(id) && !SKILL_MAP.get(id)?.isBase
          );
          toUnlock.sort((a, b) => {
            const sa = SKILL_MAP.get(a);
            const sb = SKILL_MAP.get(b);
            return (sa?.tier ?? 0) - (sb?.tier ?? 0);
          });
          for (const id of toUnlock) {
            unlockSkill(id);
          }
          selectSkill(skill.id);
        }
      }
    },
    [unlockedSet, unlockSkill, lockSkill, selectSkill, selectedSkillId, isConfirmed, mode]
  );

  const handleConfirm = useCallback(() => {
    if (isConfirmed) {
      resetPlayState();
    } else if (selectedSkillId) {
      setConfirmedSkills([selectedSkillId]);
    }
  }, [isConfirmed, selectedSkillId, setConfirmedSkills, resetPlayState]);

  // ─── Pan logic ────────────────────────────────────────────────────
  const applyPan = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return;

    const dx = clientX - panStartRef.current.x;
    const dy = clientY - panStartRef.current.y;

    if (
      !hasPannedRef.current &&
      Math.abs(dx) + Math.abs(dy) < PAN_THRESHOLD
    )
      return;
    hasPannedRef.current = true;
    setIsPanning(true);

    const rect = svg.getBoundingClientRect();
    const scaleX = viewBoxStartRef.current.w / rect.width;
    const scaleY = viewBoxStartRef.current.h / rect.height;

    setViewBox({
      ...viewBoxStartRef.current,
      x: viewBoxStartRef.current.x - dx * scaleX,
      y: viewBoxStartRef.current.y - dy * scaleY,
    });
  }, []);

  const applyZoom = useCallback((scaleFactor: number) => {
    setViewBox((prev) => {
      const newW = prev.w * scaleFactor;
      const newH = prev.h * scaleFactor;
      const currentScale = DEFAULT_VB.w / newW;
      if (currentScale < MIN_SCALE || currentScale > MAX_SCALE) return prev;
      const dw = newW - prev.w;
      const dh = newH - prev.h;
      return {
        x: prev.x - dw / 2,
        y: prev.y - dh / 2,
        w: newW,
        h: newH,
      };
    });
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault();
      applyZoom(e.deltaY > 0 ? 1.1 : 0.9);
    },
    [applyZoom]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (e.button !== 0 && e.button !== 1) return;
      pointerDownRef.current = true;
      hasPannedRef.current = false;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      viewBoxStartRef.current = viewBox;
    },
    [viewBox]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!pointerDownRef.current) return;
      applyPan(e.clientX, e.clientY);
    },
    [applyPan]
  );

  const handleMouseUp = useCallback(() => {
    pointerDownRef.current = false;
    setIsPanning(false);
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<SVGSVGElement>) => {
      if (e.touches.length === 1) {
        const t = e.touches[0];
        pointerDownRef.current = true;
        hasPannedRef.current = false;
        panStartRef.current = { x: t.clientX, y: t.clientY };
        viewBoxStartRef.current = viewBox;
      } else if (e.touches.length === 2) {
        pointerDownRef.current = false;
        setIsPanning(false);
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        pinchStartDistRef.current = Math.sqrt(dx * dx + dy * dy);
        viewBoxStartRef.current = viewBox;
      }
    },
    [viewBox]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<SVGSVGElement>) => {
      e.preventDefault();

      if (e.touches.length === 1 && pointerDownRef.current) {
        const t = e.touches[0];
        applyPan(t.clientX, t.clientY);
      } else if (e.touches.length === 2 && pinchStartDistRef.current > 0) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const scale = pinchStartDistRef.current / dist;

        const newW = viewBoxStartRef.current.w * scale;
        const newH = viewBoxStartRef.current.h * scale;
        const currentScale = DEFAULT_VB.w / newW;
        if (currentScale < MIN_SCALE || currentScale > MAX_SCALE) return;

        const dw = newW - viewBoxStartRef.current.w;
        const dh = newH - viewBoxStartRef.current.h;
        setViewBox({
          x: viewBoxStartRef.current.x - dw / 2,
          y: viewBoxStartRef.current.y - dh / 2,
          w: newW,
          h: newH,
        });
      }
    },
    [applyPan]
  );

  const handleTouchEnd = useCallback(() => {
    pointerDownRef.current = false;
    setIsPanning(false);
    pinchStartDistRef.current = 0;
  }, []);

  const handleDoubleClick = useCallback(() => {
    setViewBox(DEFAULT_VB);
  }, []);

  // ─── Card pattern and boost info for active skill ──────────────────
  const activePattern = activeSkill ? HEX_PATTERN_MAP.get(activeSkill.id) : undefined;

  // Check if the active base skill has its boost unlocked
  const activeBoostLabel = useMemo(() => {
    if (!activeSkill) return undefined;
    const boost = BASE_TO_BOOST[activeSkill.id];
    if (!boost) return undefined;
    if (unlockedSet.has(boost.id)) return boost.label;
    return undefined;
  }, [activeSkill, unlockedSet]);

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full flex flex-col md:flex-row items-stretch overflow-hidden">
      {/* SVG graph — fills available space */}
      <div className="flex-1 min-h-0 md:flex-1 md:min-h-0 min-w-0 flex items-center justify-center">
        <svg
          ref={svgRef}
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          className="w-full h-full"
          style={{
            maxHeight: "100%",
            cursor: isPanning ? "grabbing" : "default",
            touchAction: "none",
          }}
          xmlns="http://www.w3.org/2000/svg"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            handleMouseUp();
            handleNodeHoverEnd();
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onDoubleClick={handleDoubleClick}
        >
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g transform={`rotate(${rotation}, 0, 0)`} style={{ transition: "transform 0.3s ease" }}>
          {/* YOMI advantage wedges between base skills */}
          <g style={{ pointerEvents: "none" }}>
            {advantageWedges.map((wedge, i) => {
              const isActiveBranch =
                hoveredSkill !== null &&
                wedge.color === BRANCH_COLORS[hoveredSkill.branch];
              return (
                <path
                  key={`adv-${i}`}
                  d={wedge.path}
                  fill={wedge.color}
                  fillOpacity={isActiveBranch ? 0.8 : 0.5}
                  stroke={wedge.color}
                  strokeWidth={0.5}
                  strokeOpacity={0.6}
                />
              );
            })}
            <text
              x={yomiCenter.x}
              y={yomiCenter.y + 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              fontSize={6}
              fontWeight="700"
              opacity={0.7}
              letterSpacing="0.1em"
              transform={`rotate(${-rotation}, ${yomiCenter.x}, ${yomiCenter.y + 2})`}
            >
              YOMI
            </text>
          </g>

          {/* Highlighted prereq edges (shared edges + connection lines) */}
          <g style={{ pointerEvents: "none" }}>
            {highlightEdges.map((edge, i) =>
              edge.type === "shared" ? (
                <line
                  key={`he-${i}`}
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  stroke={edge.color}
                  strokeWidth={4}
                  strokeOpacity={0.9}
                  strokeLinecap="round"
                />
              ) : (
                <line
                  key={`he-${i}`}
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  stroke={edge.color}
                  strokeWidth={2}
                  strokeOpacity={0.6}
                  strokeLinecap="round"
                  strokeDasharray="6 4"
                />
              )
            )}
          </g>

          {/* All hex skill cells */}
          <g>
            {visibleSkills.map((skill) => {
              const { px: x, py: y } = skill;
              const color = BRANCH_COLORS[skill.branch] ?? "#888888";
              const icon = BRANCH_ICONS[skill.branch] ?? "";
              const isUnlocked = skill.isBase || unlockedSet.has(skill.id);
              const isHovered = hoveredSkill?.id === skill.id;
              const isSelected = selectedSkillId === skill.id;
              const isHighlighted = highlightedIds.has(skill.id);
              const showGlow = isHovered || isSelected;

              let fill: string;
              let fillOpacity: number;
              let stroke: string;
              let strokeW: number;
              let strokeDash: string | undefined;
              let filterAttr: string | undefined;

              if (showGlow) {
                fill = color;
                fillOpacity = 0.9;
                stroke = "#ffffff";
                strokeW = 2.5;
                strokeDash = undefined;
                filterAttr = "url(#glow)";
              } else if (isHighlighted) {
                fill = color;
                fillOpacity = 0.7;
                stroke = "#ffffff";
                strokeW = 2;
                strokeDash = undefined;
                filterAttr = undefined;
              } else if (isUnlocked) {
                if (mode === "play") {
                  // Play mode: hollow by default, filled only when active
                  fill = "transparent";
                  fillOpacity = 1;
                  stroke = color;
                  strokeW = 1.5;
                } else {
                  fill = color;
                  fillOpacity = skill.isBase ? 0.5 : 0.8;
                  stroke = color;
                  strokeW = 1.5;
                }
                strokeDash = undefined;
                filterAttr = undefined;
              } else {
                fill = "#1f2937";
                fillOpacity = 0.6;
                stroke = color;
                strokeW = 1;
                strokeDash = "4 3";
                filterAttr = undefined;
              }

              // YOMI matchup opacity: skills you beat are bright, skills that beat you are dimmed
              const isAdvantage = advantageIds.has(skill.id);
              const isDisadvantage = disadvantageIds.has(skill.id);
              const hasMatchupContext = hoveredSkill && !showGlow;
              let groupOpacity = 1;

              if (hasMatchupContext) {
                if (isAdvantage) {
                  groupOpacity = 1;
                } else if (isDisadvantage) {
                  groupOpacity = 0.25;
                } else if (!isHighlighted) {
                  groupOpacity = 0.4;
                }
              }

              return (
                <g
                  key={skill.id}
                  style={{
                    cursor:
                      mode === "build" && skill.isBase ? "default" : "pointer",
                    opacity: groupOpacity,
                    transition: "opacity 0.15s ease",
                  }}
                  onMouseEnter={() => handleNodeHover(skill)}
                  onMouseLeave={handleNodeHoverEnd}
                  onClick={() => handleNodeClick(skill)}
                >
                  <polygon
                    points={hexPoints(x, y, HEX_R)}
                    fill={fill}
                    fillOpacity={fillOpacity}
                    stroke={stroke}
                    strokeWidth={strokeW}
                    strokeDasharray={strokeDash}
                    filter={filterAttr}
                  />
                  <text
                    x={x}
                    y={y - 5}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={16}
                    transform={`rotate(${-rotation}, ${x}, ${y - 5})`}
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {icon}
                  </text>
                  <text
                    x={x}
                    y={y + 14}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={showGlow || isHighlighted ? "#ffffff" : "#ffffffcc"}
                    fontSize={7}
                    fontWeight="700"
                    letterSpacing="0.05em"
                    transform={`rotate(${-rotation}, ${x}, ${y + 14})`}
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {skill.name}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Confirmed selection outlines */}
          {isConfirmed && (
            <g style={{ pointerEvents: "none" }}>
              {Array.from(confirmedIds).map((id) => {
                const pos = SKILL_POSITIONS[id];
                if (!pos) return null;
                const { x, y } = axialToPixel(pos.q, pos.r);
                const skill = SKILL_MAP.get(id);
                const r = HEX_R + 4;
                const color = skill
                  ? BRANCH_COLORS[skill.branch] ?? "#ffffff"
                  : "#ffffff";
                return (
                  <polygon
                    key={`confirm-${id}`}
                    points={hexPoints(x, y, r)}
                    fill="none"
                    stroke={color}
                    strokeWidth={4}
                    strokeOpacity={0.9}
                    filter="url(#glow)"
                  />
                );
              })}
            </g>
          )}
          </g>{/* end rotation group */}
        </svg>

      </div>

      {/* Desktop side panel — card + target picker + confirm */}
      <DesktopSidePanel
        mode={mode}
        mounted={mounted}
        activeSkill={activeSkill}
        activePattern={activePattern ?? undefined}
        activeBoostLabel={activeBoostLabel}
      />
    </div>
  );
}

// ─── Desktop Side Panel ──────────────────────────────────────────────────────

const TARGET_COLS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
const TARGET_ROWS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function DesktopSidePanel({
  mode,
  mounted,
  activeSkill,
  activePattern,
  activeBoostLabel,
}: {
  mode: "build" | "play";
  mounted: boolean;
  activeSkill: Skill | null;
  activePattern?: Parameters<typeof HexCardFull>[0]["pattern"];
  activeBoostLabel?: string;
}) {
  const selectedSkillId = useBuildStore((s) => s.selectedSkillId);
  const confirmedSkillIds = useBuildStore((s) => s.confirmedSkillIds);
  const setConfirmedSkills = useBuildStore((s) => s.setConfirmedSkills);
  const targetHex = useBuildStore((s) => s.targetHex);
  const setTargetHex = useBuildStore((s) => s.setTargetHex);
  const resetPlayState = useBuildStore((s) => s.resetPlayState);

  const isConfirmed = confirmedSkillIds.length > 0;
  const hasTarget = targetHex !== null && targetHex.col !== "" && targetHex.row > 0;
  const canConfirm = mode !== "play" || hasTarget;

  const handleConfirm = useCallback(() => {
    if (!canConfirm && !isConfirmed) return;
    if (isConfirmed) {
      resetPlayState();
    } else if (selectedSkillId) {
      setConfirmedSkills([selectedSkillId]);
    }
  }, [canConfirm, isConfirmed, selectedSkillId, setConfirmedSkills, resetPlayState]);

  const branchColor = activeSkill ? BRANCH_COLORS[activeSkill.branch] : "#888";

  return (
    <div className="hidden md:flex md:w-[400px] flex-shrink-0 flex-col overflow-hidden">
      {/* Card */}
      <div className="flex-1 min-h-0 flex items-center justify-center p-3 overflow-y-auto">
        {mounted && activeSkill && activePattern ? (
          <HexCardFull
            skill={activeSkill}
            pattern={activePattern}
            animate
            boostLabel={activeBoostLabel}
          />
        ) : null}
      </div>

      {/* Target picker + Confirm — Play mode only */}
      {mode === "play" && selectedSkillId && (
        <div className="flex-shrink-0 border-t border-white/10 p-3 flex flex-col gap-2">
          {!isConfirmed && (
            <>
              <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">
                Target
              </span>
              <div className="flex gap-1">
                {TARGET_COLS.map((col) => (
                  <button
                    key={col}
                    onClick={() => setTargetHex({ col, row: targetHex?.row ?? 0 })}
                    className="flex-1 py-1.5 rounded text-xs font-bold transition-colors"
                    style={{
                      background: targetHex?.col === col ? branchColor : "rgba(255,255,255,0.08)",
                      color: targetHex?.col === col ? "#ffffff" : "rgba(255,255,255,0.5)",
                    }}
                  >
                    {col}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                {TARGET_ROWS.map((row) => (
                  <button
                    key={row}
                    onClick={() => setTargetHex({ col: targetHex?.col ?? "", row })}
                    className="flex-1 py-1.5 rounded text-xs font-bold transition-colors"
                    style={{
                      background: targetHex?.row === row ? branchColor : "rgba(255,255,255,0.08)",
                      color: targetHex?.row === row ? "#ffffff" : "rgba(255,255,255,0.5)",
                    }}
                  >
                    {row}
                  </button>
                ))}
              </div>
            </>
          )}

          <button
            onClick={handleConfirm}
            disabled={!canConfirm && !isConfirmed}
            className={`w-full py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all ${
              isConfirmed
                ? "bg-red-500/90 hover:bg-red-500 text-white"
                : canConfirm
                  ? "text-white"
                  : "text-white/40 cursor-not-allowed"
            }`}
            style={
              isConfirmed
                ? undefined
                : { background: canConfirm ? branchColor : `${branchColor}40` }
            }
          >
            {isConfirmed
              ? "RESET"
              : hasTarget
                ? `CONFIRM → ${targetHex!.col}${targetHex!.row}`
                : "CONFIRM"}
          </button>
        </div>
      )}
    </div>
  );
}

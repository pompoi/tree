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

const ADVANTAGE_COLOR = "#fbbf24"; // gold
const DISADVANTAGE_COLOR = "#a855f7"; // purple

// ─── YOMI matchup maps ──────────────────────────────────────────────────────
// Default triangle: ATK > MOV > DEF > ATK
// Overrides are derived from each skill's interactionNotes.
//
// ATK: melee-attack, power-hit, quick-jab, feint, lunge, combo-strike,
//      feint-strike, executioner, whirlwind
// MOV: move, flanking, dash, pivot, charge, withdraw, shadow-step,
//      phantom-step, overrun
// DEF: defend, parry, brace, sidestep, riposte, deflect, anticipate,
//      mirror-guard, fortress

const ALL_MOV = ["move", "flanking", "dash", "pivot", "charge", "withdraw", "shadow-step", "phantom-step", "overrun"];
const ALL_DEF = ["defend", "parry", "brace", "sidestep", "riposte", "deflect", "anticipate", "mirror-guard", "fortress"];
const ALL_ATK = ["melee-attack", "power-hit", "quick-jab", "feint", "lunge", "combo-strike", "feint-strike", "executioner", "whirlwind"];

// Standard ATK that MOV loses to (excluding feint/feint-strike neutral, power-hit/executioner reversed)
const STD_ATK_VS_MOV = ["melee-attack", "quick-jab", "lunge", "combo-strike", "whirlwind"];

const SKILL_BEATS: Record<string, string[]> = {
  // ─── Attack ───
  "melee-attack": [...ALL_MOV, "feint"],
  "power-hit":    ["parry", "riposte", "feint"],                       // loses to MOV (slow); breaks Parry/Riposte
  "quick-jab":    [...ALL_MOV, "power-hit", "feint", "sidestep"],      // speed beats Power Hit; resolves before Sidestep
  "feint":        [...ALL_DEF, "pivot"],                                // beats all DEF; Pivot notes: "Loses to Feint"
  "lunge":        [...ALL_MOV, "feint"],
  "combo-strike": [...ALL_MOV, "feint"],
  "feint-strike": [...ALL_DEF, "feint"],                                // upgraded Feint: beats all DEF; beats Feint (ATK vs Feint)
  "executioner":  [...ALL_MOV, "feint"],                                 // standard A>M; can be parried but hits hard
  "whirlwind":    [...ALL_MOV, "feint"],

  // ─── Movement ───
  "move":         [...ALL_DEF, "power-hit"],
  "flanking":     ALL_DEF.filter(s => s !== "brace").concat(["power-hit"]),
  "dash":         [...ALL_DEF, "power-hit"],
  "pivot":        [...ALL_DEF, "flanking", "feint-strike", "power-hit"],
  "charge":       ALL_DEF.filter(s => s !== "brace" && s !== "sidestep").concat(["power-hit"]),
  "withdraw":     [...ALL_DEF, "power-hit"],
  "shadow-step":  ALL_DEF.filter(s => s !== "brace" && s !== "anticipate").concat(["power-hit"]),
  "phantom-step": [...ALL_DEF, "power-hit"],
  "overrun":      ALL_DEF.filter(s => s !== "brace").concat(["power-hit"]),

  // ─── Defend ───
  "defend":       ALL_ATK.filter(s => s !== "feint" && s !== "feint-strike"),
  "parry":        ALL_ATK.filter(s => s !== "power-hit" && s !== "feint" && s !== "feint-strike"),
  "brace":        ALL_ATK.filter(s => s !== "feint" && s !== "feint-strike").concat(["flanking", "charge", "shadow-step", "overrun"]),
  "sidestep":     ALL_ATK.filter(s => s !== "quick-jab" && s !== "feint" && s !== "feint-strike").concat(["charge"]),
  "riposte":      ALL_ATK.filter(s => s !== "power-hit" && s !== "feint" && s !== "feint-strike"),
  "deflect":      ALL_ATK.filter(s => s !== "feint" && s !== "feint-strike"),
  "anticipate":   ALL_ATK.filter(s => s !== "feint" && s !== "feint-strike").concat(["shadow-step"]),
  "mirror-guard": ALL_ATK.filter(s => s !== "feint" && s !== "feint-strike"),
  "fortress":     ALL_ATK.filter(s => s !== "feint" && s !== "feint-strike"),
};

const SKILL_LOSES_TO: Record<string, string[]> = {
  // ─── Attack ───
  "melee-attack": [...ALL_DEF],
  "power-hit":    [...ALL_MOV, ...ALL_DEF.filter(s => s !== "parry" && s !== "riposte"), "quick-jab"],
  "quick-jab":    ALL_DEF.filter(s => s !== "sidestep"),
  "feint":        ALL_ATK.filter(s => s !== "feint"),                   // loses to every other ATK skill
  "lunge":        [...ALL_DEF],
  "combo-strike": [...ALL_DEF],
  "feint-strike": ["pivot"],                                            // only specific loss
  "executioner":  [...ALL_DEF],                                          // standard D>A; can be parried/blocked
  "whirlwind":    [...ALL_DEF],

  // ─── Movement ───
  "move":         [...STD_ATK_VS_MOV],
  "flanking":     [...STD_ATK_VS_MOV, "brace", "pivot"],
  "dash":         [...STD_ATK_VS_MOV],
  "pivot":        [...STD_ATK_VS_MOV, "feint"],                         // Pivot specifically loses to Feint
  "charge":       [...STD_ATK_VS_MOV, "brace", "sidestep"],
  "withdraw":     [...STD_ATK_VS_MOV],
  "shadow-step":  [...STD_ATK_VS_MOV, "brace", "anticipate"],
  "phantom-step": [...STD_ATK_VS_MOV],
  "overrun":      [...STD_ATK_VS_MOV, "brace"],

  // ─── Defend ───
  "defend":       [...ALL_MOV, "feint", "feint-strike"],
  "parry":        [...ALL_MOV, "power-hit", "feint", "feint-strike"],
  "brace":        ALL_MOV.filter(s => s !== "flanking" && s !== "charge" && s !== "shadow-step" && s !== "overrun").concat(["feint", "feint-strike"]),
  "sidestep":     ALL_MOV.filter(s => s !== "charge").concat(["quick-jab", "feint", "feint-strike"]),
  "riposte":      [...ALL_MOV, "power-hit", "feint", "feint-strike"],
  "deflect":      [...ALL_MOV, "feint", "feint-strike"],
  "anticipate":   ALL_MOV.filter(s => s !== "shadow-step").concat(["feint", "feint-strike"]),
  "mirror-guard": [...ALL_MOV, "feint", "feint-strike"],
  "fortress":     [...ALL_MOV, "feint", "feint-strike"],
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
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  const isConfirmed = confirmedIds.size > 0;
  const [mounted, setMounted] = useState(false);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    setMounted(true);
    useBuildStore.persist.rehydrate();
  }, []);

  // Clear selection when switching modes
  useEffect(() => {
    setSelectedSkillId(null);
  }, [mode]);

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

  // ─── Prereq shared edges to highlight ──────────────────────────────
  const highlightEdges = useMemo(() => {
    const activeId = hoveredSkill?.id ?? selectedSkillId;
    if (!activeId) return [];

    const pairs = getPrereqEdges(activeId);
    const edges: { x1: number; y1: number; x2: number; y2: number; color: string }[] = [];

    for (const [parentId, childId] of pairs) {
      if (!visibleIds.has(parentId) || !visibleIds.has(childId)) continue;
      const parentPos = SKILL_POSITIONS[parentId];
      const childPos = SKILL_POSITIONS[childId];
      if (!parentPos || !childPos) continue;

      const shared = getSharedEdge(parentPos, childPos);
      if (!shared) continue;

      const childSkill = SKILL_MAP.get(childId);
      const color = childSkill ? BRANCH_COLORS[childSkill.branch] : "#ffffff";
      edges.push({
        x1: shared[0].x,
        y1: shared[0].y,
        x2: shared[1].x,
        y2: shared[1].y,
        color,
      });
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
        setSelectedSkillId((prev) => (prev === skill.id ? null : skill.id));
      } else {
        if (skill.isBase) return;

        if (unlockedSet.has(skill.id)) {
          // Deselect and lock
          lockSkill(skill.id);
          setSelectedSkillId(null);
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
          setSelectedSkillId(skill.id);
        }
      }
    },
    [unlockedSet, unlockSkill, lockSkill, isConfirmed, mode]
  );

  const handleConfirm = useCallback(() => {
    if (isConfirmed) {
      setConfirmedIds(new Set());
      setSelectedSkillId(null);
    } else {
      setConfirmedIds(new Set(highlightedIds));
    }
  }, [isConfirmed, highlightedIds]);

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
    <div className="relative w-full h-full flex flex-col md:flex-row items-stretch overflow-y-auto md:overflow-hidden">
      {/* SVG graph — takes remaining space */}
      <div className="min-h-[70dvh] md:flex-1 md:min-h-0 min-w-0 flex items-center justify-center">
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
            <filter id="gold-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="purple-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
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

          {/* Highlighted shared edges (prereq chain) */}
          <g style={{ pointerEvents: "none" }}>
            {highlightEdges.map((edge, i) => (
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
            ))}
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
                fill = color;
                fillOpacity = skill.isBase ? 0.5 : 0.8;
                stroke = color;
                strokeW = 1.5;
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

              const isAdvantage = advantageIds.has(skill.id);
              const isDisadvantage = disadvantageIds.has(skill.id);

              if (isDisadvantage && !showGlow) {
                stroke = DISADVANTAGE_COLOR;
                strokeW = 2.5;
                fill = DISADVANTAGE_COLOR;
                fillOpacity = 0.35;
                filterAttr = "url(#purple-glow)";
              }
              if (isAdvantage && !showGlow) {
                stroke = ADVANTAGE_COLOR;
                strokeW = 2.5;
                fill = ADVANTAGE_COLOR;
                fillOpacity = 0.4;
                filterAttr = "url(#gold-glow)";
              }

              return (
                <g
                  key={skill.id}
                  style={{
                    cursor:
                      mode === "build" && skill.isBase ? "default" : "pointer",
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

        {/* Confirm / Reset button */}
        {mode === "play" && (selectedSkillId || isConfirmed) && (
          <button
            onClick={handleConfirm}
            className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide transition-all ${
              isConfirmed
                ? "bg-red-500/90 hover:bg-red-500 text-white shadow-lg shadow-red-500/30"
                : "bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-lg backdrop-blur-sm"
            }`}
          >
            {isConfirmed ? "RESET" : "CONFIRM"}
          </button>
        )}
      </div>

      {/* Card preview — right side on desktop, below on mobile. Always reserves space. */}
      <div className="w-full min-h-[50dvh] md:min-h-0 md:w-[400px] md:h-auto flex-shrink-0 flex items-center justify-center p-3 overflow-hidden">
        {mounted && activeSkill && activePattern ? (
          <HexCardFull
            skill={activeSkill}
            pattern={activePattern}
            animate
            boostLabel={activeBoostLabel}
          />
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import { createPortal } from "react-dom";
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
  movement: "#06b6d4",
  defend: "#22c55e",
};

const BRANCH_ICONS: Record<Branch, string> = {
  attack: "\u2694",
  movement: "\u26A1",
  defend: "\u{1F6E1}",
};

const BEATS: Record<Branch, Branch> = {
  attack: "movement",
  movement: "defend",
  defend: "attack",
};
const LOSES_TO: Record<Branch, Branch> = {
  attack: "defend",
  movement: "attack",
  defend: "movement",
};

const ADVANTAGE_COLOR = "#fbbf24"; // gold
const DISADVANTAGE_COLOR = "#a855f7"; // purple

const CARD_W = 240;
const CARD_H = 360;
const CARD_OFFSET = 20;

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
  onPreviewSkill: (skill: Skill | null) => void;
}

export function UnifiedSkillGraph({
  mode,
  onPreviewSkill,
}: UnifiedSkillGraphProps) {
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
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    useBuildStore.persist.rehydrate();
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

  // ─── Visible skills + pixel positions ──────────────────────────────
  const visibleSkills = useMemo(() => {
    const result: (Skill & { px: number; py: number })[] = [];

    for (const skill of SKILLS) {
      const pos = SKILL_POSITIONS[skill.id];
      if (!pos) continue;

      if (mode === "play") {
        // Play: only unlocked skills (base skills always shown)
        if (!skill.isBase && !unlockedSet.has(skill.id)) continue;
      } else {
        // Build: unlocked + unlockable
        if (!skill.isBase && !unlockedSet.has(skill.id) && !canUnlock(skill.id, unlockedSet)) continue;
      }

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
    const beatenBranch = BEATS[hoveredSkill.branch];
    const beatingBranch = LOSES_TO[hoveredSkill.branch];
    const adv = new Set<string>();
    const dis = new Set<string>();
    for (const skill of visibleSkills) {
      if (skill.id === hoveredSkill.id) continue;
      if (skill.branch === beatenBranch) adv.add(skill.id);
      if (skill.branch === beatingBranch) dis.add(skill.id);
    }
    return { advantageIds: adv, disadvantageIds: dis };
  }, [hoveredSkill, visibleSkills]);

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

  // ─── Legend position ───────────────────────────────────────────────
  const legendPos = useMemo(() => {
    let maxDist = 200;
    for (const skill of visibleSkills) {
      const d = Math.sqrt(skill.px * skill.px + skill.py * skill.py);
      if (d > maxDist) maxDist = d;
    }
    return { x: -(maxDist + 40), y: maxDist * 0.3 };
  }, [visibleSkills]);

  // ─── Handlers ─────────────────────────────────────────────────────
  const handleNodeHover = useCallback(
    (skill: Skill, event: React.MouseEvent) => {
      setHoveredSkill(skill);
      setHoverPos({ x: event.clientX, y: event.clientY });
      onPreviewSkill(skill);
    },
    [onPreviewSkill]
  );

  const handleNodeHoverEnd = useCallback(() => {
    setHoveredSkill(null);
    if (!selectedSkillId) onPreviewSkill(null);
  }, [onPreviewSkill, selectedSkillId]);

  const handleNodeClick = useCallback(
    (skill: Skill) => {
      if (hasPannedRef.current) return;
      if (isConfirmed) return;

      if (mode === "play") {
        // Play mode: select one skill as your action
        if (!unlockedSet.has(skill.id) && !skill.isBase) return;
        setSelectedSkillId((prev) => (prev === skill.id ? null : skill.id));
        onPreviewSkill(skill);
      } else {
        // Build mode: toggle unlock/lock
        if (skill.isBase) return;
        setSelectedSkillId((prev) => (prev === skill.id ? null : skill.id));
        if (unlockedSet.has(skill.id)) {
          lockSkill(skill.id);
        } else {
          unlockSkill(skill.id);
        }
      }
    },
    [unlockedSet, unlockSkill, lockSkill, isConfirmed, mode, onPreviewSkill]
  );

  const handleConfirm = useCallback(() => {
    if (isConfirmed) {
      // Reset
      setConfirmedIds(new Set());
      setSelectedSkillId(null);
    } else {
      // Confirm current highlighted selection
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

  // ─── Floating card position ────────────────────────────────────────
  const cardPos = useMemo(() => {
    if (!hoveredSkill) return { left: 0, top: 0 };
    const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
    const vh = typeof window !== "undefined" ? window.innerHeight : 800;

    let left = hoverPos.x + CARD_OFFSET;
    let top = hoverPos.y + CARD_OFFSET;

    if (left + CARD_W > vw - 8) left = hoverPos.x - CARD_W - CARD_OFFSET;
    if (top + CARD_H > vh - 8) top = hoverPos.y - CARD_H - CARD_OFFSET;

    left = Math.max(8, Math.min(left, vw - CARD_W - 8));
    top = Math.max(8, Math.min(top, vh - CARD_H - 8));

    return { left, top };
  }, [hoveredSkill, hoverPos]);

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="relative w-full flex items-center justify-center">
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className="w-full max-w-[860px] h-auto"
        style={{
          maxHeight: "calc(100dvh - 160px)",
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
          <filter
            id="purple-glow"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

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

            // Determine visual style
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
              // Locked / available in build mode
              fill = "#1f2937";
              fillOpacity = 0.6;
              stroke = color;
              strokeW = 1;
              strokeDash = "4 3";
              filterAttr = undefined;
            }

            // Advantage/disadvantage highlighting (override non-glow states)
            const isAdvantage = advantageIds.has(skill.id);
            const isDisadvantage = disadvantageIds.has(skill.id);

            if (isDisadvantage && !showGlow) {
              stroke = DISADVANTAGE_COLOR;
              strokeW = 3;
              fill = DISADVANTAGE_COLOR;
              fillOpacity = 0.15;
              filterAttr = "url(#purple-glow)";
            }
            if (isAdvantage && !showGlow) {
              stroke = ADVANTAGE_COLOR;
              strokeW = 3;
              fill = ADVANTAGE_COLOR;
              fillOpacity = 0.15;
              filterAttr = "url(#gold-glow)";
            }

            // Base skills slightly thicker advantage border
            if ((isAdvantage || isDisadvantage) && !showGlow && skill.isBase) {
              strokeW = 3.5;
            }

            return (
              <g
                key={skill.id}
                style={{
                  cursor:
                    mode === "build" && skill.isBase ? "default" : "pointer",
                }}
                onMouseEnter={(e) => handleNodeHover(skill, e)}
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
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {skill.name}
                </text>
              </g>
            );
          })}
        </g>

        {/* Advantage Legend */}
        <g
          transform={`translate(${legendPos.x}, ${legendPos.y})`}
          style={{ pointerEvents: "none" }}
        >
          <rect
            x={-8}
            y={-8}
            width={120}
            height={50}
            rx={6}
            fill="#030712"
            fillOpacity={0.8}
            stroke="#ffffff"
            strokeWidth={0.5}
            strokeOpacity={0.2}
          />
          <polygon
            points={hexPoints(8, 8, 8)}
            fill={ADVANTAGE_COLOR}
            fillOpacity={0.6}
            stroke={ADVANTAGE_COLOR}
            strokeWidth={1}
          />
          <text
            x={22}
            y={12}
            fill="#fbbf24"
            fontSize={8}
            fontWeight="600"
            dominantBaseline="middle"
            style={{ userSelect: "none" }}
          >
            Beats
          </text>
          <polygon
            points={hexPoints(8, 30, 8)}
            fill={DISADVANTAGE_COLOR}
            fillOpacity={0.6}
            stroke={DISADVANTAGE_COLOR}
            strokeWidth={1}
          />
          <text
            x={22}
            y={34}
            fill="#a855f7"
            fontSize={8}
            fontWeight="600"
            dominantBaseline="middle"
            style={{ userSelect: "none" }}
          >
            Vulnerable
          </text>
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

      {/* Floating HexCardFull on hover */}
      {mounted &&
        hoveredSkill &&
        (() => {
          const pattern = HEX_PATTERN_MAP.get(hoveredSkill.id);
          if (!pattern) return null;
          return createPortal(
            <div
              className="fixed pointer-events-none z-50"
              style={{ left: cardPos.left, top: cardPos.top }}
            >
              <HexCardFull
                skill={hoveredSkill}
                pattern={pattern}
                animate
              />
            </div>,
            document.body
          );
        })()}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { SKILLS, SKILL_MAP } from "@/data/skills";
import { HEX_PATTERN_MAP } from "@/data/hex-patterns";
import { canUnlock } from "@/lib/graph-utils";
import { computeHexLayout, getHexRadii, hexVertices } from "@/lib/radial-layout";
import { HexCardFull } from "@/components/hex-card/HexCardFull";
import { SkillEdge } from "./SkillEdge";
import { useBuildStore } from "@/stores/build-store";
import type { Skill, Branch } from "@/types/skill";
import type {
  SkillNode as SkillNodeType,
  SkillEdge as SkillEdgeType,
} from "@/types/graph";

// ─── Constants ──────────────────────────────────────────────────────────────

const DEFAULT_VB = { x: -500, y: -500, w: 1000, h: 1000 };
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

const BRANCH_HEX_R = 36;

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

const BASE_SKILL_IDS = new Set(["melee-attack", "move", "defend"]);

const BASE_SKILLS: Record<Branch, string> = {
  attack: "melee-attack",
  movement: "move",
  defend: "defend",
};

const BRANCH_LABELS: {
  label: string;
  color: string;
  edgeIdx: number;
}[] = [
  { label: "ATTACK", color: "#ef4444", edgeIdx: 0 },
  { label: "MOVEMENT", color: "#06b6d4", edgeIdx: 2 },
  { label: "DEFEND", color: "#22c55e", edgeIdx: 4 },
];

const CARD_W = 240;
const CARD_H = 360;
const CARD_OFFSET = 20;

// ─── SVG Helpers ────────────────────────────────────────────────────────────

function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    pts.push(
      `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`
    );
  }
  return pts.join(" ");
}

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

// ─── Component ──────────────────────────────────────────────────────────────

interface UnifiedSkillGraphProps {
  mode: "tree" | "wheel";
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

  // ─── Visible skills based on mode ────────────────────────────────
  const { nodes, edges, hexRadii } = useMemo(() => {
    const visibleSkills: Skill[] = [];
    const visibleIds = new Set<string>();

    for (const skill of SKILLS) {
      if (mode === "wheel") {
        // Wheel: only unlocked skills (for reviewing current build)
        if (unlockedSet.has(skill.id)) {
          visibleSkills.push(skill);
          visibleIds.add(skill.id);
        }
      } else {
        // Tree: unlocked + unlockable (for planning builds)
        if (unlockedSet.has(skill.id) || canUnlock(skill.id, unlockedSet)) {
          visibleSkills.push(skill);
          visibleIds.add(skill.id);
        }
      }
    }

    const positions = computeHexLayout(visibleSkills);
    const radii = getHexRadii(positions);

    const nodeMap = new Map<string, SkillNodeType>();
    for (const skill of visibleSkills) {
      const pos = positions.get(skill.id);
      if (!pos) continue;
      nodeMap.set(skill.id, {
        skill,
        angle: 0,
        radius: 0,
        x: pos.x,
        y: pos.y,
      });
    }

    const edgeList: SkillEdgeType[] = [];
    for (const skill of visibleSkills) {
      for (const prereqId of skill.prerequisites) {
        if (visibleIds.has(prereqId)) {
          edgeList.push({ from: prereqId, to: skill.id });
        }
      }
    }

    return { nodes: nodeMap, edges: edgeList, hexRadii: radii };
  }, [unlockedSet, mode]);

  // ─── Highlighted IDs (prereq chain of hovered or selected skill) ──
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

  // ─── Advantage/disadvantage sets (YOMI highlighting) ─────────────
  const { advantageIds, disadvantageIds } = useMemo(() => {
    if (!hoveredSkill) return { advantageIds: new Set<string>(), disadvantageIds: new Set<string>() };
    const beatenBranch = BEATS[hoveredSkill.branch];
    const beatingBranch = LOSES_TO[hoveredSkill.branch];
    const adv = new Set<string>();
    const dis = new Set<string>();
    for (const node of nodes.values()) {
      if (node.skill.id === hoveredSkill.id) continue;
      if (node.skill.branch === beatenBranch) adv.add(node.skill.id);
      if (node.skill.branch === beatingBranch) dis.add(node.skill.id);
    }
    return { advantageIds: adv, disadvantageIds: dis };
  }, [hoveredSkill, nodes]);

  // ─── Hex ring outlines ───────────────────────────────────────────
  const hexRingPaths = useMemo(() => {
    return hexRadii.map((r) => {
      const verts = hexVertices(r);
      const d = verts
        .map((v, i) => `${i === 0 ? "M" : "L"} ${v.x} ${v.y}`)
        .join(" ");
      return d + " Z";
    });
  }, [hexRadii]);

  // ─── Branch label positions ──────────────────────────────────────
  const labelPositions = useMemo(() => {
    const outerR =
      hexRadii.length > 0 ? hexRadii[hexRadii.length - 1] + 30 : 200;
    const verts = hexVertices(outerR);

    return BRANCH_LABELS.map(({ label, color, edgeIdx }) => {
      const v1 = verts[edgeIdx];
      const v2 = verts[(edgeIdx + 1) % 6];
      const mid = { x: (v1.x + v2.x) / 2, y: (v1.y + v2.y) / 2 };
      const dist = Math.sqrt(mid.x * mid.x + mid.y * mid.y);
      const push = dist > 0 ? 20 / dist : 0;
      return {
        label,
        color,
        x: mid.x + mid.x * push,
        y: mid.y + mid.y * push,
      };
    });
  }, [hexRadii]);

  // ─── Advantage wedges (dynamic from base skill positions) ────────
  const advantageWedges = useMemo(() => {
    const atkNode = nodes.get("melee-attack");
    const movNode = nodes.get("move");
    const defNode = nodes.get("defend");
    if (!atkNode || !movNode || !defNode) return [];

    const atk = { x: atkNode.x, y: atkNode.y };
    const mov = { x: movNode.x, y: movNode.y };
    const def = { x: defNode.x, y: defNode.y };

    const touchAM = { x: (atk.x + mov.x) / 2, y: (atk.y + mov.y) / 2 };
    const touchAD = { x: (atk.x + def.x) / 2, y: (atk.y + def.y) / 2 };
    const touchMD = { x: (mov.x + def.x) / 2, y: (mov.y + def.y) / 2 };

    const cx = (atk.x + mov.x + def.x) / 3;
    const cy = (atk.y + mov.y + def.y) / 3;

    return [
      { path: `M ${cx},${cy} L ${touchAM.x},${touchAM.y} L ${touchAD.x},${touchAD.y} Z`, color: BRANCH_COLORS.defend },
      { path: `M ${cx},${cy} L ${touchAM.x},${touchAM.y} L ${touchMD.x},${touchMD.y} Z`, color: BRANCH_COLORS.attack },
      { path: `M ${cx},${cy} L ${touchAD.x},${touchAD.y} L ${touchMD.x},${touchMD.y} Z`, color: BRANCH_COLORS.movement },
    ];
  }, [nodes]);

  const yomiCenter = useMemo(() => {
    const atkNode = nodes.get("melee-attack");
    const movNode = nodes.get("move");
    const defNode = nodes.get("defend");
    if (!atkNode || !movNode || !defNode) return { x: 0, y: 0 };
    return {
      x: (atkNode.x + movNode.x + defNode.x) / 3,
      y: (atkNode.y + movNode.y + defNode.y) / 3,
    };
  }, [nodes]);

  const legendPos = useMemo(() => {
    const outerR = hexRadii.length > 0 ? hexRadii[hexRadii.length - 1] : 200;
    return { x: -(outerR + 20), y: outerR * 0.5 };
  }, [hexRadii]);

  // ─── Handlers ────────────────────────────────────────────────────
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
    (skillId: string) => {
      // When confirmed, don't change selection — only hover for details
      if (isConfirmed) return;

      // Toggle selection for persistent highlight
      setSelectedSkillId((prev) => (prev === skillId ? null : skillId));

      // Toggle unlock/lock
      if (unlockedSet.has(skillId)) {
        lockSkill(skillId);
      } else {
        unlockSkill(skillId);
      }
    },
    [unlockedSet, unlockSkill, lockSkill, isConfirmed]
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

  // Base skill hover/click (rendered as branch-hex-style)
  const handleBaseHover = useCallback(
    (branch: Branch, event: React.MouseEvent) => {
      const baseId = BASE_SKILLS[branch];
      const skill = SKILL_MAP.get(baseId);
      if (skill) {
        setHoveredSkill(skill);
        setHoverPos({ x: event.clientX, y: event.clientY });
        onPreviewSkill(skill);
      }
    },
    [onPreviewSkill]
  );

  const handleBaseHoverEnd = useCallback(() => {
    setHoveredSkill(null);
    if (!selectedSkillId) onPreviewSkill(null);
  }, [onPreviewSkill, selectedSkillId]);

  // ─── Pan logic ──────────────────────────────────────────────────
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

  // ─── Floating card position (clamped to viewport) ────────────────
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

  // ─── Render ──────────────────────────────────────────────────────
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
          <filter
            id="core-glow"
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="gold-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="purple-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Hex ring outlines */}
        <g>
          {hexRingPaths.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="#ffffff"
              strokeWidth={0.8}
              opacity={0.1}
              strokeDasharray="6 4"
            />
          ))}
        </g>

        {/* Branch labels */}
        <g>
          {labelPositions.map(({ label, color, x, y }) => (
            <text
              key={label}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={color}
              fontSize={11}
              fontWeight="600"
              letterSpacing="0.08em"
              opacity={0.8}
              style={{ pointerEvents: "none", userSelect: "none" }}
            >
              {label}
            </text>
          ))}
        </g>

        {/* Central advantage triangle — colored wedges showing who beats whom */}
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

        {/* Prerequisite edges */}
        <g>
          {edges.map((edge) => {
            const fromNode = nodes.get(edge.from);
            const toNode = nodes.get(edge.to);
            if (!fromNode || !toNode) return null;
            return (
              <SkillEdge
                key={`${edge.from}->${edge.to}`}
                fromNode={fromNode}
                toNode={toNode}
                unlockedSkillIds={unlockedSet}
              />
            );
          })}
        </g>

        {/* All skill nodes — uniform hex style */}
        <g>
          {Array.from(nodes.values()).map((node) => {
            const { skill, x, y } = node;
            const color = BRANCH_COLORS[skill.branch] ?? "#888888";
            const icon = BRANCH_ICONS[skill.branch] ?? "";
            const isBase = skill.isBase;
            const isUnlocked = isBase || unlockedSet.has(skill.id);
            const isHovered = hoveredSkill?.id === skill.id;
            const isHighlighted = highlightedIds.has(skill.id);
            const showGlow = isHovered || isHighlighted;

            // In wheel mode: unfilled outline when not unlocked
            const wheelEmpty = mode === "wheel" && !isUnlocked;

            let fill: string;
            let fillOpacity: number;
            let stroke: string;
            let strokeW: number;
            let strokeDash: string | undefined;

            if (wheelEmpty && !showGlow) {
              fill = "transparent";
              fillOpacity = 0;
              stroke = color;
              strokeW = 1.5;
              strokeDash = "4 3";
            } else if (showGlow) {
              fill = color;
              fillOpacity = 0.8;
              stroke = "#ffffff";
              strokeW = 2.5;
              strokeDash = undefined;
            } else if (isUnlocked) {
              fill = color;
              fillOpacity = isBase ? 0.5 : 0.9;
              stroke = isBase ? color : "#ffffff";
              strokeW = isBase ? 1.5 : 2;
              strokeDash = undefined;
            } else {
              // Tree mode, not unlocked — available
              fill = "#1f2937";
              fillOpacity = 0.7;
              stroke = "#ffffff";
              strokeW = 1.5;
              strokeDash = "4 3";
            }

            // Advantage/disadvantage highlighting (overridden by showGlow)
            const isAdvantage = advantageIds.has(skill.id);
            const isDisadvantage = disadvantageIds.has(skill.id);

            if (isDisadvantage && !showGlow) {
              stroke = DISADVANTAGE_COLOR;
              strokeW = 3;
              fill = DISADVANTAGE_COLOR;
              fillOpacity = 0.15;
            }
            if (isAdvantage && !showGlow) {
              stroke = ADVANTAGE_COLOR;
              strokeW = 3;
              fill = ADVANTAGE_COLOR;
              fillOpacity = 0.15;
            }

            // Make base skills slightly more prominent when advantage/disadvantage highlighted
            if ((isAdvantage || isDisadvantage) && !showGlow && isBase) {
              strokeW = 3.5; // slightly thicker than regular skill's 3
            }

            const handleHover = (e: React.MouseEvent) => {
              if (isBase) {
                handleBaseHover(skill.branch, e);
              } else {
                handleNodeHover(skill, e);
              }
            };

            const handleHoverEnd = () => {
              if (isBase) {
                handleBaseHoverEnd();
              } else {
                handleNodeHoverEnd();
              }
            };

            const handleClick = () => {
              if (isBase) return;
              handleNodeClick(skill.id);
            };

            return (
              <g
                key={skill.id}
                style={{ cursor: isBase ? "default" : "pointer" }}
                onMouseEnter={handleHover}
                onMouseLeave={handleHoverEnd}
                onClick={handleClick}
              >
                <polygon
                  points={hexPoints(x, y, BRANCH_HEX_R)}
                  fill={fill}
                  fillOpacity={fillOpacity}
                  stroke={stroke}
                  strokeWidth={strokeW}
                  strokeDasharray={strokeDash}
                  filter={showGlow ? "url(#core-glow)" : isAdvantage ? "url(#gold-glow)" : isDisadvantage ? "url(#purple-glow)" : undefined}
                />
                <text
                  x={x}
                  y={y - 4}
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
                  fill={showGlow ? "#ffffff" : wheelEmpty ? color : "#ffffffcc"}
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
        <g transform={`translate(${legendPos.x}, ${legendPos.y})`} style={{ pointerEvents: "none" }}>
          <rect x={-8} y={-8} width={120} height={50} rx={6}
            fill="#030712" fillOpacity={0.8} stroke="#ffffff" strokeWidth={0.5} strokeOpacity={0.2} />

          {/* Gold = Beats */}
          <polygon points={hexPoints(8, 8, 8)} fill={ADVANTAGE_COLOR} fillOpacity={0.6}
            stroke={ADVANTAGE_COLOR} strokeWidth={1} />
          <text x={22} y={12} fill="#fbbf24" fontSize={8} fontWeight="600"
            dominantBaseline="middle" style={{ userSelect: "none" }}>Beats</text>

          {/* Purple = Vulnerable */}
          <polygon points={hexPoints(8, 30, 8)} fill={DISADVANTAGE_COLOR} fillOpacity={0.6}
            stroke={DISADVANTAGE_COLOR} strokeWidth={1} />
          <text x={22} y={34} fill="#a855f7" fontSize={8} fontWeight="600"
            dominantBaseline="middle" style={{ userSelect: "none" }}>Vulnerable</text>
        </g>

        {/* Confirmed selection outlines — fat hex borders */}
        {isConfirmed && (
          <g style={{ pointerEvents: "none" }}>
            {Array.from(confirmedIds).map((id) => {
              const node = nodes.get(id);
              if (!node) return null;
              const r = BRANCH_HEX_R + 4;
              const color = BRANCH_COLORS[node.skill.branch] ?? "#ffffff";
              return (
                <polygon
                  key={`confirm-${id}`}
                  points={hexPoints(node.x, node.y, r)}
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
      {(highlightedIds.size > 0 || isConfirmed) && (
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

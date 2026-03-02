"use client";

import { useEffect, useMemo, useCallback, useState } from "react";
import { useBuildStore } from "@/stores/build-store";
import { SKILL_MAP } from "@/data/skills";
import { SkillCard } from "@/components/skill-card/SkillCard";
import type { Skill, Branch } from "@/types/skill";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Ring boundaries — each tier's band runs from RING_EDGES[tier] to RING_EDGES[tier+1]. */
const RING_EDGES = [0, 36, 86, 136, 186];
const SLICE_GAP = 1.2;
const SECTOR_PAD = 3;
const OUTER_MARGIN = 20;

const BRANCH_COLORS: Record<Branch, string> = {
  attack: "#ef4444",
  movement: "#06b6d4",
  defend: "#22c55e",
};

/** Fixed 120° sectors — ATK at top, MOV bottom-right, DEF bottom-left. */
const SECTORS: {
  branch: Branch;
  start: number;
  end: number;
  cwNeighbor: Branch;
  ccwNeighbor: Branch;
}[] = [
  { branch: "attack", start: -60, end: 60, cwNeighbor: "movement", ccwNeighbor: "defend" },
  { branch: "movement", start: 60, end: 180, cwNeighbor: "defend", ccwNeighbor: "attack" },
  { branch: "defend", start: 180, end: 300, cwNeighbor: "attack", ccwNeighbor: "movement" },
];

// ─── SVG Helpers ─────────────────────────────────────────────────────────────

function degToRad(deg: number): number {
  return ((deg - 90) * Math.PI) / 180;
}

function polarToXY(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = degToRad(angleDeg);
  return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius };
}

/** Annular arc (ring segment). */
function describeArc(
  startDeg: number,
  endDeg: number,
  innerR: number,
  outerR: number
): string {
  let sweep = endDeg - startDeg;
  if (sweep <= 0) sweep += 360;
  const la = sweep > 180 ? 1 : 0;

  const os = polarToXY(startDeg, outerR);
  const oe = polarToXY(endDeg, outerR);
  const is_ = polarToXY(startDeg, innerR);
  const ie = polarToXY(endDeg, innerR);

  return [
    `M ${os.x} ${os.y}`,
    `A ${outerR} ${outerR} 0 ${la} 1 ${oe.x} ${oe.y}`,
    `L ${ie.x} ${ie.y}`,
    `A ${innerR} ${innerR} 0 ${la} 0 ${is_.x} ${is_.y}`,
    `Z`,
  ].join(" ");
}

/** Just the outer arc edge. */
function describeOuterArc(
  startDeg: number,
  endDeg: number,
  radius: number
): string {
  let sweep = endDeg - startDeg;
  if (sweep <= 0) sweep += 360;
  const la = sweep > 180 ? 1 : 0;
  const s = polarToXY(startDeg, radius);
  const e = polarToXY(endDeg, radius);
  return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${la} 1 ${e.x} ${e.y}`;
}

// ─── Ordering ────────────────────────────────────────────────────────────────

function dfsOrder(group: Skill[]): Skill[] {
  if (group.length === 0) return [];
  const ids = new Set(group.map((s) => s.id));
  const childrenOf = new Map<string, Skill[]>();
  const roots: Skill[] = [];

  for (const skill of group) {
    const inGroupPrereqs = skill.prerequisites.filter((id) => ids.has(id));
    if (inGroupPrereqs.length === 0) roots.push(skill);
    for (const pid of inGroupPrereqs) {
      if (!childrenOf.has(pid)) childrenOf.set(pid, []);
      childrenOf.get(pid)!.push(skill);
    }
  }

  const result: Skill[] = [];
  const visited = new Set<string>();

  function visit(skill: Skill) {
    if (visited.has(skill.id)) return;
    visited.add(skill.id);
    result.push(skill);
    for (const child of childrenOf.get(skill.id) ?? []) visit(child);
  }

  for (const root of roots) visit(root);
  for (const skill of group) {
    if (!visited.has(skill.id)) result.push(skill);
  }
  return result;
}

/**
 * Order skills within a sector:
 * CCW-border hybrids → pure branch → CW-border hybrids.
 */
function orderInSector(
  skills: Skill[],
  cwNeighbor: Branch,
  ccwNeighbor: Branch
): Skill[] {
  const ccwHybrids = skills.filter((s) => s.secondaryBranch === ccwNeighbor);
  const pure = skills.filter((s) => !s.secondaryBranch);
  const cwHybrids = skills.filter((s) => s.secondaryBranch === cwNeighbor);

  return [
    ...dfsOrder(ccwHybrids),
    ...dfsOrder(pure),
    ...dfsOrder(cwHybrids),
  ];
}

// ─── Layout Types ────────────────────────────────────────────────────────────

interface ArcSlot {
  skill: Skill;
  startDeg: number;
  endDeg: number;
  midDeg: number;
  innerR: number;
  outerR: number;
  midR: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SelectionWheel() {
  useEffect(() => {
    useBuildStore.persist.rehydrate();
  }, []);

  const builds = useBuildStore((s) => s.builds);
  const activeSlot = useBuildStore((s) => s.activeSlot);
  const activeBuild = builds[activeSlot];

  const [hoveredSkill, setHoveredSkill] = useState<Skill | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const displayedSkill = hoveredSkill ?? selectedSkill;

  const allSkills = useMemo(() => {
    if (!activeBuild) return [];
    return activeBuild.decisionLog
      .map((entry) => SKILL_MAP.get(entry.skillId))
      .filter(Boolean) as Skill[];
  }, [activeBuild]);

  // Compute arc slots: fixed sectors, contiguous ring bands
  const arcSlots = useMemo(() => {
    const slots: ArcSlot[] = [];

    const byTier = new Map<number, Skill[]>();
    for (const skill of allSkills) {
      if (!byTier.has(skill.tier)) byTier.set(skill.tier, []);
      byTier.get(skill.tier)!.push(skill);
    }

    for (const [tier, tierSkills] of byTier) {
      const innerR = RING_EDGES[tier];
      const outerR = RING_EDGES[tier + 1] ?? RING_EDGES[RING_EDGES.length - 1];
      const midR = (innerR + outerR) / 2;

      for (const sector of SECTORS) {
        const sectorSkills = tierSkills.filter(
          (s) => s.branch === sector.branch
        );
        if (sectorSkills.length === 0) continue;

        const ordered = orderInSector(
          sectorSkills,
          sector.cwNeighbor,
          sector.ccwNeighbor
        );

        const padStart = sector.start + SECTOR_PAD;
        const padEnd = sector.end - SECTOR_PAD;
        const available = padEnd - padStart;
        const count = ordered.length;
        const sliceSize = available / count;

        for (let i = 0; i < count; i++) {
          const start = padStart + i * sliceSize + SLICE_GAP / 2;
          const end = padStart + (i + 1) * sliceSize - SLICE_GAP / 2;
          slots.push({
            skill: ordered[i],
            startDeg: start,
            endDeg: end,
            midDeg: (start + end) / 2,
            innerR,
            outerR,
            midR,
          });
        }
      }
    }

    return slots;
  }, [allSkills]);

  const handleClick = useCallback((skill: Skill) => {
    setSelectedSkill((prev) => (prev?.id === skill.id ? null : skill));
  }, []);

  const maxTier = allSkills.length > 0
    ? Math.max(...allSkills.map((s) => s.tier))
    : 0;
  const wheelOuterR = RING_EDGES[Math.min(maxTier + 1, RING_EDGES.length - 1)];
  const vbR = wheelOuterR + OUTER_MARGIN;
  const vbSize = vbR * 2;

  const isEmpty = allSkills.length === 0;

  const sectorBoundaryAngles = [-60, 60, 180];

  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
      <svg
        viewBox={`${-vbSize / 2} ${-vbSize / 2} ${vbSize} ${vbSize}`}
        className="w-full max-w-[min(500px,100%)] h-auto"
        style={{ maxHeight: "calc(100dvh - 200px)" }}
        xmlns="http://www.w3.org/2000/svg"
        onMouseLeave={() => setHoveredSkill(null)}
      >
        {/* Ring boundary circles */}
        {RING_EDGES.slice(1, maxTier + 2).map((r, i) => (
          <circle
            key={i}
            cx={0}
            cy={0}
            r={r}
            fill="none"
            stroke="#ffffff"
            strokeWidth={0.5}
            opacity={0.06}
          />
        ))}

        {/* Sector boundary lines */}
        {!isEmpty &&
          sectorBoundaryAngles.map((deg) => {
            const p1 = polarToXY(deg, RING_EDGES[0]);
            const p2 = polarToXY(deg, wheelOuterR);
            return (
              <line
                key={deg}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="#ffffff"
                strokeWidth={0.6}
                opacity={0.08}
              />
            );
          })}

        {/* Branch labels outside outermost ring */}
        {!isEmpty &&
          SECTORS.map(({ branch, start, end }) => {
            const midDeg = (start + end) / 2;
            const labelR = wheelOuterR + 12;
            const pos = polarToXY(midDeg, labelR);
            return (
              <text
                key={branch}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={BRANCH_COLORS[branch]}
                fontSize={8}
                fontWeight="600"
                letterSpacing="0.08em"
                opacity={0.6}
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {branch.toUpperCase()}
              </text>
            );
          })}

        {/* Arc segments */}
        {arcSlots.map(({ skill, startDeg, endDeg, midDeg, innerR, outerR, midR }) => {
          const color = BRANCH_COLORS[skill.branch];
          const isHighlighted = displayedSkill?.id === skill.id;

          const labelPos = polarToXY(midDeg, midR);
          const arcSpan = endDeg - startDeg;
          const fontSize = Math.max(4, Math.min(8, arcSpan * 0.18));
          const showLabel = arcSpan > 10;

          return (
            <g
              key={skill.id}
              onMouseEnter={() => setHoveredSkill(skill)}
              onMouseLeave={() => setHoveredSkill(null)}
              onClick={() => handleClick(skill)}
              style={{ cursor: "pointer" }}
            >
              {/* Hit area */}
              <path
                d={describeArc(startDeg, endDeg, innerR, outerR)}
                fill={isHighlighted ? color : "transparent"}
                fillOpacity={isHighlighted ? 0.7 : 0}
                stroke="none"
              />

              {/* Outer arc */}
              <path
                d={describeOuterArc(startDeg, endDeg, outerR)}
                fill="none"
                stroke={color}
                strokeWidth={isHighlighted ? 4 : 2}
                strokeLinecap="round"
              />

              {/* Radial spoke at slice start */}
              <line
                x1={polarToXY(startDeg - SLICE_GAP / 2, innerR).x}
                y1={polarToXY(startDeg - SLICE_GAP / 2, innerR).y}
                x2={polarToXY(startDeg - SLICE_GAP / 2, outerR).x}
                y2={polarToXY(startDeg - SLICE_GAP / 2, outerR).y}
                stroke="#ffffff"
                strokeWidth={0.3}
                opacity={0.06}
              />

              {/* Label */}
              {showLabel && (
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isHighlighted ? "#ffffff" : color}
                  fontSize={fontSize}
                  fontWeight="600"
                  opacity={isHighlighted ? 1 : 0.45}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {skill.name}
                </text>
              )}
            </g>
          );
        })}

        {isEmpty && (
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#ffffff"
            fontSize={10}
            opacity={0.3}
          >
            No skills selected
          </text>
        )}
      </svg>

      {/* Skill card panel */}
      <div className="w-full md:w-[200px] md:flex-shrink-0">
        {displayedSkill ? (
          <SkillCard skill={displayedSkill} />
        ) : (
          <div className="flex items-center justify-center h-[280px] text-white/20 text-xs text-center">
            Tap a segment to preview
          </div>
        )}
      </div>
    </div>
  );
}

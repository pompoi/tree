"use client";

import { useEffect, useMemo, useCallback, useState } from "react";
import { useBuildStore } from "@/stores/build-store";
import { SKILL_MAP, BASE_SKILL_IDS } from "@/data/skills";
import { SkillCard } from "@/components/skill-card/SkillCard";
import type { Skill, Branch } from "@/types/skill";

// ─── Constants ────────────────────────────────────────────────────────────────

const WHEEL_RADIUS = 160;
const SLICE_GAP = 1.5;

const BRANCH_COLORS: Record<Branch, string> = {
  attack: "#ef4444",
  movement: "#06b6d4",
  defend: "#22c55e",
};

// ─── SVG Helpers ─────────────────────────────────────────────────────────────

function degToRad(deg: number): number {
  return ((deg - 90) * Math.PI) / 180;
}

function polarToXY(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = degToRad(angleDeg);
  return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius };
}

function describeSlice(startDeg: number, endDeg: number, radius: number): string {
  let sweep = endDeg - startDeg;
  if (sweep <= 0) sweep += 360;
  const largeArc = sweep > 180 ? 1 : 0;
  const start = polarToXY(startDeg, radius);
  const end = polarToXY(endDeg, radius);
  return `M 0 0 L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

// ─── Ordering ────────────────────────────────────────────────────────────────

function dfsOrder(group: Skill[]): Skill[] {
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

function borderKey(skill: Skill): string | null {
  if (!skill.secondaryBranch) return null;
  return [skill.branch, skill.secondaryBranch].sort().join(",");
}

function orderForWheel(skills: Skill[]): { ordered: Skill[]; startAngle: number } {
  if (skills.length === 0) return { ordered: [], startAngle: 0 };

  const pureATK: Skill[] = [];
  const atkMov: Skill[] = [];
  const pureMOV: Skill[] = [];
  const movDef: Skill[] = [];
  const pureDEF: Skill[] = [];
  const defAtk: Skill[] = [];

  for (const skill of skills) {
    const bk = borderKey(skill);
    if (bk === "attack,movement") atkMov.push(skill);
    else if (bk === "defend,movement") movDef.push(skill);
    else if (bk === "attack,defend") defAtk.push(skill);
    else if (skill.branch === "attack") pureATK.push(skill);
    else if (skill.branch === "movement") pureMOV.push(skill);
    else pureDEF.push(skill);
  }

  const ordered = [
    ...dfsOrder(pureATK),
    ...dfsOrder(atkMov),
    ...dfsOrder(pureMOV),
    ...dfsOrder(movDef),
    ...dfsOrder(pureDEF),
    ...dfsOrder(defAtk),
  ];

  const sliceAngle = 360 / ordered.length;
  const atkCenter = (pureATK.length + defAtk.length / 2) / 2;
  const startAngle = -atkCenter * sliceAngle;

  return { ordered, startAngle };
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

  // The card to display: hovered takes priority, then selected
  const displayedSkill = hoveredSkill ?? selectedSkill;

  const allSkills = useMemo(() => {
    if (!activeBuild) return [];
    return activeBuild.decisionLog
      .map((entry) => SKILL_MAP.get(entry.skillId))
      .filter(Boolean) as Skill[];
  }, [activeBuild]);

  const { ordered, startAngle } = useMemo(
    () => orderForWheel(allSkills),
    [allSkills]
  );

  const vbSize = (WHEEL_RADIUS + 40) * 2;
  const sliceAngle = ordered.length > 0 ? 360 / ordered.length : 360;

  const handleClick = useCallback((skill: Skill) => {
    setSelectedSkill((prev) => (prev?.id === skill.id ? null : skill));
  }, []);

  const isEmpty = ordered.length === 0;

  return (
    <div className="w-full flex items-center justify-center gap-8">
      <svg
        viewBox={`${-vbSize / 2} ${-vbSize / 2} ${vbSize} ${vbSize}`}
        className="w-full max-w-[500px] h-auto flex-shrink-0"
        style={{ maxHeight: "calc(100vh - 200px)" }}
        xmlns="http://www.w3.org/2000/svg"
        onMouseLeave={() => setHoveredSkill(null)}
      >
        <defs>
          <filter id="slice-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {ordered.map((skill, i) => {
          const sStart = startAngle + i * sliceAngle;
          const sEnd = startAngle + (i + 1) * sliceAngle;
          const gap = ordered.length > 1 ? SLICE_GAP / 2 : 0;

          const color = BRANCH_COLORS[skill.branch];
          const midAngle = sStart + sliceAngle / 2;
          const labelPos = polarToXY(midAngle, WHEEL_RADIUS * 0.55);

          const fontSize = Math.max(6, Math.min(11, sliceAngle * 0.18));
          const showLabel = sliceAngle > 12;

          const isHighlighted = displayedSkill?.id === skill.id;

          // Outer arc endpoints
          const arcS = polarToXY(sStart + gap, WHEEL_RADIUS);
          const arcE = polarToXY(sEnd - gap, WHEEL_RADIUS);
          let sw = (sEnd - gap) - (sStart + gap);
          if (sw <= 0) sw += 360;
          const la = sw > 180 ? 1 : 0;

          return (
            <g
              key={skill.id}
              onMouseEnter={() => setHoveredSkill(skill)}
              onMouseLeave={() => setHoveredSkill(null)}
              onClick={() => handleClick(skill)}
              style={{ cursor: "pointer" }}
            >
              {/* Hit area (always covers full slice) */}
              <path
                d={describeSlice(sStart + gap, sEnd - gap, WHEEL_RADIUS)}
                fill={isHighlighted ? color : "transparent"}
                fillOpacity={isHighlighted ? 0.8 : 0}
                stroke="none"
              />

              {/* Outer arc — always visible */}
              <path
                d={`M ${arcS.x} ${arcS.y} A ${WHEEL_RADIUS} ${WHEEL_RADIUS} 0 ${la} 1 ${arcE.x} ${arcE.y}`}
                fill="none"
                stroke={color}
                strokeWidth={isHighlighted ? 6 : 3}
                strokeLinecap="round"
              />

              {/* Spoke line at slice start */}
              {ordered.length > 1 && (
                <line
                  x1={0}
                  y1={0}
                  x2={arcS.x}
                  y2={arcS.y}
                  stroke="#ffffff"
                  strokeWidth={0.5}
                  opacity={0.1}
                />
              )}

              {/* Label — only when highlighted or slices are wide enough */}
              {showLabel && (
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isHighlighted ? "#ffffff" : color}
                  fontSize={fontSize}
                  fontWeight="600"
                  opacity={isHighlighted ? 1 : 0.5}
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
      <div className="flex-shrink-0 w-[200px]">
        {displayedSkill ? (
          <SkillCard skill={displayedSkill} />
        ) : (
          <div className="flex items-center justify-center h-[280px] text-white/20 text-xs text-center">
            Hover a slice to preview
          </div>
        )}
      </div>
    </div>
  );
}

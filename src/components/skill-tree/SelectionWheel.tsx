"use client";

import { useEffect, useMemo, useCallback } from "react";
import { useBuildStore } from "@/stores/build-store";
import { SKILL_MAP, BASE_SKILL_IDS } from "@/data/skills";
import { Tooltip } from "@/components/ui/Tooltip";
import { useSkillTooltip } from "@/hooks/use-skill-tooltip";
import type { Skill, Branch } from "@/types/skill";

// ─── Constants ────────────────────────────────────────────────────────────────

const PIE_RADIUS = 55;
const MAX_RADIUS = 300;
const MAX_RING_WIDTH = 30;
const ARC_GAP = 1.5; // degrees of gap between slices
const RING_GAP = 1.5; // px gap between rings

const BRANCH_COLORS: Record<Branch, string> = {
  attack: "#ef4444",
  movement: "#06b6d4",
  defend: "#22c55e",
};

// Branch angular ranges (degrees, 0° = top/north, clockwise)
// Each branch occupies 120°, centered at its angle
const BRANCH_ARCS: Record<Branch, { start: number; end: number }> = {
  attack: { start: 300, end: 60 },
  movement: { start: 60, end: 180 },
  defend: { start: 180, end: 300 },
};

// ─── SVG Arc Helpers ──────────────────────────────────────────────────────────

/** Convert degrees (0° = top, clockwise) to standard math radians */
function degToRad(deg: number): number {
  // SVG: 0° = top means -90° in standard math, clockwise = positive
  return ((deg - 90) * Math.PI) / 180;
}

function polarToXY(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = degToRad(angleDeg);
  return {
    x: Math.cos(rad) * radius,
    y: Math.sin(rad) * radius,
  };
}

/**
 * Build an SVG path for an annular arc segment (donut slice).
 * startDeg/endDeg in our coordinate system (0° = top, clockwise).
 */
function describeArc(
  innerR: number,
  outerR: number,
  startDeg: number,
  endDeg: number
): string {
  // Normalize so we always sweep clockwise from start to end
  let sweep = endDeg - startDeg;
  if (sweep <= 0) sweep += 360;
  const largeArc = sweep > 180 ? 1 : 0;

  const outerStart = polarToXY(startDeg, outerR);
  const outerEnd = polarToXY(endDeg, outerR);
  const innerEnd = polarToXY(endDeg, innerR);
  const innerStart = polarToXY(startDeg, innerR);

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    `Z`,
  ].join(" ");
}

/** Get the midpoint angle of a branch arc (for label placement) */
function branchMidAngle(branch: Branch): number {
  const arc = BRANCH_ARCS[branch];
  let mid = (arc.start + arc.end) / 2;
  // Handle the wrap-around for attack (300→60)
  if (arc.start > arc.end) {
    mid = (arc.start + arc.end + 360) / 2;
    if (mid >= 360) mid -= 360;
  }
  return mid;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SelectionWheel() {
  // Rehydrate persisted Zustand state on mount
  useEffect(() => {
    useBuildStore.persist.rehydrate();
  }, []);

  const builds = useBuildStore((s) => s.builds);
  const activeSlot = useBuildStore((s) => s.activeSlot);
  const activeBuild = builds[activeSlot];

  const { tooltipSkill, tooltipPosition, showTooltip, hideTooltip } =
    useSkillTooltip();

  // ─── Derive base skills and selections from decision log ────────────
  const baseSkills = useMemo(
    () =>
      BASE_SKILL_IDS.map((id) => SKILL_MAP.get(id)).filter(Boolean) as Skill[],
    []
  );

  const selections = useMemo(() => {
    if (!activeBuild) return [];
    return activeBuild.decisionLog
      .filter((entry) => !BASE_SKILL_IDS.includes(entry.skillId))
      .map((entry) => SKILL_MAP.get(entry.skillId))
      .filter(Boolean) as Skill[];
  }, [activeBuild]);

  // ─── Ring dimensions ────────────────────────────────────────────────
  const ringWidth = useMemo(() => {
    if (selections.length === 0) return MAX_RING_WIDTH;
    return Math.min(
      MAX_RING_WIDTH,
      (MAX_RADIUS - PIE_RADIUS - selections.length * RING_GAP) /
        selections.length
    );
  }, [selections.length]);

  // ─── Outer extent for viewBox ───────────────────────────────────────
  const outerExtent = useMemo(() => {
    if (selections.length === 0) return PIE_RADIUS + 40;
    return PIE_RADIUS + selections.length * (ringWidth + RING_GAP) + 30;
  }, [selections.length, ringWidth]);

  const vbSize = Math.max(outerExtent * 2 + 60, 300);

  // ─── Hover handler ──────────────────────────────────────────────────
  const handleArcHover = useCallback(
    (skill: Skill, event: React.MouseEvent) => {
      showTooltip(skill, event.clientX, event.clientY);
    },
    [showTooltip]
  );

  // ─── Build base skill map by branch for pie labels ──────────────────
  const baseByBranch = useMemo(() => {
    const map = new Map<Branch, Skill>();
    for (const skill of baseSkills) {
      map.set(skill.branch, skill);
    }
    return map;
  }, [baseSkills]);

  const isEmpty = selections.length === 0;

  return (
    <div className="w-full flex items-center justify-center">
      <svg
        viewBox={`${-vbSize / 2} ${-vbSize / 2} ${vbSize} ${vbSize}`}
        className="w-full max-w-[700px] h-auto"
        style={{ maxHeight: "calc(100vh - 200px)" }}
        xmlns="http://www.w3.org/2000/svg"
        onMouseLeave={hideTooltip}
      >
        {/* Glow filter */}
        <defs>
          <filter id="ring-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Center pie chart (base skills) ── */}
        {(["attack", "movement", "defend"] as Branch[]).map((branch) => {
          const arc = BRANCH_ARCS[branch];
          const color = BRANCH_COLORS[branch];
          const skill = baseByBranch.get(branch);
          const mid = branchMidAngle(branch);
          const labelPos = polarToXY(mid, PIE_RADIUS * 0.55);

          return (
            <g
              key={branch}
              onMouseEnter={(e) => skill && handleArcHover(skill, e)}
              onMouseMove={(e) => skill && handleArcHover(skill, e)}
              onMouseLeave={hideTooltip}
              style={{ cursor: "default" }}
            >
              <path
                d={describeArc(0, PIE_RADIUS, arc.start + ARC_GAP / 2, arc.end - ARC_GAP / 2)}
                fill={color}
                fillOpacity={0.85}
                stroke="#ffffff"
                strokeWidth={1.5}
              />
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffff"
                fontSize={9}
                fontWeight="600"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {skill?.name ?? branch}
              </text>
            </g>
          );
        })}

        {/* ── Selection rings ── */}
        {selections.map((skill, i) => {
          const innerR = PIE_RADIUS + i * (ringWidth + RING_GAP) + RING_GAP;
          const outerR = innerR + ringWidth;
          const branch = skill.branch;
          const arc = BRANCH_ARCS[branch];
          const color = BRANCH_COLORS[branch];
          const mid = branchMidAngle(branch);
          const labelR = (innerR + outerR) / 2;
          const labelPos = polarToXY(mid, labelR);

          // Font size scales with ring width, clamped
          const fontSize = Math.max(6, Math.min(10, ringWidth * 0.4));
          const showLabel = ringWidth > 10;

          return (
            <g
              key={`${skill.id}-${i}`}
              onMouseEnter={(e) => handleArcHover(skill, e)}
              onMouseMove={(e) => handleArcHover(skill, e)}
              onMouseLeave={hideTooltip}
              style={{ cursor: "default" }}
            >
              {/* Faint ring outline for context */}
              <circle
                cx={0}
                cy={0}
                r={(innerR + outerR) / 2}
                fill="none"
                stroke="#ffffff"
                strokeWidth={0.5}
                opacity={0.04}
              />

              {/* Primary branch arc */}
              <path
                d={describeArc(innerR, outerR, arc.start + ARC_GAP / 2, arc.end - ARC_GAP / 2)}
                fill={color}
                fillOpacity={0.8}
                stroke="#ffffff"
                strokeWidth={0.8}
                filter="url(#ring-glow)"
              />

              {/* Secondary branch stripe (thin inner edge) */}
              {skill.secondaryBranch && (() => {
                const secArc = BRANCH_ARCS[skill.secondaryBranch];
                const secColor = BRANCH_COLORS[skill.secondaryBranch];
                const stripeWidth = Math.max(2, ringWidth * 0.2);
                return (
                  <path
                    d={describeArc(
                      innerR,
                      innerR + stripeWidth,
                      secArc.start + ARC_GAP / 2,
                      secArc.end - ARC_GAP / 2
                    )}
                    fill={secColor}
                    fillOpacity={0.6}
                    stroke="none"
                  />
                );
              })()}

              {/* Skill name label */}
              {showLabel && (
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#ffffff"
                  fontSize={fontSize}
                  fontWeight="500"
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {skill.name}
                </text>
              )}

              {/* Ring number (small, at the arc's inner edge center) */}
              {showLabel && (() => {
                const numPos = polarToXY(mid, innerR + 6);
                return (
                  <text
                    x={numPos.x}
                    y={numPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#ffffff"
                    fontSize={6}
                    fontWeight="600"
                    opacity={0.5}
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {i + 1}
                  </text>
                );
              })()}
            </g>
          );
        })}

        {/* ── Empty state ── */}
        {isEmpty && (
          <text
            x={0}
            y={PIE_RADIUS + 30}
            textAnchor="middle"
            fill="#ffffff"
            fontSize={10}
            opacity={0.3}
          >
            Unlock skills in the tree to see rings here
          </text>
        )}
      </svg>

      <Tooltip skill={tooltipSkill} position={tooltipPosition} />
    </div>
  );
}

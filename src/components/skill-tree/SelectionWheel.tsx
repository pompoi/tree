"use client";

import { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { useBuildStore } from "@/stores/build-store";
import { SKILL_MAP, BASE_SKILL_IDS } from "@/data/skills";
import { Tooltip } from "@/components/ui/Tooltip";
import { useSkillTooltip } from "@/hooks/use-skill-tooltip";
import type { Skill, Branch, Tier } from "@/types/skill";

// ─── Constants ────────────────────────────────────────────────────────────────

const WHEEL_RADIUS = 200;
const BASE_RING_RADIUS = 80;
const NODE_RADIUS = 22;
const BASE_NODE_RADIUS = 18;

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

const TIER_BADGES: Record<Tier, string> = {
  0: "\u2605",
  1: "I",
  2: "II",
  3: "III",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function SelectionWheel() {
  const svgRef = useRef<SVGSVGElement>(null);

  // Rehydrate persisted Zustand state on mount
  useEffect(() => {
    useBuildStore.persist.rehydrate();
  }, []);

  const builds = useBuildStore((s) => s.builds);
  const activeSlot = useBuildStore((s) => s.activeSlot);
  const activeBuild = builds[activeSlot];

  const { tooltipSkill, tooltipPosition, showTooltip, hideTooltip } =
    useSkillTooltip();

  // ─── Cursor tracking for direction line ─────────────────────────────────
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [nearestIdx, setNearestIdx] = useState<number | null>(null);

  // ─── Separate base skills and selected skills ──────────────────────────
  const baseSkills = useMemo(
    () =>
      BASE_SKILL_IDS.map((id) => SKILL_MAP.get(id)).filter(
        Boolean
      ) as Skill[],
    []
  );

  const selectedSkills = useMemo(() => {
    if (!activeBuild) return [];
    // Get non-base skills in decision log order
    return activeBuild.decisionLog
      .filter((entry) => !BASE_SKILL_IDS.includes(entry.skillId))
      .map((entry) => SKILL_MAP.get(entry.skillId))
      .filter(Boolean) as Skill[];
  }, [activeBuild]);

  // ─── Position selected skills evenly around the outer ring ─────────────
  const selectedPositions = useMemo(() => {
    const count = selectedSkills.length;
    if (count === 0) return [];
    const angleStep = (2 * Math.PI) / count;
    // Start from the top (-π/2 offset, but we use sin/cos with 0=top convention)
    return selectedSkills.map((skill, i) => {
      const angle = angleStep * i;
      return {
        skill,
        angle,
        x: Math.sin(angle) * WHEEL_RADIUS,
        y: -Math.cos(angle) * WHEEL_RADIUS,
      };
    });
  }, [selectedSkills]);

  // ─── Position base skills in a tight inner ring ────────────────────────
  const basePositions = useMemo(() => {
    const count = baseSkills.length;
    const angleStep = (2 * Math.PI) / count;
    return baseSkills.map((skill, i) => {
      const angle = angleStep * i;
      return {
        skill,
        angle,
        x: Math.sin(angle) * BASE_RING_RADIUS,
        y: -Math.cos(angle) * BASE_RING_RADIUS,
      };
    });
  }, [baseSkills]);

  // ─── All positioned skills (for nearest detection) ─────────────────────
  const allPositioned = useMemo(
    () => [...basePositions, ...selectedPositions],
    [basePositions, selectedPositions]
  );

  // ─── Mouse tracking ────────────────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mx = e.clientX - centerX;
      const my = e.clientY - centerY;

      // Convert to SVG units (viewBox is 700x700 centered)
      const scaleX = 700 / rect.width;
      const scaleY = 700 / rect.height;
      const svgX = mx * scaleX;
      const svgY = my * scaleY;

      setMousePos({ x: svgX, y: svgY });

      // Find nearest skill by distance
      if (allPositioned.length === 0) {
        setNearestIdx(null);
        return;
      }
      let minDist = Infinity;
      let minIdx = 0;
      for (let i = 0; i < allPositioned.length; i++) {
        const p = allPositioned[i];
        const dx = svgX - p.x;
        const dy = svgY - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          minIdx = i;
        }
      }
      setNearestIdx(minIdx);
    },
    [allPositioned]
  );

  const handleMouseLeave = useCallback(() => {
    setMousePos(null);
    setNearestIdx(null);
    hideTooltip();
  }, [hideTooltip]);

  const handleNodeHover = useCallback(
    (skill: Skill, event: React.MouseEvent) => {
      showTooltip(skill, event.clientX, event.clientY);
    },
    [showTooltip]
  );

  // ─── Direction line endpoint (clamped to outer ring) ───────────────────
  const lineEnd = useMemo(() => {
    if (!mousePos) return null;
    const dist = Math.sqrt(mousePos.x * mousePos.x + mousePos.y * mousePos.y);
    if (dist < 5) return null;
    const clampedDist = Math.min(dist, WHEEL_RADIUS + 40);
    return {
      x: (mousePos.x / dist) * clampedDist,
      y: (mousePos.y / dist) * clampedDist,
    };
  }, [mousePos]);

  // ─── Empty state ───────────────────────────────────────────────────────
  const isEmpty = selectedSkills.length === 0;

  return (
    <div className="w-full flex items-center justify-center">
      <svg
        ref={svgRef}
        viewBox="-350 -350 700 700"
        className="w-full max-w-[700px] h-auto"
        style={{ maxHeight: "calc(100vh - 200px)" }}
        xmlns="http://www.w3.org/2000/svg"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Glow filter */}
        <defs>
          <filter id="wheel-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter
            id="nearest-glow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Direction line */}
        {lineEnd && (
          <line
            x1={0}
            y1={0}
            x2={lineEnd.x}
            y2={lineEnd.y}
            stroke="#ffffff"
            strokeWidth={1}
            opacity={0.2}
          />
        )}

        {/* Outer ring (selected skills ring) */}
        <circle
          cx={0}
          cy={0}
          r={WHEEL_RADIUS}
          fill="none"
          stroke="#ffffff"
          strokeWidth={1}
          opacity={0.1}
          strokeDasharray="6 4"
        />

        {/* Inner ring (base skills ring) */}
        <circle
          cx={0}
          cy={0}
          r={BASE_RING_RADIUS}
          fill="none"
          stroke="#ffffff"
          strokeWidth={1}
          opacity={0.08}
        />

        {/* Center dot */}
        <circle cx={0} cy={0} r={4} fill="#ffffff" opacity={0.15} />

        {/* "BASE" label */}
        <text
          x={0}
          y={-BASE_RING_RADIUS - 10}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={8}
          opacity={0.25}
          fontWeight="600"
          letterSpacing="0.1em"
        >
          BASE
        </text>

        {/* "SELECTED" label */}
        {!isEmpty && (
          <text
            x={0}
            y={-WHEEL_RADIUS - 14}
            textAnchor="middle"
            fill="#ffffff"
            fontSize={8}
            opacity={0.25}
            fontWeight="600"
            letterSpacing="0.1em"
          >
            SELECTED
          </text>
        )}

        {/* Empty state text */}
        {isEmpty && (
          <text
            x={0}
            y={-WHEEL_RADIUS}
            textAnchor="middle"
            fill="#ffffff"
            fontSize={10}
            opacity={0.3}
          >
            Unlock skills in the tree view to see them here
          </text>
        )}

        {/* Base skill nodes (inner ring) */}
        {basePositions.map((pos, i) => {
          const isNearest = nearestIdx === i;
          const color = BRANCH_COLORS[pos.skill.branch];
          return (
            <g
              key={pos.skill.id}
              onMouseEnter={(e) => handleNodeHover(pos.skill, e)}
              onMouseLeave={hideTooltip}
              style={{ cursor: "default" }}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r={BASE_NODE_RADIUS}
                fill={color}
                fillOpacity={isNearest ? 1 : 0.7}
                stroke="#ffffff"
                strokeWidth={isNearest ? 2.5 : 1.5}
                filter={isNearest ? "url(#nearest-glow)" : undefined}
              />
              <text
                x={pos.x}
                y={pos.y - 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffff"
                fontSize={7}
                fontWeight="600"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {BRANCH_ICONS[pos.skill.branch]}
              </text>
              <text
                x={pos.x}
                y={pos.y + BASE_NODE_RADIUS + 10}
                textAnchor="middle"
                fill="#ffffff"
                fontSize={8}
                opacity={isNearest ? 0.9 : 0.5}
                fontWeight="500"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {pos.skill.name}
              </text>
            </g>
          );
        })}

        {/* Selected skill nodes (outer ring) */}
        {selectedPositions.map((pos, i) => {
          const globalIdx = basePositions.length + i;
          const isNearest = nearestIdx === globalIdx;
          const color = BRANCH_COLORS[pos.skill.branch];
          const tierBadge = TIER_BADGES[pos.skill.tier as Tier];
          const hasSecondary = Boolean(pos.skill.secondaryBranch);

          return (
            <g
              key={pos.skill.id}
              onMouseEnter={(e) => handleNodeHover(pos.skill, e)}
              onMouseLeave={hideTooltip}
              style={{ cursor: "default" }}
            >
              {/* Connection line from center to node */}
              <line
                x1={0}
                y1={0}
                x2={pos.x}
                y2={pos.y}
                stroke={color}
                strokeWidth={isNearest ? 1.5 : 0.5}
                opacity={isNearest ? 0.4 : 0.1}
              />

              {/* Node */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={NODE_RADIUS}
                fill={color}
                fillOpacity={isNearest ? 1 : 0.85}
                stroke="#ffffff"
                strokeWidth={isNearest ? 2.5 : 1.5}
                filter={isNearest ? "url(#nearest-glow)" : "url(#wheel-glow)"}
              />

              {/* Secondary branch indicator */}
              {hasSecondary && pos.skill.secondaryBranch && (
                <circle
                  cx={pos.x + NODE_RADIUS * 0.6}
                  cy={pos.y - NODE_RADIUS * 0.6}
                  r={NODE_RADIUS * 0.25}
                  fill={BRANCH_COLORS[pos.skill.secondaryBranch]}
                  stroke="#00000060"
                  strokeWidth={0.5}
                />
              )}

              {/* Tier badge inside */}
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffff"
                fontSize={9}
                fontWeight="700"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {tierBadge}
              </text>

              {/* Skill name outside */}
              <text
                x={pos.x}
                y={pos.y + NODE_RADIUS + 12}
                textAnchor="middle"
                fill="#ffffff"
                fontSize={9}
                opacity={isNearest ? 1 : 0.6}
                fontWeight={isNearest ? "600" : "400"}
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {pos.skill.name}
              </text>

              {/* Selection order number */}
              <text
                x={pos.x}
                y={pos.y - NODE_RADIUS - 6}
                textAnchor="middle"
                fill={color}
                fontSize={7}
                opacity={0.6}
                fontWeight="600"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                #{i + 1}
              </text>
            </g>
          );
        })}
      </svg>

      <Tooltip skill={tooltipSkill} position={tooltipPosition} />
    </div>
  );
}

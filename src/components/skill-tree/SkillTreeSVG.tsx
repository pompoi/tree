"use client";

import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import { buildSkillGraph } from "@/data/graph";
import { TIER_RADII } from "@/data/layout";
import { TierRing } from "./TierRing";
import { BranchSlice } from "./BranchSlice";
import { SkillEdge } from "./SkillEdge";
import { SkillNode } from "./SkillNode";
import { DirectionLine } from "./DirectionLine";
import { TreeLegend } from "./TreeLegend";
import { Tooltip } from "@/components/ui/Tooltip";
import { useSkillTooltip } from "@/hooks/use-skill-tooltip";
import { useMouseAngle } from "@/hooks/use-mouse-angle";
import { useBuildStore } from "@/stores/build-store";
import type { Skill, Branch } from "@/types/skill";

const TIER_RING_RADII = Object.values(TIER_RADII) as number[];

// Default viewBox parameters
const DEFAULT_VB = { x: -450, y: -450, w: 900, h: 900 };
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

export function SkillTreeSVG() {
  const { nodes, edges } = useMemo(() => buildSkillGraph(), []);
  const svgRef = useRef<SVGSVGElement>(null);

  // ─── Pan & Zoom state ────────────────────────────────────────────────
  const [viewBox, setViewBox] = useState(DEFAULT_VB);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const viewBoxStartRef = useRef(DEFAULT_VB);

  // Rehydrate persisted Zustand state on mount
  useEffect(() => {
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

  const { tooltipSkill, tooltipPosition, showTooltip, hideTooltip } =
    useSkillTooltip();

  const {
    lineEndX,
    lineEndY,
    radius: mouseRadius,
    nearestBranch,
    handleMouseMove,
  } = useMouseAngle();

  const handleNodeHover = useCallback(
    (skill: Skill, event: React.MouseEvent) => {
      showTooltip(skill, event.clientX, event.clientY);
    },
    [showTooltip]
  );

  const handleNodeClick = useCallback(
    (skillId: string) => {
      if (unlockedSet.has(skillId)) {
        lockSkill(skillId);
      } else {
        unlockSkill(skillId);
      }
    },
    [unlockedSet, unlockSkill, lockSkill]
  );

  // ─── Wheel zoom ──────────────────────────────────────────────────────
  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault();
      const scaleFactor = e.deltaY > 0 ? 1.1 : 0.9;

      setViewBox((prev) => {
        const newW = prev.w * scaleFactor;
        const newH = prev.h * scaleFactor;

        // Enforce scale limits based on original viewBox size
        const currentScale = DEFAULT_VB.w / newW;
        if (currentScale < MIN_SCALE || currentScale > MAX_SCALE) {
          return prev;
        }

        // Zoom toward center of viewport
        const dw = newW - prev.w;
        const dh = newH - prev.h;

        return {
          x: prev.x - dw / 2,
          y: prev.y - dh / 2,
          w: newW,
          h: newH,
        };
      });
    },
    []
  );

  // ─── Pan (mouse drag) ────────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      // Only start pan on middle click or when holding shift
      if (e.button === 1 || e.shiftKey) {
        e.preventDefault();
        setIsPanning(true);
        panStartRef.current = { x: e.clientX, y: e.clientY };
        viewBoxStartRef.current = viewBox;
      }
    },
    [viewBox]
  );

  const handleMouseMovePan = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      handleMouseMove(e);

      if (!isPanning) return;

      const svg = svgRef.current;
      if (!svg) return;

      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;

      // Convert screen pixels to SVG units
      const rect = svg.getBoundingClientRect();
      const scaleX = viewBoxStartRef.current.w / rect.width;
      const scaleY = viewBoxStartRef.current.h / rect.height;

      setViewBox({
        ...viewBoxStartRef.current,
        x: viewBoxStartRef.current.x - dx * scaleX,
        y: viewBoxStartRef.current.y - dy * scaleY,
      });
    },
    [isPanning, handleMouseMove]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // ─── Double-click reset ──────────────────────────────────────────────
  const handleDoubleClick = useCallback(() => {
    setViewBox(DEFAULT_VB);
  }, []);

  // Show direction line only when mouse is within a reasonable radius
  const showDirectionLine = mouseRadius > 10;

  return (
    <div className="w-full flex items-center justify-center">
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className="w-full max-w-[860px] h-auto"
        style={{
          maxHeight: "calc(100vh - 200px)",
          cursor: isPanning ? "grabbing" : "default",
        }}
        xmlns="http://www.w3.org/2000/svg"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMovePan}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          handleMouseUp();
          hideTooltip();
        }}
        onDoubleClick={handleDoubleClick}
      >
        {/* SVG filter definitions */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Layer 0: Direction line */}
        <DirectionLine
          endX={lineEndX}
          endY={lineEndY}
          visible={showDirectionLine}
        />

        {/* Layer 1: Tier rings */}
        <g>
          {TIER_RING_RADII.map((radius) => (
            <TierRing key={radius} radius={radius} />
          ))}
        </g>

        {/* Layer 2: Branch slice dividers and labels */}
        <BranchSlice />

        {/* Layer 3: Prerequisite edges */}
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

        {/* Layer 4: Skill nodes (rendered on top) */}
        <g>
          {Array.from(nodes.values()).map((node) => {
            // Brighten nodes in the hovered branch
            const isHighlightedBranch =
              nearestBranch !== null && node.skill.branch === nearestBranch;

            return (
              <SkillNode
                key={node.skill.id}
                node={node}
                unlockedSkillIds={unlockedSet}
                onHover={handleNodeHover}
                onHoverEnd={hideTooltip}
                onClick={handleNodeClick}
                highlighted={isHighlightedBranch}
              />
            );
          })}
        </g>

        {/* Layer 5: Legend */}
        <TreeLegend />
      </svg>

      <Tooltip skill={tooltipSkill} position={tooltipPosition} />
    </div>
  );
}

"use client";

import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import { SKILLS } from "@/data/skills";
import { getSkillPosition } from "@/data/layout";
import { canUnlock } from "@/lib/graph-utils";
import { polarToCartesian } from "@/lib/polar";
import { SkillEdge } from "./SkillEdge";
import { SkillNode } from "./SkillNode";
import { Tooltip } from "@/components/ui/Tooltip";
import { useSkillTooltip } from "@/hooks/use-skill-tooltip";
import { useBuildStore } from "@/stores/build-store";
import type { Skill } from "@/types/skill";
import type { SkillNode as SkillNodeType, SkillEdge as SkillEdgeType } from "@/types/graph";

// Default viewBox parameters
const DEFAULT_VB = { x: -450, y: -450, w: 900, h: 900 };
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

export function SkillTreeSVG() {
  const svgRef = useRef<SVGSVGElement>(null);

  // ─── Pan & Zoom state ──────────────────────────────────────────────
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

  // ─── Visible skills: unlocked + available ──────────────────────────
  const { nodes, edges } = useMemo(() => {
    const visibleSkills: Skill[] = [];
    const visibleIds = new Set<string>();

    for (const skill of SKILLS) {
      if (unlockedSet.has(skill.id) || canUnlock(skill.id, unlockedSet)) {
        visibleSkills.push(skill);
        visibleIds.add(skill.id);
      }
    }

    // Build node map with deterministic polar positions
    const nodeMap = new Map<string, SkillNodeType>();
    for (const skill of visibleSkills) {
      const { angle, radius } = getSkillPosition(skill);
      const { x, y } = polarToCartesian(angle, radius);
      nodeMap.set(skill.id, { skill, angle, radius, x, y });
    }

    // Build edges (only between visible nodes)
    const edgeList: SkillEdgeType[] = [];
    for (const skill of visibleSkills) {
      for (const prereqId of skill.prerequisites) {
        if (visibleIds.has(prereqId)) {
          edgeList.push({ from: prereqId, to: skill.id });
        }
      }
    }

    return { nodes: nodeMap, edges: edgeList };
  }, [unlockedSet]);

  // ─── Handlers ──────────────────────────────────────────────────────
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

  // ─── Wheel zoom ────────────────────────────────────────────────────
  const handleWheel = useCallback(
    (e: React.WheelEvent<SVGSVGElement>) => {
      e.preventDefault();
      const scaleFactor = e.deltaY > 0 ? 1.1 : 0.9;

      setViewBox((prev) => {
        const newW = prev.w * scaleFactor;
        const newH = prev.h * scaleFactor;

        const currentScale = DEFAULT_VB.w / newW;
        if (currentScale < MIN_SCALE || currentScale > MAX_SCALE) {
          return prev;
        }

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

  // ─── Pan (mouse drag) ──────────────────────────────────────────────
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (e.button === 1 || e.shiftKey) {
        e.preventDefault();
        setIsPanning(true);
        panStartRef.current = { x: e.clientX, y: e.clientY };
        viewBoxStartRef.current = viewBox;
      }
    },
    [viewBox]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isPanning) return;

      const svg = svgRef.current;
      if (!svg) return;

      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;

      const rect = svg.getBoundingClientRect();
      const scaleX = viewBoxStartRef.current.w / rect.width;
      const scaleY = viewBoxStartRef.current.h / rect.height;

      setViewBox({
        ...viewBoxStartRef.current,
        x: viewBoxStartRef.current.x - dx * scaleX,
        y: viewBoxStartRef.current.y - dy * scaleY,
      });
    },
    [isPanning]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleDoubleClick = useCallback(() => {
    setViewBox(DEFAULT_VB);
  }, []);

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
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          handleMouseUp();
          hideTooltip();
        }}
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

        {/* Skill nodes */}
        <g>
          {Array.from(nodes.values()).map((node) => (
            <SkillNode
              key={node.skill.id}
              node={node}
              unlockedSkillIds={unlockedSet}
              onHover={handleNodeHover}
              onHoverEnd={hideTooltip}
              onClick={handleNodeClick}
            />
          ))}
        </g>
      </svg>

      <Tooltip skill={tooltipSkill} position={tooltipPosition} />
    </div>
  );
}

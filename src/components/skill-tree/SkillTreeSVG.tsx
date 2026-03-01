"use client";

import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import { SKILLS, SKILL_MAP, BASE_SKILL_IDS } from "@/data/skills";
import { getSkillPosition } from "@/data/layout";
import { canUnlock } from "@/lib/graph-utils";
import { polarToCartesian } from "@/lib/polar";
import { SkillEdge } from "./SkillEdge";
import { SkillNode } from "./SkillNode";
import { Tooltip } from "@/components/ui/Tooltip";
import { useSkillTooltip } from "@/hooks/use-skill-tooltip";
import { useForceLayout } from "@/hooks/use-force-layout";
import { useBuildStore } from "@/stores/build-store";
import type { Skill, Branch } from "@/types/skill";
import type { SkillNode as SkillNodeType } from "@/types/graph";
import type { ForceNode, ForceEdge } from "@/hooks/use-force-layout";

// ─── Constants ───────────────────────────────────────────────────────────────

const BASE_RADIUS = 100;
const BRANCH_ANGLES: Record<Branch, number> = {
  attack: 0,
  movement: (2 * Math.PI) / 3,
  defend: (4 * Math.PI) / 3,
};

// Default viewBox parameters
const DEFAULT_VB = { x: -350, y: -350, w: 700, h: 700 };
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

// ─── Component ───────────────────────────────────────────────────────────────

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

  // ─── Compute visible skills (unlocked + available) ─────────────────
  const visibleSkills = useMemo(() => {
    const visible: Skill[] = [];
    for (const skill of SKILLS) {
      if (unlockedSet.has(skill.id) || canUnlock(skill.id, unlockedSet)) {
        visible.push(skill);
      }
    }
    return visible;
  }, [unlockedSet]);

  // ─── Pinned base positions ─────────────────────────────────────────
  const pinnedPositions = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    for (const id of BASE_SKILL_IDS) {
      const skill = SKILL_MAP.get(id);
      if (!skill) continue;
      const angle = BRANCH_ANGLES[skill.branch];
      const pos = polarToCartesian(angle, BASE_RADIUS);
      m.set(id, pos);
    }
    return m;
  }, []);

  // ─── Force layout inputs ──────────────────────────────────────────
  const forceNodes = useMemo<ForceNode[]>(() => {
    return visibleSkills.map((skill) => {
      const pin = pinnedPositions.get(skill.id);
      if (pin) {
        return { id: skill.id, x0: pin.x, y0: pin.y, branch: skill.branch };
      }
      // Use polar layout as initial position hint
      const { angle, radius } = getSkillPosition(skill);
      const pos = polarToCartesian(angle, radius);
      return { id: skill.id, x0: pos.x, y0: pos.y, branch: skill.branch };
    });
  }, [visibleSkills, pinnedPositions]);

  const visibleIds = useMemo(
    () => new Set(visibleSkills.map((s) => s.id)),
    [visibleSkills]
  );

  const forceEdges = useMemo<ForceEdge[]>(() => {
    const edges: ForceEdge[] = [];
    for (const skill of visibleSkills) {
      for (const prereqId of skill.prerequisites) {
        if (visibleIds.has(prereqId)) {
          edges.push({ from: prereqId, to: skill.id });
        }
      }
    }
    return edges;
  }, [visibleSkills, visibleIds]);

  // ─── Run force simulation ──────────────────────────────────────────
  const positions = useForceLayout(forceNodes, forceEdges, pinnedPositions);

  // ─── Build SkillNode objects from force positions ──────────────────
  const nodeMap = useMemo(() => {
    const m = new Map<string, SkillNodeType>();
    for (const skill of visibleSkills) {
      const pos = positions.get(skill.id) ?? { x: 0, y: 0 };
      m.set(skill.id, {
        skill,
        angle: 0, // not used in force layout
        radius: 0,
        x: pos.x,
        y: pos.y,
      });
    }
    return m;
  }, [visibleSkills, positions]);

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

        {/* Prerequisite edges */}
        <g>
          {forceEdges.map((edge) => {
            const fromNode = nodeMap.get(edge.from);
            const toNode = nodeMap.get(edge.to);
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

        {/* Skill nodes (rendered on top) */}
        <g>
          {Array.from(nodeMap.values()).map((node) => (
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

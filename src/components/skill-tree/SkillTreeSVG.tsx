"use client";

import { useEffect, useMemo, useCallback, useState, useRef } from "react";
import { SKILLS } from "@/data/skills";
import { canUnlock } from "@/lib/graph-utils";
import { computeHexLayout, getHexRadii, hexVertices } from "@/lib/radial-layout";
import { SkillEdge } from "./SkillEdge";
import { SkillNode } from "./SkillNode";
import { Tooltip } from "@/components/ui/Tooltip";
import { useSkillTooltip } from "@/hooks/use-skill-tooltip";
import { useBuildStore } from "@/stores/build-store";
import type { Skill, Branch } from "@/types/skill";
import type { SkillNode as SkillNodeType, SkillEdge as SkillEdgeType } from "@/types/graph";

// Default viewBox parameters
const DEFAULT_VB = { x: -450, y: -450, w: 900, h: 900 };
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

// Branch labels positioned outside edge midpoints
const BRANCH_LABELS: { branch: Branch; label: string; color: string; edgeIdx: number }[] = [
  { branch: "attack", label: "ATTACK", color: "#ef4444", edgeIdx: 0 },
  { branch: "movement", label: "MOVEMENT", color: "#06b6d4", edgeIdx: 2 },
  { branch: "defend", label: "DEFEND", color: "#22c55e", edgeIdx: 4 },
];

// Branch background color sectors (120° each)
const BRANCH_SECTORS = [
  { color: "#ef4444", startDeg: 300, endDeg: 60 },   // ATK (top)
  { color: "#06b6d4", startDeg: 60, endDeg: 180 },    // MOV (bottom-right)
  { color: "#22c55e", startDeg: 180, endDeg: 300 },   // DEF (bottom-left)
];

function sectorPath(startDeg: number, endDeg: number, r: number): string {
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const x1 = Math.cos(toRad(startDeg)) * r;
  const y1 = Math.sin(toRad(startDeg)) * r;
  const x2 = Math.cos(toRad(endDeg)) * r;
  const y2 = Math.sin(toRad(endDeg)) * r;
  return `M 0 0 L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
}

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
  const { nodes, edges, hexRadii } = useMemo(() => {
    const visibleSkills: Skill[] = [];
    const visibleIds = new Set<string>();

    for (const skill of SKILLS) {
      if (unlockedSet.has(skill.id) || canUnlock(skill.id, unlockedSet)) {
        visibleSkills.push(skill);
        visibleIds.add(skill.id);
      }
    }

    // Hex layout — BFS from base skills, snap to hex edges
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

    // Build edges (only between visible nodes)
    const edgeList: SkillEdgeType[] = [];
    for (const skill of visibleSkills) {
      for (const prereqId of skill.prerequisites) {
        if (visibleIds.has(prereqId)) {
          edgeList.push({ from: prereqId, to: skill.id });
        }
      }
    }

    return { nodes: nodeMap, edges: edgeList, hexRadii: radii };
  }, [unlockedSet]);

  // ─── Hex ring outlines ─────────────────────────────────────────────
  const hexRingPaths = useMemo(() => {
    return hexRadii.map((r) => {
      const verts = hexVertices(r);
      const d = verts
        .map((v, i) => `${i === 0 ? "M" : "L"} ${v.x} ${v.y}`)
        .join(" ");
      return d + " Z";
    });
  }, [hexRadii]);

  // ─── Branch label positions (outside the outermost hex) ────────────
  const labelPositions = useMemo(() => {
    const outerR = hexRadii.length > 0 ? hexRadii[hexRadii.length - 1] + 30 : 110;
    const verts = hexVertices(outerR);

    return BRANCH_LABELS.map(({ label, color, edgeIdx }) => {
      const v1 = verts[edgeIdx];
      const v2 = verts[(edgeIdx + 1) % 6];
      const mid = { x: (v1.x + v2.x) / 2, y: (v1.y + v2.y) / 2 };
      // Push outward from center
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
          <filter id="bg-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="80" />
          </filter>
        </defs>

        {/* Branch color background wash */}
        <g filter="url(#bg-blur)">
          {BRANCH_SECTORS.map(({ color, startDeg, endDeg }) => (
            <path
              key={color}
              d={sectorPath(startDeg, endDeg, 600)}
              fill={color}
              opacity={0.12}
            />
          ))}
        </g>

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

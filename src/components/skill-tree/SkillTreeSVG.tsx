"use client";

import { useEffect, useMemo, useCallback } from "react";
import { buildSkillGraph } from "@/data/graph";
import { TIER_RADII } from "@/data/layout";
import { TierRing } from "./TierRing";
import { BranchSlice } from "./BranchSlice";
import { SkillEdge } from "./SkillEdge";
import { SkillNode } from "./SkillNode";
import { Tooltip } from "@/components/ui/Tooltip";
import { useSkillTooltip } from "@/hooks/use-skill-tooltip";
import { useBuildStore } from "@/stores/build-store";
import type { Skill } from "@/types/skill";

const TIER_RING_RADII = Object.values(TIER_RADII) as number[];

export function SkillTreeSVG() {
  const { nodes, edges } = useMemo(() => buildSkillGraph(), []);

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

  return (
    <div className="w-full flex items-center justify-center">
      <svg
        viewBox="-450 -450 900 900"
        className="w-full max-w-[860px] h-auto"
        style={{ maxHeight: "calc(100vh - 120px)" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* SVG filter for glow effect on unlocked nodes */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

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

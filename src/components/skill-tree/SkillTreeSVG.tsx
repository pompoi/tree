"use client";

import { buildSkillGraph } from "@/data/graph";
import { TIER_RADII } from "@/data/layout";
import { TierRing } from "./TierRing";
import { BranchSlice } from "./BranchSlice";
import { SkillEdge } from "./SkillEdge";
import { SkillNode } from "./SkillNode";

const TIER_RING_RADII = Object.values(TIER_RADII) as number[];

export function SkillTreeSVG() {
  const { nodes, edges } = buildSkillGraph();

  return (
    <div className="w-full flex items-center justify-center bg-gray-950">
      <svg
        viewBox="-450 -450 900 900"
        className="w-full max-w-[860px] h-auto"
        style={{ maxHeight: "calc(100vh - 120px)" }}
        xmlns="http://www.w3.org/2000/svg"
      >
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
              />
            );
          })}
        </g>

        {/* Layer 4: Skill nodes (rendered on top) */}
        <g>
          {Array.from(nodes.values()).map((node) => (
            <SkillNode key={node.skill.id} node={node} />
          ))}
        </g>
      </svg>
    </div>
  );
}

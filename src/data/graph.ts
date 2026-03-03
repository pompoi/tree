import { SKILLS } from "./skills";
import type { SkillGraph, SkillNode, SkillEdge } from "@/types/graph";
import { SKILL_POSITIONS, axialToPixel } from "@/lib/hex-grid-layout";

export function buildSkillGraph(): SkillGraph {
  const nodes = new Map<string, SkillNode>();
  const edges: SkillEdge[] = [];

  for (const skill of SKILLS) {
    const pos = SKILL_POSITIONS[skill.id];
    if (!pos) continue;
    const { x, y } = axialToPixel(pos.q, pos.r);
    nodes.set(skill.id, {
      skill,
      q: pos.q,
      r: pos.r,
      x,
      y,
    });
    for (const prereqId of skill.prerequisites) {
      edges.push({ from: prereqId, to: skill.id });
    }
  }

  return { nodes, edges };
}

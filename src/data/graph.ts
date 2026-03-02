import { SKILLS } from "./skills";
import type { SkillGraph, SkillNode, SkillEdge } from "@/types/graph";
import { getSkillPosition } from "./layout";

export function buildSkillGraph(): SkillGraph {
  const nodes = new Map<string, SkillNode>();
  const edges: SkillEdge[] = [];

  for (const skill of SKILLS) {
    const { angle, radius } = getSkillPosition(skill);
    nodes.set(skill.id, {
      skill,
      angle,
      radius,
      x: Math.sin(angle) * radius,
      y: -Math.cos(angle) * radius,
    });
    for (const prereqId of skill.prerequisites) {
      edges.push({ from: prereqId, to: skill.id });
    }
  }

  return { nodes, edges };
}

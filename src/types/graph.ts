import type { Skill } from "./skill";

export interface SkillNode {
  skill: Skill;
  q: number;
  r: number;
  x: number;
  y: number;
}

export interface SkillEdge {
  from: string;
  to: string;
}

export interface SkillGraph {
  nodes: Map<string, SkillNode>;
  edges: SkillEdge[];
}

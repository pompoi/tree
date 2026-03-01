import type { Skill } from "./skill";

export interface SkillNode {
  skill: Skill;
  angle: number;
  radius: number;
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

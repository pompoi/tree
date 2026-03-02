export interface DecisionEntry {
  skillId: string;
  towerLevel: number;
  timestamp: number;
}

export interface PlayerBuild {
  slotIndex: number;
  name: string;
  unlockedSkillIds: string[];
  decisionLog: DecisionEntry[];
  stats: { damage: number; movement: number; reduction: number };
  updatedAt: number;
}

export interface BuildSlot {
  index: number;
  name: string;
  isEmpty: boolean;
  skillCount: number;
}

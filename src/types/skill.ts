export type Branch = "attack" | "movement" | "defend";
export type Tier = 0 | 1 | 2 | 3;
export type ActionType = "melee" | "ranged" | "move" | "dodge" | "passive";
export type StatBonus = "damage" | "movement" | "reduction";

export interface Skill {
  id: string;
  name: string;
  tier: Tier;
  branch: Branch;
  secondaryBranch?: Branch;
  actionType: ActionType;
  hexRange: number;
  description: string;
  flavor?: string;
  statBonus: StatBonus;
  statBonusAmount: number;
  cooldown: number;
  prerequisites: string[];
  isBase: boolean;
  tags?: string[];
  /** Interaction notes for skill matchups */
  interactionNotes?: string;
  /** True if this is a passive boost skill that enhances a base skill */
  isBoostPassive?: boolean;
}

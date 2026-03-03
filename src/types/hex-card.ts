/** Axial hex coordinate */
export interface HexCoord {
  q: number;
  r: number;
}

/** Visual role of a hex cell on a skill card */
export type HexCellType =
  | "player"
  | "damage"
  | "movement"
  | "block"
  | "conditional"
  | "empty";

/** A single hex cell in the card visualization */
export interface HexCell {
  coord: HexCoord;
  type: HexCellType;
  label?: string;
  animationDelay?: number;
  animateRotate?: boolean;
}

/** Direction arrow on the card */
export interface HexArrow {
  from: HexCoord;
  to: HexCoord;
  style: "facing" | "move" | "attack" | "counter";
}

/** Complete hex card visualization data for one skill */
export interface HexCardPattern {
  skillId: string;
  cells: HexCell[];
  arrows: HexArrow[];
  note?: string;
}

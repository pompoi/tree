"use client";

import { Line } from "@react-three/drei";

const ARROW_COLORS: Record<string, string> = {
  facing: "#ffffff",
  move: "#86efac",
  attack: "#fca5a5",
  counter: "#fbbf24",
};

interface HexArrow3DProps {
  from: [number, number, number];
  to: [number, number, number];
  style: "facing" | "move" | "attack" | "counter";
}

export function HexArrow3D({ from, to, style }: HexArrow3DProps) {
  const color = ARROW_COLORS[style] ?? "#ffffff";
  const fromRaised: [number, number, number] = [from[0], from[1] + 0.35, from[2]];
  const toRaised: [number, number, number] = [to[0], to[1] + 0.35, to[2]];

  return (
    <Line
      points={[fromRaised, toRaised]}
      color={color}
      lineWidth={style === "attack" ? 3 : 2}
      dashed={style === "facing" || style === "counter"}
      dashSize={0.15}
      gapSize={0.1}
    />
  );
}

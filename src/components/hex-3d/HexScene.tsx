"use client";

import { useMemo } from "react";
import { OrbitControls } from "@react-three/drei";
import { hexToPixel } from "@/lib/hex-to-pixel";
import { HexPrism } from "./HexPrism";
import { HexArrow3D } from "./HexArrow3D";
import type { HexCardPattern } from "@/types/hex-card";
import type { Branch } from "@/types/skill";

const BRANCH_COLORS: Record<Branch, string> = {
  attack: "#ef4444",
  movement: "#06b6d4",
  defend: "#22c55e",
};

const SCALE = 1 / 24;

interface HexSceneProps {
  pattern: HexCardPattern | null;
  branch: Branch;
}

export function HexScene({ pattern, branch }: HexSceneProps) {
  const branchColor = BRANCH_COLORS[branch];

  const cells3D = useMemo(() => {
    if (!pattern) return [];
    return pattern.cells.map((cell) => {
      const px = hexToPixel(cell.coord);
      return {
        ...cell,
        worldPos: [px.x * SCALE, 0, px.y * SCALE] as [number, number, number],
      };
    });
  }, [pattern]);

  const arrows3D = useMemo(() => {
    if (!pattern) return [];
    return pattern.arrows.map((arrow) => {
      const fromPx = hexToPixel(arrow.from);
      const toPx = hexToPixel(arrow.to);
      return {
        ...arrow,
        fromWorld: [fromPx.x * SCALE, 0, fromPx.y * SCALE] as [number, number, number],
        toWorld: [toPx.x * SCALE, 0, toPx.y * SCALE] as [number, number, number],
      };
    });
  }, [pattern]);

  const center = useMemo((): [number, number, number] => {
    if (cells3D.length === 0) return [0, 0, 0];
    let sumX = 0;
    let sumZ = 0;
    for (const c of cells3D) {
      sumX += c.worldPos[0];
      sumZ += c.worldPos[2];
    }
    return [sumX / cells3D.length, 0, sumZ / cells3D.length];
  }, [cells3D]);

  if (!pattern) return null;

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} />
      <pointLight position={[0, 3, 0]} intensity={0.4} color={branchColor} />

      <OrbitControls
        target={center}
        enablePan={false}
        maxPolarAngle={Math.PI / 2.5}
        minDistance={2}
        maxDistance={8}
        autoRotate
        autoRotateSpeed={0.5}
      />

      {cells3D.map((cell, i) => (
        <HexPrism
          key={`${cell.coord.q},${cell.coord.r}-${i}`}
          position={cell.worldPos}
          cellType={cell.type}
          branchColor={branchColor}
          delay={(cell.animationDelay ?? 0) * 0.08}
        />
      ))}

      {arrows3D.map((arrow, i) => (
        <HexArrow3D
          key={`arrow-${i}`}
          from={arrow.fromWorld}
          to={arrow.toWorld}
          style={arrow.style}
        />
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[center[0], -0.01, center[2]]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#0a0a1a" transparent opacity={0.5} />
      </mesh>
    </>
  );
}

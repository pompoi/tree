"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createHexShape } from "./hex-shape";
import type { HexCellType } from "@/types/hex-card";

const CELL_COLORS: Record<HexCellType, string> = {
  player: "#ffffff",
  damage: "#ef4444",
  movement: "#22c55e",
  block: "#06b6d4",
  conditional: "#fbbf24",
  empty: "#1f2937",
};

interface HexPrismProps {
  position: [number, number, number];
  cellType: HexCellType;
  branchColor: string;
  radius?: number;
  depth?: number;
  delay?: number;
}

export function HexPrism({
  position,
  cellType,
  branchColor,
  radius = 0.9,
  depth = 0.3,
  delay = 0,
}: HexPrismProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  const geometry = useMemo(() => {
    const shape = createHexShape(radius);
    return new THREE.ExtrudeGeometry(shape, {
      depth: cellType === "player" ? depth * 2 : depth,
      bevelEnabled: false,
    });
  }, [radius, depth, cellType]);

  const color = cellType === "player" ? branchColor : CELL_COLORS[cellType];

  useFrame((state) => {
    if (!meshRef.current) return;
    const elapsed = state.clock.elapsedTime;
    const t = Math.max(0, Math.min(1, (elapsed - delay) / 0.35));
    const eased = 1 - Math.pow(1 - t, 3);
    meshRef.current.scale.setScalar(eased);

    if (cellType === "player" && materialRef.current) {
      materialRef.current.emissiveIntensity = 0.3 + 0.15 * Math.sin(elapsed * 2);
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      scale={0}
    >
      <meshStandardMaterial
        ref={materialRef}
        color={color}
        emissive={color}
        emissiveIntensity={cellType === "player" ? 0.4 : 0}
        transparent
        opacity={cellType === "empty" ? 0.3 : 0.85}
        roughness={0.4}
        metalness={0.1}
      />
    </mesh>
  );
}

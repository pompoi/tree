"use client";

import { Suspense, useMemo } from "react";
import dynamic from "next/dynamic";
import { HEX_PATTERN_MAP } from "@/data/hex-patterns";
import type { Skill, Branch } from "@/types/skill";

const LazyCanvas = dynamic(
  () => import("@react-three/fiber").then((mod) => mod.Canvas),
  { ssr: false }
);

const LazyHexScene = dynamic(
  () => import("./HexScene").then((mod) => mod.HexScene),
  { ssr: false }
);

interface HexPreviewPanelProps {
  skill: Skill | null;
  branch: Branch;
}

export function HexPreviewPanel({ skill, branch }: HexPreviewPanelProps) {
  const pattern = useMemo(
    () => (skill ? HEX_PATTERN_MAP.get(skill.id) ?? null : null),
    [skill]
  );

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-white/10 bg-black/40 relative">
      {skill && (
        <div className="absolute top-2 left-3 z-10">
          <span className="text-xs font-bold text-white/80">{skill.name}</span>
          <span className="text-[10px] text-white/40 ml-2">T{skill.tier}</span>
        </div>
      )}

      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">
            Loading 3D...
          </div>
        }
      >
        <LazyCanvas
          camera={{ position: [0, 4, 4], fov: 45 }}
          style={{ width: "100%", height: "100%" }}
        >
          <LazyHexScene pattern={pattern} branch={branch} />
        </LazyCanvas>
      </Suspense>

      {!skill && (
        <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs pointer-events-none">
          Select a skill to preview
        </div>
      )}
    </div>
  );
}

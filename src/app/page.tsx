"use client";

import { SkillTreeSVG } from "@/components/skill-tree/SkillTreeSVG";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      <SkillTreeSVG />
    </main>
  );
}

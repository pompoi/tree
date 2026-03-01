"use client";

import { SkillTreeSVG } from "@/components/skill-tree/SkillTreeSVG";
import { BuildPanel } from "@/components/build/BuildPanel";
import { CardBar } from "@/components/build/CardBar";

export default function Home() {
  return (
    <main className="h-screen bg-gray-950 flex flex-col overflow-hidden">
      {/* Top section: Tree + Sidebar */}
      <div className="flex-1 flex min-h-0">
        {/* Skill Tree (takes remaining space) */}
        <div className="flex-1 flex items-center justify-center p-4 min-w-0">
          <SkillTreeSVG />
        </div>

        {/* Sidebar */}
        <BuildPanel />
      </div>

      {/* Bottom: Card Bar */}
      <CardBar />
    </main>
  );
}

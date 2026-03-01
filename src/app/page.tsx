"use client";

import { useState } from "react";
import { SkillTreeSVG } from "@/components/skill-tree/SkillTreeSVG";
import { SelectionWheel } from "@/components/skill-tree/SelectionWheel";
import { BuildPanel } from "@/components/build/BuildPanel";
import { CardBar } from "@/components/build/CardBar";

type View = "tree" | "wheel";

export default function Home() {
  const [view, setView] = useState<View>("tree");

  return (
    <main className="h-screen bg-gray-950 flex flex-col overflow-hidden">
      {/* Top section: Tree + Sidebar */}
      <div className="flex-1 flex min-h-0">
        {/* Skill Tree / Selection Wheel (takes remaining space) */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* View toggle */}
          <div className="flex items-center gap-1 px-4 pt-3">
            <button
              onClick={() => setView("tree")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                view === "tree"
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Skill Tree
            </button>
            <button
              onClick={() => setView("wheel")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                view === "wheel"
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              Selection Wheel
            </button>
          </div>

          {/* Active view */}
          <div className="flex-1 flex items-center justify-center p-4">
            {view === "tree" ? <SkillTreeSVG /> : <SelectionWheel />}
          </div>
        </div>

        {/* Sidebar */}
        <BuildPanel />
      </div>

      {/* Bottom: Card Bar */}
      <CardBar />
    </main>
  );
}

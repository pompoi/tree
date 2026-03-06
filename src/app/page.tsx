"use client";

import { useState } from "react";
import { UnifiedSkillGraph } from "@/components/skill-tree/UnifiedSkillGraph";
import { ActionBar } from "@/components/skill-tree/ActionBar";
import { BuildPanel } from "@/components/build/BuildPanel";

type View = "build" | "play";

function RibbonButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
        active
          ? "bg-white/10 text-white"
          : "text-white/40 hover:text-white/60"
      }`}
    >
      {children}
    </button>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("play");
  const [showBuildPanel, setShowBuildPanel] = useState(false);

  return (
    <main className="h-dvh bg-gray-950 flex flex-col overflow-hidden">
      {/* Header ribbon */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-1 flex-shrink-0">
        <RibbonButton
          active={view === "play"}
          onClick={() => setView("play")}
        >
          Play
        </RibbonButton>
        <RibbonButton
          active={view === "build"}
          onClick={() => setView("build")}
        >
          Build
        </RibbonButton>

        <div className="ml-auto flex items-center gap-1">
          <RibbonButton
            active={showBuildPanel}
            onClick={() => setShowBuildPanel((v) => !v)}
          >
            Build
          </RibbonButton>
        </div>
      </div>

      {/* Main content: graph fills remaining space */}
      <div className="flex-1 min-h-0 overflow-hidden p-2">
        <UnifiedSkillGraph mode={view} />
      </div>

      {/* Action bar — mobile only, fixed overlay at bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30">
        <ActionBar mode={view} />
      </div>

      {/* Build panel overlay */}
      <BuildPanel
        open={showBuildPanel}
        onClose={() => setShowBuildPanel(false)}
      />
    </main>
  );
}

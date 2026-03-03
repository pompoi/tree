"use client";

import { useState } from "react";
import { UnifiedSkillGraph } from "@/components/skill-tree/UnifiedSkillGraph";
import { BuildPanel } from "@/components/build/BuildPanel";
import { CardBar } from "@/components/build/CardBar";
import { CardPreviewPanel } from "@/components/build/CardPreviewPanel";
import type { Skill } from "@/types/skill";

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
  const [showCards, setShowCards] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [previewSkill, setPreviewSkill] = useState<Skill | null>(null);

  return (
    <main className="h-dvh bg-gray-950 flex flex-col overflow-hidden">
      {/* Header ribbon */}
      <div className="flex items-center gap-1 px-4 pt-3 pb-1 flex-shrink-0">
        {/* View toggles (left) */}
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

        {/* Panel toggles (right) */}
        <div className="ml-auto flex items-center gap-1">
          <RibbonButton
            active={showCards}
            onClick={() => setShowCards((v) => !v)}
          >
            Cards
          </RibbonButton>
          <RibbonButton
            active={showPreview}
            onClick={() => setShowPreview((v) => !v)}
          >
            Preview
          </RibbonButton>
          <RibbonButton
            active={showBuildPanel}
            onClick={() => setShowBuildPanel((v) => !v)}
          >
            Build
          </RibbonButton>
        </div>
      </div>

      {/* Main content: graph + card preview */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Unified Skill Graph */}
        <div className="flex-1 min-w-0 flex items-center justify-center p-4">
          <UnifiedSkillGraph mode={view} onPreviewSkill={setPreviewSkill} />
        </div>

        {/* Right: Card preview panel (desktop) */}
        {showPreview && (
          <div className="hidden md:flex w-[280px] flex-shrink-0 border-l border-white/10">
            <CardPreviewPanel skill={previewSkill} />
          </div>
        )}
      </div>

      {/* Bottom: Card Bar */}
      {showCards && <CardBar onPreviewSkill={setPreviewSkill} />}

      {/* Mobile: Card preview below (shown when preview enabled and a card is selected) */}
      {showPreview && previewSkill && (
        <div className="md:hidden h-[400px] flex-shrink-0 border-t border-white/10 overflow-auto">
          <CardPreviewPanel skill={previewSkill} />
        </div>
      )}

      {/* Build panel overlay */}
      <BuildPanel
        open={showBuildPanel}
        onClose={() => setShowBuildPanel(false)}
      />
    </main>
  );
}

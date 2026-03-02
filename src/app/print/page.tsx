"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useBuildStore } from "@/stores/build-store";
import { CardSheet } from "@/components/skill-card/CardSheet";

export default function PrintPage() {
  // Rehydrate persisted state on mount
  useEffect(() => {
    useBuildStore.persist.rehydrate();
  }, []);

  const builds = useBuildStore((s) => s.builds);
  const activeSlot = useBuildStore((s) => s.activeSlot);
  const activeBuild = builds[activeSlot];

  const unlockedSkillIds = activeBuild?.unlockedSkillIds ?? [];
  const buildName = activeBuild?.name ?? "Build";

  return (
    <div className="print-page">
      {/* Nav bar - hidden in print */}
      <nav className="print-nav px-6 py-4 flex items-center justify-between bg-gray-950 border-b border-white/10">
        <Link
          href="/"
          className="text-sm text-white/60 hover:text-white transition-colors"
        >
          &larr; Back to Tree
        </Link>
        <h1 className="text-sm font-semibold text-white/80">
          {buildName} &mdash; {unlockedSkillIds.length} Skills
        </h1>
        <button
          onClick={() => window.print()}
          className="text-sm text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-lg transition-colors"
        >
          Print
        </button>
      </nav>

      {/* Card grid */}
      <div className="p-6 print-content">
        <CardSheet unlockedSkillIds={unlockedSkillIds} />
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { SKILLS, SKILL_MAP } from "@/data/skills";
import { HEX_PATTERN_MAP } from "@/data/hex-patterns";
import { HexCardFull } from "@/components/hex-card/HexCardFull";
import type { Branch, Tier } from "@/types/skill";
import Link from "next/link";

const BRANCH_COLORS: Record<Branch, string> = {
  attack: "#ef4444",
  movement: "#06b6d4",
  defend: "#22c55e",
};

const BRANCH_LABELS: Record<Branch, string> = {
  attack: "Attack",
  movement: "Movement",
  defend: "Defend",
};

const BRANCHES: Branch[] = ["attack", "defend", "movement"];
const TIERS: Tier[] = [0, 1, 2, 3];

type FilterBranch = Branch | "all";

export default function CardsGalleryPage() {
  const [filter, setFilter] = useState<FilterBranch>("all");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filteredSkills = useMemo(() => {
    if (filter === "all") return SKILLS;
    return SKILLS.filter((s) => s.branch === filter);
  }, [filter]);

  // Group by tier
  const byTier = useMemo(() => {
    const groups = new Map<Tier, typeof filteredSkills>();
    for (const tier of TIERS) {
      const tierSkills = filteredSkills.filter((s) => s.tier === tier);
      if (tierSkills.length > 0) groups.set(tier, tierSkills);
    }
    return groups;
  }, [filteredSkills]);

  // Build prerequisite edges for the graph view
  const edges = useMemo(() => {
    const visibleIds = new Set(filteredSkills.map((s) => s.id));
    return filteredSkills.flatMap((s) =>
      s.prerequisites
        .filter((pid) => visibleIds.has(pid))
        .map((pid) => ({ from: pid, to: s.id, branch: s.branch }))
    );
  }, [filteredSkills]);

  return (
    <main className="min-h-dvh bg-gray-950 overflow-auto">
      {/* Nav */}
      <nav className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center gap-4">
        <Link
          href="/"
          className="text-sm text-white/50 hover:text-white transition-colors"
        >
          &larr; Tree
        </Link>
        <h1 className="text-sm font-bold text-white">Skill Cards</h1>
        <div className="flex gap-1 ml-auto">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              filter === "all"
                ? "bg-white/15 text-white"
                : "text-white/40 hover:text-white/60"
            }`}
          >
            All
          </button>
          {BRANCHES.map((b) => (
            <button
              key={b}
              onClick={() => setFilter(b)}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                filter === b
                  ? "text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
              style={filter === b ? { background: `${BRANCH_COLORS[b]}40` } : undefined}
            >
              {BRANCH_LABELS[b]}
            </button>
          ))}
        </div>
      </nav>

      {/* Relationship graph (compact SVG) */}
      <div className="px-4 pt-4">
        <CardGraph
          skills={filteredSkills}
          edges={edges}
          hoveredId={hoveredId}
          onHover={setHoveredId}
        />
      </div>

      {/* Cards grid by tier */}
      <div className="px-4 pb-8">
        {Array.from(byTier.entries()).map(([tier, tierSkills]) => (
          <div key={tier} className="mt-6">
            <h2 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">
              Tier {tier}
              {tier === 0
                ? " — Core"
                : tier === 1
                  ? " — Foundational"
                  : tier === 2
                    ? " — Advanced"
                    : " — Mastery"}
            </h2>
            <div className="flex flex-wrap gap-4">
              {tierSkills.map((skill) => {
                const pattern = HEX_PATTERN_MAP.get(skill.id);
                if (!pattern) return null;
                return (
                  <Link
                    key={skill.id}
                    href={`/card/${skill.id}`}
                    className="transition-transform hover:scale-105"
                    onMouseEnter={() => setHoveredId(skill.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <HexCardFull skill={skill} pattern={pattern} animate={false} />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

// ─── Compact Relationship Graph ──────────────────────────────────────────────

function CardGraph({
  skills,
  edges,
  hoveredId,
  onHover,
}: {
  skills: typeof SKILLS;
  edges: { from: string; to: string; branch: Branch }[];
  hoveredId: string | null;
  onHover: (id: string | null) => void;
}) {
  // Simple force-free layout: tier rows, spread by branch
  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    const rowHeight = 50;
    const colWidth = 90;

    // Group by tier and branch
    const BRANCHES: Branch[] = ["attack", "defend", "movement"];
    for (const tier of TIERS) {
      const tierSkills = skills.filter((s) => s.tier === tier);
      for (const branch of BRANCHES) {
        const branchSkills = tierSkills.filter((s) => s.branch === branch);
        const branchOffset = BRANCHES.indexOf(branch);
        const baseX = branchOffset * (colWidth * 3.5);

        branchSkills.forEach((s, i) => {
          map.set(s.id, {
            x: baseX + i * colWidth,
            y: tier * rowHeight,
          });
        });
      }
    }
    return map;
  }, [skills]);

  // Compute viewBox from positions
  const { minX, minY, maxX, maxY } = useMemo(() => {
    let mnX = Infinity, mnY = Infinity, mxX = -Infinity, mxY = -Infinity;
    for (const p of positions.values()) {
      mnX = Math.min(mnX, p.x);
      mnY = Math.min(mnY, p.y);
      mxX = Math.max(mxX, p.x);
      mxY = Math.max(mxY, p.y);
    }
    return { minX: mnX, minY: mnY, maxX: mxX, maxY: mxY };
  }, [positions]);

  const pad = 40;
  const vbX = minX - pad;
  const vbY = minY - pad;
  const vbW = maxX - minX + pad * 2;
  const vbH = maxY - minY + pad * 2;

  // Find connected skills for highlighting
  const connectedToHovered = useMemo(() => {
    if (!hoveredId) return new Set<string>();
    const connected = new Set<string>([hoveredId]);
    // Walk prerequisites backwards
    function walkUp(id: string) {
      const skill = SKILL_MAP.get(id);
      if (!skill) return;
      for (const pid of skill.prerequisites) {
        if (!connected.has(pid)) {
          connected.add(pid);
          walkUp(pid);
        }
      }
    }
    walkUp(hoveredId);
    return connected;
  }, [hoveredId]);

  return (
    <div className="bg-gray-900/30 rounded-lg border border-white/5 p-2">
      <svg
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        className="w-full h-auto"
        style={{ maxHeight: 220 }}
      >
        {/* Edges */}
        {edges.map((e, i) => {
          const from = positions.get(e.from);
          const to = positions.get(e.to);
          if (!from || !to) return null;
          const isActive =
            connectedToHovered.has(e.from) && connectedToHovered.has(e.to);
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={BRANCH_COLORS[e.branch]}
              strokeWidth={isActive ? 2 : 0.8}
              strokeOpacity={isActive ? 0.8 : 0.2}
            />
          );
        })}

        {/* Nodes */}
        {skills.map((s) => {
          const pos = positions.get(s.id);
          if (!pos) return null;
          const color = BRANCH_COLORS[s.branch];
          const isHovered = hoveredId === s.id;
          const isConnected = connectedToHovered.has(s.id);

          return (
            <g
              key={s.id}
              onMouseEnter={() => onHover(s.id)}
              onMouseLeave={() => onHover(null)}
              style={{ cursor: "pointer" }}
            >
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isHovered ? 10 : 7}
                fill={isHovered || isConnected ? color : "#1f2937"}
                stroke={color}
                strokeWidth={isHovered ? 2 : 1}
                fillOpacity={isHovered ? 0.9 : isConnected ? 0.6 : 0.3}
              />
              <text
                x={pos.x}
                y={pos.y + 14}
                textAnchor="middle"
                fill={isHovered || isConnected ? "#ffffff" : "#ffffff60"}
                fontSize={5}
                fontWeight={isHovered ? "700" : "500"}
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {s.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

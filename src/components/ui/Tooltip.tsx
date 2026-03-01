"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import type { Skill } from "@/types/skill";
import { SkillCard } from "@/components/skill-card/SkillCard";

const OFFSET = 16;
const CARD_WIDTH = 200;
const CARD_HEIGHT = 280;

interface TooltipProps {
  skill: Skill | null;
  position: { x: number; y: number };
}

export function Tooltip({ skill, position }: TooltipProps) {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !skill) return null;

  // Calculate position clamped to viewport
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;

  let left = position.x + OFFSET;
  let top = position.y + OFFSET;

  // Flip horizontally if overflowing right
  if (left + CARD_WIDTH > vw - 8) {
    left = position.x - CARD_WIDTH - OFFSET;
  }

  // Flip vertically if overflowing bottom
  if (top + CARD_HEIGHT > vh - 8) {
    top = position.y - CARD_HEIGHT - OFFSET;
  }

  // Clamp to edges
  left = Math.max(8, Math.min(left, vw - CARD_WIDTH - 8));
  top = Math.max(8, Math.min(top, vh - CARD_HEIGHT - 8));

  return createPortal(
    <div
      ref={containerRef}
      className="fixed pointer-events-none z-50"
      style={{ left, top }}
    >
      <SkillCard skill={skill} />
    </div>,
    document.body
  );
}

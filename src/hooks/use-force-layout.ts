import { useEffect, useRef, useState, useMemo } from "react";
import type { Branch } from "@/types/skill";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ForceNode {
  id: string;
  x0: number; // initial x
  y0: number; // initial y
  branch: Branch;
}

export interface ForceEdge {
  from: string;
  to: string;
}

interface SimNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  branch: Branch;
  pinned: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const REPULSION = 8000;
const SPRING_STRENGTH = 0.03;
const REST_LENGTH = 100;
const BRANCH_GRAVITY = 0.005;
const DAMPING = 0.82;
const MAX_FORCE = 50;
const CONVERGENCE_THRESHOLD = 0.5;
const MAX_TICKS = 300;

// Branch gravity targets (unit vectors pointing toward branch region)
const BRANCH_TARGETS: Record<Branch, { x: number; y: number }> = {
  attack: { x: 0, y: -1 },    // top
  movement: { x: 0.866, y: 0.5 },  // bottom-right (120°)
  defend: { x: -0.866, y: 0.5 },   // bottom-left (240°)
};

// ─── Force Simulation ────────────────────────────────────────────────────────

function clampForce(f: number): number {
  return Math.max(-MAX_FORCE, Math.min(MAX_FORCE, f));
}

function tick(nodes: SimNode[], edges: ForceEdge[]): number {
  const n = nodes.length;
  const forces = new Array(n).fill(null).map(() => ({ fx: 0, fy: 0 }));

  // 1. Repulsion between all pairs
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = nodes[i];
      const b = nodes[j];
      let dx = a.x - b.x;
      let dy = a.y - b.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; dist = 1; }

      const force = REPULSION / (dist * dist);
      const fx = clampForce((dx / dist) * force);
      const fy = clampForce((dy / dist) * force);

      forces[i].fx += fx;
      forces[i].fy += fy;
      forces[j].fx -= fx;
      forces[j].fy -= fy;
    }
  }

  // 2. Spring attraction along edges
  const nodeIdx = new Map(nodes.map((n, i) => [n.id, i]));
  for (const edge of edges) {
    const ai = nodeIdx.get(edge.from);
    const bi = nodeIdx.get(edge.to);
    if (ai === undefined || bi === undefined) continue;

    const a = nodes[ai];
    const b = nodes[bi];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.1) continue;

    const displacement = dist - REST_LENGTH;
    const force = SPRING_STRENGTH * displacement;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;

    forces[ai].fx += fx;
    forces[ai].fy += fy;
    forces[bi].fx -= fx;
    forces[bi].fy -= fy;
  }

  // 3. Branch gravity — pull nodes gently toward their branch direction
  for (let i = 0; i < n; i++) {
    const node = nodes[i];
    const target = BRANCH_TARGETS[node.branch];
    forces[i].fx += target.x * REPULSION * BRANCH_GRAVITY;
    forces[i].fy += target.y * REPULSION * BRANCH_GRAVITY;
  }

  // 4. Apply forces, damping, update positions
  let totalEnergy = 0;
  for (let i = 0; i < n; i++) {
    const node = nodes[i];
    if (node.pinned) continue;

    node.vx = (node.vx + forces[i].fx) * DAMPING;
    node.vy = (node.vy + forces[i].fy) * DAMPING;
    node.x += node.vx;
    node.y += node.vy;

    totalEnergy += node.vx * node.vx + node.vy * node.vy;
  }

  return totalEnergy;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useForceLayout(
  visibleNodes: ForceNode[],
  edges: ForceEdge[],
  pinned: Map<string, { x: number; y: number }>
): Map<string, { x: number; y: number }> {
  // Stable key for detecting changes
  const nodeKey = useMemo(
    () => visibleNodes.map((n) => n.id).sort().join(","),
    [visibleNodes]
  );

  const prevPositionsRef = useRef<Map<string, { x: number; y: number }>>(
    new Map()
  );
  const rafRef = useRef<number>(0);

  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(
    () => {
      const m = new Map<string, { x: number; y: number }>();
      for (const n of visibleNodes) {
        const pin = pinned.get(n.id);
        m.set(n.id, pin ?? { x: n.x0, y: n.y0 });
      }
      return m;
    }
  );

  useEffect(() => {
    if (visibleNodes.length === 0) {
      setPositions(new Map());
      return;
    }

    // Build simulation nodes
    const simNodes: SimNode[] = visibleNodes.map((n) => {
      const pin = pinned.get(n.id);
      // Reuse previous position if the node was already visible
      const prev = prevPositionsRef.current.get(n.id);
      const startPos = pin ?? prev ?? { x: n.x0, y: n.y0 };

      return {
        id: n.id,
        x: startPos.x,
        y: startPos.y,
        vx: 0,
        vy: 0,
        branch: n.branch,
        pinned: pinned.has(n.id),
      };
    });

    let tickCount = 0;

    function step() {
      const energy = tick(simNodes, edges);
      tickCount++;

      // Update positions state
      const newPositions = new Map<string, { x: number; y: number }>();
      for (const node of simNodes) {
        newPositions.set(node.id, { x: node.x, y: node.y });
      }
      setPositions(newPositions);
      prevPositionsRef.current = newPositions;

      if (energy > CONVERGENCE_THRESHOLD && tickCount < MAX_TICKS) {
        rafRef.current = requestAnimationFrame(step);
      }
    }

    rafRef.current = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeKey]);

  return positions;
}

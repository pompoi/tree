import { useState, useCallback, useRef } from "react";
import { cartesianToPolar } from "@/lib/polar";
import { BRANCH_ANGLES, TIER_RADII } from "@/data/layout";
import { buildSkillGraph } from "@/data/graph";
import type { Branch } from "@/types/skill";

const BRANCHES: Branch[] = ["attack", "movement", "defend"];
const OUTER_RADIUS = 360;

interface MouseAngleState {
  angle: number;
  radius: number;
  nearestBranch: Branch | null;
  nearestSkillId: string | null;
  lineEndX: number;
  lineEndY: number;
}

const defaultState: MouseAngleState = {
  angle: 0,
  radius: 0,
  nearestBranch: null,
  nearestSkillId: null,
  lineEndX: 0,
  lineEndY: 0,
};

/**
 * Compute angular distance handling wraparound.
 */
function angularDistance(a: number, b: number): number {
  const twoPi = 2 * Math.PI;
  const diff = ((a - b) % twoPi + twoPi) % twoPi;
  return Math.min(diff, twoPi - diff);
}

export function useMouseAngle() {
  const [state, setState] = useState<MouseAngleState>(defaultState);
  const graphRef = useRef(buildSkillGraph());

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = e.currentTarget;
      const point = svg.createSVGPoint();
      point.x = e.clientX;
      point.y = e.clientY;

      const ctm = svg.getScreenCTM();
      if (!ctm) return;

      const svgPoint = point.matrixTransform(ctm.inverse());
      const { angle, radius: rawRadius } = cartesianToPolar(
        svgPoint.x,
        svgPoint.y
      );

      // Clamp radius for the direction line
      const clampedRadius = Math.min(rawRadius, OUTER_RADIUS);
      const lineEndX = Math.sin(angle) * clampedRadius;
      const lineEndY = -Math.cos(angle) * clampedRadius;

      // Find nearest branch
      let nearestBranch: Branch | null = null;
      let minBranchDist = Infinity;
      for (const branch of BRANCHES) {
        const dist = angularDistance(angle, BRANCH_ANGLES[branch]);
        if (dist < minBranchDist) {
          minBranchDist = dist;
          nearestBranch = branch;
        }
      }

      // Find nearest skill node within a reasonable distance
      let nearestSkillId: string | null = null;
      let minNodeDist = Infinity;
      const SNAP_THRESHOLD = 40; // SVG units

      for (const [id, node] of graphRef.current.nodes) {
        const dx = svgPoint.x - node.x;
        const dy = svgPoint.y - node.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < SNAP_THRESHOLD && dist < minNodeDist) {
          minNodeDist = dist;
          nearestSkillId = id;
        }
      }

      setState({
        angle,
        radius: rawRadius,
        nearestBranch,
        nearestSkillId,
        lineEndX,
        lineEndY,
      });
    },
    []
  );

  return { ...state, handleMouseMove };
}

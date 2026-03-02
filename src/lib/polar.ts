/**
 * Polar coordinate utilities for the skill tree SVG layout.
 *
 * Convention: angle=0 points UP (north), increases clockwise.
 * x = sin(angle) * radius, y = -cos(angle) * radius
 */

export function polarToCartesian(
  angle: number,
  radius: number
): { x: number; y: number } {
  return {
    x: Math.sin(angle) * radius,
    y: -Math.cos(angle) * radius,
  };
}

export function cartesianToPolar(
  x: number,
  y: number
): { angle: number; radius: number } {
  const radius = Math.sqrt(x * x + y * y);
  // atan2 with flipped y to match our convention (up = angle 0)
  const angle = Math.atan2(x, -y);
  return { angle: normalizeAngle(angle), radius };
}

export function normalizeAngle(angle: number): number {
  const twoPi = 2 * Math.PI;
  return ((angle % twoPi) + twoPi) % twoPi;
}

/**
 * Average two angles correctly, handling the wraparound at 2π/0.
 * Uses the unit-vector midpoint approach to avoid ambiguity.
 */
export function averageAngles(a: number, b: number): number {
  const x = Math.cos(a) + Math.cos(b);
  const y = Math.sin(a) + Math.sin(b);
  if (x === 0 && y === 0) {
    // Angles are exactly opposite; pick the one that averages via the shorter arc
    return normalizeAngle(a + Math.PI / 2);
  }
  return normalizeAngle(Math.atan2(y, x));
}

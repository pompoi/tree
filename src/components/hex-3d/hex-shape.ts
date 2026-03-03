import * as THREE from "three";

/**
 * Create a flat-top hexagonal Shape for extrusion.
 * Vertices start at 0° (rightmost point) and go counter-clockwise in 60° steps.
 */
export function createHexShape(radius: number = 1): THREE.Shape {
  const shape = new THREE.Shape();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i);
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

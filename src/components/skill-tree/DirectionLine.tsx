interface DirectionLineProps {
  endX: number;
  endY: number;
  visible: boolean;
}

export function DirectionLine({ endX, endY, visible }: DirectionLineProps) {
  if (!visible) return null;

  return (
    <line
      x1={0}
      y1={0}
      x2={endX}
      y2={endY}
      stroke="#ffffff"
      strokeOpacity={0.12}
      strokeWidth={1}
      strokeDasharray="4 6"
      style={{ pointerEvents: "none" }}
    />
  );
}

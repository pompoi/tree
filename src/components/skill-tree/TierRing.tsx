interface TierRingProps {
  radius: number;
}

export function TierRing({ radius }: TierRingProps) {
  return (
    <circle
      cx={0}
      cy={0}
      r={radius}
      fill="none"
      stroke="#ffffff20"
      strokeWidth={1}
      strokeDasharray="8 4"
    />
  );
}

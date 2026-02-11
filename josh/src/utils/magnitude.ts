export function getMagnitudeColor(mag: number): string {
  if (mag >= 7) return "#7f0000";
  if (mag >= 6) return "#b71c1c";
  if (mag >= 5) return "#e53935";
  if (mag >= 4) return "#ff6f00";
  if (mag >= 3) return "#ffa000";
  if (mag >= 2) return "#fdd835";
  return "#66bb6a";
}

export function getMagnitudeRadius(mag: number): number {
  const clamped = Math.max(0, Math.min(mag, 9));
  return 4 + clamped * 2.5;
}

export function formatMagnitude(mag: number | null): string {
  if (mag === null) return "N/A";
  return mag.toFixed(1);
}

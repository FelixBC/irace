/**
 * Progress % for distance-style challenges: current km vs goal km (same units as `Participation.currentDistance` / `Challenge.goal`).
 */
export function computeProgressPercent(currentDistance: number, goal: number): number {
  const g = Number(goal);
  const d = Number(currentDistance);
  if (!Number.isFinite(g) || g <= 0 || !Number.isFinite(d) || d < 0) return 0;
  return Math.min(100, Math.round((d / g) * 100));
}

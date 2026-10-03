// requestAnimationFrame timestamps belong to the frame, not callback entry time.
// Starting from its first timestamp avoids mixing that clock with performance.now().
export function frameDeltaSeconds(now, previous) {
  if (previous === null || !Number.isFinite(now) || !Number.isFinite(previous)) return 0;
  return Math.min(Math.max((now - previous) / 1000, 0), 0.05);
}

// JavaScript's remainder may be negative; curve sampling requires 0 <= t < 1.
export function unitPhase(value) {
  if (!Number.isFinite(value)) return 0;
  return ((value % 1) + 1) % 1;
}

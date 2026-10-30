/** Small easing / pose helpers shared by the animated actors. */
export const ease = (t: number) => t * t * (3 - 2 * t);
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** 0 → 1 over [a, b] of progress `p`, clamped. */
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

/** Wind-up (negative, backwards), strike (positive, forwards), recover. Radians about x. */
export function swingAngle(p: number, windup = -1.0, strike = 1.6) {
  if (p < 0) return 0;
  if (p < 0.45) return windup * ease(p / 0.45);
  if (p < 0.7) return windup + (strike - windup) * ease((p - 0.45) / 0.25);
  return strike * (1 - ease((p - 0.7) / 0.3));
}

/** 0 → 1 → 0 bump, peaking at progress 0.5. */
export const lunge = (p: number) => (p < 0 ? 0 : Math.sin(Math.min(1, p) * Math.PI));

/** Ramps up in the first quarter, holds, ramps down in the last 15%. */
export function hold(p: number) {
  if (p < 0) return 0;
  if (p < 0.25) return ease(p / 0.25);
  if (p > 0.85) return 1 - ease((p - 0.85) / 0.15);
  return 1;
}

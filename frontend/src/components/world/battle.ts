/** One looping fight: hero strike, Sentinel strike, then the monster hits back. */
export const CYCLE = 6;

const ease = (t: number) => t * t * (3 - 2 * t);
const win = (c: number, a: number, b: number) => (c < a || c > b ? -1 : (c - a) / (b - a));

export function battlePhase(t: number) {
  const c = t % CYCLE;
  const pulse = (c0: number) => Math.exp(-Math.pow((c - c0) * 6, 2));
  return {
    warden: win(c, 0.3, 1.1),
    sentinel: win(c, 2.0, 3.0),
    monster: win(c, 3.8, 4.8),
    hitMonster: Math.max(pulse(0.8), pulse(2.6)),
    hitHero: pulse(4.4),
  };
}

/** Wind-up, strike, recover. Returns radians about the x axis (forward is positive). */
export function swingAngle(p: number) {
  if (p < 0) return 0;
  if (p < 0.45) return -1.0 * ease(p / 0.45);
  if (p < 0.7) return -1.0 + 2.6 * ease((p - 0.45) / 0.25);
  return 1.6 * (1 - ease((p - 0.7) / 0.3));
}

export const lunge = (p: number) => (p < 0 ? 0 : Math.sin(Math.min(1, p) * Math.PI));

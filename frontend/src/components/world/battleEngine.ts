import { useSyncExternalStore } from "react";

export type HeroId = "warden" | "sentinel";
export type Actor = HeroId | "monster";
export type WeaponId = "blade" | "staff" | "bow" | "hammer" | "cannon" | "shield";
export type AnimKind =
  | WeaponId
  | "rend"
  | "quake"
  | "swipe"
  | "slam"
  | "lunge"
  | "roar"
  | "die";

export type Weapon = {
  id: WeaponId;
  hero: HeroId;
  name: string;
  type: "Melee" | "Ranged" | "Magic";
  damage: number;
  cooldown: number;
  desc: string;
};

export const HERO_NAME: Record<HeroId, string> = { warden: "Ashen Warden", sentinel: "Iron Sentinel" };

export const WEAPONS: Record<HeroId, Weapon[]> = {
  warden: [
    { id: "blade", hero: "warden", name: "Wraith Blade", type: "Melee", damage: 18, cooldown: 1.4, desc: "Two fast slashes. Cheap and reliable." },
    { id: "staff", hero: "warden", name: "Hexstaff", type: "Magic", damage: 27, cooldown: 3.2, desc: "Channel a volley of three arcane bolts." },
    { id: "bow", hero: "warden", name: "Ashen Longbow", type: "Ranged", damage: 24, cooldown: 2.2, desc: "A drawn shot with a glowing arrow, from range." },
  ],
  sentinel: [
    { id: "hammer", hero: "sentinel", name: "Siege Hammer", type: "Melee", damage: 28, cooldown: 2.4, desc: "Overhead slam that cracks the ground." },
    { id: "cannon", hero: "sentinel", name: "Ember Cannon", type: "Ranged", damage: 30, cooldown: 3.6, desc: "Lobs an explosive shell from the shoulder cannon." },
    { id: "shield", hero: "sentinel", name: "Bulwark Shield", type: "Melee", damage: 14, cooldown: 1.8, desc: "Shield bash. Quick, and staggers the beast." },
  ],
};

export const SPECIALS: Record<HeroId, { name: string; kind: AnimKind; damage: number; cooldown: number; desc: string }> = {
  warden: { name: "Soul Rend", kind: "rend", damage: 45, cooldown: 8, desc: "Leap and cleave with a giant spectral arc." },
  sentinel: { name: "Earthshatter", kind: "quake", damage: 40, cooldown: 9, desc: "Leap and slam down, sending a shockwave through the ground." },
};

/** Timing (seconds from the start of an action) of launches, flight and hits. */
export const TIMELINE: Record<AnimKind, { dur: number; hits: number[]; launches?: number[]; flight?: number }> = {
  blade: { dur: 1.1, hits: [0.38, 0.74] },
  staff: { dur: 1.7, hits: [1.05, 1.25, 1.45], launches: [0.7, 0.9, 1.1], flight: 0.35 },
  bow: { dur: 1.4, hits: [1.0], launches: [0.7], flight: 0.3 },
  rend: { dur: 1.7, hits: [1.0] },
  hammer: { dur: 1.6, hits: [1.0] },
  cannon: { dur: 1.5, hits: [1.2], launches: [0.6], flight: 0.6 },
  shield: { dur: 1.0, hits: [0.45] },
  quake: { dur: 2.0, hits: [1.3] },
  swipe: { dur: 1.5, hits: [0.9] },
  slam: { dur: 1.9, hits: [1.3] },
  lunge: { dur: 1.6, hits: [1.0] },
  roar: { dur: 1.7, hits: [] },
  die: { dur: 2.4, hits: [] },
};

export type Anim = { kind: AnimKind; start: number; dur: number };
export type Impact = { t: number; target: Actor; color: string; power: number };

const MAX_HP = { warden: 120, sentinel: 160, monster: 320 };

export const engine = {
  now: 0,
  version: 0,
  selected: "warden" as HeroId,
  weapon: { warden: "blade", sentinel: "hammer" } as Record<HeroId, WeaponId>,
  hp: { ...MAX_HP } as Record<Actor, number>,
  maxHp: MAX_HP as Record<Actor, number>,
  alive: true,
  auto: false,
  anim: {} as Partial<Record<Actor, Anim>>,
  cdUntil: {} as Record<string, number>,
  hits: { monster: [], warden: [], sentinel: [] } as Record<Actor, number[]>,
  impacts: [] as Impact[],
  shake: 0,
  panic: 0,
  roarAt: -99,
  log: [] as string[],
  nextMonsterAct: 5,
  nextAuto: 2,
};

const listeners = new Set<() => void>();
const queue: { at: number; fn: () => void }[] = [];

function emit() {
  engine.version++;
  listeners.forEach((l) => l());
}

export function useBattle() {
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => engine.version,
    () => 0,
  );
  return engine;
}

const schedule = (at: number, fn: () => void) => queue.push({ at, fn });

function say(msg: string) {
  engine.log = [msg, ...engine.log].slice(0, 5);
}

export const currentWeapon = (hero: HeroId) => WEAPONS[hero].find((w) => w.id === engine.weapon[hero])!;
export const busy = (a: Actor) => {
  const an = engine.anim[a];
  return !!an && engine.now < an.start + an.dur;
};
/** Seconds of cooldown left for an ability id ("blade", "warden-special", ...). */
export const cooldownLeft = (id: string) => Math.max(0, (engine.cdUntil[id] ?? 0) - engine.now);

/** Progress 0..1 of an actor's current animation if it is `kind`, else -1. */
export function progress(a: Actor, ...kinds: AnimKind[]) {
  const an = engine.anim[a];
  if (!an || !kinds.includes(an.kind)) return -1;
  const p = (engine.now - an.start) / an.dur;
  return p < 0 || p > 1 ? -1 : p;
}

/** Decaying flash (1 → 0) after the latest hit on an actor. */
export function hitFlash(a: Actor, decay = 7) {
  const arr = engine.hits[a];
  let v = 0;
  for (const t of arr) {
    const age = engine.now - t;
    if (age >= 0) v = Math.max(v, Math.exp(-age * decay));
  }
  return v;
}

const COLOR = { warden: "#7ff5df", sentinel: "#ff9a3c", monster: "#ff4a3a" };

function impact(target: Actor, from: Actor, power: number) {
  engine.impacts = [...engine.impacts.filter((i) => engine.now - i.t < 1), { t: engine.now, target, color: COLOR[from], power }];
  engine.hits[target] = [...engine.hits[target].filter((t) => engine.now - t < 2), engine.now];
}

function hitMonster(hero: HeroId, dmg: number, power: number) {
  if (!engine.alive) return;
  const d = Math.round(dmg * (0.9 + Math.random() * 0.2));
  engine.hp.monster = Math.max(0, engine.hp.monster - d);
  impact("monster", hero, power);
  engine.shake = Math.max(engine.shake, power > 1 ? 0.9 : 0.35);
  say(`${HERO_NAME[hero]} hits the Gravemaw for ${d}`);
  if (engine.hp.monster <= 0) die();
  emit();
}

function hitHero(hero: HeroId, dmg: number) {
  const d = Math.round(dmg * (0.85 + Math.random() * 0.3));
  engine.hp[hero] = Math.max(8, engine.hp[hero] - d);
  impact(hero, "monster", 1.4);
  engine.shake = Math.max(engine.shake, 0.6);
  say(`The Gravemaw mauls the ${HERO_NAME[hero]} for ${d}`);
  emit();
}

function die() {
  engine.alive = false;
  engine.anim.monster = { kind: "die", start: engine.now, dur: TIMELINE.die.dur };
  engine.shake = 1;
  say("The Gravemaw is slain!");
  schedule(engine.now + 9, () => {
    engine.alive = true;
    engine.hp.monster = engine.maxHp.monster;
    engine.hp.warden = engine.maxHp.warden;
    engine.hp.sentinel = engine.maxHp.sentinel;
    engine.anim.monster = undefined;
    engine.nextMonsterAct = engine.now + 2;
    say("A new Gravemaw claws out of the fog…");
    emit();
  });
}

export function heroAct(hero: HeroId, special = false) {
  if (!engine.alive || busy(hero)) return false;
  const w = currentWeapon(hero);
  const sp = SPECIALS[hero];
  const id = special ? `${hero}-special` : w.id;
  if (cooldownLeft(id) > 0) return false;
  const kind = special ? sp.kind : w.id;
  const tl = TIMELINE[kind];
  engine.anim[hero] = { kind, start: engine.now, dur: tl.dur };
  engine.cdUntil[id] = engine.now + (special ? sp.cooldown : w.cooldown);
  const total = special ? sp.damage : w.damage;
  tl.hits.forEach((h) => schedule(engine.now + h, () => hitMonster(hero, total / tl.hits.length, special ? 2 : 1)));
  emit();
  return true;
}

export function selectHero(h: HeroId) {
  if (engine.selected !== h) {
    engine.selected = h;
    emit();
  }
}
export const toggleHero = () => selectHero(engine.selected === "warden" ? "sentinel" : "warden");

export function selectWeapon(hero: HeroId, idx: number) {
  const w = WEAPONS[hero][idx];
  if (w && engine.weapon[hero] !== w.id && !busy(hero)) {
    engine.weapon[hero] = w.id;
    engine.selected = hero;
    emit();
  }
}
export function cycleWeapon(dir: 1 | -1) {
  const hero = engine.selected;
  const list = WEAPONS[hero];
  const i = list.findIndex((w) => w.id === engine.weapon[hero]);
  selectWeapon(hero, (i + dir + list.length) % list.length);
}

export function toggleAuto() {
  engine.auto = !engine.auto;
  emit();
}

const MONSTER_ATTACKS: AnimKind[] = ["swipe", "slam", "lunge", "swipe", "roar"];

/** Advance the simulation. Called once per frame from inside the Canvas. */
export function tick(t: number, dt: number) {
  engine.now = t;

  for (let i = queue.length - 1; i >= 0; i--) {
    if (queue[i].at <= t) {
      const { fn } = queue.splice(i, 1)[0];
      fn();
    }
  }

  engine.shake *= Math.exp(-dt * 5);
  engine.panic += ((engine.alive ? 1 : 0) - engine.panic) * Math.min(1, dt * (engine.alive ? 2.5 : 1.2));

  // Monster AI: attacks every few seconds, picks a hero at random.
  if (engine.alive && !busy("monster") && t >= engine.nextMonsterAct) {
    const kind = MONSTER_ATTACKS[Math.floor(Math.random() * MONSTER_ATTACKS.length)];
    const tl = TIMELINE[kind];
    engine.anim.monster = { kind, start: t, dur: tl.dur };
    engine.nextMonsterAct = t + tl.dur + 2 + Math.random() * 2.5;
    if (kind === "roar") {
      engine.roarAt = t + 0.4;
      schedule(t + 0.4, () => {
        engine.shake = Math.max(engine.shake, 0.5);
        say("The Gravemaw roars!");
        emit();
      });
    } else {
      const target: HeroId = Math.random() < 0.5 ? "warden" : "sentinel";
      const dmg = kind === "slam" ? 24 : kind === "lunge" ? 20 : 14;
      tl.hits.forEach((h) => schedule(t + h, () => engine.alive && hitHero(target, dmg)));
    }
    emit();
  }

  // Auto-battle: heroes pick the next ready ability themselves.
  if (engine.auto && engine.alive && t >= engine.nextAuto) {
    engine.nextAuto = t + 0.5;
    for (const hero of ["warden", "sentinel"] as HeroId[]) {
      if (busy(hero)) continue;
      if (cooldownLeft(`${hero}-special`) <= 0 && Math.random() < 0.4) heroAct(hero, true);
      else {
        const list = WEAPONS[hero];
        const ready = list.filter((w) => cooldownLeft(w.id) <= 0);
        if (ready.length) {
          engine.weapon[hero] = ready[Math.floor(Math.random() * ready.length)].id;
          heroAct(hero);
        }
      }
    }
  }

  // Slow recovery between fights.
  for (const h of ["warden", "sentinel"] as HeroId[]) {
    if (engine.hp[h] < engine.maxHp[h]) engine.hp[h] = Math.min(engine.maxHp[h], engine.hp[h] + dt * 1.2);
  }
}

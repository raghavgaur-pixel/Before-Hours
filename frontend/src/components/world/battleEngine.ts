import { useSyncExternalStore } from "react";
import { INTERACTABLES, MONSTER_XZ, SENTINEL_XZ, WARDEN_XZ, groundAt } from "./terrain";

export type HeroId = "warden" | "sentinel";
/** A hero id, or an enemy id ("monster", "z0", ...). */
export type Actor = string;
export type WeaponId = "blade" | "staff" | "bow" | "hammer" | "cannon" | "shield";
export type AnimKind = WeaponId | "rend" | "quake" | "swipe" | "slam" | "lunge" | "roar" | "die";
export type AttackMode = "light" | "heavy" | "strong" | "skill";
export type ItemId = "potion" | "flask" | "salve";

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

export const ITEM_DEFS: Record<ItemId, { name: string; desc: string; glyph: string }> = {
  potion: { name: "Healing Draught", desc: "Restores 50 health.", glyph: "✚" },
  flask: { name: "Ember Flask", desc: "Hurl at your target for 30 fire damage.", glyph: "♨" },
  salve: { name: "Spirit Salve", desc: "Halves damage taken for 6 seconds.", glyph: "❖" },
};

export const GESTURES = ["wave", "cheer", "bow", "taunt"] as const;
export type Gesture = (typeof GESTURES)[number];

const MELEE: AnimKind[] = ["blade", "hammer", "shield", "rend", "quake"];
export const isMelee = (k: AnimKind) => MELEE.includes(k);

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

export type Anim = { kind: AnimKind; start: number; dur: number; target?: string; mult?: number };
export type Impact = { t: number; target: Actor; color: string; power: number };

export type Enemy = {
  id: string;
  kind: "monster" | "zombie";
  x: number;
  z: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  stunUntil: number;
  chestY: number;
  reach: number;
  radius: number;
};

export type HeroPos = { x: number; z: number; y: number; yaw: number; speed: number };

const MAX_HP = { warden: 120, sentinel: 160 };
export const ROLL_DUR = 0.55;
const yawTo = (ax: number, az: number, bx: number, bz: number) => Math.atan2(bx - ax, bz - az);

export const engine = {
  now: 0,
  version: 0,
  selected: "warden" as HeroId,
  weapon: { warden: "blade", sentinel: "hammer" } as Record<HeroId, WeaponId>,
  hp: { warden: MAX_HP.warden, sentinel: MAX_HP.sentinel } as Record<HeroId, number>,
  maxHp: MAX_HP as Record<HeroId, number>,
  pos: {
    warden: { x: WARDEN_XZ[0], z: WARDEN_XZ[1], y: 0.3, yaw: yawTo(...WARDEN_XZ, ...MONSTER_XZ), speed: 0 },
    sentinel: { x: SENTINEL_XZ[0], z: SENTINEL_XZ[1], y: 0.3, yaw: yawTo(...SENTINEL_XZ, ...MONSTER_XZ), speed: 0 },
  } as Record<HeroId, HeroPos>,
  enemies: {
    monster: { id: "monster", kind: "monster", x: MONSTER_XZ[0], z: MONSTER_XZ[1], hp: 320, maxHp: 320, alive: true, stunUntil: 0, chestY: 1.1, reach: 3.2, radius: 0.9 },
  } as Record<string, Enemy>,
  alive: true,
  auto: false,
  paused: false,
  anim: {} as Record<Actor, Anim | undefined>,
  cdUntil: {} as Record<string, number>,
  hits: {} as Record<Actor, number[]>,
  impacts: [] as Impact[],
  shake: 0,
  panic: 0,
  log: [] as string[],
  nextMonsterAct: 5,
  nextAuto: 2,
  /** State of the hero under the player's control. */
  p: {
    stamina: 100,
    maxStamina: 100,
    blocking: false,
    parryUntil: 0,
    parryCd: 0,
    rollStart: -9,
    rollUntil: 0,
    rollCd: 0,
    rollDx: 0,
    rollDz: 1,
    invulnUntil: 0,
    wardUntil: 0,
    sprinting: false,
    twoHand: false,
    charging: false,
    chargeStart: 0,
    lock: false,
    target: null as string | null,
    itemIdx: 0,
    itemCd: 0,
    kills: 0,
    prompt: null as string | null,
    gesture: null as { kind: Gesture; start: number } | null,
  },
  items: [
    { id: "potion" as ItemId, count: 3 },
    { id: "flask" as ItemId, count: 4 },
    { id: "salve" as ItemId, count: 2 },
  ],
};

const listeners = new Set<() => void>();
const queue: { at: number; fn: () => void }[] = [];

export function emit() {
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

export const schedule = (at: number, fn: () => void) => queue.push({ at, fn });

export function say(msg: string) {
  engine.log = [msg, ...engine.log].slice(0, 5);
}

export const currentWeapon = (hero: HeroId) => WEAPONS[hero].find((w) => w.id === engine.weapon[hero])!;
export const busy = (a: Actor) => {
  const an = engine.anim[a];
  return !!an && engine.now < an.start + an.dur;
};
/** Seconds of cooldown left for an ability id ("blade", "warden-special", ...). */
export const cooldownLeft = (id: string) => Math.max(0, (engine.cdUntil[id] ?? 0) - engine.now);

/** Progress 0..1 of an actor's current animation if it is one of `kinds`, else -1. */
export function progress(a: Actor, ...kinds: AnimKind[]) {
  const an = engine.anim[a];
  if (!an || !kinds.includes(an.kind)) return -1;
  const p = (engine.now - an.start) / an.dur;
  return p < 0 || p > 1 ? -1 : p;
}

/** Decaying flash (1 → 0) after the latest hit on an actor. */
export function hitFlash(a: Actor, decay = 7) {
  let v = 0;
  for (const t of engine.hits[a] ?? []) {
    const age = engine.now - t;
    if (age >= 0) v = Math.max(v, Math.exp(-age * decay));
  }
  return v;
}

const COLOR: Record<string, string> = { warden: "#7ff5df", sentinel: "#ff9a3c" };

function impact(target: Actor, color: string, power: number) {
  engine.impacts = [...engine.impacts.filter((i) => engine.now - i.t < 1), { t: engine.now, target, color, power }];
  engine.hits[target] = [...(engine.hits[target] ?? []).filter((t) => engine.now - t < 2), engine.now];
}

// ---------------------------------------------------------------- targeting

export const liveEnemies = () => Object.values(engine.enemies).filter((e) => e.alive);
const distTo = (hero: HeroId, e: { x: number; z: number }) => Math.hypot(e.x - engine.pos[hero].x, e.z - engine.pos[hero].z);

/** Lock-on target if valid, else the closest enemy the hero is roughly facing. */
export function pickTarget(hero: HeroId): Enemy | null {
  const locked = engine.p.target && engine.enemies[engine.p.target];
  if (hero === engine.selected && engine.p.lock && locked && locked.alive) return locked;
  const me = engine.pos[hero];
  const live = liveEnemies();
  if (!live.length) return null;
  const facing = live.filter((e) => {
    const d = yawTo(me.x, me.z, e.x, e.z) - me.yaw;
    return Math.abs(Math.atan2(Math.sin(d), Math.cos(d))) < 1.2;
  });
  const pool = facing.length ? facing : live;
  return pool.sort((a, b) => distTo(hero, a) - distTo(hero, b))[0];
}

export function toggleLock() {
  const p = engine.p;
  if (p.lock) {
    p.lock = false;
    p.target = null;
    say("Lock-on released");
  } else {
    const t = pickTarget(engine.selected);
    if (!t) return;
    p.lock = true;
    p.target = t.id;
    say(`Locked on: ${t.kind === "monster" ? "Gravemaw" : "Husk"}`);
  }
  emit();
}

export function switchTarget() {
  const p = engine.p;
  const live = liveEnemies().sort((a, b) => distTo(engine.selected, a) - distTo(engine.selected, b));
  if (!live.length) return;
  const i = live.findIndex((e) => e.id === p.target);
  p.target = live[(i + 1) % live.length].id;
  p.lock = true;
  emit();
}

// ------------------------------------------------------------------- combat

function damageEnemy(id: string, hero: HeroId, dmg: number, power: number) {
  const e = engine.enemies[id];
  if (!e || !e.alive) return;
  const d = Math.round(dmg * (0.9 + Math.random() * 0.2));
  e.hp = Math.max(0, e.hp - d);
  impact(id, COLOR[hero], power);
  engine.shake = Math.max(engine.shake, power > 1 ? 0.9 : e.kind === "monster" ? 0.35 : 0.15);
  say(`${HERO_NAME[hero]} hits the ${e.kind === "monster" ? "Gravemaw" : "husk"} for ${d}`);
  if (e.hp <= 0) killEnemy(e, hero);
  emit();
}

function killEnemy(e: Enemy, hero: HeroId) {
  e.alive = false;
  if (hero === engine.selected) engine.p.kills++;
  if (e.kind === "monster") {
    engine.alive = false;
    engine.anim.monster = { kind: "die", start: engine.now, dur: TIMELINE.die.dur };
    engine.shake = 1;
    say("The Gravemaw is slain!");
    schedule(engine.now + 9, () => {
      e.alive = true;
      e.hp = e.maxHp;
      e.x = MONSTER_XZ[0];
      e.z = MONSTER_XZ[1];
      engine.alive = true;
      engine.anim.monster = undefined;
      engine.hp.warden = engine.maxHp.warden;
      engine.hp.sentinel = engine.maxHp.sentinel;
      engine.nextMonsterAct = engine.now + 2;
      say("A new Gravemaw claws out of the fog…");
      emit();
    });
  } else {
    say("A husk collapses");
    if (engine.p.target === e.id) {
      engine.p.target = null;
      engine.p.lock = false;
    }
    schedule(engine.now + 12, () => {
      e.alive = true;
      e.hp = e.maxHp;
      emit();
    });
  }
}

/** An enemy swings at a hero. Handles reach, roll i-frames, parry, block and ward. */
export function enemyHitsHero(enemyId: string, hero: HeroId, dmg: number) {
  const e = engine.enemies[enemyId];
  if (!e || !e.alive || engine.now < e.stunUntil) return;
  const me = engine.pos[hero];
  if (Math.hypot(e.x - me.x, e.z - me.z) > e.reach) {
    say(`The ${e.kind === "monster" ? "Gravemaw" : "husk"} swings wide`);
    emit();
    return;
  }
  const p = engine.p;
  const mine = hero === engine.selected;
  if (mine && engine.now < p.invulnUntil) {
    say("Dodged!");
    emit();
    return;
  }
  if (mine && engine.now < p.parryUntil) {
    e.stunUntil = engine.now + 1.8;
    if (enemyId === "monster") {
      engine.anim.monster = undefined;
      engine.nextMonsterAct = engine.now + 2.4;
    }
    p.stamina = Math.min(p.maxStamina, p.stamina + 25);
    impact(enemyId, "#ffffff", 1.6);
    engine.shake = Math.max(engine.shake, 0.7);
    say("Parried! The enemy is staggered");
    emit();
    return;
  }
  let d = dmg;
  if (mine && p.blocking) {
    d *= 0.25;
    p.stamina = Math.max(0, p.stamina - 15);
  }
  if (mine && engine.now < p.wardUntil) d *= 0.5;
  d = Math.round(d * (0.85 + Math.random() * 0.3));
  engine.hp[hero] = Math.max(8, engine.hp[hero] - d);
  impact(hero, "#ff4a3a", 1.4);
  engine.shake = Math.max(engine.shake, 0.55);
  say(`The ${e.kind === "monster" ? "Gravemaw" : "husk"} ${mine && p.blocking ? "is blocked, chips" : "mauls"} the ${HERO_NAME[hero]} for ${d}`);
  emit();
}

const COST: Record<AttackMode, number> = { light: 8, heavy: 22, strong: 30, skill: 20 };

export function heroAct(hero: HeroId, mode: AttackMode = "light", charge = 0) {
  const p = engine.p;
  const mine = hero === engine.selected;
  if (busy(hero)) return false;
  if (mine && (engine.now < p.rollUntil || p.blocking)) return false;
  const w = currentWeapon(hero);
  const sp = SPECIALS[hero];
  const special = mode === "skill";
  const id = special ? `${hero}-special` : w.id;
  if (cooldownLeft(id) > 0) return false;
  if (mine && p.stamina < COST[mode]) {
    say("Not enough stamina");
    emit();
    return false;
  }
  const kind = special ? sp.kind : w.id;
  const tl = TIMELINE[kind];
  const target = pickTarget(hero);
  const me = engine.pos[hero];
  if (target) me.yaw = yawTo(me.x, me.z, target.x, target.z);
  const two = mine && p.twoHand;
  const mult = (mode === "heavy" ? 1.6 : mode === "strong" ? 1 + Math.min(charge, 1.2) : 1) * (two ? 1.3 : 1);
  if (mine) p.stamina -= COST[mode];
  engine.anim[hero] = { kind, start: engine.now, dur: tl.dur, target: target?.id, mult };
  engine.cdUntil[id] =
    engine.now + (special ? sp.cooldown : w.cooldown) * (mode === "heavy" ? 1.3 : 1) * (two ? 1.25 : 1);
  const total = (special ? sp.damage : w.damage) * mult;
  const power = special || mode === "strong" ? 2 : mode === "heavy" ? 1.5 : 1;
  tl.hits.forEach((h) =>
    schedule(engine.now + h, () => {
      if (!target || !target.alive) return;
      const d = Math.hypot(target.x - me.x, target.z - me.z);
      const reach = (kind === "rend" || kind === "quake" ? 3.4 : 2.9) + target.radius;
      if (isMelee(kind) && d > reach) {
        say("Too far — the blow falls short");
        emit();
        return;
      }
      if (d > 11) return;
      damageEnemy(target.id, hero, total / tl.hits.length, power);
    }),
  );
  emit();
  return true;
}

// ------------------------------------------------------------ player actions

export function startRoll(dx: number, dz: number) {
  const p = engine.p;
  const hero = engine.selected;
  if (busy(hero) || engine.now < p.rollCd || p.stamina < 20 || engine.now < p.rollUntil) return;
  const len = Math.hypot(dx, dz) || 1;
  p.rollDx = dx / len;
  p.rollDz = dz / len;
  p.rollStart = engine.now;
  p.rollUntil = engine.now + ROLL_DUR;
  p.rollCd = engine.now + 0.9;
  p.invulnUntil = engine.now + 0.45;
  p.stamina -= 20;
  p.blocking = false;
}

export function parry() {
  const p = engine.p;
  if (engine.now < p.parryCd || p.stamina < 10 || busy(engine.selected)) return;
  p.parryUntil = engine.now + 0.35;
  p.parryCd = engine.now + 1.0;
  p.stamina -= 10;
}

export function setBlock(on: boolean) {
  const p = engine.p;
  p.blocking = on && engine.now >= p.rollUntil && !busy(engine.selected);
}

export function startCharge() {
  const p = engine.p;
  if (p.charging || busy(engine.selected) || p.stamina < COST.strong) return;
  p.charging = true;
  p.chargeStart = engine.now;
}

/** Release a held Shift+click: a quick tap is a heavy attack, a long hold a charged strong attack. */
export function releaseCharge() {
  const p = engine.p;
  if (!p.charging) return;
  p.charging = false;
  const held = engine.now - p.chargeStart;
  if (held < 0.25) heroAct(engine.selected, "heavy");
  else heroAct(engine.selected, "strong", held);
}

export const chargeFrac = () => (engine.p.charging ? Math.min(1, (engine.now - engine.p.chargeStart) / 1.2) : 0);

export function toggleTwoHand() {
  engine.p.twoHand = !engine.p.twoHand;
  say(engine.p.twoHand ? "Two-handed grip: +30% damage, slower recovery" : "One-handed grip");
  emit();
}

export function cycleItem(dir: 1 | -1) {
  const n = engine.items.length;
  engine.p.itemIdx = (engine.p.itemIdx + dir + n) % n;
  emit();
}

export function consumeItem() {
  const p = engine.p;
  const it = engine.items[p.itemIdx];
  if (!it || it.count <= 0 || engine.now < p.itemCd) return;
  const hero = engine.selected;
  p.itemCd = engine.now + 1;
  it.count--;
  if (it.id === "potion") {
    engine.hp[hero] = Math.min(engine.maxHp[hero], engine.hp[hero] + 50);
    say("You drink a Healing Draught (+50)");
  } else if (it.id === "salve") {
    p.wardUntil = engine.now + 6;
    say("Spirit Salve: damage halved for 6s");
  } else {
    const t = pickTarget(hero);
    if (t) {
      schedule(engine.now + 0.5, () => damageEnemy(t.id, hero, 30, 1.5));
      say("You hurl an Ember Flask");
    } else {
      it.count++;
    }
  }
  emit();
}

export function interact() {
  const me = engine.pos[engine.selected];
  const near = INTERACTABLES.find((i) => Math.hypot(i.x - me.x, i.z - me.z) < i.r);
  if (!near) return;
  const h = engine.selected;
  if (near.id === "bonfire") {
    engine.hp[h] = engine.maxHp[h];
    engine.p.stamina = engine.p.maxStamina;
    say("You warm yourself by the bonfire. Fully rested.");
  } else if (near.id === "well") {
    engine.hp[h] = Math.min(engine.maxHp[h], engine.hp[h] + 30);
    say("Cold water from the well (+30)");
  } else if (near.id === "pen") say("The cattle low nervously.");
  else say("Whispers drift between the stones…");
  emit();
}

export function doGesture(kind: Gesture) {
  engine.p.gesture = { kind, start: engine.now };
  say(`${HERO_NAME[engine.selected]}: ${kind}`);
  if (kind === "taunt") engine.nextMonsterAct = Math.min(engine.nextMonsterAct, engine.now + 1);
  emit();
}

export const gestureProgress = () => {
  const g = engine.p.gesture;
  if (!g) return null;
  const p = (engine.now - g.start) / 2;
  return p > 1 ? null : { kind: g.kind, p };
};

// ---------------------------------------------------------------- selection

export function selectHero(h: HeroId) {
  if (engine.selected !== h) {
    engine.selected = h;
    engine.p.lock = false;
    engine.p.target = null;
    engine.p.blocking = false;
    engine.p.charging = false;
    emit();
  }
}
export const toggleHero = () => selectHero(engine.selected === "warden" ? "sentinel" : "warden");

export function selectWeapon(hero: HeroId, idx: number) {
  const w = WEAPONS[hero][idx];
  if (w && engine.weapon[hero] !== w.id && !busy(hero)) {
    engine.weapon[hero] = w.id;
    selectHero(hero);
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

// --------------------------------------------------------------- simulation

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

  const p = engine.p;
  engine.shake *= Math.exp(-dt * 5);
  engine.panic += ((engine.alive ? 1 : 0) - engine.panic) * Math.min(1, dt * (engine.alive ? 2.5 : 1.2));
  if (!p.sprinting && !p.blocking && !p.charging) p.stamina = Math.min(p.maxStamina, p.stamina + dt * 24);
  if (p.blocking) p.stamina = Math.max(0, p.stamina - dt * 4);
  if (p.stamina <= 0 && p.blocking) p.blocking = false;

  // Nearby interactable prompt.
  const me = engine.pos[engine.selected];
  const near = INTERACTABLES.find((i) => Math.hypot(i.x - me.x, i.z - me.z) < i.r);
  const prompt = near ? near.label : null;
  if (prompt !== p.prompt) {
    p.prompt = prompt;
    emit();
  }

  // Drop a lock-on whose target is gone.
  if (p.lock && (!p.target || !engine.enemies[p.target]?.alive)) {
    p.lock = false;
    p.target = null;
    emit();
  }

  // Monster AI: closes the distance, then picks an attack that fits the range.
  const m = engine.enemies.monster;
  if (m.alive) {
    const heroes = (["warden", "sentinel"] as HeroId[]).sort((a, b) => distTo(a, m) - distTo(b, m));
    const near = heroes[0];
    const d = distTo(near, m);
    const stunned = t < m.stunUntil;
    if (!busy("monster") && !stunned) {
      if (d > 3.0) {
        const nx = (engine.pos[near].x - m.x) / d;
        const nz = (engine.pos[near].z - m.z) / d;
        const nxp = m.x + nx * 0.55 * dt;
        const nzp = m.z + nz * 0.55 * dt;
        if (Math.hypot(nxp - MONSTER_XZ[0], nzp - MONSTER_XZ[1]) < 4.5) {
          m.x = nxp;
          m.z = nzp;
        }
      }
      if (t >= engine.nextMonsterAct) {
        let kind: AnimKind;
        if (d > 6.5) kind = "roar";
        else if (d > 3.4) kind = Math.random() < 0.6 ? "lunge" : "roar";
        else kind = MONSTER_ATTACKS[Math.floor(Math.random() * MONSTER_ATTACKS.length)];
        const tl = TIMELINE[kind];
        engine.anim.monster = { kind, start: t, dur: tl.dur };
        engine.nextMonsterAct = t + tl.dur + 1.6 + Math.random() * 2;
        m.reach = kind === "lunge" ? 4.2 : 3.2;
        if (kind === "roar") {
          schedule(t + 0.4, () => {
            engine.shake = Math.max(engine.shake, 0.5);
            say("The Gravemaw roars!");
            emit();
          });
        } else {
          const dmg = kind === "slam" ? 24 : kind === "lunge" ? 20 : 14;
          tl.hits.forEach((h) => schedule(t + h, () => enemyHitsHero("monster", near, dmg)));
        }
        emit();
      }
    }
  }

  // Auto-battle: heroes pick the next ready ability themselves.
  if (engine.auto && t >= engine.nextAuto && liveEnemies().length) {
    engine.nextAuto = t + 0.5;
    for (const hero of ["warden", "sentinel"] as HeroId[]) {
      if (busy(hero)) continue;
      if (cooldownLeft(`${hero}-special`) <= 0 && Math.random() < 0.4) heroAct(hero, "skill");
      else {
        const ready = WEAPONS[hero].filter((w) => cooldownLeft(w.id) <= 0);
        if (ready.length) {
          engine.weapon[hero] = ready[Math.floor(Math.random() * ready.length)].id;
          heroAct(hero);
        }
      }
    }
  }

  for (const h of ["warden", "sentinel"] as HeroId[]) {
    if (engine.hp[h] < engine.maxHp[h]) engine.hp[h] = Math.min(engine.maxHp[h], engine.hp[h] + dt * 1.2);
    engine.pos[h].y = groundAt(engine.pos[h].x, engine.pos[h].z);
  }
}

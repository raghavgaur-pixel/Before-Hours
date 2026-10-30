import { useSyncExternalStore } from "react";
import { GRAVEYARD, INTERACTABLES, MONSTER_XZ, SENTINEL_XZ, WARDEN_XZ, groundAt, isWalkable, nearestTile } from "./terrain";

export type HeroId = "warden" | "sentinel";
/** A hero id, or an enemy id ("monster", "z0", ...). */
export type Actor = string;
export type WeaponId = "blade" | "staff" | "bow" | "daggers" | "hammer" | "cannon" | "shield" | "gauntlets";
export type AnimKind = WeaponId | "rend" | "quake" | "swipe" | "slam" | "lunge" | "roar" | "die" | "cleave" | "flurry" | "stomp";
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
    { id: "daggers", hero: "warden", name: "Veil Daggers", type: "Melee", damage: 21, cooldown: 1.2, desc: "Three rapid alternating stabs. Fast, close range." },
  ],
  sentinel: [
    { id: "hammer", hero: "sentinel", name: "Siege Hammer", type: "Melee", damage: 28, cooldown: 2.4, desc: "Overhead slam that cracks the ground." },
    { id: "cannon", hero: "sentinel", name: "Ember Cannon", type: "Ranged", damage: 30, cooldown: 3.6, desc: "Lobs an explosive shell from the shoulder cannon." },
    { id: "shield", hero: "sentinel", name: "Bulwark Shield", type: "Melee", damage: 14, cooldown: 1.8, desc: "Shield bash. Quick, and staggers the beast." },
    { id: "gauntlets", hero: "sentinel", name: "Quake Gauntlets", type: "Melee", damage: 30, cooldown: 2.6, desc: "A jab followed by a crushing uppercut." },
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

const MELEE: AnimKind[] = ["blade", "daggers", "hammer", "shield", "gauntlets", "rend", "quake"];
export const isMelee = (k: AnimKind) => MELEE.includes(k);

/** Timing (seconds from the start of an action) of launches, flight and hits. */
export const TIMELINE: Record<AnimKind, { dur: number; hits: number[]; launches?: number[]; flight?: number }> = {
  blade: { dur: 1.1, hits: [0.38, 0.74] },
  staff: { dur: 1.7, hits: [1.05, 1.25, 1.45], launches: [0.7, 0.9, 1.1], flight: 0.35 },
  bow: { dur: 1.4, hits: [1.0], launches: [0.7], flight: 0.3 },
  daggers: { dur: 1.1, hits: [0.28, 0.5, 0.72] },
  gauntlets: { dur: 1.5, hits: [0.45, 1.0] },
  rend: { dur: 1.7, hits: [1.0] },
  hammer: { dur: 1.6, hits: [1.0] },
  cannon: { dur: 1.5, hits: [1.2], launches: [0.6], flight: 0.6 },
  shield: { dur: 1.0, hits: [0.45] },
  quake: { dur: 2.0, hits: [1.3] },
  swipe: { dur: 1.5, hits: [0.9] },
  slam: { dur: 1.9, hits: [1.3] },
  lunge: { dur: 1.6, hits: [1.0] },
  cleave: { dur: 2.3, hits: [1.4] },
  flurry: { dur: 2.6, hits: [0.8, 1.1, 1.4, 1.7] },
  stomp: { dur: 2.1, hits: [1.3] },
  roar: { dur: 1.7, hits: [] },
  die: { dur: 2.4, hits: [] },
};

export type Anim = { kind: AnimKind; start: number; dur: number; target?: string; mult?: number };
export type Impact = { t: number; target: Actor; color: string; power: number };

export type Enemy = {
  id: string;
  kind: "monster" | "zombie" | "villain" | "boss";
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

/** The playable roster. Only the main character, the Stoneguard sentinel, is in the game. */
export const HEROES: HeroId[] = ["sentinel"];
export const MAIN_HERO: HeroId = HEROES[0];

/** Where husks rise: a loose ring around the graveyard. */
export const zombieSpawn = (i: number): [number, number] => [
  GRAVEYARD.x + Math.cos(i * 1.05 + 0.4) * 1.5,
  GRAVEYARD.z + Math.sin(i * 1.05 + 0.4) * 1.3,
];
export const ZOMBIE_COUNT = 6;
export const VILLAIN_COUNT = 4;

/** Raiders come in from the fields south of the village. */
const VILLAIN_SPOTS: [number, number][] = [[-3.4, 4.4], [1.8, 5.6], [-0.8, 6.2], [3.0, 4.0], [-2.0, 5.4]];
export const villainSpawn = (i: number): [number, number] => {
  const ok = VILLAIN_SPOTS.filter(([x, z]) => isWalkable(x, z));
  return ok[i % Math.max(1, ok.length)] ?? VILLAIN_SPOTS[0];
};

/** Progression: kill enemies for XP, level up to upgrade the party and weapons, reach the boss level. */
export const XP_PER_LEVEL = 40;
export const BOSS_LEVEL = 7;
export const XP_VALUE = { zombie: 10, villain: 15, monster: 40, boss: 0 } as const;
/** Weapons upgrade a tier at levels 3 and 5. */
export const tierForLevel = (level: number) => 1 + (level >= 3 ? 1 : 0) + (level >= 5 ? 1 : 0);

/** Levels 1-3 are husks, 4-6 raiders, 7 the final boss. */
export type Stage = "zombie" | "villain" | "boss";
export const stageFor = (level: number): Stage => (level >= BOSS_LEVEL ? "boss" : level >= 4 ? "villain" : "zombie");
export const STAGE_LABEL: Record<Stage, string> = {
  zombie: "Stage 1 · Husks (Lv 1–3)",
  villain: "Stage 2 · Raiders (Lv 4–6)",
  boss: "Final · The Grafted King (Lv 7)",
};
export const TIER_NAME = ["", "I", "II", "III"];

const zombies = Object.fromEntries(
  Array.from({ length: ZOMBIE_COUNT }, (_, i) => {
    const [x, z] = zombieSpawn(i);
    const id = `z${i}`;
    return [id, { id, kind: "zombie", x, z, hp: 45, maxHp: 45, alive: true, stunUntil: 0, chestY: 0.5, reach: 0.8, radius: 0.3 } as Enemy];
  }),
);

const villains = Object.fromEntries(
  Array.from({ length: VILLAIN_COUNT }, (_, i) => {
    const [x, z] = villainSpawn(i);
    const id = `v${i}`;
    return [id, { id, kind: "villain", x, z, hp: 70, maxHp: 70, alive: false, stunUntil: 0, chestY: 0.55, reach: 0.95, radius: 0.3 } as Enemy];
  }),
);
export const ROLL_DUR = 0.55;
const yawTo = (ax: number, az: number, bx: number, bz: number) => Math.atan2(bx - ax, bz - az);

export const engine = {
  now: 0,
  version: 0,
  selected: "sentinel" as HeroId,
  weapon: { warden: "blade", sentinel: "hammer" } as Record<HeroId, WeaponId>,
  hp: { warden: MAX_HP.warden, sentinel: MAX_HP.sentinel } as Record<HeroId, number>,
  maxHp: { warden: MAX_HP.warden, sentinel: MAX_HP.sentinel } as Record<HeroId, number>,
  pos: {
    warden: { x: WARDEN_XZ[0], z: WARDEN_XZ[1], y: 0.3, yaw: yawTo(...WARDEN_XZ, ...MONSTER_XZ), speed: 0 },
    sentinel: { x: SENTINEL_XZ[0], z: SENTINEL_XZ[1], y: 0.3, yaw: yawTo(...SENTINEL_XZ, ...MONSTER_XZ), speed: 0 },
  } as Record<HeroId, HeroPos>,
  enemies: {
    monster: { id: "monster", kind: "monster", x: MONSTER_XZ[0], z: MONSTER_XZ[1], hp: 320, maxHp: 320, alive: false, stunUntil: 0, chestY: 1.1, reach: 3.2, radius: 0.9 },
    boss: { id: "boss", kind: "boss", x: 0.5, z: -4.8, hp: 600, maxHp: 600, alive: false, stunUntil: 0, chestY: 1.9, reach: 4.8, radius: 1.2 },
    ...zombies,
    ...villains,
  } as Record<string, Enemy>,
  /** Civilian positions, written by each villager every frame so husks can hunt them. */
  civs: [] as { x: number; z: number; downUntil: number }[],
  prog: {
    xp: 0,
    level: 1,
    tier: 1,
    kills: { zombie: 0, villain: 0, monster: 0 },
    levelUpAt: -9,
    banner: null as null | { title: string; sub: string; img?: string; until: number },
    boss: "locked" as "locked" | "arrived" | "dead",
    bossAt: -9,
    bossDiedAt: -9,
  },
  alive: false,
  /** Fallen heroes; both down is game over. */
  down: { warden: false, sentinel: false } as Record<HeroId, boolean>,
  gameOver: false,
  /** Recent deaths, for death effects: where, what, and when. */
  deaths: [] as { t: number; x: number; z: number; kind: string; big: boolean }[],
  /** Chosen look per hero (see skins.ts). */
  skin: { warden: "warden-classic", sentinel: "sentinel-stoneguard" } as Record<HeroId, string>,
  /** When each hero last changed weapon, to drive the swap flourish. */
  swapAt: { warden: -9, sentinel: -9 } as Record<HeroId, number>,
  victoryUntil: 0,
  flask: null as { start: number; hero: HeroId; target: string } | null,
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
  nextBossAct: 0,
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

/** The hero whose special attack has just landed, and how long ago (seconds), if any. */
export function specialHit() {
  for (const hero of ["warden", "sentinel"] as HeroId[]) {
    const a = engine.anim[hero];
    if (!a || (a.kind !== "rend" && a.kind !== "quake")) continue;
    const age = engine.now - (a.start + TIMELINE[a.kind].hits[0]);
    if (age >= 0 && age < 1.1) return { hero, age };
  }
  return null;
}

const COLOR: Record<string, string> = { warden: "#7ff5df", sentinel: "#ff9a3c" };

function impact(target: Actor, color: string, power: number) {
  engine.impacts = [...engine.impacts.filter((i) => engine.now - i.t < 1), { t: engine.now, target, color, power }];
  engine.hits[target] = [...(engine.hits[target] ?? []).filter((t) => engine.now - t < 2), engine.now];
}

// ---------------------------------------------------------------- targeting

export const liveEnemies = () => Object.values(engine.enemies).filter((e) => e.alive);
export const aliveHeroes = () => HEROES.filter((h) => !engine.down[h]);

const stageActive = (e: Enemy) => (e.kind === "zombie" || e.kind === "villain") && stageFor(engine.prog.level) === e.kind;

function pushDeath(x: number, z: number, kind: string, big = false) {
  engine.deaths = [...engine.deaths.filter((d) => engine.now - d.t < 6), { t: engine.now, x, z, kind, big }];
}

/** Bring in the foes for the current stage and send the other stage's away. */
export function applyStage() {
  for (const e of Object.values(engine.enemies)) {
    if (e.kind !== "zombie" && e.kind !== "villain") continue;
    if (stageActive(e)) {
      if (!e.alive) {
        e.alive = true;
        e.hp = e.maxHp;
      }
    } else if (e.alive) {
      e.alive = false;
      pushDeath(e.x, e.z, "dismiss");
    }
  }
}
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

export function showBanner(title: string, sub: string, seconds = 3.5, img?: string) {
  engine.prog.banner = { title, sub, img, until: engine.now + seconds };
}

function levelUp() {
  const pr = engine.prog;
  pr.level++;
  pr.levelUpAt = engine.now;
  for (const h of ["warden", "sentinel"] as HeroId[]) {
    engine.maxHp[h] += 15;
    engine.hp[h] = engine.maxHp[h];
  }
  engine.p.maxStamina += 10;
  engine.p.stamina = engine.p.maxStamina;
  engine.down.warden = false;
  engine.down.sentinel = false;
  const tier = tierForLevel(pr.level);
  const upgraded = tier > pr.tier;
  pr.tier = tier;
  say(`LEVEL UP! Party level ${pr.level}${upgraded ? ` · weapons upgraded to tier ${TIER_NAME[tier]}` : ""}`);
  const stage = stageFor(pr.level);
  showBanner(
    `LEVEL ${pr.level}`,
    stage !== stageFor(pr.level - 1)
      ? STAGE_LABEL[stage]
      : upgraded
        ? `Your weapons are now tier ${TIER_NAME[tier]}`
        : "Health, stamina and damage increased",
  );
  if (pr.level >= BOSS_LEVEL) onBossLevel();
  else applyStage();
}

/** The final boss rises from the north once the party reaches BOSS_LEVEL. Minions stop respawning. */
export function spawnBoss() {
  const pr = engine.prog;
  if (pr.boss !== "locked") return;
  pr.boss = "arrived";
  pr.bossAt = engine.now;
  for (const en of Object.values(engine.enemies)) {
    if (en.id !== "boss") en.alive = false;
  }
  engine.alive = false;
  engine.p.lock = false;
  engine.p.target = null;
  const b = engine.enemies.boss;
  b.alive = true;
  b.hp = b.maxHp;
  b.x = 0.5;
  b.z = -4.8;
  engine.anim.boss = undefined;
  engine.nextBossAct = engine.now + 3.5;
  engine.shake = 1;
  say("THE GRAFTED KING has arrived!");
  showBanner("THE GRAFTED KING", "A giant draped in gold, grown from a dozen stolen arms…", 6.5, "/images/boss.webp");
  emit();
}
const onBossLevel = () => spawnBoss();

export function addXp(n: number) {
  const pr = engine.prog;
  pr.xp += n;
  while (pr.xp >= XP_PER_LEVEL && pr.level < BOSS_LEVEL) {
    pr.xp -= XP_PER_LEVEL;
    levelUp();
  }
  if (pr.level >= BOSS_LEVEL) pr.xp = Math.min(pr.xp, XP_PER_LEVEL);
  emit();
}

/** Start the whole game over from level 1. */
export function restartGame() {
  resetProgress();
  showBanner("A NEW NIGHT BEGINS", "Stage 1 · Husks (Lv 1–3)", 4);
  emit();
}

export function resetProgress() {
  const pr = engine.prog;
  pr.xp = 0;
  pr.level = 1;
  pr.tier = 1;
  pr.kills = { zombie: 0, villain: 0, monster: 0 };
  engine.maxHp.warden = MAX_HP.warden;
  engine.maxHp.sentinel = MAX_HP.sentinel;
  engine.hp.warden = MAX_HP.warden;
  engine.hp.sentinel = MAX_HP.sentinel;
  engine.p.maxStamina = 100;
  engine.p.stamina = 100;
  pr.boss = "locked";
  engine.enemies.boss.alive = false;
  engine.anim.boss = undefined;
  for (const en of Object.values(engine.enemies)) {
    if (en.id === "boss") continue;
    en.alive = false;
    en.hp = en.maxHp;
  }
  engine.enemies.monster.x = MONSTER_XZ[0];
  engine.enemies.monster.z = MONSTER_XZ[1];
  engine.anim.monster = undefined;
  engine.alive = false;
  engine.down.warden = false;
  engine.down.sentinel = false;
  engine.gameOver = false;
  engine.selected = MAIN_HERO;
  applyStage();
  pr.banner = null;
  queue.length = 0;
  engine.anim = {};
  engine.p.lock = false;
  engine.p.target = null;
  engine.pos.warden.x = WARDEN_XZ[0];
  engine.pos.warden.z = WARDEN_XZ[1];
  engine.pos.sentinel.x = SENTINEL_XZ[0];
  engine.pos.sentinel.z = SENTINEL_XZ[1];
  engine.log = [];
  say("Progress reset");
  emit();
}

const RESPAWN: Record<string, number> = { zombie: 5, villain: 6, monster: 10 };

function killEnemy(e: Enemy, hero: HeroId) {
  e.alive = false;
  pushDeath(e.x, e.z, e.kind, e.kind === "boss");
  if (hero === engine.selected) engine.p.kills++;
  if (e.kind === "monster" || e.kind === "zombie" || e.kind === "villain") {
    engine.prog.kills[e.kind]++;
    addXp(XP_VALUE[e.kind]);
  }
  if (e.kind === "boss") {
    engine.anim.boss = { kind: "die", start: engine.now, dur: TIMELINE.die.dur };
    engine.prog.boss = "dead";
    engine.prog.bossDiedAt = engine.now;
    engine.shake = 1;
    engine.victoryUntil = engine.now + 8;
    // The collapse is followed by a second, much larger golden burst as the body dissolves.
    schedule(engine.now + 2.4, () => {
      pushDeath(e.x, e.z, "boss", true);
      engine.shake = 1;
    });
    say("THE GRAFTED KING FALLS! Victory!");
    showBanner("VICTORY", "The Grafted King is slain", 5);
  } else if (e.kind === "monster") {
    engine.alive = false;
    engine.anim.monster = { kind: "die", start: engine.now, dur: TIMELINE.die.dur };
    engine.shake = 1;
    engine.victoryUntil = engine.now + 5;
    say("The Gravemaw is slain!");
    schedule(engine.now + RESPAWN.monster, () => {
      if (engine.prog.boss !== "locked" || !stageActive(e)) return;
      e.alive = true;
      e.hp = e.maxHp;
      e.x = MONSTER_XZ[0];
      e.z = MONSTER_XZ[1];
      engine.alive = true;
      engine.anim.monster = undefined;
      engine.nextMonsterAct = engine.now + 2;
      say("A new Gravemaw claws out of the fog…");
      emit();
    });
  } else {
    say(e.kind === "villain" ? "A raider falls" : "A husk collapses");
    if (engine.p.target === e.id) {
      engine.p.target = null;
      engine.p.lock = false;
    }
    schedule(engine.now + RESPAWN[e.kind], () => {
      if (engine.prog.boss !== "locked" || !stageActive(e)) return;
      e.alive = true;
      e.hp = e.maxHp;
      emit();
    });
  }
}

/** An enemy swings at a hero. Handles reach, roll i-frames, parry, block and ward. */
export function enemyHitsHero(enemyId: string, hero: HeroId, dmg: number) {
  const e = engine.enemies[enemyId];
  if (!e || !e.alive || engine.now < e.stunUntil || engine.down[hero]) return;
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
    } else if (enemyId === "boss") {
      engine.anim.boss = undefined;
      engine.nextBossAct = engine.now + 2.2;
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
  engine.hp[hero] = Math.max(0, engine.hp[hero] - d);
  impact(hero, "#ff4a3a", 1.4);
  engine.shake = Math.max(engine.shake, 0.55);
  say(`The ${e.kind === "monster" ? "Gravemaw" : e.kind === "villain" ? "raider" : e.kind === "boss" ? "Grafted King" : "husk"} ${mine && p.blocking ? "is blocked, chips" : "hits"} the ${HERO_NAME[hero]} for ${d}`);
  if (engine.hp[hero] <= 0) heroDown(hero);
  emit();
}

function heroDown(hero: HeroId) {
  engine.down[hero] = true;
  engine.p.blocking = false;
  engine.p.charging = false;
  engine.anim[hero] = undefined;
  engine.shake = 1;
  pushDeath(engine.pos[hero].x, engine.pos[hero].z, "hero");
  say(`${HERO_NAME[hero]} has fallen!`);
  const other = HEROES.find((h) => h !== hero && !engine.down[h]);
  if (!other) {
    engine.gameOver = true;
    engine.auto = false;
    say("YOU DIED");
  } else if (engine.selected === hero) {
    engine.selected = other;
    engine.p.lock = false;
    engine.p.target = null;
  }
}

/** After a defeat: both heroes stand again at full health, the current stage restarts. */
export function retryAfterDeath() {
  for (const h of ["warden", "sentinel"] as HeroId[]) {
    engine.down[h] = false;
    engine.hp[h] = engine.maxHp[h];
  }
  engine.pos.warden.x = WARDEN_XZ[0];
  engine.pos.warden.z = WARDEN_XZ[1];
  engine.pos.sentinel.x = SENTINEL_XZ[0];
  engine.pos.sentinel.z = SENTINEL_XZ[1];
  engine.p.stamina = engine.p.maxStamina;
  engine.gameOver = false;
  engine.selected = MAIN_HERO;
  if (engine.prog.boss === "arrived") {
    const b = engine.enemies.boss;
    b.hp = b.maxHp;
    b.x = 0.5;
    b.z = -4.8;
    engine.prog.bossAt = engine.now;
    engine.anim.boss = undefined;
    engine.nextBossAct = engine.now + 3.5;
  } else applyStage();
  engine.prog.banner = null;
  say("You rise again…");
  emit();
}

const COST: Record<AttackMode, number> = { light: 8, heavy: 22, strong: 30, skill: 20 };

export function heroAct(hero: HeroId, mode: AttackMode = "light", charge = 0) {
  const p = engine.p;
  const mine = hero === engine.selected;
  if (engine.down[hero] || busy(hero)) return false;
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
  const prog = engine.prog;
  const growth = (1 + 0.08 * (prog.level - 1)) * (1 + 0.25 * (prog.tier - 1));
  const total = (special ? sp.damage : w.damage) * mult * growth;
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
      engine.flask = { start: engine.now, hero, target: t.id };
      schedule(engine.now + 0.55, () => damageEnemy(t.id, hero, 30, 1.5));
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
    for (const k of ["warden", "sentinel"] as HeroId[]) {
      if (engine.down[k]) {
        engine.down[k] = false;
        engine.hp[k] = engine.maxHp[k] * 0.5;
        say(`${HERO_NAME[k]} is revived by the fire`);
      }
    }
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
  if (engine.down[h] || !HEROES.includes(h)) return;
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
    engine.swapAt[hero] = engine.now;
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

export function selectSkin(hero: HeroId, id: string) {
  if (engine.skin[hero] === id) return;
  engine.skin[hero] = id;
  say(`${HERO_NAME[hero]} changes skin`);
  emit();
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
  const threat = liveEnemies().length > 0;
  engine.panic += ((threat ? 1 : 0) - engine.panic) * Math.min(1, dt * (threat ? 2.5 : 1.2));
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
    const heroes = aliveHeroes().sort((a, b) => distTo(a, m) - distTo(b, m));
    const near = heroes[0] ?? engine.selected;
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

  // Final boss: marches on the nearest hero and picks a heavy attack that fits the range.
  const B = engine.enemies.boss;
  if (B.alive) {
    const near = aliveHeroes().sort((a, b) => distTo(a, B) - distTo(b, B))[0];
    const d = near ? distTo(near, B) : 99;
    const rising = t < engine.prog.bossAt + 2.5;
    if (near && !busy("boss") && t >= B.stunUntil && !rising) {
      if (d > 3.6) {
        const sp = d > 7 ? 1.3 : 0.8;
        const nx = B.x + ((engine.pos[near].x - B.x) / d) * sp * dt;
        const nz = B.z + ((engine.pos[near].z - B.z) / d) * sp * dt;
        if (nearestTile(nx, nz).terrain !== "mountain") {
          B.x = nx;
          B.z = nz;
        }
      }
      if (t >= engine.nextBossAct && d < 6.2) {
        const kind: AnimKind = d < 4.2 ? (["cleave", "flurry", "stomp"] as AnimKind[])[Math.floor(Math.random() * 3)] : "stomp";
        const tl = TIMELINE[kind];
        engine.anim.boss = { kind, start: t, dur: tl.dur };
        engine.nextBossAct = t + tl.dur + 1.2 + Math.random() * 1.2;
        B.reach = kind === "flurry" ? 4.4 : 5.2;
        const dmg = kind === "cleave" ? 32 : kind === "stomp" ? 26 : 12;
        tl.hits.forEach((h) => schedule(t + h, () => enemyHitsHero("boss", near, dmg)));
        emit();
      }
    }
  }

  // Auto-battle: heroes pick the next ready ability that can reach their target.
  if (engine.auto && t >= engine.nextAuto && liveEnemies().length) {
    engine.nextAuto = t + 0.5;
    for (const hero of aliveHeroes()) {
      if (busy(hero)) continue;
      const tgt = pickTarget(hero);
      if (!tgt) continue;
      const d = distTo(hero, tgt);
      if (d > 9) continue;
      const me = engine.pos[hero];
      // Close the gap on melee targets.
      if (d > 3.4) {
        const step = Math.min(d - 3.0, 1.2 * dt);
        me.x += ((tgt.x - me.x) / d) * step;
        me.z += ((tgt.z - me.z) / d) * step;
        me.yaw = yawTo(me.x, me.z, tgt.x, tgt.z);
      }
      const reachable = (w: Weapon) => (isMelee(w.id) ? d <= 3.6 : true);
      if (cooldownLeft(`${hero}-special`) <= 0 && d <= 3.6 && Math.random() < 0.4) heroAct(hero, "skill");
      else {
        const ready = WEAPONS[hero].filter((w) => cooldownLeft(w.id) <= 0 && reachable(w));
        if (ready.length) {
          engine.weapon[hero] = ready[Math.floor(Math.random() * ready.length)].id;
          heroAct(hero);
        }
      }
    }
  }

  for (const h of ["warden", "sentinel"] as HeroId[]) {
    if (!engine.down[h] && engine.hp[h] < engine.maxHp[h]) engine.hp[h] = Math.min(engine.maxHp[h], engine.hp[h] + dt * 1.2);
    engine.pos[h].y = groundAt(engine.pos[h].x, engine.pos[h].z);
  }
}

"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { busy, engine, liveEnemies, type HeroId } from "./battleEngine";
import { groundAt, isWalkable } from "./terrain";

/** Shared input / camera state for the third-person controls. */
export const view = {
  mode: "play" as "play" | "overview",
  /** True while the player has taken control (pointer locked, or soft-locked if the browser refused). */
  active: false,
  yaw: -Math.PI / 2,
  pitch: 0.42,
  dist: 4.8,
  sens: 1,
  keys: new Set<string>(),
};

const angleDiff = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
const lerpAngle = (a: number, b: number, k: number) => a + angleDiff(a, b) * Math.min(1, k);

/** Move a hero by (dx, dz), sliding along blocked axes and keeping clear of enemy bodies. */
function step(hero: HeroId, dx: number, dz: number) {
  const me = engine.pos[hero];
  let nx = me.x + dx;
  let nz = me.z + dz;
  if (!isWalkable(nx, nz)) {
    if (isWalkable(nx, me.z)) nz = me.z;
    else if (isWalkable(me.x, nz)) nx = me.x;
    else {
      nx = me.x;
      nz = me.z;
    }
  }
  for (const e of liveEnemies()) {
    const d = Math.hypot(nx - e.x, nz - e.z);
    const min = e.radius + 0.25;
    if (d < min && d > 0.001) {
      nx = e.x + ((nx - e.x) / d) * min;
      nz = e.z + ((nz - e.z) / d) * min;
    }
  }
  const moved = Math.hypot(nx - me.x, nz - me.z);
  me.x = nx;
  me.z = nz;
  return moved;
}

/** Drives the selected hero from the keyboard, and turns the idle hero toward the nearest enemy. */
export function PlayerDriver() {
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const hero = engine.selected;
    const me = engine.pos[hero];
    const p = engine.p;
    const k = view.keys;
    const play = view.mode === "play" && view.active && !engine.down[hero];

    // Camera-relative basis.
    const fx = -Math.sin(view.yaw);
    const fz = -Math.cos(view.yaw);
    const rx = Math.cos(view.yaw);
    const rz = -Math.sin(view.yaw);
    let dx = 0;
    let dz = 0;
    if (play) {
      const fw = (k.has("w") ? 1 : 0) - (k.has("s") ? 1 : 0);
      const rt = (k.has("d") ? 1 : 0) - (k.has("a") ? 1 : 0);
      dx = fx * fw + rx * rt;
      dz = fz * fw + rz * rt;
    }
    const len = Math.hypot(dx, dz);
    const moving = len > 0.01;
    if (moving) {
      dx /= len;
      dz /= len;
    }

    const rolling = engine.now < p.rollUntil;
    const attacking = busy(hero);
    const sprint = play && moving && k.has("shift") && p.stamina > 1 && !rolling && !p.blocking && !p.charging && !attacking;
    p.sprinting = sprint;
    if (sprint) p.stamina = Math.max(0, p.stamina - 18 * dt);

    let speed = 0;
    let mx = dx;
    let mz = dz;
    if (rolling) {
      speed = 3.6;
      mx = p.rollDx;
      mz = p.rollDz;
    } else if (moving) {
      speed = sprint ? 3.1 : p.blocking || p.charging ? 0.9 : attacking ? 0.7 : 1.7;
    }
    const moved = speed > 0 ? step(hero, mx * speed * dt, mz * speed * dt) : 0;
    me.speed = dt > 0 ? moved / dt : 0;

    // Facing.
    const target = p.target ? engine.enemies[p.target] : null;
    const aimAt = (p.lock || attacking || p.blocking || p.charging) && target?.alive ? target : null;
    let want = me.yaw;
    if (rolling) want = Math.atan2(p.rollDx, p.rollDz);
    else if (aimAt) want = Math.atan2(aimAt.x - me.x, aimAt.z - me.z);
    else if (moving) want = Math.atan2(dx, dz);
    else if (play && (p.blocking || p.charging || attacking)) want = Math.atan2(fx, fz);
    me.yaw = lerpAngle(me.yaw, want, dt * (rolling ? 25 : 12));

    // The other hero stands guard facing the nearest enemy.
    const other: HeroId = hero === "warden" ? "sentinel" : "warden";
    const o = engine.pos[other];
    o.speed = 0;
    const near = liveEnemies().sort(
      (a, b) => Math.hypot(a.x - o.x, a.z - o.z) - Math.hypot(b.x - o.x, b.z - o.z),
    )[0];
    if (near && !busy(other)) o.yaw = lerpAngle(o.yaw, Math.atan2(near.x - o.x, near.z - o.z), dt * 4);
    o.y = groundAt(o.x, o.z);
    me.y = groundAt(me.x, me.z);
  });
  return null;
}

/** Third-person follow camera with mouse look and lock-on assist. Only runs in play mode. */
export function PlayerRig() {
  const camera = useThree((s) => s.camera);
  useFrame((_, delta) => {
    if (view.mode !== "play") return;
    const dt = Math.min(delta, 0.05);
    const me = engine.pos[engine.selected];
    const p = engine.p;
    // Pull the camera back so a boss that towers over the heroes stays in frame.
    const wantDist = engine.enemies.boss.alive && engine.prog.boss === "arrived" ? 8.2 : 4.8;
    view.dist += (wantDist - view.dist) * Math.min(1, dt * 1.5);
    const target = p.lock && p.target ? engine.enemies[p.target] : null;
    if (target?.alive) {
      const want = Math.atan2(-(target.x - me.x), -(target.z - me.z));
      view.yaw = lerpAngle(view.yaw, want, dt * 3);
    }
    const cp = Math.cos(view.pitch);
    const px = me.x + Math.sin(view.yaw) * cp * view.dist;
    const pz = me.z + Math.cos(view.yaw) * cp * view.dist;
    const py = Math.max(me.y + 0.55 + Math.sin(view.pitch) * view.dist, groundAt(px, pz) + 0.45);
    camera.position.set(px, py, pz);
    camera.lookAt(me.x - Math.cos(view.yaw) * 0.25, me.y + 0.75, me.z + Math.sin(view.yaw) * 0.25);
  });
  return null;
}

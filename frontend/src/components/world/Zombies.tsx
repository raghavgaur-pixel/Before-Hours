"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import {
  VILLAIN_COUNT,
  aliveHeroes,
  ZOMBIE_COUNT,
  emit,
  engine,
  enemyHitsHero,
  heroAct,
  hitFlash,
  say,
  schedule,
  villainSpawn,
  zombieSpawn,
  type HeroId,
} from "./battleEngine";
import { groundAt, isWalkable } from "./terrain";

type Variant = "zombie" | "villain";

const LOOK = {
  zombie: { skin: "#a3a393", robe: "#3a3633", leg: "#2c2a2a", eye: "#e6f0d0", scale: 1.2, aggro: 2.6, atkDur: 1.1, dmg: 7, atkGap: 2.4 },
  villain: { skin: "#b08a6a", robe: "#2f3a2c", leg: "#241f1a", eye: "#ff6a3a", scale: 1.25, aggro: 5, atkDur: 0.8, dmg: 10, atkGap: 1.8 },
} as const;

let lastGrabLog = -99;

/**
 * A husk or a raider. Husks shamble after villagers and turn on heroes who get
 * close; raiders hunt the heroes directly, faster. Both are real enemies: lock on,
 * hit them for XP, and they respawn so there is always something to fight.
 */
function Foe({ id, index, variant }: { id: string; index: number; variant: Variant }) {
  const L = LOOK[variant];
  const spawn = variant === "zombie" ? zombieSpawn : villainSpawn;
  const root = useRef<Group>(null);
  const body = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const head = useRef<Group>(null);
  const st = useRef({
    yaw: 0,
    nextThink: 0,
    tx: 0,
    tz: 0,
    kind: "wander" as "wander" | "civ" | "hero",
    civ: -1,
    hero: "warden" as HeroId,
    atkStart: -9,
    nextAtk: 0,
    wasAlive: true,
    deadT: 0,
    phase: index * 1.9,
  });

  useFrame(({ clock }, delta) => {
    const g = root.current;
    const b = body.current;
    if (!g || !b) return;
    const dt = Math.min(delta, 0.05);
    const e = engine.enemies[id];
    const s = st.current;
    const now = engine.now;
    const t = clock.elapsedTime + s.phase;

    if (!e.alive) {
      if (s.wasAlive) {
        s.wasAlive = false;
        s.deadT = 0;
      }
      s.deadT += dt;
      b.rotation.x = -Math.min(1.5, s.deadT * 3);
      b.position.y = -Math.min(0.12, s.deadT * 0.1);
      g.visible = s.deadT < 4;
      g.position.set(e.x, groundAt(e.x, e.z), e.z);
      return;
    }
    if (!s.wasAlive) {
      s.wasAlive = true;
      const [sx, sz] = spawn(index + Math.floor(Math.random() * 3));
      e.x = sx;
      e.z = sz;
      g.visible = true;
      b.position.y = 0;
      b.rotation.x = 0;
    }

    // Choose something to hunt a couple of times a second.
    if (now >= s.nextThink) {
      s.nextThink = now + 0.5;
      let best = -1;
      let bd = 7;
      if (variant === "zombie") {
        engine.civs.forEach((c, i) => {
          const d = Math.hypot(c.x - e.x, c.z - e.z);
          if (c.downUntil < now && d < bd) {
            bd = d;
            best = i;
          }
        });
      }
      const heroes = aliveHeroes().sort(
        (a, c) => Math.hypot(engine.pos[a].x - e.x, engine.pos[a].z - e.z) - Math.hypot(engine.pos[c].x - e.x, engine.pos[c].z - e.z),
      );
      const hd = heroes.length ? Math.hypot(engine.pos[heroes[0]].x - e.x, engine.pos[heroes[0]].z - e.z) : 99;
      if (hd < L.aggro) {
        s.kind = "hero";
        s.hero = heroes[0];
      } else if (best >= 0) {
        s.kind = "civ";
        s.civ = best;
      } else {
        s.kind = "wander";
        if (Math.hypot(s.tx - e.x, s.tz - e.z) < 0.4 || s.tx === 0) {
          const [sx, sz] = spawn(index + Math.floor(Math.random() * 6));
          s.tx = sx;
          s.tz = sz;
        }
      }
    }

    let tx = s.tx;
    let tz = s.tz;
    if (s.kind === "civ" && engine.civs[s.civ]) {
      tx = engine.civs[s.civ].x;
      tz = engine.civs[s.civ].z;
    } else if (s.kind === "hero") {
      tx = engine.pos[s.hero].x;
      tz = engine.pos[s.hero].z;
    }
    const dx = tx - e.x;
    const dz = tz - e.z;
    const dist = Math.hypot(dx, dz);
    const stunned = now < e.stunUntil;
    const attacking = now < s.atkStart + L.atkDur;
    const hunting = s.kind !== "wander";

    let speed = 0;
    if (!stunned && !attacking && dist > (hunting ? 0.45 : 0.3)) {
      speed = variant === "villain" ? (hunting ? (dist < 2 ? 1.5 : 1.0) : 0.3) : hunting ? (dist < 1.8 ? 1.0 : 0.5) : 0.25;
    }
    if (speed > 0) {
      const nx = e.x + (dx / dist) * speed * dt;
      const nz = e.z + (dz / dist) * speed * dt;
      if (isWalkable(nx, nz)) {
        e.x = nx;
        e.z = nz;
      } else if (isWalkable(nx, e.z)) e.x = nx;
      else if (isWalkable(e.x, nz)) e.z = nz;
      s.yaw += Math.atan2(Math.sin(Math.atan2(dx, dz) - s.yaw), Math.cos(Math.atan2(dx, dz) - s.yaw)) * Math.min(1, dt * 6);
    }

    // Attacks.
    if (!attacking && !stunned && now >= s.nextAtk) {
      if (s.kind === "civ" && dist < 0.55 && engine.civs[s.civ]) {
        s.atkStart = now;
        s.nextAtk = now + 3.5;
        engine.civs[s.civ].downUntil = now + 2.6;
        if (now - lastGrabLog > 8) {
          lastGrabLog = now;
          say("A husk drags a villager to the ground!");
          emit();
        }
      } else if (s.kind === "hero" && dist < 0.95) {
        s.atkStart = now;
        s.nextAtk = now + L.atkGap;
        const target = s.hero;
        schedule(now + L.atkDur * 0.5, () => enemyHitsHero(id, target, L.dmg));
      }
    }

    // Pose.
    const hit = hitFlash(id, 8);
    const ap = attacking ? (now - s.atkStart) / L.atkDur : -1;
    const walkAmp = speed > 0 ? Math.min(1, speed / 0.6) : 0;
    const gait = Math.sin(t * (speed > 0.8 ? 7 : 4)) * 0.55 * walkAmp;
    g.position.set(e.x, groundAt(e.x, e.z), e.z);
    g.rotation.y = s.yaw;
    b.position.set(Math.sin(t * 70) * hit * 0.03, Math.abs(gait) * 0.02, -hit * 0.1);
    b.rotation.set(
      (attacking ? 0.5 * Math.sin(ap * Math.PI) : variant === "zombie" ? 0.12 : 0.05) + (stunned ? -0.25 : 0),
      Math.sin(t * 1.3) * 0.12 * (1 - walkAmp),
      Math.sin(t * 1.7) * 0.05,
    );
    if (legL.current) legL.current.rotation.x = gait;
    if (legR.current) legR.current.rotation.x = -gait;
    if (variant === "zombie") {
      const reach = attacking ? -1.9 + Math.sin(ap * Math.PI) * 0.9 : stunned ? -0.4 : -1.35 + Math.sin(t * 1.9) * 0.12;
      if (armL.current) armL.current.rotation.x = reach;
      if (armR.current) armR.current.rotation.x = reach + (attacking ? 0.2 : Math.sin(t * 2.3) * 0.1);
    } else {
      // Raider: arms pump as he runs, knife arm stabs.
      if (armL.current) armL.current.rotation.x = -gait * 1.1;
      if (armR.current) armR.current.rotation.x = attacking ? -1.7 * Math.sin(ap * Math.PI) : gait * 1.1 - 0.3;
    }
    if (head.current) head.current.rotation.set(0.25 + Math.sin(t * 0.9) * 0.1, Math.sin(t * 1.1) * 0.35 * (variant === "zombie" ? 1 : 0.3), Math.sin(t * 1.5) * 0.2 * (variant === "zombie" ? 1 : 0));
  });

  return (
    <group
      ref={root}
      scale={L.scale}
      onClick={(ev) => {
        ev.stopPropagation();
        engine.p.lock = true;
        engine.p.target = id;
        heroAct(engine.selected, "light");
      }}
      onPointerOver={() => {
        document.body.style.cursor = "crosshair";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    >
      <group ref={body}>
        <group ref={legL} position={[-0.05, 0.22, 0]}>
          <mesh position={[0, -0.1, 0]}>
            <cylinderGeometry args={[0.035, 0.03, 0.22, 6]} />
            <meshStandardMaterial color={L.leg} roughness={1} />
          </mesh>
        </group>
        <group ref={legR} position={[0.05, 0.22, 0]}>
          <mesh position={[0, -0.1, 0]}>
            <cylinderGeometry args={[0.035, 0.03, 0.22, 6]} />
            <meshStandardMaterial color={L.leg} roughness={1} />
          </mesh>
        </group>
        <mesh position={[0, 0.34, 0]}>
          <cylinderGeometry args={[0.065, 0.09, 0.22, 8]} />
          <meshStandardMaterial color={L.robe} roughness={1} />
        </mesh>
        {variant === "zombie" && (
          <mesh position={[0.04, 0.28, 0.08]} rotation={[0, 0, 0.4]}>
            <boxGeometry args={[0.07, 0.02, 0.01]} />
            <meshStandardMaterial color="#7a1d1d" emissive="#4a0f0f" emissiveIntensity={0.6} />
          </mesh>
        )}
        <group ref={armL} position={[-0.09, 0.42, 0]}>
          <mesh position={[0, -0.1, 0]}>
            <cylinderGeometry args={[0.02, 0.016, 0.22, 5]} />
            <meshStandardMaterial color={L.skin} roughness={1} />
          </mesh>
        </group>
        <group ref={armR} position={[0.09, 0.42, 0]}>
          <mesh position={[0, -0.1, 0]}>
            <cylinderGeometry args={[0.02, 0.016, 0.22, 5]} />
            <meshStandardMaterial color={L.skin} roughness={1} />
          </mesh>
          {variant === "villain" && (
            <mesh position={[0, -0.24, 0.04]} rotation={[0.3, 0, 0]}>
              <boxGeometry args={[0.014, 0.16, 0.03]} />
              <meshStandardMaterial color="#c9ccd0" metalness={0.8} roughness={0.35} />
            </mesh>
          )}
        </group>
        <group ref={head} position={[0, 0.5, 0.01]}>
          <mesh>
            <sphereGeometry args={[0.055, 10, 10]} />
            <meshStandardMaterial color={L.skin} roughness={1} />
          </mesh>
          {variant === "villain" && (
            <mesh position={[0, 0.012, -0.012]}>
              <coneGeometry args={[0.07, 0.11, 8]} />
              <meshStandardMaterial color={L.robe} roughness={1} />
            </mesh>
          )}
          {[-0.022, 0.022].map((x) => (
            <mesh key={x} position={[x, 0.008, 0.048]}>
              <sphereGeometry args={[0.011, 6, 6]} />
              <meshStandardMaterial color={L.eye} emissive={L.eye} emissiveIntensity={4} toneMapped={false} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

export function Zombies() {
  return (
    <>
      {Array.from({ length: ZOMBIE_COUNT }, (_, i) => (
        <Foe key={`z${i}`} id={`z${i}`} index={i} variant="zombie" />
      ))}
      {Array.from({ length: VILLAIN_COUNT }, (_, i) => (
        <Foe key={`v${i}`} id={`v${i}`} index={i} variant="villain" />
      ))}
    </>
  );
}

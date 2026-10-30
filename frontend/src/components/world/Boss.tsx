"use client";

import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh, MeshBasicMaterial, PointLight } from "three";
import { ease, hold, lunge, seg, swingAngle } from "./battle";
import { engine, heroAct, hitFlash, progress } from "./battleEngine";
import { groundAt } from "./terrain";

const GOLD = "#c9a24b";
const ARMOR = "#4a4338";
const CLOAK = "#8a6e2c";
const PALE = "#b8b49a";
const EYE = "#ffb347";

const GRAFTS = [
  { pos: [-0.3, 0.95, -0.16] as const, base: -1.1, skin: "#9a9a82", weapon: "mace" as const },
  { pos: [0.3, 0.95, -0.16] as const, base: 1.1, skin: "#7a8a6a", weapon: "spear" as const },
  { pos: [-0.52, 0.55, 0.02] as const, base: -1.45, skin: "#8a7a8a", weapon: "dagger" as const },
  { pos: [0.52, 0.55, 0.02] as const, base: 1.45, skin: "#a09070", weapon: "shield" as const },
];

function GraftWeapon({ kind }: { kind: (typeof GRAFTS)[number]["weapon"] }) {
  if (kind === "mace")
    return (
      <group position={[0, -0.5, 0.05]}>
        <mesh position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.34, 6]} />
          <meshStandardMaterial color="#3a2b20" roughness={1} />
        </mesh>
        <mesh position={[0, -0.32, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#5a5d63" metalness={0.8} roughness={0.4} />
        </mesh>
      </group>
    );
  if (kind === "spear")
    return (
      <group position={[0, -0.5, 0.05]}>
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 0.8, 6]} />
          <meshStandardMaterial color="#3a2b20" roughness={1} />
        </mesh>
        <mesh position={[0, -0.64, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.035, 0.2, 6]} />
          <meshStandardMaterial color="#c9ccd0" metalness={0.8} roughness={0.35} />
        </mesh>
      </group>
    );
  if (kind === "dagger")
    return (
      <mesh position={[0, -0.6, 0.05]}>
        <boxGeometry args={[0.04, 0.34, 0.012]} />
        <meshStandardMaterial color="#c9ccd0" metalness={0.8} roughness={0.35} />
      </mesh>
    );
  return (
    <mesh position={[0.06, -0.5, 0.1]} rotation={[0, Math.PI / 2, 0]}>
      <circleGeometry args={[0.2, 14]} />
      <meshStandardMaterial color="#6b5a2c" metalness={0.6} roughness={0.5} side={2} />
    </mesh>
  );
}

/** The Grafted King: the final boss. A giant crowned knight with a dozen stolen arms. */
export function Boss() {
  const root = useRef<Group>(null);
  const lean = useRef<Group>(null);
  const head = useRef<Group>(null);
  const jaw = useRef<Mesh>(null);
  const armR = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const legL = useRef<Group>(null);
  const legR = useRef<Group>(null);
  const grafts = useRef<(Group | null)[]>([]);
  const cloak = useRef<Mesh>(null);
  const wave = useRef<Mesh>(null);
  const flash = useRef<PointLight>(null);
  const bar = useRef<Mesh>(null);
  const yaw = useRef(Math.PI);

  useFrame(({ clock }) => {
    const r = root.current;
    const ln = lean.current;
    if (!r || !ln) return;
    const e = engine.enemies.boss;
    const t = clock.elapsedTime;
    const now = engine.now;
    const pr = engine.prog;
    const show = pr.boss === "arrived" || (pr.boss === "dead" && now - pr.bossDiedAt < 4.6);
    r.visible = show;
    if (!show) return;

    const rise = ease(seg((now - pr.bossAt) / 2.5, 0, 1));
    const risen = rise >= 1;
    r.position.set(e.x, groundAt(e.x, e.z) - (1 - rise) * 3.4, e.z);
    if (e.alive && risen) {
      const near = [engine.pos.warden, engine.pos.sentinel].sort(
        (a, b) => Math.hypot(a.x - e.x, a.z - e.z) - Math.hypot(b.x - e.x, b.z - e.z),
      )[0];
      const want = Math.atan2(near.x - e.x, near.z - e.z);
      yaw.current += Math.atan2(Math.sin(want - yaw.current), Math.cos(want - yaw.current)) * 0.06;
    }
    r.rotation.y = yaw.current;
    // After it falls, the body crumbles into gold light.
    const crumble = pr.boss === "dead" ? seg(now - pr.bossDiedAt, 2.4, 4.4) : 0;
    r.scale.setScalar(2.6 * (1 - crumble * crumble));

    const pCleave = progress("boss", "cleave");
    const pFlurry = progress("boss", "flurry");
    const pStomp = progress("boss", "stomp");
    const pDie = progress("boss", "die");
    const dead = pr.boss === "dead";
    const stunned = e.alive && now < e.stunUntil;
    const hit = hitFlash("boss", 7);

    let tilt = 0;
    let z = 0;
    let y = Math.sin(t * 1.2) * 0.012;
    let twist = 0;
    let rArm = -0.2;
    let lArm = -0.2 + Math.sin(t * 1.1) * 0.05;
    const graft = [0, 0, 0, 0];
    let lift = 0;
    let wv = -1;
    let jawOpen = 0.06;
    let headUp = 0;

    if (pCleave >= 0) {
      const up = ease(seg(pCleave, 0, 0.55));
      const down = ease(seg(pCleave, 0.58, 0.7));
      const rec = ease(seg(pCleave, 0.8, 1));
      rArm = lArm = -2.9 * up * (1 - down) + 1.5 * down * (1 - rec);
      tilt = -0.4 * up * (1 - down) + 0.55 * down * (1 - rec);
      z = lunge(pCleave) * 0.5;
      headUp = up * (1 - down);
      jawOpen = 0.6 * up;
      graft.fill(-1.8 * up * (1 - down));
      wv = pCleave > 0.64 ? seg(pCleave, 0.64, 1) : -1;
    } else if (pFlurry >= 0) {
      const starts = [0.18, 0.3, 0.42, 0.54];
      const pulses = starts.map((s) => Math.sin(Math.min(1, Math.max(0, (pFlurry - s) / 0.16)) * Math.PI));
      pulses.forEach((p, i) => (graft[i] = -2.3 * p));
      rArm = -0.2 - 1.9 * Math.max(pulses[0], pulses[2]);
      lArm = -0.2 - 1.9 * Math.max(pulses[1], pulses[3]);
      twist = Math.sin(pFlurry * Math.PI * 4) * 0.3;
      z = lunge(pFlurry) * 0.35;
      tilt = 0.2 * lunge(pFlurry);
      jawOpen = 0.5;
    } else if (pStomp >= 0) {
      const up = ease(seg(pStomp, 0, 0.5));
      const down = ease(seg(pStomp, 0.55, 0.65));
      lift = -1.3 * up * (1 - down);
      rArm = lArm = -1.3 * up * (1 - down);
      tilt = -0.2 * up * (1 - down) + 0.22 * down * (1 - ease(seg(pStomp, 0.75, 1)));
      y += -0.14 * down * (1 - ease(seg(pStomp, 0.75, 1)));
      graft.fill(-1.2 * up);
      jawOpen = 0.7 * up;
      wv = pStomp > 0.6 ? seg(pStomp, 0.6, 1) : -1;
    } else if (stunned) {
      tilt = -0.3 + Math.sin(t * 9) * 0.04;
      headUp = 0.8;
      jawOpen = 0.5;
      rArm = lArm = 0.3;
    }
    if (dead) {
      const d = pDie >= 0 ? pDie : 1;
      tilt = 1.25 * ease(seg(d, 0.1, 0.8));
      y = -0.45 * ease(seg(d, 0.1, 0.8));
      rArm = lArm = 0.8 * d;
      graft.fill(0.6 * d);
      jawOpen = 0.8 * d;
      lift = -0.8 * d;
    }

    ln.rotation.set(tilt, twist, 0);
    ln.position.set(Math.sin(t * 70) * hit * 0.03, y, z - hit * 0.15);
    if (armR.current) armR.current.rotation.x = rArm;
    if (armL.current) armL.current.rotation.x = lArm;
    if (legR.current) legR.current.rotation.x = lift;
    if (legL.current) legL.current.rotation.x = dead ? -0.8 : 0;
    grafts.current.forEach((g, i) => {
      if (!g) return;
      g.rotation.z = GRAFTS[i].base + Math.sin(t * 0.9 + i * 1.7) * 0.14;
      g.rotation.x = graft[i] + (graft[i] === 0 ? Math.sin(t * 1.3 + i) * 0.12 : 0);
    });
    if (head.current) head.current.rotation.x = -headUp * 0.5;
    if (jaw.current) jaw.current.rotation.x = jawOpen;
    if (cloak.current) cloak.current.rotation.z = Math.sin(t * 1.4) * 0.03;
    if (flash.current) flash.current.intensity = 2.5 + hit * 14;
    if (wave.current) {
      const v = wv > 0 ? wv : 0;
      wave.current.scale.setScalar(0.3 + v * (pStomp >= 0 ? 6.5 : 5));
      (wave.current.material as MeshBasicMaterial).opacity = v > 0 ? (1 - v) * 0.85 : 0;
    }
    if (bar.current) {
      const f = Math.max(0.001, e.hp / e.maxHp);
      bar.current.scale.x = f * 0.8;
      bar.current.position.x = -0.4 * (1 - f);
    }
    void hold;
    void swingAngle;
  });

  const spike = (x: number, yy: number, s: number) => (
    <mesh position={[x * 0.14, yy, 0]} rotation={[0, 0, -x * 0.9]}>
      <coneGeometry args={[0.035 * s, 0.18 * s, 5]} />
      <meshStandardMaterial color={GOLD} metalness={0.8} roughness={0.35} />
    </mesh>
  );

  return (
    <group
      ref={root}
      scale={2.6}
      visible={false}
      onClick={(ev) => {
        ev.stopPropagation();
        heroAct(engine.selected, "light");
      }}
      onPointerOver={() => {
        document.body.style.cursor = "crosshair";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    >
      {/* Legs and boots. */}
      {[-1, 1].map((s) => (
        <group key={s} ref={s === -1 ? legL : legR} position={[s * 0.16, 0.5, 0]}>
          <mesh position={[0, -0.27, 0]}>
            <cylinderGeometry args={[0.1, 0.085, 0.55, 8]} />
            <meshStandardMaterial color={ARMOR} metalness={0.6} roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.52, 0.04]}>
            <boxGeometry args={[0.16, 0.08, 0.26]} />
            <meshStandardMaterial color="#2a2620" roughness={0.9} />
          </mesh>
        </group>
      ))}

      <group ref={lean} position={[0, 0.5, 0]}>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.5, 0.2, 0.32]} />
          <meshStandardMaterial color={ARMOR} metalness={0.6} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.34, 0]}>
          <boxGeometry args={[0.64, 0.56, 0.4]} />
          <meshStandardMaterial color={ARMOR} metalness={0.65} roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.2, 0.205]}>
          <boxGeometry args={[0.56, 0.05, 0.02]} />
          <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.4, 0.21]}>
          <boxGeometry args={[0.14, 0.2, 0.02]} />
          <meshStandardMaterial color={GOLD} emissive="#7a5a1a" emissiveIntensity={0.6} metalness={0.9} roughness={0.3} />
        </mesh>

        {/* Tattered gold cloak. */}
        <mesh ref={cloak} position={[0, 0.2, -0.26]} rotation={[0.12, 0, 0]}>
          <coneGeometry args={[0.6, 1.2, 12, 1, true]} />
          <meshStandardMaterial color={CLOAK} roughness={1} side={2} />
        </mesh>
        <mesh position={[0, 0.2, -0.3]} rotation={[0.12, 0, 0]} scale={0.82}>
          <coneGeometry args={[0.6, 1.2, 12, 1, true]} />
          <meshStandardMaterial color="#2f3a22" roughness={1} side={2} />
        </mesh>

        {/* Spiked pauldrons. */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.42, 0.6, 0]}>
            <mesh>
              <sphereGeometry args={[0.2, 12, 10]} />
              <meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.35} />
            </mesh>
            {spike(s * 1.1, 0.16, 1.1)}
            {spike(s * 0.4, 0.2, 1.3)}
          </group>
        ))}

        {/* Head: pale face, horned crown, burning eyes. */}
        <group ref={head} position={[0, 0.84, 0.02]}>
          <mesh>
            <sphereGeometry args={[0.14, 12, 10]} />
            <meshStandardMaterial color={PALE} roughness={0.9} />
          </mesh>
          <mesh ref={jaw} position={[0, -0.1, 0.06]}>
            <boxGeometry args={[0.14, 0.05, 0.12]} />
            <meshStandardMaterial color="#8f8a74" roughness={0.9} />
          </mesh>
          {[-0.05, 0.05].map((x) => (
            <mesh key={x} position={[x, 0.02, 0.125]}>
              <sphereGeometry args={[0.022, 8, 8]} />
              <meshStandardMaterial color={EYE} emissive={EYE} emissiveIntensity={5} toneMapped={false} />
            </mesh>
          ))}
          {Array.from({ length: 7 }, (_, i) => {
            const a = (i / 7) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.12, 0.13, Math.sin(a) * 0.12]}>
                <coneGeometry args={[0.025, 0.14, 5]} />
                <meshStandardMaterial color={GOLD} metalness={0.9} roughness={0.3} />
              </mesh>
            );
          })}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.15, 0.1, -0.02]} rotation={[0, 0, -s * 0.9]}>
              <coneGeometry args={[0.04, 0.3, 6]} />
              <meshStandardMaterial color="#d9cfa8" roughness={0.6} />
            </mesh>
          ))}
          <pointLight position={[0, 0, 0.25]} color={EYE} intensity={2.5} distance={3.5} />
        </group>

        {/* Main arms with the great axe and greatsword. */}
        {[-1, 1].map((s) => (
          <group key={s} ref={s === 1 ? armR : armL} position={[s * 0.5, 0.68, 0.02]}>
            <mesh position={[0, -0.22, 0.04]}>
              <cylinderGeometry args={[0.08, 0.065, 0.5, 8]} />
              <meshStandardMaterial color={ARMOR} metalness={0.6} roughness={0.5} />
            </mesh>
            <mesh position={[0, -0.5, 0.08]}>
              <sphereGeometry args={[0.075, 8, 8]} />
              <meshStandardMaterial color={PALE} roughness={0.9} />
            </mesh>
            {s === 1 ? (
              <group position={[0, -0.5, 0.08]}>
                <mesh position={[0, -0.05, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.025, 0.025, 1.2, 6]} />
                  <meshStandardMaterial color="#3a2b20" roughness={1} />
                </mesh>
                <mesh position={[0, -0.05, 0.9]}>
                  <boxGeometry args={[0.05, 0.5, 0.36]} />
                  <meshStandardMaterial color="#9fa3a8" metalness={0.85} roughness={0.35} />
                </mesh>
              </group>
            ) : (
              <mesh position={[0, -0.5, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
                <boxGeometry args={[0.09, 1.1, 0.025]} />
                <meshStandardMaterial color="#c9ccd0" emissive="#6b5a2c" emissiveIntensity={0.4} metalness={0.9} roughness={0.3} />
              </mesh>
            )}
          </group>
        ))}

        {/* The grafted arms: mismatched, restless, each holding something. */}
        {GRAFTS.map((g, i) => (
          <group
            key={i}
            ref={(el) => {
              grafts.current[i] = el;
            }}
            position={[...g.pos]}
          >
            <mesh position={[0, -0.2, 0]}>
              <cylinderGeometry args={[0.055, 0.04, 0.42, 7]} />
              <meshStandardMaterial color={g.skin} roughness={1} />
            </mesh>
            <mesh position={[0, -0.43, 0.02]}>
              <sphereGeometry args={[0.055, 8, 8]} />
              <meshStandardMaterial color={g.skin} roughness={1} />
            </mesh>
            <GraftWeapon kind={g.weapon} />
          </group>
        ))}
        <pointLight ref={flash} position={[0, 0.5, 0.5]} color="#ffcf80" intensity={2.5} distance={5} />
      </group>

      <mesh ref={wave} position={[0, 0.03, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.42, 36]} />
        <meshBasicMaterial color="#ffb347" transparent opacity={0} toneMapped={false} depthWrite={false} />
      </mesh>

      <Billboard position={[0, 1.7, 0]}>
        <mesh>
          <planeGeometry args={[0.86, 0.07]} />
          <meshBasicMaterial color="#0b0d10" />
        </mesh>
        <mesh ref={bar} position={[0, 0, 0.001]} scale={[0.8, 1, 1]}>
          <planeGeometry args={[1, 0.045]} />
          <meshBasicMaterial color="#d4a22a" toneMapped={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

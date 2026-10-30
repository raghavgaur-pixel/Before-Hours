"use client";

import { useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import type { Group, Mesh, MeshBasicMaterial } from "three";
import { ease, hold, lunge, seg, swingAngle } from "./battle";
import {
  ROLL_DUR,
  chargeFrac,
  engine,
  gestureProgress,
  hitFlash,
  progress,
  selectHero,
  useBattle,
  type HeroId,
} from "./battleEngine";
import { SkinModel } from "./models";
import { SKINS } from "./skins";

const pointer = (on: boolean) => {
  document.body.style.cursor = on ? "pointer" : "";
};

/** Pose inputs shared by both heroes: movement, dodge roll, guard, parry, charge, gestures, swap and victory. */
function common(id: HeroId, dt: number, walk: { current: number }) {
  const me = engine.pos[id];
  const sel = engine.selected === id;
  const p = engine.p;
  const roll = sel && engine.now < p.rollUntil ? (engine.now - p.rollStart) / ROLL_DUR : -1;
  const parry = sel && engine.now < p.parryUntil ? 1 - (p.parryUntil - engine.now) / 0.35 : -1;
  const swap = (engine.now - engine.swapAt[id]) / 0.55;
  walk.current += me.speed * dt * 3.4;
  return {
    me,
    sel,
    roll,
    parry,
    swap: swap >= 0 && swap <= 1 ? swap : -1,
    vic: engine.now < engine.victoryUntil,
    block: sel && p.blocking,
    charge: sel ? chargeFrac() : 0,
    gest: sel ? gestureProgress() : null,
    gait: Math.sin(walk.current) * Math.min(1, me.speed / 1.6) * 0.85,
    sprint: me.speed > 2.5 && roll < 0,
  };
}

function GuardDisc({ disc, color }: { disc: React.RefObject<Mesh | null>; color: string }) {
  return (
    <mesh ref={disc} position={[0, 0.5, 0.38]} visible={false}>
      <circleGeometry args={[0.32, 20]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} toneMapped={false} depthWrite={false} side={2} />
    </mesh>
  );
}

function setDisc(m: Mesh | null, block: boolean, parry: number, color: string) {
  if (!m) return;
  m.visible = block || parry >= 0;
  const mat = m.material as MeshBasicMaterial;
  mat.color.set(parry >= 0 ? "#ffffff" : color);
  mat.opacity = parry >= 0 ? 0.85 : 0.4;
  m.scale.setScalar(parry >= 0 ? 1 + parry * 0.9 : 1);
}

function SelectRing({ id, radius, color }: { id: HeroId; radius: number; color: string }) {
  const ref = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.visible = engine.selected === id && !engine.down[id];
    ref.current.rotation.z = clock.elapsedTime * 0.8;
  });
  return (
    <mesh ref={ref} position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius, radius + 0.04, 6]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

/** Veylorn-style hooded dark-fantasy knight; can wear the scanned Veylorn skin instead. */
export function AshenWarden() {
  useBattle();
  const skin = SKINS.warden.find((s) => s.id === engine.skin.warden) ?? SKINS.warden[0];
  const P = skin.palette;
  const model = skin.kind === "model" ? skin.model! : null;
  const GLOW = P.glow;

  const root = useRef<Group>(null);
  const walk = useRef(0);
  const legs = useRef<(Group | null)[]>([]);
  const disc = useRef<Mesh>(null);
  const glow = useRef<Mesh>(null);
  const body = useRef<Group>(null);
  const modelG = useRef<Group>(null);
  const hand = useRef<Group>(null);
  const bladeG = useRef<Group>(null);
  const staffG = useRef<Group>(null);
  const bowG = useRef<Group>(null);
  const dagR = useRef<Group>(null);
  const dagL = useRef<Group>(null);
  const arrow = useRef<Mesh>(null);
  const armL = useRef<Group>(null);
  const arc = useRef<Mesh>(null);
  const bigArc = useRef<Mesh>(null);
  const handOrb = useRef<Mesh>(null);
  const rune = useRef<Mesh>(null);
  const runeOuter = useRef<Mesh>(null);
  const orbs = useRef<Group>(null);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const b = body.current;
    if (!b || !root.current) return;
    const C = common("warden", Math.min(delta, 0.05), walk);
    root.current.position.set(C.me.x, C.me.y, C.me.z);
    root.current.rotation.y = C.me.yaw;
    if (engine.down.warden) {
      // Fallen: lying where they dropped.
      b.position.set(0, -0.12, 0);
      b.rotation.set(-1.45, 0, 0);
      b.scale.y = 1;
      return;
    }
    const w = engine.weapon.warden;
    const pBlade = progress("warden", "blade");
    const pStaff = progress("warden", "staff");
    const pBow = progress("warden", "bow");
    const pDag = progress("warden", "daggers");
    const pRend = progress("warden", "rend");
    const hit = hitFlash("warden", 6);

    if (bladeG.current) bladeG.current.visible = w === "blade" || pRend >= 0;
    if (staffG.current) staffG.current.visible = w === "staff" && pRend < 0;
    if (bowG.current) bowG.current.visible = w === "bow" && pRend < 0;
    if (dagR.current) dagR.current.visible = w === "daggers" && pRend < 0;
    if (dagL.current) dagL.current.visible = w === "daggers" && pRend < 0;

    let z = 0;
    let y = Math.sin(t * 1.6) * 0.008;
    let lean = 0;
    let twist = 0;
    let swing = 0;
    let sideTilt = -0.08;
    let armRaise = 0;
    let armFwd = 0;
    let stabL = 0;
    let cast = 0;
    let slash = 0;
    let bigSlash = 0;

    if (pBlade >= 0) {
      const second = pBlade >= 0.5;
      const q = second ? (pBlade - 0.5) / 0.5 : pBlade / 0.5;
      z = lunge(pBlade) * 0.55;
      swing = swingAngle(q, -1.2, 1.9);
      sideTilt = second ? 0.7 : -0.5;
      twist = (second ? 0.5 : -0.5) * ease(seg(q, 0.3, 0.8));
      lean = 0.18 * lunge(q);
      slash = q > 0.4 && q < 0.85 ? Math.sin(((q - 0.4) / 0.45) * Math.PI) : 0;
    } else if (pDag >= 0) {
      // Three quick alternating stabs.
      const i = Math.min(2, Math.floor(pDag * 3));
      const q = pDag * 3 - i;
      const pulse = Math.sin(Math.min(1, q * 1.2) * Math.PI);
      z = lunge(pDag) * 0.5;
      twist = (i % 2 === 0 ? -0.35 : 0.35) * pulse;
      lean = 0.2;
      swing = i % 2 === 0 ? 1.3 * pulse : 0;
      stabL = i % 2 === 1 ? pulse : 0;
    } else if (pRend >= 0) {
      z = lunge(pRend) * 0.95;
      y += Math.sin(seg(pRend, 0.15, 0.7) * Math.PI) * 0.55;
      swing = swingAngle(pRend, -2.7, 1.9);
      lean = 0.35 * lunge(seg(pRend, 0.3, 1));
      bigSlash = pRend > 0.5 && pRend < 0.9 ? Math.sin(((pRend - 0.5) / 0.4) * Math.PI) : 0;
    } else if (pStaff >= 0) {
      cast = hold(pStaff);
      z = -cast * 0.06;
      lean = -cast * 0.1;
      armRaise = cast;
      swing = 0.1 + cast * 0.9;
      y += cast * (model ? 0.1 : 0);
    } else if (pBow >= 0) {
      cast = hold(pBow);
      armFwd = cast;
      twist = -0.35 * cast;
      z = -cast * 0.05;
    }
    z -= hit * 0.18;
    lean -= hit * 0.3;

    // Player-state poses and idle life.
    const idle = pBlade < 0 && pStaff < 0 && pBow < 0 && pRend < 0 && pDag < 0;
    if (idle) {
      if (C.charge > 0) {
        swing = -1.1 * C.charge;
        lean -= 0.15 * C.charge;
      }
      if (C.block || C.parry >= 0) armFwd = Math.max(armFwd, 0.75);
      if (C.sprint) lean += 0.28;
      if (C.swap >= 0) swing += C.swap * Math.PI * 2; // weapon flourish on swap
      if (C.gest) {
        const g = C.gest;
        if (g.kind === "wave") armRaise = 1;
        else if (g.kind === "cheer") {
          armRaise = 1;
          y += Math.abs(Math.sin(g.p * Math.PI * 3)) * 0.1;
        } else if (g.kind === "bow") lean += 0.9 * Math.sin(g.p * Math.PI);
        else if (g.kind === "taunt") {
          armFwd = 1;
          lean -= 0.2;
        }
      } else if (C.vic) {
        // Victory: weapon raised high, hopping.
        armRaise = 1;
        swing = -2.1 + Math.sin(t * 6) * 0.2;
        y += Math.abs(Math.sin(t * 5)) * 0.07;
      } else if (C.me.speed < 0.1 && C.roll < 0 && !C.block) {
        // Idle fidget: a slow sway and an occasional glance.
        twist += Math.sin(t * 0.6) * 0.06 + Math.max(0, Math.sin(t * 0.37) - 0.85) * 3;
      }
    }
    let scaleY = 1;
    if (C.roll >= 0) {
      lean = C.roll * Math.PI * 2;
      y -= 0.08;
      scaleY = 0.85;
    }
    legs.current.forEach((l, i) => {
      if (l) l.rotation.x = (i === 0 ? 1 : -1) * C.gait;
    });
    setDisc(disc.current, C.block && idle, idle ? C.parry : -1, GLOW);
    if (glow.current) glow.current.scale.setScalar(Math.max(C.charge * 1.3, C.swap >= 0 ? Math.sin(C.swap * Math.PI) * 0.9 : 0));
    if (modelG.current) {
      // Scanned skins are rigid, so animate them as a whole: breathing, step rock, levitating cast.
      modelG.current.scale.set(1, 1 + Math.sin(t * 1.6) * 0.012, 1);
      modelG.current.rotation.z = C.gait * 0.08;
      modelG.current.position.y = Math.abs(C.gait) * 0.03 + cast * 0.04;
    }

    b.position.set(Math.sin(t * 55) * hit * 0.03, y, z);
    b.rotation.set(lean, twist, 0);
    b.scale.y = scaleY;

    if (hand.current) {
      hand.current.rotation.set(0.1 + swing, 0, sideTilt);
      hand.current.scale.setScalar(1 + 0.12 * (engine.prog.tier - 1));
    }
    if (armL.current) {
      const wave = C.gest?.kind === "wave" ? Math.sin(t * 10) * 0.3 : 0;
      armL.current.rotation.z = -2.45 * armRaise + wave;
      armL.current.rotation.x = -0.35 * armRaise - 1.55 * armFwd - 1.3 * stabL - (pDag >= 0 ? 0.3 : 0);
    }
    if (bowG.current) bowG.current.rotation.x = 1.55 * armFwd;
    if (arrow.current) arrow.current.visible = pBow >= 0 && pBow > 0.08 && pBow < 0.5;
    if (arc.current) (arc.current.material as MeshBasicMaterial).opacity = slash * 0.95;
    if (bigArc.current) {
      (bigArc.current.material as MeshBasicMaterial).opacity = bigSlash;
      bigArc.current.scale.setScalar(0.6 + bigSlash * 0.7);
    }
    const magic = Math.max(armRaise, pBow >= 0 ? cast * 0.5 : 0);
    if (handOrb.current) handOrb.current.scale.setScalar(armRaise * (1 + 0.25 * Math.sin(t * 20)));
    if (rune.current) {
      rune.current.rotation.z = t * 1.4;
      (rune.current.material as MeshBasicMaterial).opacity = magic * 0.85;
    }
    if (runeOuter.current) {
      runeOuter.current.rotation.z = -t * 0.9;
      (runeOuter.current.material as MeshBasicMaterial).opacity = magic * 0.6;
    }
    if (orbs.current) {
      orbs.current.rotation.y = t * 3.2;
      orbs.current.scale.setScalar(armRaise);
    }
  });

  const metal = { color: P.metal, metalness: 0.6, roughness: 0.5 } as const;

  return (
    <group
      ref={root}
      scale={1.1}
      onClick={(e) => {
        e.stopPropagation();
        selectHero("warden");
      }}
      onPointerOver={() => pointer(true)}
      onPointerOut={() => pointer(false)}
    >
      <SelectRing id="warden" radius={0.52} color={GLOW} />
      <group ref={body}>
        {model && (
          <group ref={modelG}>
            <Suspense fallback={null}>
              <SkinModel {...model} />
            </Suspense>
          </group>
        )}

        {!model && (
          <>
            {[-0.07, 0.07].map((x, i) => (
              <group
                key={x}
                ref={(el) => {
                  legs.current[i] = el;
                }}
                position={[x, 0.3, 0]}
              >
                <mesh position={[0, -0.15, 0]}>
                  <cylinderGeometry args={[0.05, 0.045, 0.3, 8]} />
                  <meshStandardMaterial color={P.dark} metalness={0.6} roughness={0.5} />
                </mesh>
              </group>
            ))}
            <mesh position={[0, 0.45, 0]}>
              <boxGeometry args={[0.28, 0.3, 0.18]} />
              <meshStandardMaterial {...metal} />
            </mesh>
            <mesh position={[0, 0.38, -0.07]} scale={[1, 1, 0.55]}>
              <coneGeometry args={[0.3, 0.72, 10, 1, true]} />
              <meshStandardMaterial color={P.cloak} roughness={1} side={2} />
            </mesh>
            {[-0.17, 0.17].map((x) => (
              <mesh key={x} position={[x, 0.6, 0]}>
                <sphereGeometry args={[0.08, 10, 10]} />
                <meshStandardMaterial color={P.trim} metalness={0.8} roughness={0.4} />
              </mesh>
            ))}
            <group position={[-0.06, 0.52, -0.13]} rotation={[0.15, 0, 0.25]}>
              <mesh>
                <cylinderGeometry args={[0.04, 0.035, 0.3, 8]} />
                <meshStandardMaterial color="#2a1f18" roughness={1} />
              </mesh>
              {[-0.02, 0, 0.02].map((x, i) => (
                <mesh key={x} position={[x, 0.2, 0.005 * i]}>
                  <cylinderGeometry args={[0.004, 0.004, 0.14, 4]} />
                  <meshStandardMaterial color={GLOW} emissive={GLOW} emissiveIntensity={2} toneMapped={false} />
                </mesh>
              ))}
            </group>
          </>
        )}

        <group ref={armL} position={[-0.2, 0.6, 0.02]}>
          {!model && (
            <mesh position={[0, -0.13, 0]}>
              <cylinderGeometry args={[0.035, 0.03, 0.28, 6]} />
              <meshStandardMaterial {...metal} />
            </mesh>
          )}
          <mesh ref={handOrb} position={[0, -0.3, 0]} scale={0}>
            <sphereGeometry args={[0.05, 10, 10]} />
            <meshStandardMaterial color="#aaf5e8" emissive={GLOW} emissiveIntensity={4} toneMapped={false} />
          </mesh>
          <group ref={dagL} position={[0, -0.34, 0.02]} rotation={[Math.PI / 2, 0, 0]} visible={false}>
            <mesh position={[0, 0.1, 0]}>
              <boxGeometry args={[0.03, 0.26, 0.012]} />
              <meshStandardMaterial color="#9fe9dc" emissive={GLOW} emissiveIntensity={1.6} toneMapped={false} />
            </mesh>
          </group>
          <group ref={bowG} position={[0, -0.3, 0]}>
            <group rotation={[0, Math.PI / 2, 0]}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <torusGeometry args={[0.3, 0.012, 6, 18, Math.PI]} />
                <meshStandardMaterial color="#2a1f18" roughness={0.9} />
              </mesh>
            </group>
            <mesh>
              <boxGeometry args={[0.004, 0.6, 0.004]} />
              <meshBasicMaterial color="#cfe9e4" />
            </mesh>
            <mesh ref={arrow} position={[0, 0, 0.12]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.008, 0.008, 0.5, 5]} />
              <meshStandardMaterial color="#aaf5e8" emissive={GLOW} emissiveIntensity={2.5} toneMapped={false} />
            </mesh>
          </group>
        </group>

        {!model && (
          <>
            <mesh position={[0.22, 0.5, 0.02]} rotation={[0, 0, 0.15]}>
              <cylinderGeometry args={[0.035, 0.03, 0.28, 6]} />
              <meshStandardMaterial {...metal} />
            </mesh>
            <mesh position={[0, 0.72, 0]}>
              <sphereGeometry args={[0.09, 12, 12]} />
              <meshStandardMaterial color="#0e0f12" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.82, -0.01]}>
              <coneGeometry args={[0.12, 0.2, 8]} />
              <meshStandardMaterial color={P.dark} roughness={1} />
            </mesh>
            {[-0.035, 0.035].map((x) => (
              <mesh key={x} position={[x, 0.73, 0.08]}>
                <sphereGeometry args={[0.014, 8, 8]} />
                <meshStandardMaterial color={GLOW} emissive={GLOW} emissiveIntensity={4} toneMapped={false} />
              </mesh>
            ))}
          </>
        )}

        {/* Right hand: blade, staff or dagger, swapped by the selected weapon. */}
        <group ref={hand} position={[0.24, 0.42, 0.05]}>
          <group ref={bladeG}>
            <mesh position={[0, 0.12, 0]}>
              <boxGeometry args={[0.035, 0.62, 0.012]} />
              <meshStandardMaterial color="#9fe9dc" emissive={GLOW} emissiveIntensity={1.6} toneMapped={false} />
            </mesh>
            <mesh position={[0, -0.2, 0]}>
              <boxGeometry args={[0.1, 0.025, 0.03]} />
              <meshStandardMaterial color={P.trim} metalness={0.8} />
            </mesh>
          </group>
          <group ref={staffG}>
            <mesh position={[0, 0.2, 0]}>
              <cylinderGeometry args={[0.014, 0.018, 0.9, 6]} />
              <meshStandardMaterial color="#2a1f18" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.68, 0]}>
              <sphereGeometry args={[0.05, 10, 10]} />
              <meshStandardMaterial color="#aaf5e8" emissive={GLOW} emissiveIntensity={3.5} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0.66, 0]} rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.08, 0.008, 5, 14, Math.PI * 1.3]} />
              <meshStandardMaterial color={P.trim} metalness={0.8} />
            </mesh>
          </group>
          <group ref={dagR} visible={false}>
            <mesh position={[0, 0.08, 0]}>
              <boxGeometry args={[0.03, 0.26, 0.012]} />
              <meshStandardMaterial color="#9fe9dc" emissive={GLOW} emissiveIntensity={1.6} toneMapped={false} />
            </mesh>
            <mesh position={[0, -0.06, 0]}>
              <boxGeometry args={[0.07, 0.02, 0.025]} />
              <meshStandardMaterial color={P.trim} metalness={0.8} />
            </mesh>
          </group>
        </group>
        <pointLight position={[0.2, 0.5, 0.2]} color={GLOW} intensity={1.2} distance={1.8} />

        <mesh ref={arc} position={[0.2, 0.55, 0.4]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.46, 0.016, 6, 28, Math.PI * 0.8]} />
          <meshBasicMaterial color={GLOW} transparent opacity={0} toneMapped={false} depthWrite={false} />
        </mesh>
        <mesh ref={bigArc} position={[0, 0.7, 0.55]} rotation={[0, Math.PI / 2, 0.2]}>
          <torusGeometry args={[0.7, 0.04, 6, 32, Math.PI * 0.9]} />
          <meshBasicMaterial color="#aaf5e8" transparent opacity={0} toneMapped={false} depthWrite={false} />
        </mesh>
        <mesh ref={rune} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.38, 0.44, 6]} />
          <meshBasicMaterial color={GLOW} transparent opacity={0} toneMapped={false} depthWrite={false} />
        </mesh>
        <mesh ref={runeOuter} position={[0, 0.022, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.52, 3]} />
          <meshBasicMaterial color={GLOW} transparent opacity={0} toneMapped={false} depthWrite={false} />
        </mesh>
        <GuardDisc disc={disc} color={GLOW} />
        <mesh ref={glow} position={[0.24, 0.95, 0.1]} scale={0}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshBasicMaterial color="#aaf5e8" toneMapped={false} />
        </mesh>
        <group ref={orbs} position={[0, 0.5, 0]} scale={0}>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[Math.cos((i * Math.PI * 2) / 3) * 0.36, 0.1 * i, Math.sin((i * Math.PI * 2) / 3) * 0.36]}>
              <sphereGeometry args={[0.035, 8, 8]} />
              <meshStandardMaterial color="#aaf5e8" emissive={GLOW} emissiveIntensity={4} toneMapped={false} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

/** Stonebound-style iron golem: hammer, cannon, shield and gauntlets; can wear the Stoneguard skin. */
export function IronSentinel() {
  useBattle();
  const skin = SKINS.sentinel.find((s) => s.id === engine.skin.sentinel) ?? SKINS.sentinel[0];
  const P = skin.palette;
  const model = skin.kind === "model" ? skin.model! : null;
  const EMBER = P.glow;

  const root = useRef<Group>(null);
  const walk = useRef(0);
  const legs = useRef<(Group | null)[]>([]);
  const arms = useRef<(Group | null)[]>([]);
  const fists = useRef<(Mesh | null)[]>([]);
  const disc = useRef<Mesh>(null);
  const glow = useRef<Mesh>(null);
  const body = useRef<Group>(null);
  const modelG = useRef<Group>(null);
  const hammer = useRef<Group>(null);
  const cannon = useRef<Group>(null);
  const shield = useRef<Group>(null);
  const muzzle = useRef<Mesh>(null);
  const ring = useRef<Mesh>(null);
  const ring2 = useRef<Mesh>(null);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const b = body.current;
    if (!b || !root.current) return;
    const C = common("sentinel", Math.min(delta, 0.05), walk);
    root.current.position.set(C.me.x, C.me.y, C.me.z);
    root.current.rotation.y = C.me.yaw;
    if (engine.down.sentinel) {
      b.position.set(0, -0.12, 0);
      b.rotation.set(-1.45, 0, 0);
      b.scale.y = 1;
      return;
    }
    const w = engine.weapon.sentinel;
    const pHam = progress("sentinel", "hammer");
    const pCan = progress("sentinel", "cannon");
    const pShi = progress("sentinel", "shield");
    const pGau = progress("sentinel", "gauntlets");
    const pQuake = progress("sentinel", "quake");
    const hit = hitFlash("sentinel", 6);

    if (hammer.current) hammer.current.visible = w === "hammer" || pQuake >= 0;
    if (cannon.current) cannon.current.visible = w === "cannon" && pQuake < 0;
    if (shield.current) shield.current.visible = (w === "shield" || C.block || C.parry >= 0) && pQuake < 0;
    fists.current.forEach((f) => {
      if (f) f.visible = w === "gauntlets" && pQuake < 0;
    });

    let z = 0;
    let y = Math.sin(t * 1.1) * 0.006;
    let lean = 0;
    let hamAngle = 0;
    let kick = 0;
    let shieldZ = 0;
    let slam = -1;
    let armR = 0;
    let armLx = 0;

    if (pHam >= 0) {
      hamAngle = swingAngle(pHam, -2.9, 1.5);
      lean = pHam < 0.45 ? -0.28 * ease(pHam / 0.45) : 0.4 * (1 - ease(seg(pHam, 0.7, 1)));
      z = lunge(pHam) * 0.4;
      slam = pHam > 0.6 ? seg(pHam, 0.6, 1) : -1;
    } else if (pQuake >= 0) {
      hamAngle = swingAngle(pQuake, -3.0, 1.6);
      y += Math.sin(seg(pQuake, 0.2, 0.65) * Math.PI) * 0.6;
      z = lunge(pQuake) * 0.6;
      lean = pQuake < 0.45 ? -0.3 * ease(pQuake / 0.45) : 0.45 * (1 - ease(seg(pQuake, 0.7, 1)));
      slam = pQuake > 0.62 ? seg(pQuake, 0.62, 1) : -1;
    } else if (pGau >= 0) {
      // A jab with the right fist, then a crushing uppercut with the left.
      const q1 = seg(pGau, 0.1, 0.4);
      const q2 = seg(pGau, 0.45, 0.8);
      armR = -1.7 * Math.sin(q1 * Math.PI);
      armLx = -2.5 * Math.sin(Math.min(1, q2 * 1.1) * Math.PI);
      z = lunge(pGau) * 0.55;
      lean = 0.1 * Math.sin(q1 * Math.PI) + 0.3 * Math.sin(q2 * Math.PI);
      y += Math.sin(q2 * Math.PI) * 0.15;
      slam = pGau > 0.62 ? seg(pGau, 0.62, 1) : -1;
    } else if (pCan >= 0) {
      const aim = hold(pCan);
      kick = Math.exp(-Math.pow((pCan - 0.42) * 12, 2));
      z = -kick * 0.12;
      lean = -kick * 0.12;
      if (cannon.current) {
        cannon.current.position.z = 0.05 - kick * 0.1;
        cannon.current.rotation.x = -aim * 0.12;
      }
    } else if (pShi >= 0) {
      shieldZ = lunge(pShi) * 0.42;
      z = lunge(pShi) * 0.3;
      lean = 0.2 * lunge(pShi);
    }
    z -= hit * 0.2;
    lean -= hit * 0.25;

    const idle = pHam < 0 && pCan < 0 && pShi < 0 && pQuake < 0 && pGau < 0;
    let twist = 0;
    let swapSpin = 0;
    if (idle) {
      if (C.charge > 0) {
        hamAngle = -1.4 * C.charge;
        lean -= 0.18 * C.charge;
      }
      if (C.block || C.parry >= 0) shieldZ = 0.25;
      if (C.sprint) lean += 0.25;
      if (C.swap >= 0) swapSpin = C.swap * Math.PI * 2;
      if (C.gest) {
        const g = C.gest;
        if (g.kind === "wave") hamAngle = -2.2 + Math.sin(t * 8) * 0.3;
        else if (g.kind === "cheer") {
          hamAngle = -2.6;
          y += Math.abs(Math.sin(g.p * Math.PI * 3)) * 0.1;
        } else if (g.kind === "bow") lean += 0.8 * Math.sin(g.p * Math.PI);
        else if (g.kind === "taunt") {
          hamAngle = -1.2;
          lean -= 0.2;
        }
      } else if (C.vic) {
        hamAngle = -2.8 + Math.sin(t * 6) * 0.15;
        armR = -2.9;
        armLx = -2.9;
        y += Math.abs(Math.sin(t * 5)) * 0.06;
      } else if (C.me.speed < 0.1 && C.roll < 0 && !C.block) {
        twist = Math.sin(t * 0.5) * 0.05 + Math.max(0, Math.sin(t * 0.31) - 0.88) * 2.5;
      }
    }
    let scaleY = 1;
    if (C.roll >= 0) {
      lean = C.roll * Math.PI * 2;
      y -= 0.08;
      scaleY = 0.85;
    }
    legs.current.forEach((l, i) => {
      if (l) l.rotation.x = (i === 0 ? 1 : -1) * C.gait;
    });
    // Arms counter-swing with the stride; punches and cheers override.
    if (arms.current[1]) arms.current[1].rotation.x = armR !== 0 ? armR : -C.gait * 0.6;
    if (arms.current[0]) arms.current[0].rotation.x = armLx !== 0 ? armLx : C.gait * 0.6;
    setDisc(disc.current, C.block && idle, idle ? C.parry : -1, EMBER);
    if (glow.current) glow.current.scale.setScalar(Math.max(C.charge * 1.4, C.swap >= 0 ? Math.sin(C.swap * Math.PI) * 1.0 : 0));
    if (modelG.current) {
      modelG.current.scale.set(1, 1 + Math.sin(t * 1.1) * 0.01, 1);
      modelG.current.rotation.z = C.gait * 0.06;
      modelG.current.position.y = Math.abs(C.gait) * 0.025;
    }

    b.position.set(Math.sin(t * 60) * hit * 0.04, y, z);
    b.rotation.set(lean, twist, 0);
    b.scale.y = scaleY;
    if (hammer.current) {
      hammer.current.rotation.x = hamAngle + swapSpin;
      hammer.current.scale.setScalar(1 + 0.12 * (engine.prog.tier - 1));
    }
    if (shield.current) shield.current.position.z = 0.1 + shieldZ;
    if (muzzle.current) muzzle.current.scale.setScalar(kick * 1.8);

    const doSlam = (m: Mesh | null, big: number) => {
      if (!m) return;
      const v = slam > 0 ? slam : 0;
      m.scale.setScalar(0.2 + v * big);
      (m.material as MeshBasicMaterial).opacity = v > 0 ? (1 - v) * 0.8 : 0;
    };
    doSlam(ring.current, pQuake >= 0 ? 3.4 : 1.8);
    doSlam(ring2.current, pQuake >= 0 ? 2.2 : 1.1);
  });

  const iron = { color: P.metal, metalness: 0.85, roughness: 0.4 } as const;

  return (
    <group
      ref={root}
      scale={1.15}
      onClick={(e) => {
        e.stopPropagation();
        selectHero("sentinel");
      }}
      onPointerOver={() => pointer(true)}
      onPointerOut={() => pointer(false)}
    >
      <SelectRing id="sentinel" radius={0.55} color={EMBER} />
      <group ref={body}>
        {model && (
          <group ref={modelG}>
            <Suspense fallback={null}>
              <SkinModel {...model} />
            </Suspense>
          </group>
        )}

        {!model && (
          <>
            {[-0.1, 0.1].map((x, i) => (
              <group
                key={x}
                ref={(el) => {
                  legs.current[i] = el;
                }}
                position={[x, 0.28, 0]}
              >
                <mesh position={[0, -0.14, 0]}>
                  <boxGeometry args={[0.13, 0.28, 0.15]} />
                  <meshStandardMaterial {...iron} />
                </mesh>
              </group>
            ))}
            <mesh position={[0, 0.5, 0]}>
              <boxGeometry args={[0.42, 0.42, 0.28]} />
              <meshStandardMaterial {...iron} />
            </mesh>
            <mesh position={[0, 0.52, 0.145]}>
              <sphereGeometry args={[0.055, 12, 12]} />
              <meshStandardMaterial color={EMBER} emissive={EMBER} emissiveIntensity={3.5} toneMapped={false} />
            </mesh>
            <group position={[0, 0.5, 0.145]} rotation={[0, 0, -0.6]}>
              <mesh>
                <boxGeometry args={[0.46, 0.04, 0.02]} />
                <meshStandardMaterial color="#2a1f18" roughness={1} />
              </mesh>
              {[-0.15, -0.05, 0.05, 0.15].map((x) => (
                <mesh key={x} position={[x, 0, 0.02]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.022, 0.022, 0.07, 8]} />
                  <meshStandardMaterial color="#b0742e" metalness={0.8} roughness={0.35} />
                </mesh>
              ))}
            </group>
            {[-0.3, 0.3].map((x) => (
              <mesh key={x} position={[x, 0.7, 0]}>
                <boxGeometry args={[0.18, 0.12, 0.2]} />
                <meshStandardMaterial {...iron} color={P.trim} />
              </mesh>
            ))}
            <mesh position={[0, 0.82, 0]}>
              <boxGeometry args={[0.17, 0.14, 0.17]} />
              <meshStandardMaterial {...iron} color={P.trim} />
            </mesh>
            <mesh position={[0, 0.83, 0.088]}>
              <boxGeometry args={[0.12, 0.025, 0.01]} />
              <meshStandardMaterial color={EMBER} emissive={EMBER} emissiveIntensity={4} toneMapped={false} />
            </mesh>
          </>
        )}

        {/* Arms are always built so punches and cheers work with either skin. */}
        {[-1, 1].map((s, i) => (
          <group
            key={s}
            ref={(el) => {
              arms.current[i] = el;
            }}
            position={[s * 0.32, 0.66, 0]}
          >
            {!model && (
              <mesh position={[0, -0.2, 0]}>
                <boxGeometry args={[0.1, 0.36, 0.1]} />
                <meshStandardMaterial {...iron} />
              </mesh>
            )}
            <mesh
              ref={(el) => {
                fists.current[i] = el;
              }}
              position={[0, -0.44, 0.02]}
              visible={false}
            >
              <boxGeometry args={[0.17, 0.17, 0.2]} />
              <meshStandardMaterial {...iron} color={P.trim} emissive={EMBER} emissiveIntensity={0.7} toneMapped={false} />
            </mesh>
          </group>
        ))}

        <group ref={cannon} position={[0.3, 0.84, 0.05]}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.1]}>
            <cylinderGeometry args={[0.045, 0.055, 0.3, 10]} />
            <meshStandardMaterial color="#2a2d33" metalness={0.9} roughness={0.35} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.26]}>
            <torusGeometry args={[0.048, 0.012, 6, 12]} />
            <meshStandardMaterial color={EMBER} emissive={EMBER} emissiveIntensity={1.5} toneMapped={false} />
          </mesh>
          <mesh ref={muzzle} position={[0, 0, 0.3]} scale={0}>
            <sphereGeometry args={[0.07, 10, 10]} />
            <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
          </mesh>
        </group>

        <group ref={shield} position={[-0.42, 0.45, 0.1]}>
          <mesh>
            <boxGeometry args={[0.06, 0.4, 0.3]} />
            <meshStandardMaterial {...iron} color={P.trim} />
          </mesh>
          <mesh position={[-0.04, 0, 0]}>
            <circleGeometry args={[0.08, 12]} />
            <meshStandardMaterial color={EMBER} emissive={EMBER} emissiveIntensity={1.5} toneMapped={false} side={2} />
          </mesh>
        </group>

        <group ref={hammer} position={[0.42, 0.3, 0.05]}>
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.55, 8]} />
            <meshStandardMaterial color="#2a1f18" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[0.2, 0.12, 0.12]} />
            <meshStandardMaterial {...iron} />
          </mesh>
        </group>
        <pointLight position={[0, 0.55, 0.3]} color={EMBER} intensity={1.4} distance={1.8} />
        <GuardDisc disc={disc} color={EMBER} />
        <mesh ref={glow} position={[0.42, 0.95, 0.1]} scale={0}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
        </mesh>
      </group>

      <group position={[-0.5, 0, 0.35]} rotation={[0, 0.4, 0]}>
        <mesh position={[0, 0.07, 0]}>
          <boxGeometry args={[0.24, 0.14, 0.18]} />
          <meshStandardMaterial color="#3a2b20" roughness={1} />
        </mesh>
        {[-0.07, 0.03, 0.12].map((x) => (
          <mesh key={x} position={[x, 0.17, 0]}>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshStandardMaterial color="#2a2d33" metalness={0.9} roughness={0.35} />
          </mesh>
        ))}
      </group>

      <mesh ref={ring} position={[0.45, 0.03, 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.36, 28]} />
        <meshBasicMaterial color={EMBER} transparent opacity={0} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh ref={ring2} position={[0.45, 0.035, 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.26, 28]} />
        <meshBasicMaterial color="#ffd9a0" transparent opacity={0} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

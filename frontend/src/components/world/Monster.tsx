"use client";

import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh, MeshBasicMaterial, PointLight } from "three";
import { ease, hold, lunge, seg, swingAngle } from "./battle";
import { engine, heroAct, hitFlash, progress } from "./battleEngine";
import { HEROES } from "./battleEngine";
import { groundAt } from "./terrain";

const FLESH = "#2a2025";
const BONE = "#cfc4ab";
const FIRE = "#ff3b2e";

function Claws({ y = -0.5 }: { y?: number }) {
  return (
    <>
      {[-0.05, 0, 0.05].map((x) => (
        <mesh key={x} position={[x, y, 0.04]} rotation={[0.5, 0, 0]}>
          <coneGeometry args={[0.018, 0.14, 5]} />
          <meshStandardMaterial color={BONE} roughness={0.6} />
        </mesh>
      ))}
    </>
  );
}

/** The Gravemaw: swipes, rearing slams, a lunging bite and a roar. Click it to attack. */
export function Monster() {
  const root = useRef<Group>(null);
  const yaw = useRef(-1.6);
  const body = useRef<Group>(null);
  const lean = useRef<Group>(null);
  const torso = useRef<Mesh>(null);
  const armR = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const head = useRef<Group>(null);
  const jaw = useRef<Mesh>(null);
  const flash = useRef<PointLight>(null);
  const eyes = useRef<PointLight>(null);
  const bar = useRef<Mesh>(null);
  const barG = useRef<Group>(null);
  const wave = useRef<Mesh>(null);
  const claw = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const g = body.current;
    const ln = lean.current;
    const r = root.current;
    if (!g || !ln || !r) return;
    const e = engine.enemies.monster;
    r.position.set(e.x, groundAt(e.x, e.z), e.z);
    if (e.alive) {
      const near = HEROES.map((h) => engine.pos[h]).sort(
        (a, b) => Math.hypot(a.x - e.x, a.z - e.z) - Math.hypot(b.x - e.x, b.z - e.z),
      )[0];
      const want = Math.atan2(near.x - e.x, near.z - e.z);
      const d = Math.atan2(Math.sin(want - yaw.current), Math.cos(want - yaw.current));
      yaw.current += d * 0.08;
    }
    r.rotation.y = yaw.current;
    const stunned = e.alive && engine.now < e.stunUntil;

    const pSwipe = progress("monster", "swipe");
    const pSlam = progress("monster", "slam");
    const pLunge = progress("monster", "lunge");
    const pRoar = progress("monster", "roar");
    const pDie = progress("monster", "die");
    const dead = !engine.alive;
    const hit = hitFlash("monster", 7);

    let z = 0;
    let y = Math.sin(t * 1.3) * 0.01;
    let tilt = 0;
    let rArm = -0.15;
    let lArm = -0.1 + Math.sin(t * 1.1) * 0.06;
    let headUp = 0;
    let jawOpen = 0.05 + Math.sin(t * 1.8) * 0.02;
    let wv = -1;
    let clawTrail = 0;

    if (pSwipe >= 0) {
      tilt = -0.4 * ease(seg(pSwipe, 0, 0.5)) + 0.7 * ease(seg(pSwipe, 0.5, 0.65)) * (1 - ease(seg(pSwipe, 0.75, 1)));
      rArm = -0.15 + swingAngle(pSwipe, -1.8, 1.5) * 1.0;
      z = lunge(pSwipe) * 0.7;
      clawTrail = pSwipe > 0.5 && pSwipe < 0.8 ? Math.sin(((pSwipe - 0.5) / 0.3) * Math.PI) : 0;
      jawOpen = 0.4 * hold(pSwipe);
    } else if (pSlam >= 0) {
      const up = ease(seg(pSlam, 0, 0.55));
      const down = ease(seg(pSlam, 0.6, 0.72));
      const rec = ease(seg(pSlam, 0.8, 1));
      tilt = -0.65 * up * (1 - down) + 0.55 * down * (1 - rec);
      rArm = lArm = -2.6 * up * (1 - down) + 1.3 * down * (1 - rec);
      z = lunge(pSlam) * 0.45;
      y += Math.sin(seg(pSlam, 0.3, 0.7) * Math.PI) * 0.25;
      headUp = up * (1 - down);
      jawOpen = 0.55 * up;
      wv = pSlam > 0.64 ? seg(pSlam, 0.64, 1) : -1;
    } else if (pLunge >= 0) {
      const crouch = ease(seg(pLunge, 0, 0.45));
      const strike = ease(seg(pLunge, 0.45, 0.62)) * (1 - ease(seg(pLunge, 0.75, 1)));
      tilt = -0.15 * crouch + 0.85 * strike;
      z = strike * 1.15 - crouch * 0.12;
      y += -0.08 * crouch;
      lArm = rArm = -0.5 * crouch + 0.8 * strike;
      jawOpen = 0.15 + 0.85 * strike;
    } else if (pRoar >= 0) {
      const r = hold(pRoar);
      tilt = -0.5 * r;
      headUp = r;
      jawOpen = 0.95 * r;
      rArm = lArm = -1.2 * r;
      y += r * 0.05 + Math.sin(t * 50) * 0.015 * r;
    }

    if (stunned && pSwipe < 0 && pSlam < 0 && pLunge < 0 && pRoar < 0) {
      tilt = -0.35 + Math.sin(t * 9) * 0.05;
      headUp = 0.7;
      jawOpen = 0.5;
      rArm = lArm = 0.5;
    }

    if (pDie >= 0 || dead) {
      const d = dead ? (pDie >= 0 ? pDie : 1) : 0;
      tilt = -1.45 * ease(seg(d, 0, 0.7));
      y = -0.28 * ease(seg(d, 0.3, 1));
      rArm = lArm = -0.6 + 1.0 * d;
      jawOpen = 0.7 * d;
      z = -0.4 * d;
    }

    g.position.set(Math.sin(t * 75) * hit * 0.04, y, z - hit * 0.18);
    ln.rotation.x = tilt;
    if (torso.current) torso.current.scale.set(1, 1.1 + Math.sin(t * 1.8) * 0.03, 0.9);
    if (armR.current) armR.current.rotation.x = rArm;
    if (armL.current) armL.current.rotation.x = lArm + hit * 0.5;
    if (head.current) head.current.rotation.x = -headUp * 0.5;
    if (jaw.current) jaw.current.rotation.x = jawOpen;
    if (flash.current) flash.current.intensity = 1.5 + hit * 14;
    if (eyes.current) eyes.current.intensity = dead ? 0 : 2.5 + (pRoar >= 0 ? 3 : 0) + (pSlam >= 0 || pLunge >= 0 ? 2 : 0);
    if (claw.current) {
      claw.current.visible = clawTrail > 0;
      (claw.current.material as MeshBasicMaterial).opacity = clawTrail;
    }
    if (wave.current) {
      const v = wv > 0 ? wv : 0;
      wave.current.scale.setScalar(0.3 + v * 4.0);
      (wave.current.material as MeshBasicMaterial).opacity = v > 0 ? (1 - v) * 0.8 : 0;
    }
    if (bar.current && barG.current) {
      const f = Math.max(0.001, engine.enemies.monster.hp / engine.enemies.monster.maxHp);
      bar.current.scale.x = f * 0.6;
      bar.current.position.x = -0.3 * (1 - f);
      barG.current.visible = engine.alive;
    }
  });

  const horn = (s: 1 | -1) => (
    <mesh position={[s * 0.13, 1.2, 0.2]} rotation={[-0.5, 0, -s * 0.7]}>
      <coneGeometry args={[0.045, 0.34, 6]} />
      <meshStandardMaterial color={BONE} roughness={0.5} />
    </mesh>
  );

  const arm = (s: 1 | -1, ref: typeof armR) => (
    <group ref={ref} position={[s * 0.36, 0.88, 0.02]}>
      <mesh position={[0, -0.22, 0.05]} rotation={[0.2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.055, 0.5, 8]} />
        <meshStandardMaterial color={FLESH} roughness={0.9} />
      </mesh>
      <mesh position={[0, -0.5, 0.1]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#1f171b" roughness={0.9} />
      </mesh>
      <group position={[0, -0.02, 0.06]}>
        <Claws />
      </group>
    </group>
  );

  return (
    <group
      ref={root}
      scale={1.5}
      onClick={(e) => {
        e.stopPropagation();
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
        {[-0.17, 0.17].map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.09, 0.07, 0.45, 8]} />
              <meshStandardMaterial color={FLESH} roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.03, 0.06]}>
              <boxGeometry args={[0.15, 0.06, 0.22]} />
              <meshStandardMaterial color="#1f171b" roughness={0.9} />
            </mesh>
          </group>
        ))}

        <group ref={lean} position={[0, 0.45, 0]}>
          <group position={[0, -0.45, 0]}>
            <mesh ref={torso} position={[0, 0.7, 0]} scale={[1, 1.1, 0.9]}>
              <sphereGeometry args={[0.3, 14, 12]} />
              <meshStandardMaterial color={FLESH} roughness={0.9} />
            </mesh>
            {[0.55, 0.7, 0.85].map((yy, i) => (
              <mesh key={yy} position={[(i - 1) * 0.07, yy, 0.26]} rotation={[0, 0, 0.3 * (i - 1)]}>
                <boxGeometry args={[0.012, 0.16, 0.012]} />
                <meshStandardMaterial color={FIRE} emissive={FIRE} emissiveIntensity={2} toneMapped={false} />
              </mesh>
            ))}
            {[0, 1, 2, 3, 4].map((i) => (
              <mesh key={i} position={[0, 1.0 - i * 0.12, -0.27 - i * 0.01]} rotation={[-0.9, 0, 0]}>
                <coneGeometry args={[0.05 - i * 0.004, 0.22, 5]} />
                <meshStandardMaterial color="#17110f" roughness={0.8} />
              </mesh>
            ))}

            {arm(1, armR)}
            {arm(-1, armL)}

            <group ref={head} position={[0, 1.0, 0.2]}>
              <mesh position={[0, 0.08, 0]} scale={[1, 0.9, 1.2]}>
                <sphereGeometry args={[0.2, 12, 10]} />
                <meshStandardMaterial color={FLESH} roughness={0.9} />
              </mesh>
              <group position={[0, -0.04, 0.08]}>
                <mesh ref={jaw} position={[0, -0.02, 0.1]}>
                  <boxGeometry args={[0.2, 0.07, 0.2]} />
                  <meshStandardMaterial color="#1f171b" roughness={0.9} />
                </mesh>
              </group>
              <mesh position={[0, -0.01, 0.16]}>
                <boxGeometry args={[0.15, 0.02, 0.1]} />
                <meshStandardMaterial color="#ff7a2e" emissive="#ff5a1e" emissiveIntensity={2.5} toneMapped={false} />
              </mesh>
              {[-0.07, -0.025, 0.025, 0.07].map((x) => (
                <mesh key={x} position={[x, 0.02, 0.17]} rotation={[Math.PI, 0, 0]}>
                  <coneGeometry args={[0.012, 0.05, 4]} />
                  <meshStandardMaterial color={BONE} />
                </mesh>
              ))}
              {[-0.075, 0.075].map((x) => (
                <mesh key={x} position={[x, 0.13, 0.16]}>
                  <sphereGeometry args={[0.025, 8, 8]} />
                  <meshStandardMaterial color={FIRE} emissive={FIRE} emissiveIntensity={5} toneMapped={false} />
                </mesh>
              ))}
              <group position={[0, 0.12, -0.2]}>
                {horn(1)}
                {horn(-1)}
              </group>
              <pointLight ref={eyes} position={[0, 0.1, 0.3]} color={FIRE} intensity={2.5} distance={2.8} />
            </group>

            <mesh ref={claw} position={[0.4, 0.5, 0.5]} rotation={[0, Math.PI / 2, 0.4]} visible={false}>
              <torusGeometry args={[0.55, 0.03, 5, 24, Math.PI * 0.7]} />
              <meshBasicMaterial color="#ff5a3a" transparent opacity={0} toneMapped={false} depthWrite={false} />
            </mesh>
          </group>
        </group>
        <pointLight ref={flash} position={[0, 0.8, 0.5]} color="#ffb070" intensity={1.5} distance={3.5} />
      </group>

      <mesh ref={wave} position={[0, 0.03, 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.4, 32]} />
        <meshBasicMaterial color="#ff6a3a" transparent opacity={0} toneMapped={false} depthWrite={false} />
      </mesh>

      <Billboard position={[0, 1.65, 0]}>
        <group ref={barG}>
          <mesh>
            <planeGeometry args={[0.62, 0.07]} />
            <meshBasicMaterial color="#0b0d10" />
          </mesh>
          <mesh ref={bar} position={[0, 0, 0.001]} scale={[0.6, 1, 1]}>
            <planeGeometry args={[1, 0.045]} />
            <meshBasicMaterial color="#c0392b" toneMapped={false} />
          </mesh>
        </group>
      </Billboard>
    </group>
  );
}

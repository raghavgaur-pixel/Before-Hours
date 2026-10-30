"use client";

import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh, PointLight } from "three";
import { battlePhase, lunge, swingAngle } from "./battle";

type V3 = [number, number, number];

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

/** The Gravemaw: a hulking horned beast that stalks the fields. */
export function Monster({ position, facing }: { position: V3; facing: number }) {
  const body = useRef<Group>(null);
  const torso = useRef<Mesh>(null);
  const armR = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const flash = useRef<PointLight>(null);
  const bar = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const ph = battlePhase(t);
    if (body.current) {
      body.current.position.z = lunge(ph.monster) * 0.35 - ph.hitMonster * 0.2;
      body.current.position.x = ph.hitMonster * 0.03 * Math.sin(t * 70);
      body.current.position.y = Math.sin(t * 1.3) * 0.01;
    }
    if (torso.current) torso.current.scale.set(1, 1.1 + Math.sin(t * 1.8) * 0.03, 0.9);
    if (armR.current) armR.current.rotation.x = -0.15 + swingAngle(ph.monster) * 0.9;
    if (armL.current) armL.current.rotation.x = -0.1 + Math.sin(t * 1.1) * 0.06 + ph.hitMonster * 0.5;
    if (flash.current) flash.current.intensity = 1.5 + ph.hitMonster * 14;
    if (bar.current) {
      const s = Math.max(0.05, 0.62 - (t % 6) * 0.01) / 0.62;
      bar.current.scale.x = s * 0.62;
      bar.current.position.x = -0.3 * (1 - s);
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
    <group position={position} rotation={[0, facing, 0]} scale={1.5}>
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

        <mesh ref={torso} position={[0, 0.7, 0]} scale={[1, 1.1, 0.9]}>
          <sphereGeometry args={[0.3, 14, 12]} />
          <meshStandardMaterial color={FLESH} roughness={0.9} />
        </mesh>
        {[0.55, 0.7, 0.85].map((y, i) => (
          <mesh key={y} position={[(i - 1) * 0.07, y, 0.26]} rotation={[0, 0, 0.3 * (i - 1)]}>
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

        <mesh position={[0, 1.08, 0.2]} scale={[1, 0.9, 1.2]}>
          <sphereGeometry args={[0.2, 12, 10]} />
          <meshStandardMaterial color={FLESH} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.96, 0.3]}>
          <boxGeometry args={[0.2, 0.07, 0.2]} />
          <meshStandardMaterial color="#1f171b" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.99, 0.36]}>
          <boxGeometry args={[0.15, 0.02, 0.1]} />
          <meshStandardMaterial color="#ff7a2e" emissive="#ff5a1e" emissiveIntensity={2.5} toneMapped={false} />
        </mesh>
        {[-0.07, -0.025, 0.025, 0.07].map((x) => (
          <mesh key={x} position={[x, 1.02, 0.37]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.012, 0.05, 4]} />
            <meshStandardMaterial color={BONE} />
          </mesh>
        ))}
        {horn(1)}
        {horn(-1)}
        {[-0.075, 0.075].map((x) => (
          <mesh key={x} position={[x, 1.13, 0.36]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color={FIRE} emissive={FIRE} emissiveIntensity={5} toneMapped={false} />
          </mesh>
        ))}
        <pointLight position={[0, 1.1, 0.5]} color={FIRE} intensity={2.5} distance={2.8} />
        <pointLight ref={flash} position={[0, 0.8, 0.5]} color="#ffb070" intensity={1.5} distance={3.5} />
      </group>

      <Billboard position={[0, 1.65, 0]}>
        <mesh>
          <planeGeometry args={[0.62, 0.07]} />
          <meshBasicMaterial color="#0b0d10" />
        </mesh>
        <mesh ref={bar} position={[-0.29 * 0, 0, 0.001]} scale={[0.62, 1, 1]}>
          <planeGeometry args={[0.6, 0.045]} />
          <meshBasicMaterial color="#c0392b" toneMapped={false} />
        </mesh>
      </Billboard>
    </group>
  );
}

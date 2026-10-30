"use client";

import { Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh, MeshBasicMaterial, MeshStandardMaterial, PointLight } from "three";
import { groundAt, mulberry32 } from "./terrain";

type V3 = [number, number, number];

/** Post lantern with a flickering flame and a soft pool of light on the ground. */
export function Lantern({ x, z, color = "#ffa64d", phase = 0 }: { x: number; z: number; color?: string; phase?: number }) {
  const y = groundAt(x, z);
  const bulb = useRef<Mesh>(null);
  const pool = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase;
    const f = 0.75 + Math.sin(t * 11) * 0.12 + Math.sin(t * 5.3) * 0.1;
    if (bulb.current) (bulb.current.material as MeshStandardMaterial).emissiveIntensity = 3 * f;
    if (pool.current) (pool.current.material as MeshBasicMaterial).opacity = 0.28 * f;
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.012, 0.016, 0.4, 5]} />
        <meshStandardMaterial color="#17130f" roughness={1} />
      </mesh>
      <mesh ref={bulb} position={[0, 0.43, 0]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <mesh ref={pool} position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 20]} />
        <meshBasicMaterial color={color} transparent opacity={0.28} depthWrite={false} blending={2} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function DeadTree({ position, scale = 1, seed = 1 }: { position: V3; scale?: number; seed?: number }) {
  const r = mulberry32(seed);
  const branches = Array.from({ length: 4 }, (_, i) => ({
    y: 0.28 + i * 0.1,
    rot: r() * 6.28,
    lean: 0.6 + r() * 0.6,
    len: 0.2 + r() * 0.12,
  }));
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.02, 0.05, 0.55, 5]} />
        <meshStandardMaterial color="#231b17" roughness={1} />
      </mesh>
      {branches.map((b, i) => (
        <group key={i} position={[0, b.y, 0]} rotation={[0, b.rot, b.lean]}>
          <mesh position={[0, b.len / 2, 0]}>
            <cylinderGeometry args={[0.005, 0.015, b.len, 4]} />
            <meshStandardMaterial color="#231b17" roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Graveyard({ center }: { center: [number, number] }) {
  const y = groundAt(center[0], center[1]);
  const r = mulberry32(7);
  const stones = Array.from({ length: 8 }, (_, i) => ({
    x: ((i % 4) - 1.5) * 0.35 + (r() - 0.5) * 0.1,
    z: (Math.floor(i / 4) - 0.5) * 0.5 + (r() - 0.5) * 0.1,
    tilt: (r() - 0.5) * 0.3,
    h: 0.16 + r() * 0.1,
  }));
  return (
    <group position={[center[0], y, center[1]]}>
      {stones.map((s, i) => (
        <group key={i} position={[s.x, 0, s.z]} rotation={[0, s.tilt, s.tilt]}>
          <mesh position={[0, s.h / 2, 0]}>
            <boxGeometry args={[0.12, s.h, 0.04]} />
            <meshStandardMaterial color="#5b5d60" roughness={1} />
          </mesh>
          <mesh position={[0, s.h, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.04, 10]} />
            <meshStandardMaterial color="#5b5d60" roughness={1} />
          </mesh>
        </group>
      ))}
      <DeadTree position={[-0.9, 0, 0.5]} scale={1.3} seed={3} />
      <DeadTree position={[0.95, 0, -0.55]} scale={1.1} seed={9} />
      <Sparkles count={14} scale={[1.8, 0.8, 1.4]} position={[0, 0.5, 0]} size={4} speed={0.25} color="#59f0d0" opacity={0.7} />
    </group>
  );
}

export function Well({ x, z }: { x: number; z: number }) {
  const y = groundAt(x, z);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.15, 0.17, 0.2, 10]} />
        <meshStandardMaterial color="#555352" roughness={1} />
      </mesh>
      <mesh position={[0, 0.19, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.11, 10]} />
        <meshBasicMaterial color="#05080a" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.15, 0.3, 0]}>
          <boxGeometry args={[0.025, 0.28, 0.025]} />
          <meshStandardMaterial color="#3a2b20" roughness={1} />
        </mesh>
      ))}
      <mesh position={[0, 0.5, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.24, 0.14, 4]} />
        <meshStandardMaterial color="#2f3646" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

export function Bonfire({ x, z }: { x: number; z: number }) {
  const y = groundAt(x, z);
  const flame = useRef<Mesh>(null);
  const light = useRef<PointLight>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const f = 0.8 + Math.sin(t * 13) * 0.14 + Math.sin(t * 7.1) * 0.1;
    if (flame.current) flame.current.scale.set(1, f * 1.2, 1);
    if (light.current) light.current.intensity = 7 * f;
  });
  return (
    <group position={[x, y, z]}>
      {[0, 1.05, 2.1].map((a) => (
        <mesh key={a} position={[0, 0.04, 0]} rotation={[0, a, 0.15]}>
          <boxGeometry args={[0.3, 0.04, 0.04]} />
          <meshStandardMaterial color="#2a1d14" roughness={1} />
        </mesh>
      ))}
      <mesh ref={flame} position={[0, 0.17, 0]}>
        <coneGeometry args={[0.08, 0.26, 7]} />
        <meshStandardMaterial color="#ff9a2e" emissive="#ff6a14" emissiveIntensity={3.5} toneMapped={false} />
      </mesh>
      <pointLight ref={light} position={[0, 0.3, 0]} color="#ff9a4d" intensity={7} distance={6} />
      <Sparkles count={14} scale={[0.4, 1.2, 0.4]} position={[0, 0.7, 0]} size={3} speed={0.6} color="#ff8a3d" opacity={0.9} />
    </group>
  );
}

"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { groundAt, mulberry32 } from "./terrain";

type V3 = [number, number, number];

const Leg = ({ x, z, h = 0.17, r = 0.028, color }: { x: number; z: number; h?: number; r?: number; color: string }) => (
  <group position={[x, h, z]}>
    <mesh position={[0, -h / 2, 0]}>
      <cylinderGeometry args={[r, r * 0.8, h, 6]} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  </group>
);

const COW_COATS = [
  { body: "#2a2220", patch: "#d8d2c4" },
  { body: "#5b3d2a", patch: "#cbbfa8" },
  { body: "#d8d2c4", patch: "#2a2220" },
];

/** A grazing cow. Faces +z, lowers its head to graze. */
export function Cow({ position, rotation, coat, phase }: { position: V3; rotation: number; coat: number; phase: number }) {
  const head = useRef<Group>(null);
  const root = useRef<Group>(null);
  const { body, patch } = COW_COATS[coat % COW_COATS.length];
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + phase;
    if (head.current) head.current.rotation.x = 0.55 + Math.sin(t * 0.9) * 0.4;
    if (root.current) root.current.rotation.z = Math.sin(t * 0.5) * 0.02;
  });
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={1.15}>
      <group ref={root}>
        <mesh position={[0, 0.27, 0]}>
          <boxGeometry args={[0.2, 0.2, 0.38]} />
          <meshStandardMaterial color={body} roughness={0.95} />
        </mesh>
        <mesh position={[0.005, 0.3, -0.04]}>
          <boxGeometry args={[0.205, 0.12, 0.14]} />
          <meshStandardMaterial color={patch} roughness={0.95} />
        </mesh>
        {[-0.07, 0.07].flatMap((x) => [-0.13, 0.13].map((z) => <Leg key={`${x}${z}`} x={x} z={z} color={body} />))}
        <mesh position={[0, 0.3, -0.21]} rotation={[0.5, 0, 0]}>
          <boxGeometry args={[0.02, 0.18, 0.02]} />
          <meshStandardMaterial color={body} />
        </mesh>
        <group ref={head} position={[0, 0.34, 0.2]}>
          <mesh position={[0, 0, 0.08]}>
            <boxGeometry args={[0.12, 0.12, 0.16]} />
            <meshStandardMaterial color={body} roughness={0.95} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.07, 0.07, 0.03]} rotation={[0, 0, -s * 0.9]}>
              <coneGeometry args={[0.014, 0.08, 5]} />
              <meshStandardMaterial color="#cfc4ab" />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

/** A pack animal that prowls a loop. Glowing eyes; legs swing as it walks. */
export function Wolf({ center, radius, speed, phase, clockwise = 1 }: { center: [number, number]; radius: number; speed: number; phase: number; clockwise?: 1 | -1 }) {
  const ref = useRef<Group>(null);
  const legs = useRef<(Group | null)[]>([]);
  const y = groundAt(center[0], center[1]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const a = (t * speed + phase) * clockwise;
    const g = ref.current;
    if (!g) return;
    g.position.set(center[0] + Math.cos(a) * radius, y + Math.abs(Math.sin(t * 9 + phase)) * 0.01, center[1] + Math.sin(a) * radius);
    g.rotation.y = Math.atan2(-Math.sin(a) * clockwise, Math.cos(a) * clockwise);
    legs.current.forEach((l, i) => {
      if (l) l.rotation.x = Math.sin(t * 9 + phase + (i % 3 === 0 ? 0 : Math.PI)) * 0.55;
    });
  });
  const fur = "#3a3d42";
  return (
    <group ref={ref} scale={1.2}>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.14, 0.14, 0.34]} />
        <meshStandardMaterial color={fur} roughness={1} />
      </mesh>
      <mesh position={[0, 0.3, 0.2]}>
        <boxGeometry args={[0.11, 0.1, 0.13]} />
        <meshStandardMaterial color={fur} roughness={1} />
      </mesh>
      <mesh position={[0, 0.27, 0.3]}>
        <boxGeometry args={[0.06, 0.05, 0.1]} />
        <meshStandardMaterial color="#2b2d31" roughness={1} />
      </mesh>
      {[-0.035, 0.035].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.37, 0.18]}>
            <coneGeometry args={[0.025, 0.06, 4]} />
            <meshStandardMaterial color={fur} />
          </mesh>
          <mesh position={[x, 0.32, 0.26]}>
            <sphereGeometry args={[0.012, 6, 6]} />
            <meshStandardMaterial color="#ffd23c" emissive="#ffc21c" emissiveIntensity={4} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.26, -0.24]} rotation={[-1.1, 0, 0]}>
        <coneGeometry args={[0.04, 0.2, 5]} />
        <meshStandardMaterial color={fur} />
      </mesh>
      {[
        [-0.05, 0.12],
        [0.05, -0.12],
        [0.05, 0.12],
        [-0.05, -0.12],
      ].map(([x, z], i) => (
        <group
          key={i}
          ref={(el) => {
            legs.current[i] = el;
          }}
          position={[x, 0.18, z]}
        >
          <mesh position={[0, -0.09, 0]}>
            <cylinderGeometry args={[0.02, 0.015, 0.18, 5]} />
            <meshStandardMaterial color="#2b2d31" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** A deer, head down grazing, with branching antlers. Faces +z. */
export function Deer({ position, rotation, phase }: { position: V3; rotation: number; phase: number }) {
  const head = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (head.current) head.current.rotation.x = 0.2 + (Math.sin(clock.elapsedTime * 0.7 + phase) * 0.5 + 0.5) * 0.9;
  });
  const hide = "#6b5a46";
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={1.2}>
      <mesh position={[0, 0.34, 0]}>
        <boxGeometry args={[0.14, 0.16, 0.34]} />
        <meshStandardMaterial color={hide} roughness={1} />
      </mesh>
      {[-0.05, 0.05].flatMap((x) => [-0.12, 0.12].map((z) => <Leg key={`${x}${z}`} x={x} z={z} h={0.26} r={0.018} color="#4a3d2e" />))}
      <group ref={head} position={[0, 0.42, 0.16]}>
        <mesh position={[0, 0.12, 0.02]} rotation={[-0.35, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.04, 0.26, 6]} />
          <meshStandardMaterial color={hide} roughness={1} />
        </mesh>
        <mesh position={[0, 0.26, 0.08]}>
          <boxGeometry args={[0.07, 0.07, 0.13]} />
          <meshStandardMaterial color={hide} roughness={1} />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s} position={[s * 0.035, 0.31, 0.05]} rotation={[0, 0, -s * 0.4]}>
            <mesh position={[0, 0.07, 0]}>
              <cylinderGeometry args={[0.006, 0.01, 0.15, 4]} />
              <meshStandardMaterial color="#cdbf9f" />
            </mesh>
            <mesh position={[s * 0.03, 0.1, 0]} rotation={[0, 0, -s * 0.8]}>
              <cylinderGeometry args={[0.005, 0.008, 0.08, 4]} />
              <meshStandardMaterial color="#cdbf9f" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/** A crow circling overhead, wings flapping. */
export function Crow({ center, radius, height, speed, phase }: { center: [number, number]; radius: number; height: number; speed: number; phase: number }) {
  const ref = useRef<Group>(null);
  const wings = useRef<(Group | null)[]>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const a = t * speed + phase;
    const g = ref.current;
    if (!g) return;
    g.position.set(center[0] + Math.cos(a) * radius, height + Math.sin(t * 0.8 + phase) * 0.25, center[1] + Math.sin(a) * radius);
    g.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a));
    const f = Math.sin(t * 13 + phase) * 0.7;
    if (wings.current[0]) wings.current[0].rotation.z = f;
    if (wings.current[1]) wings.current[1].rotation.z = -f;
  });
  return (
    <group ref={ref}>
      <mesh scale={[0.6, 0.6, 1.5]}>
        <sphereGeometry args={[0.05, 8, 6]} />
        <meshStandardMaterial color="#0e0f12" roughness={1} />
      </mesh>
      <mesh position={[0, 0.005, 0.08]}>
        <coneGeometry args={[0.015, 0.05, 4]} />
        <meshStandardMaterial color="#8a7a4a" />
      </mesh>
      {[1, -1].map((s, i) => (
        <group
          key={s}
          ref={(el) => {
            wings.current[i] = el;
          }}
          position={[s * 0.02, 0.01, 0]}
        >
          <mesh position={[s * 0.09, 0, 0]}>
            <boxGeometry args={[0.18, 0.006, 0.07]} />
            <meshStandardMaterial color="#0e0f12" roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/** Cattle pen: fence ring with a gap, hay bales, and cows inside. */
export function CattlePen({ center }: { center: [number, number] }) {
  const y = groundAt(center[0], center[1]);
  const R = 1.0;
  const posts = 16;
  const rand = mulberry32(42);
  const cows = Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * Math.PI * 2 + rand();
    const d = 0.25 + rand() * 0.4;
    return { x: Math.cos(a) * d, z: Math.sin(a) * d, rot: rand() * 6.28, coat: i, phase: rand() * 6 };
  });
  const segs: React.ReactElement[] = [];
  for (let i = 0; i < posts; i++) {
    if (i === 3 || i === 4) continue; // gate gap facing the village
    const a = (i / posts) * Math.PI * 2;
    const b = ((i + 1) / posts) * Math.PI * 2;
    const x = Math.cos(a) * R;
    const z = Math.sin(a) * R;
    const mx = (x + Math.cos(b) * R) / 2;
    const mz = (z + Math.sin(b) * R) / 2;
    segs.push(
      <group key={i}>
        <mesh position={[x, 0.11, z]}>
          <boxGeometry args={[0.04, 0.22, 0.04]} />
          <meshStandardMaterial color="#3a2b20" roughness={1} />
        </mesh>
        {[0.09, 0.17].map((h) => (
          <mesh key={h} position={[mx, h, mz]} rotation={[0, -(a + b) / 2 - Math.PI / 2, 0]}>
            <boxGeometry args={[2 * R * Math.sin(Math.PI / posts), 0.025, 0.02]} />
            <meshStandardMaterial color="#4a3829" roughness={1} />
          </mesh>
        ))}
      </group>,
    );
  }
  return (
    <group position={[center[0], y, center[1]]}>
      {segs}
      {cows.map((c, i) => (
        <Cow key={i} position={[c.x, 0, c.z]} rotation={c.rot} coat={c.coat} phase={c.phase} />
      ))}
      {[[-0.35, 0.85], [-0.55, 0.65]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.1, z]} rotation={[0, 0.4 * i, Math.PI / 2]}>
          <cylinderGeometry args={[0.11, 0.11, 0.24, 8]} />
          <meshStandardMaterial color="#8a7332" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

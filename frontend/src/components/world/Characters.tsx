"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh, MeshBasicMaterial } from "three";
import { battlePhase, lunge, swingAngle } from "./battle";

type V3 = [number, number, number];

const GLOW = "#34e0c0";
const EMBER = "#ff9a3c";

/** Veylorn-style hooded dark-fantasy knight. Procedural placeholder for a GLB. */
export function AshenWarden({
  position,
  facing,
  fight = false,
}: {
  position: V3;
  facing?: number;
  fight?: boolean;
}) {
  const body = useRef<Group>(null);
  const sword = useRef<Group>(null);
  const arc = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const b = body.current;
    if (!b) return;
    b.position.y = Math.sin(t * 1.6) * 0.008;
    if (!fight) {
      b.rotation.y = (facing ?? -0.6) + Math.sin(t * 0.4) * 0.15;
      return;
    }
    const ph = battlePhase(t);
    b.position.z = lunge(ph.warden) * 0.28;
    if (sword.current) sword.current.rotation.x = 0.1 + swingAngle(ph.warden);
    if (arc.current) {
      const v = ph.warden > 0.45 && ph.warden < 0.85 ? Math.sin(((ph.warden - 0.45) / 0.4) * Math.PI) : 0;
      (arc.current.material as MeshBasicMaterial).opacity = v * 0.9;
    }
  });

  return (
    <group position={position} rotation={[0, fight ? (facing ?? 0) : 0, 0]} scale={1.1}>
    <group ref={body}>
      {[-0.07, 0.07].map((x) => (
        <mesh key={x} position={[x, 0.15, 0]}>
          <cylinderGeometry args={[0.05, 0.045, 0.3, 8]} />
          <meshStandardMaterial color="#1a1c20" metalness={0.6} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.28, 0.3, 0.18]} />
        <meshStandardMaterial color="#434a56" metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.38, -0.07]} scale={[1, 1, 0.55]}>
        <coneGeometry args={[0.3, 0.72, 10, 1, true]} />
        <meshStandardMaterial color="#242830" roughness={1} side={2} />
      </mesh>
      {[-0.17, 0.17].map((x) => (
        <mesh key={x} position={[x, 0.6, 0]}>
          <sphereGeometry args={[0.08, 10, 10]} />
          <meshStandardMaterial color="#353a43" metalness={0.8} roughness={0.4} />
        </mesh>
      ))}
      <mesh position={[0, 0.72, 0]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color="#0e0f12" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.82, -0.01]}>
        <coneGeometry args={[0.12, 0.2, 8]} />
        <meshStandardMaterial color="#14161a" roughness={1} />
      </mesh>
      {[-0.035, 0.035].map((x) => (
        <mesh key={x} position={[x, 0.73, 0.08]}>
          <sphereGeometry args={[0.014, 8, 8]} />
          <meshStandardMaterial color={GLOW} emissive={GLOW} emissiveIntensity={4} toneMapped={false} />
        </mesh>
      ))}
      <group ref={sword} position={[0.24, 0.42, 0.05]} rotation={[0.1, 0, -0.08]}>
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[0.035, 0.62, 0.012]} />
          <meshStandardMaterial color="#9fe9dc" emissive={GLOW} emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
        <mesh position={[0, -0.2, 0]}>
          <boxGeometry args={[0.1, 0.025, 0.03]} />
          <meshStandardMaterial color="#2b2f36" metalness={0.8} />
        </mesh>
      </group>
      <pointLight position={[0.2, 0.5, 0.2]} color={GLOW} intensity={1.2} distance={1.8} />
      {fight && (
        <mesh ref={arc} position={[0.2, 0.55, 0.4]} rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[0.42, 0.014, 6, 28, Math.PI * 0.75]} />
          <meshBasicMaterial color={GLOW} transparent opacity={0} toneMapped={false} depthWrite={false} />
        </mesh>
      )}
    </group>
    </group>
  );
}

/** Stonebound-style iron golem. Procedural placeholder for a GLB. */
export function IronSentinel({
  position,
  facing = 0.7,
  fight = false,
}: {
  position: V3;
  facing?: number;
  fight?: boolean;
}) {
  const body = useRef<Group>(null);
  const hammer = useRef<Group>(null);
  const ring = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const b = body.current;
    if (!b) return;
    b.position.y = Math.sin(t * 1.1) * 0.006;
    if (!fight) return;
    const ph = battlePhase(t);
    b.position.z = lunge(ph.sentinel) * 0.2 - ph.hitHero * 0.12;
    b.position.x = ph.hitHero * 0.04 * Math.sin(t * 60);
    if (hammer.current) hammer.current.rotation.x = swingAngle(ph.sentinel);
    if (ring.current) {
      const p = ph.sentinel;
      const v = p > 0.55 && p < 1 ? (p - 0.55) / 0.45 : 0;
      ring.current.scale.setScalar(0.2 + v * 1.6);
      (ring.current.material as MeshBasicMaterial).opacity = v > 0 ? (1 - v) * 0.7 : 0;
    }
  });

  const iron = { color: "#3a3f47", metalness: 0.85, roughness: 0.4 } as const;

  return (
    <group position={position} rotation={[0, facing, 0]} scale={1.15}>
    <group ref={body}>
      {[-0.1, 0.1].map((x) => (
        <mesh key={x} position={[x, 0.14, 0]}>
          <boxGeometry args={[0.13, 0.28, 0.15]} />
          <meshStandardMaterial {...iron} />
        </mesh>
      ))}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.42, 0.42, 0.28]} />
        <meshStandardMaterial {...iron} />
      </mesh>
      <mesh position={[0, 0.52, 0.145]}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshStandardMaterial color={EMBER} emissive={EMBER} emissiveIntensity={3.5} toneMapped={false} />
      </mesh>
      {[-0.3, 0.3].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.7, 0]}>
            <boxGeometry args={[0.18, 0.12, 0.2]} />
            <meshStandardMaterial {...iron} color="#2d3138" />
          </mesh>
          <mesh position={[x * 1.07, 0.46, 0]}>
            <boxGeometry args={[0.1, 0.36, 0.1]} />
            <meshStandardMaterial {...iron} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.82, 0]}>
        <boxGeometry args={[0.17, 0.14, 0.17]} />
        <meshStandardMaterial {...iron} color="#2d3138" />
      </mesh>
      <mesh position={[0, 0.83, 0.088]}>
        <boxGeometry args={[0.12, 0.025, 0.01]} />
        <meshStandardMaterial color={EMBER} emissive={EMBER} emissiveIntensity={4} toneMapped={false} />
      </mesh>
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
    </group>
      {fight && (
        <mesh ref={ring} position={[0.45, 0.03, 0.55]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.28, 0.34, 28]} />
          <meshBasicMaterial color={EMBER} transparent opacity={0} toneMapped={false} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

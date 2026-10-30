"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

type V3 = [number, number, number];

const GLOW = "#34e0c0";
const EMBER = "#ff9a3c";

/** Veylorn-style hooded dark-fantasy knight. Procedural placeholder for a GLB. */
export function AshenWarden({ position }: { position: V3 }) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime;
    ref.current.position.y = position[1] + Math.sin(t * 1.6) * 0.008;
    ref.current.rotation.y = -0.6 + Math.sin(t * 0.4) * 0.15;
  });

  return (
    <group ref={ref} position={position} scale={1.1}>
      {[-0.07, 0.07].map((x) => (
        <mesh key={x} position={[x, 0.15, 0]}>
          <cylinderGeometry args={[0.05, 0.045, 0.3, 8]} />
          <meshStandardMaterial color="#1a1c20" metalness={0.6} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[0.28, 0.3, 0.18]} />
        <meshStandardMaterial color="#2b2f36" metalness={0.7} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.38, -0.07]} scale={[1, 1, 0.55]}>
        <coneGeometry args={[0.3, 0.72, 10, 1, true]} />
        <meshStandardMaterial color="#14161a" roughness={1} side={2} />
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
      <group position={[0.24, 0.42, 0.05]} rotation={[0.1, 0, -0.08]}>
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
    </group>
  );
}

/** Stonebound-style iron golem. Procedural placeholder for a GLB. */
export function IronSentinel({ position }: { position: V3 }) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 1.1) * 0.006;
  });

  const iron = { color: "#3a3f47", metalness: 0.85, roughness: 0.4 } as const;

  return (
    <group ref={ref} position={position} rotation={[0, 0.7, 0]} scale={1.15}>
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
      <group position={[0.42, 0.3, 0.05]}>
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
  );
}

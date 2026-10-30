"use client";

import type { ReactElement } from "react";

type V3 = [number, number, number];

export function Tree({ position, scale = 1 }: { position: V3; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.03, 0.045, 0.15, 6]} />
        <meshStandardMaterial color="#2b1f17" />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <coneGeometry args={[0.19, 0.38, 7]} />
        <meshStandardMaterial color="#1b3326" emissive="#0c5a4c" emissiveIntensity={0.18} flatShading />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <coneGeometry args={[0.14, 0.32, 7]} />
        <meshStandardMaterial color="#1f3b2b" emissive="#0c5a4c" emissiveIntensity={0.18} flatShading />
      </mesh>
    </group>
  );
}

export function Mountain({ position, scale = 1 }: { position: V3; scale?: number }) {
  const r = 0.34 * scale;
  const h = 0.95 * scale;
  return (
    <group position={position}>
      <mesh position={[0, h / 2, 0]}>
        <coneGeometry args={[r, h, 5]} />
        <meshStandardMaterial color="#4a4f58" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0, h * 0.85, 0]}>
        <coneGeometry args={[r * 0.3, h * 0.3, 5]} />
        <meshStandardMaterial color="#cfd6de" roughness={0.8} flatShading />
      </mesh>
    </group>
  );
}

export function Crystal({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.2, 0]} scale={[0.6, 1.4, 0.6]}>
        <octahedronGeometry args={[0.16]} />
        <meshStandardMaterial color="#2de2c0" emissive="#17e0b5" emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0.3, 0]} color="#2de2c0" intensity={2.5} distance={3.5} />
    </group>
  );
}

export function House({ position, rotation = 0, scale = 1.35 }: { position: V3; rotation?: number; scale?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh position={[0, 0.11, 0]}>
        <boxGeometry args={[0.3, 0.22, 0.25]} />
        <meshStandardMaterial color="#5b4637" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.32, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.27, 0.22, 4]} />
        <meshStandardMaterial color="#2f3646" roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0.06, 0.12, 0.126]}>
        <boxGeometry args={[0.07, 0.07, 0.01]} />
        <meshStandardMaterial color="#ffb347" emissive="#ff9a2e" emissiveIntensity={2.5} toneMapped={false} />
      </mesh>
    </group>
  );
}

export function Tower({ position }: { position: V3 }) {
  return (
    <group position={position} scale={1.5}>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.34, 0.7, 0.34]} />
        <meshStandardMaterial color="#3d3a3a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.9, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[0.3, 0.45, 4]} />
        <meshStandardMaterial color="#232834" roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0, 0.55, 0.176]}>
        <boxGeometry args={[0.07, 0.14, 0.01]} />
        <meshStandardMaterial color="#ffb347" emissive="#ff9a2e" emissiveIntensity={3} toneMapped={false} />
      </mesh>
      <mesh position={[0.2, 0.75, 0]}>
        <boxGeometry args={[0.02, 0.28, 0.14]} />
        <meshStandardMaterial color="#14402f" emissive="#0b5a40" emissiveIntensity={0.4} />
      </mesh>
      <pointLight position={[0, 0.6, 0.4]} color="#ffa64d" intensity={5} distance={5} />
    </group>
  );
}

export function Wheat({ position }: { position: V3 }) {
  const rows: ReactElement[] = [];
  for (let i = -2; i <= 2; i++) {
    rows.push(
      <mesh key={i} position={[i * 0.14, 0.04, 0]}>
        <boxGeometry args={[0.08, 0.08, 0.7]} />
        <meshStandardMaterial color="#b08a2e" emissive="#6b4f10" emissiveIntensity={0.25} />
      </mesh>,
    );
  }
  return <group position={position}>{rows}</group>;
}

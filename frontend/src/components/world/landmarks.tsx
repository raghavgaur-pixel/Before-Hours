"use client";

import { Billboard } from "@react-three/drei";

type V3 = [number, number, number];

/** Wooden bridge laid across the river (river runs roughly along z). */
export function Bridge({ position }: { position: V3 }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[2.5, 0.07, 0.34]} />
        <meshStandardMaterial color="#4a3426" roughness={0.95} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, 0.16, s * 0.16]}>
          <boxGeometry args={[2.4, 0.04, 0.03]} />
          <meshStandardMaterial color="#35261c" roughness={0.95} />
        </mesh>
      ))}
      {[-1.1, -0.4, 0.4, 1.1].flatMap((x) =>
        [-1, 1].map((s) => (
          <mesh key={`${x}${s}`} position={[x, 0.11, s * 0.16]}>
            <boxGeometry args={[0.04, 0.14, 0.04]} />
            <meshStandardMaterial color="#35261c" roughness={0.95} />
          </mesh>
        )),
      )}
    </group>
  );
}

export type MarkerKind = "wood" | "stone" | "grain" | "mine";

const MARKER_COLOR: Record<MarkerKind, string> = {
  wood: "#c98a3b",
  stone: "#cfd6de",
  grain: "#e0b843",
  mine: "#b9a27a",
};

/** Floating resource marker: a gold ring around a small icon, always facing the camera. */
export function ResourceMarker({ position, kind }: { position: V3; kind: MarkerKind }) {
  const c = MARKER_COLOR[kind];
  return (
    <Billboard position={position} scale={0.6}>
      <mesh>
        <circleGeometry args={[0.24, 24]} />
        <meshBasicMaterial color="#0b0d10" transparent opacity={0.85} />
      </mesh>
      <mesh position={[0, 0, 0.001]}>
        <ringGeometry args={[0.22, 0.26, 28]} />
        <meshBasicMaterial color="#c9a24b" toneMapped={false} />
      </mesh>
      {kind === "wood" && (
        <mesh position={[0, 0, 0.002]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[0.05, 0.16, 4, 8]} />
          <meshBasicMaterial color={c} />
        </mesh>
      )}
      {kind === "stone" && (
        <mesh position={[0, 0, 0.002]}>
          <dodecahedronGeometry args={[0.1]} />
          <meshBasicMaterial color={c} />
        </mesh>
      )}
      {kind === "grain" && (
        <mesh position={[0, 0, 0.002]}>
          <coneGeometry args={[0.07, 0.22, 6]} />
          <meshBasicMaterial color={c} />
        </mesh>
      )}
      {kind === "mine" && (
        <mesh position={[0, 0, 0.002]} rotation={[0, 0, 0.6]}>
          <boxGeometry args={[0.24, 0.05, 0.02]} />
          <meshBasicMaterial color={c} />
        </mesh>
      )}
    </Billboard>
  );
}

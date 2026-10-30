"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { InstancedMesh, Mesh, MeshBasicMaterial, Object3D } from "three";
import { engine } from "./battleEngine";
import { groundAt } from "./terrain";

type Fx = { color: string; n: number; dur: number; up: number; spread: number; size: number };

/** Look of each kind of death: ash for husks, embers for raiders, gold for the boss, spirit motes for heroes. */
const FX: Record<string, Fx> = {
  zombie: { color: "#c9cbb0", n: 18, dur: 1.6, up: 1.0, spread: 0.55, size: 0.05 },
  villain: { color: "#ffb347", n: 18, dur: 1.5, up: 1.2, spread: 0.65, size: 0.05 },
  monster: { color: "#ff5a3a", n: 28, dur: 1.9, up: 1.5, spread: 1.0, size: 0.07 },
  hero: { color: "#9be0ff", n: 20, dur: 2.3, up: 0.9, spread: 0.45, size: 0.045 },
  dismiss: { color: "#8a8f8a", n: 8, dur: 1.0, up: 0.5, spread: 0.4, size: 0.04 },
  boss: { color: "#ffd24a", n: 48, dur: 3.2, up: 2.8, spread: 2.4, size: 0.13 },
};

const SLOTS = 8;
const MAX = 48;
const seeded = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const dummy = new Object3D();

function Slot({ index }: { index: number }) {
  const mesh = useRef<InstancedMesh>(null);
  const ring = useRef<Mesh>(null);
  const beam = useRef<Mesh>(null);

  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    const recent = engine.deaths.slice(-SLOTS);
    const d = recent[index];
    const fx = d ? FX[d.kind] ?? FX.zombie : null;
    const age = d ? engine.now - d.t : 99;
    const on = !!d && !!fx && age >= 0 && age < fx.dur;
    m.visible = on;
    if (ring.current) ring.current.visible = on && d.big;
    if (beam.current) beam.current.visible = on && d.big;
    if (!on || !d || !fx) return;

    const oy = groundAt(d.x, d.z) + (d.big ? 1.2 : 0.3);
    (m.material as MeshBasicMaterial).color.set(fx.color);
    const life = 1 - age / fx.dur;
    for (let j = 0; j < MAX; j++) {
      if (j >= fx.n) {
        dummy.scale.setScalar(0);
      } else {
        const a = seeded(j, index + 1) * Math.PI * 2;
        const sp = fx.spread * (0.35 + seeded(j, 3));
        const h = fx.up * (0.3 + seeded(j, 5));
        dummy.position.set(d.x + Math.cos(a) * sp * age, oy + h * age - 0.35 * age * age, d.z + Math.sin(a) * sp * age);
        dummy.rotation.set(age * 3 + j, age * 2, 0);
        dummy.scale.setScalar(Math.max(0.001, fx.size * life * (0.6 + seeded(j, 7))));
      }
      dummy.updateMatrix();
      m.setMatrixAt(j, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;

    if (d.big) {
      const k = Math.min(1, age / 1.2);
      if (ring.current) {
        ring.current.position.set(d.x, groundAt(d.x, d.z) + 0.05, d.z);
        ring.current.scale.setScalar(0.5 + k * 7);
        (ring.current.material as MeshBasicMaterial).opacity = Math.max(0, 1 - k) * 0.85;
      }
      if (beam.current) {
        beam.current.position.set(d.x, groundAt(d.x, d.z) + 4, d.z);
        (beam.current.material as MeshBasicMaterial).opacity = Math.max(0, 1 - age / 2.2) * 0.4;
      }
    }
  });

  return (
    <>
      <instancedMesh ref={mesh} args={[undefined, undefined, MAX]} frustumCulled={false} visible={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#fff" toneMapped={false} />
      </instancedMesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[0.9, 1, 40]} />
        <meshBasicMaterial color="#ffd24a" transparent opacity={0} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh ref={beam} visible={false}>
        <cylinderGeometry args={[0.7, 0.7, 8, 24, 1, true]} />
        <meshBasicMaterial color="#ffe28a" transparent opacity={0} toneMapped={false} depthWrite={false} side={2} />
      </mesh>
    </>
  );
}

export function DeathFx() {
  return (
    <>
      {Array.from({ length: SLOTS }, (_, i) => (
        <Slot key={i} index={i} />
      ))}
    </>
  );
}

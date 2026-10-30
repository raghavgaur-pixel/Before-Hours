"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh, MeshBasicMaterial } from "three";
import { engine, type HeroId } from "./battleEngine";

/** Golden rings and a rising pillar of light around both heroes when the party levels up. */
function Burst({ hero }: { hero: HeroId }) {
  const g = useRef<Group>(null);
  const rings = useRef<(Mesh | null)[]>([]);
  const pillar = useRef<Mesh>(null);
  useFrame(() => {
    const grp = g.current;
    if (!grp) return;
    const age = engine.now - engine.prog.levelUpAt;
    grp.visible = age >= 0 && age < 1.6;
    if (!grp.visible) return;
    const me = engine.pos[hero];
    grp.position.set(me.x, me.y, me.z);
    rings.current.forEach((r, i) => {
      if (!r) return;
      const a = Math.max(0, age - i * 0.18);
      r.position.y = a * 1.3;
      r.scale.setScalar(0.5 + a * 0.5);
      (r.material as MeshBasicMaterial).opacity = Math.max(0, 1 - a / 1.1) * 0.9;
    });
    if (pillar.current) {
      pillar.current.scale.set(1, 1, 1);
      (pillar.current.material as MeshBasicMaterial).opacity = Math.max(0, 1 - age / 1.6) * 0.35;
    }
  });
  return (
    <group ref={g} visible={false}>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            rings.current[i] = el;
          }}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.35, 0.42, 28]} />
          <meshBasicMaterial color="#ffd24a" transparent opacity={0} toneMapped={false} depthWrite={false} />
        </mesh>
      ))}
      <mesh ref={pillar} position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 2.4, 20, 1, true]} />
        <meshBasicMaterial color="#ffe28a" transparent opacity={0} toneMapped={false} depthWrite={false} side={2} />
      </mesh>
    </group>
  );
}

export function LevelUpFx() {
  return (
    <>
      <Burst hero="warden" />
      <Burst hero="sentinel" />
    </>
  );
}

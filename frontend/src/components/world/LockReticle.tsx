"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { engine } from "./battleEngine";
import { groundAt } from "./terrain";

/** Red ring over the enemy you are locked on to. */
export function LockReticle() {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const t = engine.p.lock && engine.p.target ? engine.enemies[engine.p.target] : null;
    g.visible = !!t?.alive;
    if (!t) return;
    g.position.set(t.x, groundAt(t.x, t.z) + t.chestY * 1.55 + 0.35 + Math.sin(clock.elapsedTime * 4) * 0.04, t.z);
    g.rotation.y = clock.elapsedTime * 1.5;
  });
  return (
    <group ref={ref} visible={false}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.16, 0.012, 6, 4]} />
        <meshBasicMaterial color="#ff5a3a" toneMapped={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, Math.PI / 4]}>
        <torusGeometry args={[0.16, 0.012, 6, 4]} />
        <meshBasicMaterial color="#ff5a3a" toneMapped={false} />
      </mesh>
    </group>
  );
}

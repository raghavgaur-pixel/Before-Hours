"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Group, Mesh, MeshBasicMaterial, Vector3 } from "three";
import { TIMELINE, engine, hitFlash, type Actor } from "./battleEngine";

type V3 = [number, number, number];

/** Flies a projectile along a timeline of launches. Reads the battle engine each frame. */
function useFlight(
  actor: "warden" | "sentinel",
  kind: "staff" | "bow" | "cannon",
  from: V3,
  to: V3,
  arc: number,
  refs: React.MutableRefObject<(Group | null)[]>,
) {
  const tmp = useRef(new Vector3());
  const dest = useRef(new Vector3(...to));
  useFrame(() => {
    const tl = TIMELINE[kind];
    const an = engine.anim[actor];
    refs.current.forEach((g, i) => {
      if (!g) return;
      const live = an && an.kind === kind;
      const u = live ? (engine.now - an.start - (tl.launches?.[i] ?? 0)) / (tl.flight ?? 0.4) : -1;
      if (u < 0 || u > 1) {
        g.visible = false;
        return;
      }
      g.visible = true;
      tmp.current.set(...from).lerp(dest.current, u);
      tmp.current.y += Math.sin(u * Math.PI) * arc;
      g.position.copy(tmp.current);
      g.lookAt(to[0], to[1], to[2]);
    });
  });
}

/** Ranged attacks: arcane bolts, arrow, cannon shell. Also the burst flashes on impact. */
export function Projectiles({
  boltFrom,
  arrowFrom,
  shellFrom,
  target,
}: {
  boltFrom: V3;
  arrowFrom: V3;
  shellFrom: V3;
  target: V3;
}) {
  const bolts = useRef<(Group | null)[]>([]);
  const arrow = useRef<(Group | null)[]>([]);
  const shell = useRef<(Group | null)[]>([]);
  const burst = useRef<Mesh>(null);

  useFlight("warden", "staff", boltFrom, target, 0.12, bolts);
  useFlight("warden", "bow", arrowFrom, target, 0.05, arrow);
  useFlight("sentinel", "cannon", shellFrom, target, 0.9, shell);

  useFrame(() => {
    if (!burst.current) return;
    const h = hitFlash("monster", 9);
    burst.current.scale.setScalar(0.01 + h * 0.8);
    (burst.current.material as MeshBasicMaterial).opacity = h * 0.7;
  });

  return (
    <>
      {[0, 1, 2].map((i) => (
        <group key={i} ref={(el) => void (bolts.current[i] = el)} visible={false}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <capsuleGeometry args={[0.018, 0.2, 4, 8]} />
            <meshBasicMaterial color="#aaf5e8" toneMapped={false} />
          </mesh>
          <pointLight color="#34e0c0" intensity={1.5} distance={1.6} />
        </group>
      ))}
      <group ref={(el) => void (arrow.current[0] = el)} visible={false}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.45, 5]} />
          <meshBasicMaterial color="#d6fff6" toneMapped={false} />
        </mesh>
        <pointLight color="#34e0c0" intensity={1.2} distance={1.4} />
      </group>
      <group ref={(el) => void (shell.current[0] = el)} visible={false}>
        <mesh>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshBasicMaterial color="#ffb060" toneMapped={false} />
        </mesh>
        <pointLight color="#ff9a3c" intensity={2} distance={2.2} />
      </group>
      <mesh ref={burst} position={target}>
        <sphereGeometry args={[0.5, 14, 14]} />
        <meshBasicMaterial color="#ffd9a0" transparent opacity={0} toneMapped={false} depthWrite={false} />
      </mesh>
    </>
  );
}

const SHARDS = 14;
const seeded = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

/** Flying shards on every hit, coloured by the attacker. Fed by `engine.impacts`. */
export function ImpactSparks({ positions }: { positions: Record<Actor, V3> }) {
  const group = useRef<Group>(null);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const recent = engine.impacts.slice(-4);
    g.children.forEach((slot, si) => {
      const imp = recent[si];
      const age = imp ? engine.now - imp.t : 99;
      slot.visible = !!imp && age < 0.7;
      if (!slot.visible || !imp) return;
      const [px, py, pz] = positions[imp.target];
      slot.position.set(px, py, pz);
      slot.children.forEach((m, i) => {
        const mesh = m as Mesh;
        const a = seeded(i, si + Math.floor(imp.t * 7)) * Math.PI * 2;
        const sp = (0.5 + seeded(i, 3) * 1.2) * (0.7 + imp.power * 0.5);
        const up = 0.8 + seeded(i, 5) * 1.4;
        mesh.position.set(Math.cos(a) * sp * age, up * age - 3.2 * age * age, Math.sin(a) * sp * age);
        mesh.scale.setScalar(Math.max(0.01, (1 - age / 0.7) * (0.6 + imp.power * 0.4)));
        (mesh.material as MeshBasicMaterial).color.set(imp.color);
      });
    });
  });
  return (
    <group ref={group}>
      {[0, 1, 2, 3].map((s) => (
        <group key={s} visible={false}>
          {Array.from({ length: SHARDS }, (_, i) => (
            <mesh key={i}>
              <boxGeometry args={[0.04, 0.04, 0.04]} />
              <meshBasicMaterial color="#fff" toneMapped={false} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

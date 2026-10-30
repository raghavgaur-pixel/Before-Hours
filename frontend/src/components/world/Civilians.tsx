"use client";

import { Billboard } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import { engine } from "./battleEngine";
import { MONSTER_XZ, groundAt } from "./terrain";

type Pt = [number, number];

export type CivilianKind = "villager" | "farmer" | "guard" | "washer" | "shepherd" | "child";

const ROBE: Record<CivilianKind, string> = {
  villager: "#5a4a3a",
  farmer: "#6b5b3a",
  guard: "#3a4250",
  washer: "#6a3f3f",
  shepherd: "#4b4a3a",
  child: "#7a5f45",
};

const SKIN = "#c9a98a";

/** Doorways and corners on the far side of the village, away from the monster. */
const HIDE_POINTS: Pt[] = [
  [-0.2, 0.8], [0.5, -0.9], [-1.8, -0.6], [1.1, -1.6], [-2.3, 1.2],
  [2.5, -0.3], [-1.3, 1.6], [0.1, -1.6], [-3.2, 0.9], [-0.9, -1.4],
];

const safeHides = HIDE_POINTS.filter(([x, z]) => Math.hypot(x - MONSTER_XZ[0], z - MONSTER_XZ[1]) > 3.2);

function pickHide(from: Pt, avoid?: number) {
  let idx = 0;
  for (let tries = 0; tries < 8; tries++) {
    idx = Math.floor(Math.random() * safeHides.length);
    if (idx !== avoid && Math.hypot(safeHides[idx][0] - from[0], safeHides[idx][1] - from[1]) > 0.8) break;
  }
  return idx;
}

/**
 * A villager. While the monster lives they bolt between hiding places, arms
 * flailing, then cower and tremble; guards hold their ground. When the beast
 * is dead they return to their normal route or post.
 */
export function Civilian({
  kind,
  route,
  speed = 0.25,
  pingPong = false,
  facing = 0,
  phase = 0,
  scale = 1,
}: {
  kind: CivilianKind;
  route: Pt[];
  speed?: number;
  pingPong?: boolean;
  facing?: number;
  phase?: number;
  scale?: number;
}) {
  const root = useRef<Group>(null);
  const lean = useRef<Group>(null);
  const armL = useRef<Group>(null);
  const armR = useRef<Group>(null);
  const bang = useRef<Group>(null);
  const st = useRef({ x: route[0][0], z: route[0][1], s: 0, hide: -1, dwellUntil: 0, yaw: facing, fleeing: false });

  const path = useMemo(() => {
    const pts = route;
    const closed = route.length > 2 && !pingPong ? [...pts, pts[0]] : pts;
    const segs: { a: Pt; b: Pt; len: number; start: number }[] = [];
    let total = 0;
    for (let i = 0; i < closed.length - 1; i++) {
      const a = closed[i];
      const b = closed[i + 1];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      segs.push({ a, b, len, start: total });
      total += len;
    }
    return { segs, total };
  }, [route, pingPong]);

  useFrame(({ clock }, delta) => {
    const g = root.current;
    if (!g) return;
    const dt = Math.min(delta, 0.05);
    const t = clock.elapsedTime + phase;
    const s = st.current;
    const brave = kind === "guard";
    const fleeing = engine.panic > 0.55 && !brave;

    let tx = s.x;
    let tz = s.z;
    let moveSpeed = 0;
    let mode: "idle" | "walk" | "run" | "cower" = "idle";

    if (fleeing) {
      if (!s.fleeing) {
        s.fleeing = true;
        s.hide = pickHide([s.x, s.z]);
        s.dwellUntil = 0;
      }
      const [hx, hz] = safeHides[s.hide];
      const d = Math.hypot(hx - s.x, hz - s.z);
      if (d > 0.1) {
        tx = hx;
        tz = hz;
        moveSpeed = (kind === "child" ? 1.35 : 1.1) * (0.85 + engine.panic * 0.3);
        mode = "run";
      } else {
        mode = "cower";
        if (s.dwellUntil === 0) s.dwellUntil = t + 2 + Math.random() * 2.5;
        if (t > s.dwellUntil) {
          s.hide = pickHide([s.x, s.z], s.hide);
          s.dwellUntil = 0;
        }
      }
    } else {
      s.fleeing = false;
      if (path.total > 0) {
        s.s += speed * dt;
        let q = s.s;
        if (pingPong) {
          const m = q % (path.total * 2);
          q = m > path.total ? path.total * 2 - m : m;
        } else q = q % path.total;
        const sg = path.segs.find((k) => q >= k.start && q <= k.start + k.len) ?? path.segs[0];
        const u = sg.len > 0 ? (q - sg.start) / sg.len : 0;
        tx = sg.a[0] + (sg.b[0] - sg.a[0]) * u;
        tz = sg.a[1] + (sg.b[1] - sg.a[1]) * u;
        const d = Math.hypot(tx - s.x, tz - s.z);
        moveSpeed = d > 0.15 ? Math.max(0.5, speed * 1.5) : speed;
        mode = "walk";
      } else {
        tx = route[0][0];
        tz = route[0][1];
        const d = Math.hypot(tx - s.x, tz - s.z);
        if (d > 0.05) {
          moveSpeed = 0.6;
          mode = "walk";
        }
      }
    }

    const dx = tx - s.x;
    const dz = tz - s.z;
    const dist = Math.hypot(dx, dz);
    if (dist > 0.001 && moveSpeed > 0) {
      const step = Math.min(dist, moveSpeed * dt);
      let nx = dx / dist;
      let nz = dz / dist;
      if (mode === "run") {
        const sway = Math.sin(t * 9) * 0.45;
        const px = -nz * sway;
        const pz = nx * sway;
        nx += px;
        nz += pz;
      }
      s.x += nx * step;
      s.z += nz * step;
      s.yaw = Math.atan2(nx, nz);
    } else if (brave && engine.panic > 0.55) {
      s.yaw = Math.atan2(MONSTER_XZ[0] - s.x, MONSTER_XZ[1] - s.z);
    } else if (!fleeing && path.total === 0) {
      s.yaw = facing;
    }

    const ground = groundAt(s.x, s.z);
    const gait = Math.sin(t * (mode === "run" ? 15 : 7));
    g.position.set(s.x, ground + (mode === "run" ? Math.abs(gait) * 0.04 : mode === "walk" ? Math.abs(gait) * 0.012 : 0), s.z);
    g.rotation.y = s.yaw;

    const l = lean.current;
    if (l) {
      l.rotation.x = mode === "run" ? 0.3 : mode === "cower" ? 0.35 : 0;
      l.scale.y = mode === "cower" ? 0.78 : 1;
      l.position.x = mode === "cower" ? Math.sin(t * 35) * 0.006 : 0;
    }
    if (armL.current && armR.current) {
      if (mode === "run") {
        armL.current.rotation.set(-0.5, 0, -2.0 + Math.sin(t * 15) * 0.8);
        armR.current.rotation.set(-0.5, 0, 2.0 - Math.sin(t * 15 + 1) * 0.8);
      } else if (mode === "cower") {
        armL.current.rotation.set(-0.5, 0, -2.5);
        armR.current.rotation.set(-0.5, 0, 2.5);
      } else if (brave && engine.panic > 0.55) {
        armL.current.rotation.set(-1.2, 0, 0);
        armR.current.rotation.set(-1.2, 0, 0);
      } else {
        const sw = mode === "walk" ? gait * 0.7 : Math.sin(t * 1.2) * 0.05;
        armL.current.rotation.set(sw, 0, 0);
        armR.current.rotation.set(kind === "guard" || kind === "shepherd" ? 0 : -sw, 0, 0);
      }
    }
    if (bang.current) bang.current.visible = mode === "run" || mode === "cower";
  });

  const robe = ROBE[kind];

  return (
    <group ref={root} scale={scale * (kind === "child" ? 0.65 : 1)}>
      <group ref={lean}>
        <mesh position={[0, 0.14, 0]}>
          <coneGeometry args={[0.095, 0.28, 8]} />
          <meshStandardMaterial color={robe} roughness={1} />
        </mesh>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.05, 0.08, 0.12, 8]} />
          <meshStandardMaterial color={robe} roughness={1} />
        </mesh>
        <mesh position={[0, 0.4, 0]}>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshStandardMaterial color={SKIN} roughness={0.9} />
        </mesh>

        {kind === "farmer" && (
          <mesh position={[0, 0.44, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.012, 12]} />
            <meshStandardMaterial color="#a88b4a" roughness={1} />
          </mesh>
        )}
        {(kind === "villager" || kind === "washer" || kind === "shepherd") && (
          <mesh position={[0, 0.42, -0.012]}>
            <coneGeometry args={[0.058, 0.09, 8]} />
            <meshStandardMaterial color={robe} roughness={1} />
          </mesh>
        )}
        {kind === "guard" && (
          <mesh position={[0, 0.425, 0]}>
            <sphereGeometry args={[0.05, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#4a4f58" metalness={0.8} roughness={0.4} />
          </mesh>
        )}

        {[-1, 1].map((sd) => (
          <group key={sd} ref={sd === -1 ? armL : armR} position={[sd * 0.07, 0.34, 0]}>
            <mesh position={[0, -0.07, 0]}>
              <cylinderGeometry args={[0.014, 0.012, 0.15, 5]} />
              <meshStandardMaterial color={robe} roughness={1} />
            </mesh>
          </group>
        ))}

        {kind === "guard" && (
          <mesh position={[0.09, 0.3, 0.02]}>
            <cylinderGeometry args={[0.008, 0.008, 0.62, 5]} />
            <meshStandardMaterial color="#3a2b20" roughness={1} />
          </mesh>
        )}
        {kind === "shepherd" && (
          <mesh position={[0.1, 0.25, 0.03]} rotation={[0, 0, -0.1]}>
            <cylinderGeometry args={[0.008, 0.008, 0.5, 5]} />
            <meshStandardMaterial color="#4a3829" roughness={1} />
          </mesh>
        )}
        {kind === "farmer" && (
          <group position={[0.1, 0.22, 0.04]} rotation={[0.15, 0, 0]}>
            <mesh>
              <cylinderGeometry args={[0.007, 0.007, 0.5, 5]} />
              <meshStandardMaterial color="#4a3829" roughness={1} />
            </mesh>
            {[-0.025, 0, 0.025].map((x) => (
              <mesh key={x} position={[x, 0.27, 0]}>
                <cylinderGeometry args={[0.004, 0.004, 0.08, 4]} />
                <meshStandardMaterial color="#8a8d92" metalness={0.8} roughness={0.4} />
              </mesh>
            ))}
          </group>
        )}
        {kind === "washer" && (
          <mesh position={[0.1, 0.1, 0.05]}>
            <cylinderGeometry args={[0.04, 0.032, 0.07, 8]} />
            <meshStandardMaterial color="#5a4630" roughness={1} />
          </mesh>
        )}
      </group>

      {/* "!" over the head while panicking. */}
      <Billboard position={[0, 0.62, 0]}>
        <group ref={bang} visible={false}>
          <mesh position={[0, 0.03, 0]}>
            <capsuleGeometry args={[0.012, 0.045, 3, 6]} />
            <meshBasicMaterial color="#ffd23c" toneMapped={false} />
          </mesh>
          <mesh position={[0, -0.03, 0]}>
            <sphereGeometry args={[0.014, 6, 6]} />
            <meshBasicMaterial color="#ffd23c" toneMapped={false} />
          </mesh>
        </group>
      </Billboard>
    </group>
  );
}

export const CIVILIANS: {
  kind: CivilianKind;
  route: Pt[];
  speed?: number;
  pingPong?: boolean;
  facing?: number;
  scale?: number;
}[] = [
  { kind: "villager", route: [[0.9, 0.9], [-0.9, 1.05], [-1.0, -0.4], [0.9, -0.3]], speed: 0.22 },
  { kind: "villager", route: [[-1.6, 2.5], [-0.4, 2.1], [0.9, 2.2]], speed: 0.2, pingPong: true },
  { kind: "villager", route: [[1.9, -0.6], [1.2, 0.5], [2.3, 0.7]], speed: 0.18 },
  { kind: "villager", route: [[2.5, 1.85]], facing: 0.5 },
  { kind: "villager", route: [[2.75, 2.1]], facing: 0.8, scale: 0.95 },
  { kind: "farmer", route: [[0.35, 4.25], [1.35, 4.8]], speed: 0.12, pingPong: true },
  { kind: "farmer", route: [[1.3, 4.2], [0.4, 4.8]], speed: 0.1, pingPong: true },
  { kind: "washer", route: [[-0.85, -1.0]], facing: 2.6 },
  { kind: "shepherd", route: [[-1.55, 3.0]], facing: -1.6 },
  { kind: "guard", route: [[2.1, 0.2]], facing: 1.4 },
  { kind: "guard", route: [[-2.0, -0.2]], facing: -1.6 },
  { kind: "child", route: [[-0.5, -0.5], [-0.3, -1.1], [-0.9, -1.2], [-1.1, -0.6]], speed: 0.35 },
  { kind: "villager", route: [[2.3, 2.15]], facing: 0.3, scale: 0.7 },
];

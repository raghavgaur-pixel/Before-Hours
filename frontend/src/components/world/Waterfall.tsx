"use client";

import { Sparkles } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import { CanvasTexture, MeshBasicMaterial, RepeatWrapping, type Mesh } from "three";
import { useRef } from "react";
import { TILES, mulberry32 } from "./terrain";

/** Vertical streaks that scroll downward: the body of the falling water. */
function makeStreaks() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 256;
  const ctx = c.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, c.width, c.height);
    const r = mulberry32(5);
    for (let i = 0; i < 46; i++) {
      const x = r() * c.width;
      const w = 2 + r() * 7;
      const y = r() * c.height;
      const h = 40 + r() * 150;
      const grad = ctx.createLinearGradient(0, y, 0, y + h);
      grad.addColorStop(0, "rgba(255,255,255,0)");
      grad.addColorStop(0.5, `rgba(205,240,255,${0.5 + r() * 0.5})`);
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);
      ctx.fillRect(x, y - c.height, w, h); // wrap seam
    }
  }
  const tex = new CanvasTexture(c);
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(1, 1.4);
  return tex;
}

const scroll = (t: CanvasTexture, d: number) => {
  t.offset.y -= d;
};

/** A waterfall where the river leaves the northern mountains, spilling into the first river tile. */
export function Waterfall() {
  const spot = useMemo(() => {
    const water = TILES.filter((t) => t.terrain === "water");
    return water.sort((a, b) => a.z - b.z)[0];
  }, []);
  const tex = useMemo(() => makeStreaks(), []);
  const slow = useMemo(() => makeStreaks(), []);
  const foam = useRef<Mesh>(null);

  useFrame(({ clock }, delta) => {
    scroll(tex, delta * 0.9);
    scroll(slow, delta * 0.55);
    if (foam.current) {
      const k = 1 + Math.sin(clock.elapsedTime * 3) * 0.08;
      foam.current.scale.set(k, k, 1);
      (foam.current.material as MeshBasicMaterial).opacity = 0.35 + Math.sin(clock.elapsedTime * 2.2) * 0.1;
    }
  });

  if (!spot) return null;
  const H = 2.2;
  const base = spot.height;
  const z0 = spot.z - 0.55;

  return (
    <group position={[spot.x, 0, z0]}>
      {/* The cliff the water pours over. */}
      <mesh position={[0, base + H / 2 - 0.05, -0.55]}>
        <boxGeometry args={[2.2, H, 0.9]} />
        <meshStandardMaterial color="#3b3d42" roughness={1} flatShading />
      </mesh>
      <mesh position={[0, base + H - 0.05, -0.25]}>
        <boxGeometry args={[1.5, 0.12, 0.5]} />
        <meshStandardMaterial color="#2d2f34" roughness={1} />
      </mesh>

      {/* Two sheets scrolling at different speeds read as moving water. */}
      <mesh position={[0, base + H / 2, -0.06]}>
        <planeGeometry args={[1.05, H]} />
        <meshBasicMaterial map={tex} color="#9fe6ff" transparent opacity={0.9} blending={2} depthWrite={false} toneMapped={false} side={2} />
      </mesh>
      <mesh position={[0, base + H / 2, -0.02]}>
        <planeGeometry args={[0.8, H * 0.96]} />
        <meshBasicMaterial map={slow} color="#e8fbff" transparent opacity={0.55} blending={2} depthWrite={false} toneMapped={false} side={2} />
      </mesh>

      {/* Plunge pool: foam ring and spray. */}
      <mesh ref={foam} position={[0, base + 0.02, 0.35]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.75, 28]} />
        <meshBasicMaterial color="#d8f6ff" transparent opacity={0.35} depthWrite={false} toneMapped={false} />
      </mesh>
      <Sparkles count={36} scale={[1.4, 1.1, 0.8]} position={[0, base + 0.6, 0.15]} size={4} speed={0.7} color="#e8fbff" opacity={0.8} />
      <pointLight position={[0, base + 0.6, 0.6]} color="#7fd8ee" intensity={2.2} distance={4} />
    </group>
  );
}

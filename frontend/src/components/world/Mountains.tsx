"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  IcosahedronGeometry,
  InstancedMesh,
  Object3D,
} from "three";
import { MAP_RADIUS, TILES, mulberry32 } from "./terrain";

const VARIANTS = 3;

/** Jagged rock massif with snow near the top, coloured per vertex. */
function makeRock(seed: number): BufferGeometry {
  const g = new IcosahedronGeometry(0.5, 2);
  const pos = g.attributes.position;
  const colors: number[] = [];
  const rock = new Color("#5f584f");
  const dark = new Color("#33353b");
  const snow = new Color("#aeb8c2");
  const c = new Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const j =
      1 +
      0.3 * Math.sin(x * 9.1 + seed) * Math.cos(z * 8.3 + seed * 1.3) +
      0.18 * Math.sin(y * 7.7 + seed * 0.7);
    const taper = 1 - Math.max(0, y + 0.1) * 0.85;
    const nx = x * j * taper * 1.15;
    const nz = z * j * taper * 1.15;
    const ny = (y + 0.5) * 1.9 * (0.9 + 0.2 * Math.sin(x * 5 + z * 6 + seed));
    pos.setXYZ(i, nx, ny, nz);

    const n = 0.5 + 0.5 * Math.sin(nx * 11 + ny * 5 + seed);
    c.copy(rock).lerp(dark, n * 0.7 + (1 - ny / 1.9) * 0.25);
    const snowLine = 1.5 + 0.14 * Math.sin(nx * 13 + nz * 11 + seed);
    if (ny > snowLine) c.lerp(snow, Math.min(1, (ny - snowLine) * 3));
    colors.push(c.r, c.g, c.b);
  }
  g.setAttribute("color", new Float32BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

type Peak = { x: number; y: number; z: number; w: number; h: number; rot: number };

function buildPeaks(): Peak[][] {
  const lists: Peak[][] = Array.from({ length: VARIANTS }, () => []);
  let k = 0;
  for (const t of TILES) {
    if (t.terrain !== "mountain") continue;
    const rand = mulberry32(t.seed + 99);
    const edge = t.ring >= MAP_RADIUS - 2;
    const n = edge ? 3 + Math.floor(rand() * 2) : 2 + Math.floor(rand() * 2);
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2;
      const d = Math.sqrt(rand()) * 0.6;
      const base = edge ? 1.15 : 0.8;
      lists[k++ % VARIANTS].push({
        x: t.x + Math.cos(a) * d,
        z: t.z + Math.sin(a) * d,
        y: t.height - 0.1,
        w: (0.8 + rand() * 0.8) * (edge ? 1.15 : 1),
        h: base * (0.8 + rand() * 1.1),
        rot: rand() * 6.28,
      });
    }
  }
  return lists;
}

function PeakSet({ geometry, peaks }: { geometry: BufferGeometry; peaks: Peak[] }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new Object3D();
    peaks.forEach((p, i) => {
      o.position.set(p.x, p.y, p.z);
      o.rotation.set(0, p.rot, 0);
      o.scale.set(p.w, p.h, p.w);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [peaks]);

  return (
    <instancedMesh ref={ref} args={[geometry, undefined, peaks.length]}>
      <meshStandardMaterial vertexColors flatShading roughness={1} />
    </instancedMesh>
  );
}

export function Mountains() {
  const geos = useMemo(() => [11, 47, 83].map((s) => makeRock(s)), []);
  const peaks = useMemo(() => buildPeaks(), []);
  return (
    <>
      {geos.map((g, i) => (
        <PeakSet key={i} geometry={g} peaks={peaks[i]} />
      ))}
    </>
  );
}

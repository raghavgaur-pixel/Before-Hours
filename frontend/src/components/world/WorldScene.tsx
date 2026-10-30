"use client";

import { OrbitControls, Sparkles } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { Color, InstancedMesh, Object3D } from "three";
import { AshenWarden, IronSentinel } from "./Characters";
import { Bridge, ResourceMarker } from "./landmarks";
import { Mountains } from "./Mountains";
import { Crystal, House, Tower, Wheat } from "./props";
import {
  HEX_SIZE,
  MAP_RADIUS,
  TILES,
  Terrain,
  Tile,
  mulberry32,
} from "./terrain";

const TILE_COLOR: Record<Terrain, string> = {
  village: "#58613b",
  grass: "#415531",
  farm: "#68622f",
  forest: "#2f4527",
  mountain: "#34353a",
  water: "#1d6c78",
};

type V3 = [number, number, number];
type TreeSpec = { x: number; y: number; z: number; s: number; rot: number; hue: number };

function scatter(rand: () => number, spread = 0.7): [number, number] {
  const a = rand() * Math.PI * 2;
  const d = Math.sqrt(rand()) * spread;
  return [Math.cos(a) * d, Math.sin(a) * d];
}

function buildTrees(): TreeSpec[] {
  const out: TreeSpec[] = [];
  for (const t of TILES) {
    const rand = mulberry32(t.seed + 7);
    let n = 0;
    if (t.terrain === "forest") n = 12 + Math.floor(rand() * 7);
    else if (t.terrain === "grass") n = rand() < 0.5 ? 1 + Math.floor(rand() * 3) : 0;
    else if (t.terrain === "mountain" && t.ring < MAP_RADIUS - 2) n = Math.floor(rand() * 4);
    for (let i = 0; i < n; i++) {
      const [dx, dz] = scatter(rand, 0.75);
      out.push({
        x: t.x + dx,
        z: t.z + dz,
        y: t.height,
        s: 0.5 + rand() * 0.55,
        rot: rand() * 6,
        hue: rand(),
      });
    }
  }
  return out;
}

/** All trees drawn as three instanced meshes so dense forests stay cheap. */
function Forest() {
  const trees = useMemo(() => buildTrees(), []);
  const trunk = useRef<InstancedMesh>(null);
  const low = useRef<InstancedMesh>(null);
  const high = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const o = new Object3D();
    const c = new Color();
    trees.forEach((t, i) => {
      const place = (mesh: InstancedMesh | null, lift: number, tint: boolean) => {
        if (!mesh) return;
        o.position.set(t.x, t.y + lift * t.s, t.z);
        o.scale.setScalar(t.s);
        o.rotation.set(0, t.rot, 0);
        o.updateMatrix();
        mesh.setMatrixAt(i, o.matrix);
        if (tint) {
          c.setHSL(0.3 + t.hue * 0.1, 0.4, 0.09 + t.hue * 0.07);
          mesh.setColorAt(i, c);
        }
      };
      place(trunk.current, 0.07, false);
      place(low.current, 0.3, true);
      place(high.current, 0.5, true);
    });
    for (const m of [trunk.current, low.current, high.current]) {
      if (!m) continue;
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }, [trees]);

  return (
    <>
      <instancedMesh ref={trunk} args={[undefined, undefined, trees.length]}>
        <cylinderGeometry args={[0.03, 0.045, 0.15, 5]} />
        <meshStandardMaterial color="#2b1f17" />
      </instancedMesh>
      <instancedMesh ref={low} args={[undefined, undefined, trees.length]}>
        <coneGeometry args={[0.19, 0.38, 6]} />
        <meshStandardMaterial emissive="#0c5a4c" emissiveIntensity={0.08} flatShading />
      </instancedMesh>
      <instancedMesh ref={high} args={[undefined, undefined, trees.length]}>
        <coneGeometry args={[0.14, 0.32, 6]} />
        <meshStandardMaterial emissive="#0c5a4c" emissiveIntensity={0.08} flatShading />
      </instancedMesh>
    </>
  );
}

function Decor({ tile }: { tile: Tile }) {
  const top = tile.height;
  const items = useMemo(() => {
    const rand = mulberry32(tile.seed);
    const out: React.ReactElement[] = [];
    if (tile.terrain === "mountain") {
      if (rand() < 0.3) {
        const [dx, dz] = scatter(rand, 0.5);
        out.push(<Crystal key="c" position={[dx, top, dz]} />);
      }
    } else if (tile.terrain === "farm") {
      out.push(<Wheat key="w" position={[0, top, 0]} />);
    } else if (tile.terrain === "village") {
      if (tile.ring === 0) {
        out.push(<Tower key="tower" position={[0, top, 0]} />);
        out.push(<House key="h1" position={[0.42, top, 0.25]} rotation={0.4} />);
        out.push(<House key="h2" position={[-0.4, top, 0.3]} rotation={-0.5} />);
        out.push(<House key="h3" position={[0.1, top, -0.5]} rotation={1.2} />);
      } else if (tile.ring === 1) {
        const n = 3 + Math.floor(rand() * 2);
        for (let i = 0; i < n; i++) {
          const [dx, dz] = scatter(rand, 0.55);
          out.push(<House key={i} position={[dx, top, dz]} rotation={rand() * 6} />);
        }
      } else {
        for (let i = 0; i < 4; i++) {
          const [dx, dz] = scatter(rand, 0.5);
          out.push(<House key={i} position={[dx, top, dz]} rotation={rand() * 6} />);
        }
        out.push(
          <pointLight key="l" position={[0, top + 0.4, 0]} color="#ffa64d" intensity={4} distance={4} />,
        );
      }
    }
    return out;
  }, [tile, top]);

  return <>{items}</>;
}

function HexTile({
  tile,
  selected,
  onSelect,
}: {
  tile: Tile;
  selected: boolean;
  onSelect: (t: Tile) => void;
}) {
  const isWater = tile.terrain === "water";
  return (
    <group
      position={[tile.x, 0, tile.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(tile);
      }}
    >
      <mesh position={[0, tile.height / 2, 0]}>
        <cylinderGeometry args={[HEX_SIZE * 0.99, HEX_SIZE * 0.99, tile.height, 6]} />
        <meshStandardMaterial
          color={TILE_COLOR[tile.terrain]}
          roughness={isWater ? 0.2 : 0.95}
          metalness={isWater ? 0.4 : 0}
          emissive={isWater ? "#12626c" : "#000000"}
          emissiveIntensity={isWater ? 0.55 : 0}
        />
      </mesh>
      {tile.terrain !== "mountain" && (
        <mesh position={[0, tile.height + 0.004, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 6]}>
          <ringGeometry args={[HEX_SIZE * 0.95, HEX_SIZE * 0.99, 6]} />
          <meshBasicMaterial color="#9aab86" transparent opacity={0.16} depthWrite={false} />
        </mesh>
      )}
      {selected && (
        <mesh position={[0, tile.height + 0.01, 0]}>
          <cylinderGeometry args={[HEX_SIZE * 0.99, HEX_SIZE * 0.99, 0.02, 6]} />
          <meshStandardMaterial
            color="#c9a24b"
            emissive="#c9a24b"
            emissiveIntensity={1.5}
            transparent
            opacity={0.55}
            toneMapped={false}
          />
        </mesh>
      )}
      <Decor tile={tile} />
    </group>
  );
}

const pick = (pred: (t: Tile) => boolean) => TILES.filter(pred).sort((a, b) => a.ring - b.ring)[0];

export function WorldScene({
  selected,
  onSelect,
  onClear,
}: {
  selected: Tile | null;
  onSelect: (t: Tile) => void;
  onClear: () => void;
}) {
  const standY = TILES.find((t) => t.terrain === "village")?.height ?? 0.3;
  const wardenPos: V3 = [1.55, standY, 0.95];
  const sentinelPos: V3 = [-1.45, standY, 0.9];

  const { bridges, markers } = useMemo(() => {
    const water = (zTarget: number) =>
      TILES.filter((t) => t.terrain === "water" && t.ring <= 6)
        .sort((a, b) => Math.abs(a.z - zTarget) - Math.abs(b.z - zTarget))[0];
    const bridgeTiles = [water(-3), water(3)].filter(Boolean) as Tile[];
    const m: { tile: Tile | undefined; kind: "wood" | "stone" | "grain" | "mine" }[] = [
      { tile: pick((t) => t.terrain === "forest" && t.x < -2 && t.ring >= 3), kind: "wood" },
      { tile: pick((t) => t.terrain === "mountain" && t.x > 1 && t.z < -3 && t.ring >= 4), kind: "stone" },
      { tile: pick((t) => t.terrain === "farm"), kind: "grain" },
      { tile: pick((t) => t.terrain === "mountain" && t.x > 1 && t.z > 3 && t.ring >= 4), kind: "mine" },
    ];
    return { bridges: bridgeTiles, markers: m };
  }, []);

  return (
    <Canvas camera={{ position: [0, 17, 15], fov: 38 }} dpr={[1, 2]} onPointerMissed={onClear}>
      <color attach="background" args={["#0a0e12"]} />
      <fog attach="fog" args={["#0a0e12", 20, 42]} />

      <ambientLight intensity={0.5} color="#8fa0b8" />
      <directionalLight position={[-9, 14, 8]} intensity={1.9} color="#d3dcf5" />
      <directionalLight position={[10, 6, -6]} intensity={0.5} color="#4f8f9c" />
      <hemisphereLight args={["#5d7a90", "#1d2418", 0.5]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[MAP_RADIUS * 2.4, 48]} />
        <meshStandardMaterial color="#0a0c10" roughness={1} />
      </mesh>

      {TILES.map((t) => (
        <HexTile
          key={`${t.q},${t.r}`}
          tile={t}
          selected={selected?.q === t.q && selected?.r === t.r}
          onSelect={onSelect}
        />
      ))}

      <Forest />
      <Mountains />

      {bridges.map((t) => (
        <Bridge key={`${t.q},${t.r}`} position={[t.x, 0.3, t.z]} />
      ))}

      {markers.map(
        (m) =>
          m.tile && (
            <ResourceMarker
              key={m.kind}
              kind={m.kind}
              position={[m.tile.x, m.tile.height + 0.9, m.tile.z]}
            />
          ),
      )}

      <AshenWarden position={wardenPos} />
      <IronSentinel position={sentinelPos} />

      <Sparkles count={140} scale={[22, 5, 22]} position={[0, 2, 0]} size={3} speed={0.3} color="#2de2c0" opacity={0.6} />

      <OrbitControls
        target={[0, 0, 1]}
        minDistance={6}
        maxDistance={30}
        maxPolarAngle={Math.PI / 2.2}
        enableDamping
      />
    </Canvas>
  );
}

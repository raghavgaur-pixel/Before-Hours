"use client";

import { OrbitControls, Sparkles } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import { AshenWarden, IronSentinel } from "./Characters";
import { Crystal, House, Mountain, Tower, Tree, Wheat } from "./props";
import {
  HEX_SIZE,
  MAP_RADIUS,
  Terrain,
  Tile,
  generateTiles,
  mulberry32,
} from "./terrain";

const TILE_COLOR: Record<Terrain, string> = {
  village: "#3c4a2c",
  grass: "#364a28",
  farm: "#4a4a28",
  forest: "#2a3b25",
  mountain: "#3b3f46",
  water: "#1d5a63",
};

type V3 = [number, number, number];

function scatter(rand: () => number, spread = 0.62): [number, number] {
  const a = rand() * Math.PI * 2;
  const d = Math.sqrt(rand()) * spread;
  return [Math.cos(a) * d, Math.sin(a) * d];
}

function Decor({ tile }: { tile: Tile }) {
  const top = tile.height;
  const items = useMemo(() => {
    const rand = mulberry32(tile.seed);
    const out: React.ReactElement[] = [];
    if (tile.terrain === "forest") {
      const n = 3 + Math.floor(rand() * 3);
      for (let i = 0; i < n; i++) {
        const [dx, dz] = scatter(rand);
        out.push(<Tree key={i} position={[dx, top, dz]} scale={0.8 + rand() * 0.6} />);
      }
    } else if (tile.terrain === "mountain") {
      const n = 1 + Math.floor(rand() * 2);
      for (let i = 0; i < n; i++) {
        const [dx, dz] = scatter(rand, 0.35);
        out.push(<Mountain key={i} position={[dx, top, dz]} scale={0.8 + rand() * 1.0} />);
      }
      if (rand() < 0.22) {
        const [dx, dz] = scatter(rand, 0.5);
        out.push(<Crystal key="c" position={[dx, top, dz]} />);
      }
    } else if (tile.terrain === "grass" && rand() < 0.3) {
      const [dx, dz] = scatter(rand);
      out.push(<Tree key="t" position={[dx, top, dz]} scale={0.7} />);
    } else if (tile.terrain === "farm") {
      out.push(<Wheat key="w" position={[0, top, 0]} />);
    } else if (tile.terrain === "village") {
      if (tile.ring === 0) {
        out.push(<Tower key="tower" position={[0, top, 0]} />);
        out.push(<House key="h1" position={[0.42, top, 0.25]} rotation={0.4} />);
        out.push(<House key="h2" position={[-0.4, top, 0.3]} rotation={-0.5} />);
        out.push(<House key="h3" position={[0.1, top, -0.5]} rotation={1.2} />);
      } else {
        const n = 2 + Math.floor(rand() * 2);
        for (let i = 0; i < n; i++) {
          const [dx, dz] = scatter(rand, 0.5);
          out.push(<House key={i} position={[dx, top, dz]} rotation={rand() * 6} />);
        }
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
        <cylinderGeometry args={[HEX_SIZE * 0.98, HEX_SIZE * 0.98, tile.height, 6]} />
        <meshStandardMaterial
          color={TILE_COLOR[tile.terrain]}
          roughness={isWater ? 0.2 : 0.95}
          metalness={isWater ? 0.4 : 0}
          emissive={isWater ? "#0b4a52" : "#000000"}
          emissiveIntensity={isWater ? 0.6 : 0}
        />
      </mesh>
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

export function WorldScene({
  selected,
  onSelect,
  onClear,
}: {
  selected: Tile | null;
  onSelect: (t: Tile) => void;
  onClear: () => void;
}) {
  const tiles = useMemo(() => generateTiles(), []);
  const topAt = (t: Terrain) => tiles.find((x) => x.terrain === t)?.height ?? 0.3;
  const standY = topAt("village");
  const wardenPos: V3 = [1.55, standY, 0.95];
  const sentinelPos: V3 = [-1.45, standY, 0.9];

  return (
    <Canvas
      camera={{ position: [9, 9, 11], fov: 40 }}
      dpr={[1, 2]}
      onPointerMissed={onClear}
    >
      <color attach="background" args={["#090c10"]} />
      <fog attach="fog" args={["#090c10", 14, 36]} />

      <ambientLight intensity={0.7} color="#8aa0c8" />
      <directionalLight position={[-8, 12, 6]} intensity={1.5} color="#9db4ff" />
      <hemisphereLight args={["#4a6a8a", "#0b0d10", 0.5]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[MAP_RADIUS * 2.2, 48]} />
        <meshStandardMaterial color="#0c0f13" roughness={1} />
      </mesh>

      {tiles.map((t) => (
        <HexTile
          key={`${t.q},${t.r}`}
          tile={t}
          selected={selected?.q === t.q && selected?.r === t.r}
          onSelect={onSelect}
        />
      ))}

      <AshenWarden position={wardenPos} />
      <IronSentinel position={sentinelPos} />

      <Sparkles count={90} scale={[16, 4, 16]} position={[0, 1.8, 0]} size={3} speed={0.3} color="#2de2c0" opacity={0.6} />

      <OrbitControls
        target={[0, 0.3, 0]}
        minDistance={5}
        maxDistance={22}
        maxPolarAngle={Math.PI / 2.2}
        enableDamping
      />
    </Canvas>
  );
}

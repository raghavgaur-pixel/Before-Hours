export type Terrain = "village" | "grass" | "forest" | "mountain" | "water" | "farm";

export type Tile = {
  q: number;
  r: number;
  x: number;
  z: number;
  terrain: Terrain;
  height: number;
  ring: number;
  seed: number;
};

export const HEX_SIZE = 1;
export const MAP_RADIUS = 7;

const hash = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

const smooth = (t: number) => t * t * (3 - 2 * t);

function valueNoise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const u = smooth(x - xi);
  const v = smooth(y - yi);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const TERRAIN_HEIGHT: Record<Terrain, number> = {
  village: 0.3,
  grass: 0.3,
  farm: 0.3,
  forest: 0.3,
  water: 0.1,
  mountain: 0.4,
};

export function generateTiles(radius = MAP_RADIUS): Tile[] {
  const tiles: Tile[] = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      const ring = (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
      if (ring > radius) continue;

      const x = HEX_SIZE * Math.sqrt(3) * (q + r / 2);
      const z = HEX_SIZE * 1.5 * r;
      const n = valueNoise(x * 0.35 + 10, z * 0.35 + 10);
      const riverCentre = 4.2 + 2 * Math.sin(z * 0.45);
      const isRiver = ring > 2 && Math.abs(x - riverCentre) < 1.05;

      let terrain: Terrain = "grass";
      if (ring <= 1) terrain = "village";
      else if (q === -1 && r === 3) terrain = "farm";
      else if (isRiver && ring < radius) terrain = "water";
      else if (ring >= radius - 1 || n > 0.66) terrain = "mountain";
      else if (n > 0.42) terrain = "forest";

      const base = TERRAIN_HEIGHT[terrain];
      const height = terrain === "mountain" ? base + n * 0.25 : base;
      tiles.push({ q, r, x, z, terrain, height, ring, seed: (q + 20) * 97 + (r + 20) * 31 });
    }
  }
  return tiles;
}

export const TERRAIN_LABEL: Record<Terrain, string> = {
  village: "Settlement grounds",
  grass: "Meadow",
  farm: "Farmland",
  forest: "Darkwood",
  mountain: "Ashen peaks",
  water: "River",
};

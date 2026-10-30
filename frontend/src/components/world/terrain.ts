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
export const MAP_RADIUS = 9;

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

export const BATTLE = { x: 0.2, z: 3.1 };
export const WARDEN_XZ: [number, number] = [BATTLE.x - 0.95, BATTLE.z - 0.25];
export const SENTINEL_XZ: [number, number] = [BATTLE.x - 0.5, BATTLE.z + 0.8];
export const MONSTER_XZ: [number, number] = [BATTLE.x + 1.35, BATTLE.z];
export const PEN = { x: -2.6, z: 3.0 };
export const GRAVEYARD = { x: -3.9, z: -0.9 };
export const CLEARINGS = [
  { ...BATTLE, r: 2.2 },
  { ...PEN, r: 1.6 },
  { ...GRAVEYARD, r: 1.4 },
];

export function inClearing(x: number, z: number, pad = 0) {
  return CLEARINGS.some((c) => Math.hypot(x - c.x, z - c.z) < c.r + pad);
}

export function generateTiles(radius = MAP_RADIUS): Tile[] {
  const tiles: Tile[] = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      const ring = (Math.abs(q) + Math.abs(r) + Math.abs(q + r)) / 2;
      if (ring > radius) continue;

      const x = HEX_SIZE * Math.sqrt(3) * (q + r / 2);
      const z = HEX_SIZE * 1.5 * r;
      const n = valueNoise(x * 0.35 + 10, z * 0.35 + 10);
      const riverCentre = 3.4 + 2.2 * Math.sin(z * 0.38);
      const isRiver = ring > 2 && Math.abs(x - riverCentre) < 1.15;

      let terrain: Terrain = "grass";
      if (ring <= 1) terrain = "village";
      else if (q === -1 && r === 3) terrain = "farm";
      else if (isRiver && ring < radius) terrain = "water";
      else if (ring >= radius - 1 || (ring >= radius - 2 && n > 0.34) || (ring >= radius - 3 && n > 0.52) || n > 0.76) terrain = "mountain";
      else if (n > 0.36) terrain = "forest";

      const base = TERRAIN_HEIGHT[terrain];
      const height =
        terrain === "mountain"
          ? base + 0.1 + n * 0.45 + (ring >= radius - 2 ? 0.2 : 0)
          : terrain === "water"
            ? base
            : base + (n - 0.4) * 0.12;
      tiles.push({ q, r, x, z, terrain, height, ring, seed: (q + 20) * 97 + (r + 20) * 31 });
    }
  }
  // Open ground for the battle, the cattle pen and the graveyard.
  for (const c of CLEARINGS) {
    for (const t of tiles) {
      if (Math.hypot(t.x - c.x, t.z - c.z) < 1.2 && (t.terrain === "forest" || t.terrain === "mountain")) {
        t.terrain = "grass";
        t.height = TERRAIN_HEIGHT.grass;
      }
    }
  }

  // Two outlying hamlets, like the east and west settlements in the concept art.
  const hamlet = (pred: (t: Tile) => boolean) => {
    const c = tiles
      .filter((t) => (t.terrain === "grass" || t.terrain === "forest") && pred(t))
      .sort((a, b) => a.ring - b.ring)[0];
    if (c) {
      c.terrain = "village";
      c.height = TERRAIN_HEIGHT.village;
    }
  };
  hamlet((t) => t.x > 5.2 && Math.abs(t.z) < 3 && t.ring >= 4);
  hamlet((t) => t.x < -4.5 && t.z > -1 && t.z < 5 && t.ring >= 4);
  return tiles;
}

export const TILES = generateTiles();

export function nearestTile(x: number, z: number) {
  let best = TILES[0];
  let bd = Infinity;
  for (const t of TILES) {
    const d = (t.x - x) ** 2 + (t.z - z) ** 2;
    if (d < bd) {
      bd = d;
      best = t;
    }
  }
  return best;
}

/** Height of the terrain under a world position (nearest tile top). */
export const groundAt = (x: number, z: number) => nearestTile(x, z).height;

/** River tiles carrying the two bridges. */
export const BRIDGE_TILES = [-3, 3]
  .map((zTarget) =>
    TILES.filter((t) => t.terrain === "water" && t.ring <= 6).sort(
      (a, b) => Math.abs(a.z - zTarget) - Math.abs(b.z - zTarget),
    )[0],
  )
  .filter(Boolean);

/** Can a character stand here? Mountains and open water are blocked; bridges are fine. */
export function isWalkable(x: number, z: number) {
  const t = nearestTile(x, z);
  if (t.terrain === "mountain") return false;
  if (t.terrain === "water") return BRIDGE_TILES.some((b) => Math.hypot(b.x - x, b.z - z) < 1.3 && Math.abs(z - b.z) < 0.5);
  return Math.hypot(x, z) < 11;
}

export type Interactable = { id: string; x: number; z: number; r: number; label: string };

export const INTERACTABLES: Interactable[] = [
  { id: "bonfire", x: BATTLE.x - 1.9, z: BATTLE.z + 1.0, r: 1.4, label: "Rest at the bonfire" },
  { id: "well", x: -1.0, z: -1.15, r: 1.2, label: "Drink from the well" },
  { id: "pen", x: PEN.x, z: PEN.z, r: 1.7, label: "Calm the cattle" },
  { id: "grave", x: GRAVEYARD.x, z: GRAVEYARD.z, r: 1.6, label: "Pay your respects" },
];
export const TERRAIN_LABEL: Record<Terrain, string> = {
  village: "Settlement grounds",
  grass: "Meadow",
  farm: "Farmland",
  forest: "Darkwood",
  mountain: "Ashen peaks",
  water: "River",
};

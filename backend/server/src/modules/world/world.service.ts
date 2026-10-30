import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../auth/auth.service.js";
import { JoinWorldInput } from "./world.schema.js";

// ── Helpers ─────────────────────────────────────────────────────────────────

function tileType(x: number, y: number): string {
  // Deterministic pseudo-terrain based on position
  const n = Math.abs(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);
  const v = n - Math.floor(n);
  if (v < 0.05) return "water";
  if (v < 0.20) return "mountain";
  if (v < 0.45) return "forest";
  if (v < 0.55) return "ruins";
  return "plains";
}

// ── Service ──────────────────────────────────────────────────────────────────

export class WorldService {
  /** List all active worlds with player counts */
  async listWorlds() {
    const worlds = await prisma.world.findMany({
      where: { status: { not: "maintenance" } },
      include: { _count: { select: { players: true } } },
      orderBy: { createdAt: "asc" },
    });

    return worlds.map((w) => ({
      id: w.id,
      name: w.name,
      description: w.description,
      status: w.status,
      playerCount: w._count.players,
      maxPlayers: w.maxPlayers,
      mapWidth: w.mapWidth,
      mapHeight: w.mapHeight,
    }));
  }

  /** Get a single world */
  async getWorld(worldId: string) {
    const world = await prisma.world.findUnique({
      where: { id: worldId },
      include: { _count: { select: { players: true } } },
    });

    if (!world) throw new HttpError(404, "World not found");

    return {
      id: world.id,
      name: world.name,
      description: world.description,
      status: world.status,
      playerCount: world._count.players,
      maxPlayers: world.maxPlayers,
      mapWidth: world.mapWidth,
      mapHeight: world.mapHeight,
    };
  }

  /** Return all tiles for a world (map overview) */
  async getWorldMap(worldId: string) {
    const world = await prisma.world.findUnique({ where: { id: worldId } });
    if (!world) throw new HttpError(404, "World not found");

    const tiles = await prisma.tile.findMany({
      where: { worldId },
      orderBy: [{ y: "asc" }, { x: "asc" }],
    });

    return tiles.map((t) => ({
      x: t.x,
      y: t.y,
      type: t.type,
      hasFeature: t.hasFeature,
      feature: t.feature,
    }));
  }

  /** Get a single tile */
  async getTile(worldId: string, x: number, y: number) {
    const tile = await prisma.tile.findUnique({
      where: { worldId_x_y: { worldId, x, y } },
    });
    if (!tile) throw new HttpError(404, "Tile not found");
    return tile;
  }

  /** Join a world — creates WorldPlayer and starting Settlement */
  async joinWorld(userId: string, worldId: string, input: JoinWorldInput) {
    const world = await prisma.world.findUnique({
      where: { id: worldId },
      include: { _count: { select: { players: true } } },
    });
    if (!world) throw new HttpError(404, "World not found");
    if (world.status === "maintenance") throw new HttpError(403, "World is under maintenance");
    if (world._count.players >= world.maxPlayers) throw new HttpError(409, "World is full");

    const alreadyJoined = await prisma.worldPlayer.findUnique({
      where: { worldId_userId: { worldId, userId } },
    });
    if (alreadyJoined) throw new HttpError(409, "You have already joined this world");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new HttpError(404, "User not found");

    // Find a free tile for the settlement
    const existingTiles = await prisma.tile.findMany({
      where: { worldId },
      select: { x: true, y: true },
    });
    const occupied = new Set(existingTiles.map((t) => `${t.x},${t.y}`));

    let tileX = 0, tileY = 0, found = false;
    for (let y = 0; y < world.mapHeight && !found; y++) {
      for (let x = 0; x < world.mapWidth && !found; x++) {
        const type = tileType(x, y);
        if (type !== "water" && type !== "mountain" && !occupied.has(`${x},${y}`)) {
          tileX = x;
          tileY = y;
          found = true;
        }
      }
    }
    if (!found) throw new HttpError(503, "No available tiles in this world");

    const settlementName = input.settlementName ?? `${user.username}'s Stronghold`;

    const [worldPlayer] = await prisma.$transaction([
      prisma.worldPlayer.create({ data: { worldId, userId } }),
      prisma.tile.upsert({
        where: { worldId_x_y: { worldId, x: tileX, y: tileY } },
        create: { worldId, x: tileX, y: tileY, type: "plains", hasFeature: false },
        update: { hasFeature: true, feature: "settlement" },
      }),
      prisma.settlement.upsert({
        where: { userId },
        create: {
          userId,
          worldId,
          name: settlementName,
          tileX,
          tileY,
          wood: 100,
          stone: 100,
          food: 100,
          iron: 50,
        },
        update: {
          worldId,
          name: settlementName,
          tileX,
          tileY,
        },
      }),
    ]);

    return {
      worldId,
      tileX,
      tileY,
      settlementName,
    };
  }

  /** Get all worlds a player has joined */
  async getPlayerWorlds(userId: string) {
    const entries = await prisma.worldPlayer.findMany({
      where: { userId },
      include: {
        world: { include: { _count: { select: { players: true } } } },
      },
      orderBy: { joinedAt: "desc" },
    });

    return entries.map((e) => ({
      joinedAt: e.joinedAt,
      world: {
        id: e.world.id,
        name: e.world.name,
        description: e.world.description,
        status: e.world.status,
        playerCount: e.world._count.players,
        maxPlayers: e.world.maxPlayers,
      },
    }));
  }

  /** Ensure default world exists (called at server startup) */
  async seedDefaultWorld() {
    const existing = await prisma.world.findFirst();
    if (existing) return existing;

    return prisma.world.create({
      data: {
        name: "Erebon",
        description:
          "The first continent — scarred by ancient war and ripe for reclamation.",
        maxPlayers: 500,
        mapWidth: 64,
        mapHeight: 64,
      },
    });
  }
}

export const worldService = new WorldService();


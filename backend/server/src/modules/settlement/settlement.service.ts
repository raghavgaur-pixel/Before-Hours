import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../auth/auth.service.js";

// ── Building Type Catalog ─────────────────────────────────────────────────────

const DEFAULT_BUILDING_TYPES = [
  {
    key: "sawmill",
    name: "Sawmill",
    description: "Produces wood over time. Each level increases output.",
    category: "production",
    maxLevel: 5,
    baseCostWood: 50,
    baseCostStone: 20,
    baseCostFood: 0,
    baseCostIron: 0,
    buildTimeSeconds: 60,
  },
  {
    key: "quarry",
    name: "Quarry",
    description: "Extracts stone from the earth. Essential for construction.",
    category: "production",
    maxLevel: 5,
    baseCostWood: 30,
    baseCostStone: 0,
    baseCostFood: 10,
    baseCostIron: 10,
    buildTimeSeconds: 90,
  },
  {
    key: "farm",
    name: "Farm",
    description: "Grows food to sustain your population and workers.",
    category: "production",
    maxLevel: 5,
    baseCostWood: 40,
    baseCostStone: 10,
    baseCostFood: 0,
    baseCostIron: 0,
    buildTimeSeconds: 45,
  },
  {
    key: "forge",
    name: "Forge",
    description: "Smelts iron into refined metal for advanced construction.",
    category: "production",
    maxLevel: 5,
    baseCostWood: 60,
    baseCostStone: 80,
    baseCostFood: 0,
    baseCostIron: 20,
    buildTimeSeconds: 180,
  },
  {
    key: "barracks",
    name: "Barracks",
    description: "Trains and houses soldiers to defend your settlement.",
    category: "military",
    maxLevel: 5,
    baseCostWood: 80,
    baseCostStone: 60,
    baseCostFood: 30,
    baseCostIron: 20,
    buildTimeSeconds: 300,
  },
  {
    key: "watchtower",
    name: "Watchtower",
    description: "Expands vision range and warns of incoming threats.",
    category: "military",
    maxLevel: 3,
    baseCostWood: 60,
    baseCostStone: 40,
    baseCostFood: 0,
    baseCostIron: 10,
    buildTimeSeconds: 120,
  },
  {
    key: "town_hall",
    name: "Town Hall",
    description: "The heart of your settlement. Unlocks advanced structures.",
    category: "civic",
    maxLevel: 5,
    baseCostWood: 100,
    baseCostStone: 100,
    baseCostFood: 50,
    baseCostIron: 50,
    buildTimeSeconds: 600,
  },
  {
    key: "storehouse",
    name: "Storehouse",
    description: "Increases resource storage capacity.",
    category: "civic",
    maxLevel: 5,
    baseCostWood: 70,
    baseCostStone: 30,
    baseCostFood: 0,
    baseCostIron: 0,
    buildTimeSeconds: 90,
  },
];

// ── Service ───────────────────────────────────────────────────────────────────

export class SettlementService {
  /** Get settlement overview for the authenticated user */
  async getMySettlement(userId: string) {
    const settlement = await prisma.settlement.findUnique({
      where: { userId },
      include: {
        buildings: { include: { buildingType: true } },
      },
    });
    if (!settlement) throw new HttpError(404, "You do not have a settlement yet. Join a world first.");
    return settlement;
  }

  /** Get settlement by ID (validates ownership) */
  async getSettlementById(userId: string, settlementId: string) {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      include: {
        buildings: { include: { buildingType: true } },
      },
    });
    if (!settlement) throw new HttpError(404, "Settlement not found");
    if (settlement.userId !== userId) throw new HttpError(403, "Access denied");
    return settlement;
  }

  /** Get inventory (resource snapshot) */
  async getInventory(userId: string, settlementId: string) {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      select: { userId: true, wood: true, stone: true, food: true, iron: true, updatedAt: true },
    });
    if (!settlement) throw new HttpError(404, "Settlement not found");
    if (settlement.userId !== userId) throw new HttpError(403, "Access denied");

    return {
      resources: {
        wood: settlement.wood,
        stone: settlement.stone,
        food: settlement.food,
        iron: settlement.iron,
      },
      lastUpdated: settlement.updatedAt,
    };
  }

  /** Get buildings in a settlement */
  async getBuildings(userId: string, settlementId: string) {
    const settlement = await prisma.settlement.findUnique({
      where: { id: settlementId },
      select: { userId: true },
    });
    if (!settlement) throw new HttpError(404, "Settlement not found");
    if (settlement.userId !== userId) throw new HttpError(403, "Access denied");

    const buildings = await prisma.building.findMany({
      where: { settlementId },
      include: { buildingType: true },
      orderBy: { createdAt: "asc" },
    });

    return buildings.map((b) => ({
      id: b.id,
      level: b.level,
      status: b.status,
      completesAt: b.completesAt,
      buildingType: {
        key: b.buildingType.key,
        name: b.buildingType.name,
        description: b.buildingType.description,
        category: b.buildingType.category,
        maxLevel: b.buildingType.maxLevel,
      },
    }));
  }

  /** Get the full building catalog */
  async getBuildingCatalog() {
    const types = await prisma.buildingType.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return types.map((t) => ({
      id: t.id,
      key: t.key,
      name: t.name,
      description: t.description,
      category: t.category,
      maxLevel: t.maxLevel,
      buildTimeSeconds: t.buildTimeSeconds,
      baseCost: {
        wood: t.baseCostWood,
        stone: t.baseCostStone,
        food: t.baseCostFood,
        iron: t.baseCostIron,
      },
    }));
  }

  /** Seed default building types (idempotent) */
  async seedBuildingTypes() {
    for (const bt of DEFAULT_BUILDING_TYPES) {
      await prisma.buildingType.upsert({
        where: { key: bt.key },
        update: {},
        create: bt,
      });
    }
  }
}

export const settlementService = new SettlementService();


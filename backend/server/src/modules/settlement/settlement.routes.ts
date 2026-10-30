import { FastifyInstance } from "fastify";
import {
  getMySettlementHandler,
  getSettlementHandler,
  getInventoryHandler,
  getBuildingsHandler,
  getBuildingCatalogHandler,
} from "./settlement.controller.js";

export async function settlementRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] };

  // Building catalog (public so players can browse before joining)
  fastify.get("/buildings/catalog", getBuildingCatalogHandler);

  // Player's own settlement shortcut
  fastify.get("/me/settlement", auth, getMySettlementHandler);

  // Settlement by ID
  fastify.get("/settlements/:settlementId", auth, getSettlementHandler);
  fastify.get("/settlements/:settlementId/inventory", auth, getInventoryHandler);
  fastify.get("/settlements/:settlementId/buildings", auth, getBuildingsHandler);
}


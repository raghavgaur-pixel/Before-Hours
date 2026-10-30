import { FastifyReply, FastifyRequest } from "fastify";
import { settlementService } from "./settlement.service.js";

export async function getMySettlementHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = (request.user as { sub: string }).sub;
  const settlement = await settlementService.getMySettlement(userId);
  return reply.send({ success: true, settlement });
}

export async function getSettlementHandler(
  request: FastifyRequest<{ Params: { settlementId: string } }>,
  reply: FastifyReply
) {
  const userId = (request.user as { sub: string }).sub;
  const settlement = await settlementService.getSettlementById(userId, request.params.settlementId);
  return reply.send({ success: true, settlement });
}

export async function getInventoryHandler(
  request: FastifyRequest<{ Params: { settlementId: string } }>,
  reply: FastifyReply
) {
  const userId = (request.user as { sub: string }).sub;
  const inventory = await settlementService.getInventory(userId, request.params.settlementId);
  return reply.send({ success: true, ...inventory });
}

export async function getBuildingsHandler(
  request: FastifyRequest<{ Params: { settlementId: string } }>,
  reply: FastifyReply
) {
  const userId = (request.user as { sub: string }).sub;
  const buildings = await settlementService.getBuildings(userId, request.params.settlementId);
  return reply.send({ success: true, buildings });
}

export async function getBuildingCatalogHandler(_request: FastifyRequest, reply: FastifyReply) {
  const catalog = await settlementService.getBuildingCatalog();
  return reply.send({ success: true, catalog });
}


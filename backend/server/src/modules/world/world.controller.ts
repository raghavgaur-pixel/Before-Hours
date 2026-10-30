import { FastifyReply, FastifyRequest } from "fastify";
import { worldService } from "./world.service.js";
import { joinWorldSchema } from "./world.schema.js";

export async function listWorldsHandler(request: FastifyRequest, reply: FastifyReply) {
  const worlds = await worldService.listWorlds();
  return reply.send({ success: true, worlds });
}

export async function getWorldHandler(
  request: FastifyRequest<{ Params: { worldId: string } }>,
  reply: FastifyReply
) {
  const world = await worldService.getWorld(request.params.worldId);
  return reply.send({ success: true, world });
}

export async function getWorldMapHandler(
  request: FastifyRequest<{ Params: { worldId: string } }>,
  reply: FastifyReply
) {
  const tiles = await worldService.getWorldMap(request.params.worldId);
  return reply.send({ success: true, tiles });
}

export async function getTileHandler(
  request: FastifyRequest<{ Params: { worldId: string; x: string; y: string } }>,
  reply: FastifyReply
) {
  const x = parseInt(request.params.x, 10);
  const y = parseInt(request.params.y, 10);
  if (isNaN(x) || isNaN(y)) return reply.status(400).send({ message: "x and y must be integers" });
  const tile = await worldService.getTile(request.params.worldId, x, y);
  return reply.send({ success: true, tile });
}

export async function joinWorldHandler(
  request: FastifyRequest<{ Params: { worldId: string } }>,
  reply: FastifyReply
) {
  const userId = (request.user as { sub: string }).sub;
  const input = joinWorldSchema.parse(request.body);
  const result = await worldService.joinWorld(userId, request.params.worldId, input);
  return reply.status(201).send({ success: true, ...result });
}

export async function getPlayerWorldsHandler(request: FastifyRequest, reply: FastifyReply) {
  const userId = (request.user as { sub: string }).sub;
  const worlds = await worldService.getPlayerWorlds(userId);
  return reply.send({ success: true, worlds });
}


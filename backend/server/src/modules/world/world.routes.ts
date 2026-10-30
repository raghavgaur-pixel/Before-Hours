import { FastifyInstance } from "fastify";
import {
  listWorldsHandler,
  getWorldHandler,
  getWorldMapHandler,
  getTileHandler,
  joinWorldHandler,
  getPlayerWorldsHandler,
} from "./world.controller.js";

export async function worldRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] };

  // Public
  fastify.get("/", listWorldsHandler);
  fastify.get("/:worldId", getWorldHandler);

  // Authenticated
  fastify.get("/:worldId/map", auth, getWorldMapHandler);
  fastify.get("/:worldId/tiles/:x/:y", auth, getTileHandler);
  fastify.post("/:worldId/join", auth, joinWorldHandler);
}

export async function playerWorldRoutes(fastify: FastifyInstance) {
  const auth = { onRequest: [fastify.authenticate] };
  fastify.get("/me/worlds", auth, getPlayerWorldsHandler);
}


import fastify, { FastifyInstance, FastifyServerOptions } from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import cookie from "@fastify/cookie";
import { env } from "./config/env.js";
import authenticatePlugin from "./plugins/authenticate.js";
import { errorHandler } from "./plugins/error-handler.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { worldRoutes, playerWorldRoutes } from "./modules/world/world.routes.js";
import { settlementRoutes } from "./modules/settlement/settlement.routes.js";
import { worldService } from "./modules/world/world.service.js";
import { settlementService } from "./modules/settlement/settlement.service.js";
import { prisma } from "./lib/prisma.js";

export function buildApp(opts: FastifyServerOptions = {}): FastifyInstance {
  const app = fastify(opts);

  // ── Global Error Handler ──────────────────────────────────────────────────
  app.setErrorHandler(errorHandler);

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.register(cors, {
    origin: env.CORS_ORIGIN.includes(",")
      ? env.CORS_ORIGIN.split(",").map((s) => s.trim())
      : [env.CORS_ORIGIN, "http://localhost:3000"],
    credentials: true,
  });

  // ── Cookies ───────────────────────────────────────────────────────────────
  app.register(cookie);

  // ── JWT ───────────────────────────────────────────────────────────────────
  app.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: { cookieName: "token", signed: false },
  });

  // ── Auth Plugin ───────────────────────────────────────────────────────────
  app.register(authenticatePlugin);

  // ── Health Check ──────────────────────────────────────────────────────────
  app.get("/health", async () => ({
    status: "ok",
    game: "AFTERHOURS",
    timestamp: new Date().toISOString(),
  }));

  // ── Readiness Probe ───────────────────────────────────────────────────────
  app.get("/ready", async (_req, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return reply.send({ status: "ready", db: "connected" });
    } catch {
      return reply.status(503).send({ status: "not ready", db: "disconnected" });
    }
  });

  // ── Routes ────────────────────────────────────────────────────────────────
  app.register(authRoutes, { prefix: "/api/auth" });
  app.register(worldRoutes, { prefix: "/api/worlds" });
  app.register(playerWorldRoutes, { prefix: "/api" });
  app.register(settlementRoutes, { prefix: "/api" });

  // ── Seed on startup ───────────────────────────────────────────────────────
  app.addHook("onReady", async () => {
    try {
      await worldService.seedDefaultWorld();
      await settlementService.seedBuildingTypes();
      app.log.info("✅ Seed complete — default world and building types ready");
    } catch (err) {
      app.log.warn({ err }, "Seed skipped (DB may not be connected)");
    }
  });

  return app;
}

import fastify, { FastifyInstance, FastifyServerOptions } from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import cookie from "@fastify/cookie";
import { env } from "./config/env.js";
import authenticatePlugin from "./plugins/authenticate.js";
import { errorHandler } from "./plugins/error-handler.js";
import { authRoutes } from "./modules/auth/auth.routes.js";

export function buildApp(opts: FastifyServerOptions = {}): FastifyInstance {
  const app = fastify(opts);

  // Global Error Handler
  app.setErrorHandler(errorHandler);

  // CORS
  app.register(cors, {
    origin: env.CORS_ORIGIN.includes(",")
      ? env.CORS_ORIGIN.split(",").map((s) => s.trim())
      : [env.CORS_ORIGIN, "http://localhost:3000"],
    credentials: true,
  });

  // Cookies
  app.register(cookie);

  // JWT
  app.register(jwt, {
    secret: env.JWT_SECRET,
    cookie: {
      cookieName: "token",
      signed: false,
    },
  });

  // Authentication Decorator Plugin
  app.register(authenticatePlugin);

  // Health Check
  app.get("/health", async () => {
    return {
      status: "ok",
      game: "AFTERHOURS",
      timestamp: new Date().toISOString(),
    };
  });

  // Auth Routes
  app.register(authRoutes, { prefix: "/api/auth" });

  return app;
}

import { FastifyInstance } from "fastify";
import {
  registerHandler,
  loginHandler,
  logoutHandler,
  meHandler,
} from "./auth.controller.js";

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/register", registerHandler);
  fastify.post("/login", loginHandler);
  fastify.post("/logout", logoutHandler);
  fastify.get(
    "/me",
    {
      onRequest: [fastify.authenticate],
    },
    meHandler
  );
}

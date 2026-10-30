import { FastifyReply, FastifyRequest } from "fastify";
import { authService } from "./auth.service.js";
import { registerSchema, loginSchema } from "./auth.schema.js";
import { env } from "../../config/env.js";

export async function registerHandler(request: FastifyRequest, reply: FastifyReply) {
  const validated = registerSchema.parse(request.body);
  const user = await authService.register(validated);

  const token = request.server.jwt.sign(
    {
      sub: user.id,
      email: user.email,
      username: user.username,
    },
    { expiresIn: "7d" }
  );

  reply.setCookie("token", token, {
    path: "/",
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  });

  return reply.status(201).send({
    success: true,
    message: "Registration successful. Welcome to AFTERHOURS.",
    user,
    token,
  });
}

export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  const validated = loginSchema.parse(request.body);
  const user = await authService.login(validated);

  const token = request.server.jwt.sign(
    {
      sub: user.id,
      email: user.email,
      username: user.username,
    },
    { expiresIn: "7d" }
  );

  reply.setCookie("token", token, {
    path: "/",
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
  });

  return reply.status(200).send({
    success: true,
    message: "Login successful.",
    user,
    token,
  });
}

export async function logoutHandler(_request: FastifyRequest, reply: FastifyReply) {
  reply.clearCookie("token", { path: "/" });
  return reply.status(200).send({
    success: true,
    message: "Logged out successfully.",
  });
}

export async function meHandler(request: FastifyRequest, reply: FastifyReply) {
  const payload = request.user as { sub: string };
  const user = await authService.getProfile(payload.sub);

  return reply.status(200).send({
    success: true,
    user,
  });
}

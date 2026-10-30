import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";

export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
) {
  request.log.error(error);

  if (error instanceof ZodError) {
    return reply.status(400).send({
      statusCode: 400,
      error: "Bad Request",
      message: "Validation failed",
      details: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  const statusCode = (error as any).statusCode || 500;
  const message = error.message || "Internal Server Error";

  return reply.status(statusCode).send({
    statusCode,
    error: statusCode >= 500 ? "Internal Server Error" : "Client Error",
    message: statusCode >= 500 ? "An unexpected error occurred" : message,
  });
}

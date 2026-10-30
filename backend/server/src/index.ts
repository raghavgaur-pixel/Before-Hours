import { buildApp } from "./app.js";
import { env } from "./config/env.js";

const app = buildApp({
  logger: {
    level: env.NODE_ENV === "production" ? "info" : "debug",
  },
});

async function start() {
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`⚔️ AFTERHOURS Auth Backend running on http://${env.HOST}:${env.PORT}`);
    console.log(`🛡️ Health check: http://${env.HOST}:${env.PORT}/health`);
    console.log(`🔐 Auth API: http://${env.HOST}:${env.PORT}/api/auth`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();

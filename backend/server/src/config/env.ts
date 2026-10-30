import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  HOST: z.string().default("0.0.0.0"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  JWT_SECRET: z.string().default("afterhours-dark-fantasy-jwt-secret-key-change-in-prod"),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.format());
  throw new Error("Invalid environment variables");
}

function configuredValue(value?: string) {
  if (!value || value.includes("[YOUR-") || value.startsWith("your-")) {
    return undefined;
  }
  return value;
}

export const env = {
  ...parsed.data,
  DATABASE_URL: configuredValue(parsed.data.DATABASE_URL),
  DIRECT_URL: configuredValue(parsed.data.DIRECT_URL),
  SUPABASE_URL: configuredValue(parsed.data.SUPABASE_URL),
  SUPABASE_ANON_KEY: configuredValue(parsed.data.SUPABASE_ANON_KEY),
  SUPABASE_SERVICE_ROLE_KEY: configuredValue(parsed.data.SUPABASE_SERVICE_ROLE_KEY),
};

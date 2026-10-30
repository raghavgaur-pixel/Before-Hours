import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email address")
    .transform((val) => val.toLowerCase().trim()),
  username: z
    .string({ required_error: "Username is required" })
    .min(3, "Username must be at least 3 characters long")
    .max(20, "Username must not exceed 20 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username may only contain alphanumeric characters, underscores, and hyphens"
    )
    .transform((val) => val.trim()),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password must not exceed 100 characters"),
  archetype: z
    .enum(["warrior", "gunslinger", "arcanist", "battlemage"])
    .optional()
    .default("warrior"),
});

export const loginSchema = z.object({
  login: z.string().optional(),
  email: z.string().optional(),
  username: z.string().optional(),
  password: z.string({ required_error: "Password is required" }).min(1, "Password is required"),
}).refine((data) => data.login || data.email || data.username, {
  message: "Either login, email, or username must be provided",
  path: ["login"],
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

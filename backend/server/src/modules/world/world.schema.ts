import { z } from "zod";

export const joinWorldSchema = z.object({
  settlementName: z
    .string()
    .min(3, "Settlement name must be at least 3 characters")
    .max(40, "Settlement name must not exceed 40 characters")
    .regex(/^[a-zA-Z0-9 '_-]+$/, "Settlement name contains invalid characters")
    .optional(),
});

export type JoinWorldInput = z.infer<typeof joinWorldSchema>;


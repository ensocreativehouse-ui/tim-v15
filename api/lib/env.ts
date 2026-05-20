import { z } from "zod";

const envSchema = z.object({
  APP_ID: z.string(),
  APP_SECRET: z.string(),
  DATABASE_URL: z.string(),
  KIMI_AUTH_URL: z.string(),
  KIMI_OPEN_URL: z.string(),
  OWNER_UNION_ID: z.string(),
  NODE_ENV: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
});

export const env = envSchema.parse({
  APP_ID: process.env.APP_ID,
  APP_SECRET: process.env.APP_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  KIMI_AUTH_URL: process.env.KIMI_AUTH_URL,
  KIMI_OPEN_URL: process.env.KIMI_OPEN_URL,
  OWNER_UNION_ID: process.env.OWNER_UNION_ID,
  NODE_ENV: process.env.NODE_ENV,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
});

export const isProduction = env.NODE_ENV === "production";

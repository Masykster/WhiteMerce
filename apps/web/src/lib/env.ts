import { z } from "zod";
import { resolveRates, type CurrencyRateMap } from "@whitemerce/shared/money";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z
    .string()
    .min(1)
    .default("postgresql://postgres:postgres@localhost:5432/whitemerce"),
  AUTH_SECRET: z
    .string()
    .min(16)
    .default("dev-whitemerce-auth-secret-change-in-production-32chars"),
  STOREFRONT_URL: z.string().url().default("http://localhost:4321"),
  ADMIN_URL: z.string().url().default("http://localhost:3000"),
  USD_TO_IDR_RATE: z.coerce.number().positive().default(16_000),
  ENABLE_DEV_TEST_CHECKOUT: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  STRIPE_SECRET_KEY: z.string().optional().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),
});

export type AppEnv = z.infer<typeof envSchema>;

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    STOREFRONT_URL: process.env.STOREFRONT_URL,
    ADMIN_URL: process.env.ADMIN_URL,
    USD_TO_IDR_RATE: process.env.USD_TO_IDR_RATE,
    ENABLE_DEV_TEST_CHECKOUT: process.env.ENABLE_DEV_TEST_CHECKOUT,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  });

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${formatted}`);
  }

  if (
    parsed.data.NODE_ENV === "production" &&
    process.env.NEXT_PHASE !== "phase-production-build" &&
    parsed.data.AUTH_SECRET.startsWith("dev-whitemerce")
  ) {
    throw new Error("AUTH_SECRET must be set to a strong secret in production.");
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export function getCurrencyRates(): CurrencyRateMap {
  return resolveRates(getEnv().USD_TO_IDR_RATE);
}

export function isDevCheckoutAllowed(): boolean {
  const env = getEnv();
  return env.NODE_ENV !== "production" && env.ENABLE_DEV_TEST_CHECKOUT;
}

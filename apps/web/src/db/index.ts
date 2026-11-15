import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getEnv } from "@/lib/env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  whitemerceSql?: ReturnType<typeof postgres>;
};

function getSqlClient() {
  if (!globalForDb.whitemerceSql) {
    globalForDb.whitemerceSql = postgres(getEnv().DATABASE_URL, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
  return globalForDb.whitemerceSql;
}

export const db = drizzle(getSqlClient(), { schema });
export type WhiteMerceDb = typeof db;

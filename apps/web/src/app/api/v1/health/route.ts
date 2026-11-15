import { sql } from "drizzle-orm";
import { db } from "@/db";
import { handleCorsPreflight, jsonWithCors } from "@/lib/cors";
import { isDevCheckoutAllowed } from "@/lib/env";

export const dynamic = "force-dynamic";

export function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function GET(request: Request) {
  try {
    await db.execute(sql`select 1`);
    return jsonWithCors(request, {
      status: "ok",
      database: "connected",
      devCheckoutEnabled: isDevCheckoutAllowed(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return jsonWithCors(
      request,
      {
        status: "degraded",
        database: "disconnected",
      },
      503,
    );
  }
}

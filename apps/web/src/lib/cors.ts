import { NextResponse } from "next/server";
import { getEnv } from "./env";

function resolveAllowedOrigins(): string[] {
  const env = getEnv();
  const origins = new Set<string>([env.STOREFRONT_URL]);
  if (env.NODE_ENV !== "production") {
    origins.add("http://localhost:4321");
    origins.add("http://127.0.0.1:4321");
  }
  return Array.from(origins);
}

export function getCorsHeaders(requestOrigin: string | null): Record<string, string> {
  const allowed = resolveAllowedOrigins();
  const originToReturn =
    requestOrigin && allowed.includes(requestOrigin)
      ? requestOrigin
      : allowed[0] ?? "http://localhost:4321";

  return {
    "Access-Control-Allow-Origin": originToReturn,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}

export function handleCorsPreflight(request: Request): NextResponse {
  const origin = request.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

export function jsonWithCors<T>(
  request: Request,
  body: T,
  status = 200,
): NextResponse<T> {
  const origin = request.headers.get("origin");
  return NextResponse.json(body, {
    status,
    headers: getCorsHeaders(origin),
  });
}

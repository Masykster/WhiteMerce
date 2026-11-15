import { NextResponse } from "next/server";
import {
  productFilterSchema,
  productMutationSchema,
} from "@whitemerce/shared/schemas";
import { toHttpErrorResponse } from "@/lib/api-error";
import { requireAdminApi } from "@/lib/require-admin";
import { createProduct, listProducts } from "@/services/catalog-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { unauthorizedResponse } = await requireAdminApi();
  if (unauthorizedResponse) return unauthorizedResponse;

  try {
    const url = new URL(request.url);
    const parsed = productFilterSchema.parse({
      q: url.searchParams.get("q") ?? undefined,
      category: url.searchParams.get("category") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
      sort: url.searchParams.get("sort") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });
    const result = await listProducts(parsed, { includeNonActive: true });
    return NextResponse.json(result);
  } catch (error) {
    const { status, body } = toHttpErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request) {
  const { unauthorizedResponse } = await requireAdminApi();
  if (unauthorizedResponse) return unauthorizedResponse;

  try {
    const rawBody = await request.json();
    const input = productMutationSchema.parse(rawBody);
    const product = await createProduct(input);
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    const { status, body } = toHttpErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

import { productFilterSchema } from "@whitemerce/shared/schemas";
import { toHttpErrorResponse } from "@/lib/api-error";
import { handleCorsPreflight, jsonWithCors } from "@/lib/cors";
import { listProducts } from "@/services/catalog-service";

export const dynamic = "force-dynamic";

export function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = productFilterSchema.parse({
      q: url.searchParams.get("q") ?? undefined,
      category: url.searchParams.get("category") ?? undefined,
      featured: url.searchParams.get("featured") ?? undefined,
      sort: url.searchParams.get("sort") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });

    const result = await listProducts(parsed, { includeNonActive: false });
    return jsonWithCors(request, result);
  } catch (error) {
    const { status, body } = toHttpErrorResponse(error);
    return jsonWithCors(request, body, status);
  }
}

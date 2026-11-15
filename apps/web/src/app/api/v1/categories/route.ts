import { handleCorsPreflight, jsonWithCors } from "@/lib/cors";
import { toHttpErrorResponse } from "@/lib/api-error";
import { listCategoriesWithCounts } from "@/services/catalog-service";

export const dynamic = "force-dynamic";

export function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function GET(request: Request) {
  try {
    const items = await listCategoriesWithCounts();
    return jsonWithCors(request, { items });
  } catch (error) {
    const { status, body } = toHttpErrorResponse(error);
    return jsonWithCors(request, body, status);
  }
}

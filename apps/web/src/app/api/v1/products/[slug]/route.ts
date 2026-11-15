import { toHttpErrorResponse } from "@/lib/api-error";
import { handleCorsPreflight, jsonWithCors } from "@/lib/cors";
import { getProductBySlug } from "@/services/catalog-service";

export const dynamic = "force-dynamic";

export function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const product = await getProductBySlug(slug, { includeNonActive: false });
    if (!product) {
      return jsonWithCors(request, { error: "Product not found" }, 404);
    }
    return jsonWithCors(request, { product });
  } catch (error) {
    const { status, body } = toHttpErrorResponse(error);
    return jsonWithCors(request, body, status);
  }
}

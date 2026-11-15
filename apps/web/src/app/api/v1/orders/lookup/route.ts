import { orderLookupSchema } from "@whitemerce/shared/schemas";
import { toHttpErrorResponse } from "@/lib/api-error";
import { handleCorsPreflight, jsonWithCors } from "@/lib/cors";
import { findOrderByLookup } from "@/services/order-service";

export const dynamic = "force-dynamic";

export function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = orderLookupSchema.parse({
      orderNumber: url.searchParams.get("orderNumber") ?? undefined,
      email: url.searchParams.get("email") ?? undefined,
      sessionId: url.searchParams.get("sessionId") ?? undefined,
    });

    const order = await findOrderByLookup(parsed);
    if (!order) {
      return jsonWithCors(request, { error: "Order not found" }, 404);
    }

    return jsonWithCors(request, { order });
  } catch (error) {
    const { status, body } = toHttpErrorResponse(error);
    return jsonWithCors(request, body, status);
  }
}

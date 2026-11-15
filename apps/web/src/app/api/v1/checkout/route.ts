import { checkoutRequestSchema } from "@whitemerce/shared/schemas";
import { toHttpErrorResponse } from "@/lib/api-error";
import { handleCorsPreflight, jsonWithCors } from "@/lib/cors";
import { createCheckoutSession } from "@/services/checkout-service";

export const dynamic = "force-dynamic";

export function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const input = checkoutRequestSchema.parse(rawBody);
    const session = await createCheckoutSession(input);
    return jsonWithCors(request, session, 201);
  } catch (error) {
    const { status, body } = toHttpErrorResponse(error);
    return jsonWithCors(request, body, status);
  }
}

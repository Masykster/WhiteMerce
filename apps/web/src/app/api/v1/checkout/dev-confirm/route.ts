import { z } from "zod";
import { devConfirmCheckoutSchema } from "@whitemerce/shared/schemas";
import { toHttpErrorResponse } from "@/lib/api-error";
import { handleCorsPreflight, jsonWithCors } from "@/lib/cors";
import {
  confirmDevCheckout,
  getDevCheckoutPreview,
} from "@/services/checkout-service";

export const dynamic = "force-dynamic";

const previewQuerySchema = z.object({
  orderNumber: z.string().trim().min(4).max(40),
  token: z.string().trim().min(8).max(128),
});

export function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parsed = previewQuerySchema.parse({
      orderNumber: url.searchParams.get("orderNumber") ?? "",
      token: url.searchParams.get("token") ?? "",
    });
    const order = await getDevCheckoutPreview(parsed.orderNumber, parsed.token);
    return jsonWithCors(request, { order });
  } catch (error) {
    const { status, body } = toHttpErrorResponse(error);
    return jsonWithCors(request, body, status);
  }
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.json();
    const input = devConfirmCheckoutSchema.parse(rawBody);
    const order = await confirmDevCheckout(input);
    return jsonWithCors(request, { order });
  } catch (error) {
    const { status, body } = toHttpErrorResponse(error);
    return jsonWithCors(request, body, status);
  }
}

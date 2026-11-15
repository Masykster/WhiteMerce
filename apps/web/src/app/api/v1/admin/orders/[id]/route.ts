import { NextResponse } from "next/server";
import { orderStatusUpdateSchema } from "@whitemerce/shared/schemas";
import { toHttpErrorResponse } from "@/lib/api-error";
import { requireAdminApi } from "@/lib/require-admin";
import { getOrderById, updateOrderStatus } from "@/services/order-service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { unauthorizedResponse } = await requireAdminApi();
  if (unauthorizedResponse) return unauthorizedResponse;

  try {
    const { id } = await context.params;
    const order = await getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (error) {
    const { status, body } = toHttpErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { unauthorizedResponse } = await requireAdminApi();
  if (unauthorizedResponse) return unauthorizedResponse;

  try {
    const { id } = await context.params;
    const rawBody = await request.json();
    const input = orderStatusUpdateSchema.parse(rawBody);
    const order = await updateOrderStatus(id, input.status);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (error) {
    const { status, body } = toHttpErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

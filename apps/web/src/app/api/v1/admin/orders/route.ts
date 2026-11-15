import { NextResponse } from "next/server";
import { orderStatusSchema } from "@whitemerce/shared/schemas";
import { toHttpErrorResponse } from "@/lib/api-error";
import { requireAdminApi } from "@/lib/require-admin";
import { listAdminOrders } from "@/services/order-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { unauthorizedResponse } = await requireAdminApi();
  if (unauthorizedResponse) return unauthorizedResponse;

  try {
    const url = new URL(request.url);
    const rawStatus = url.searchParams.get("status");
    const status = rawStatus ? orderStatusSchema.parse(rawStatus) : undefined;
    const items = await listAdminOrders({ status, limit: 100 });
    return NextResponse.json({ items });
  } catch (error) {
    const { status, body } = toHttpErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

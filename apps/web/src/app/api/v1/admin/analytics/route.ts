import { NextResponse } from "next/server";
import { toHttpErrorResponse } from "@/lib/api-error";
import { requireAdminApi } from "@/lib/require-admin";
import { getAnalyticsOverview } from "@/services/order-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const { unauthorizedResponse } = await requireAdminApi();
  if (unauthorizedResponse) return unauthorizedResponse;

  try {
    const overview = await getAnalyticsOverview();
    return NextResponse.json(overview);
  } catch (error) {
    const { status, body } = toHttpErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

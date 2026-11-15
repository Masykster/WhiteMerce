import { NextResponse } from "next/server";
import { categoryMutationSchema } from "@whitemerce/shared/schemas";
import { toHttpErrorResponse } from "@/lib/api-error";
import { requireAdminApi } from "@/lib/require-admin";
import {
  createCategory,
  listCategoriesWithCounts,
} from "@/services/catalog-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const { unauthorizedResponse } = await requireAdminApi();
  if (unauthorizedResponse) return unauthorizedResponse;

  try {
    const items = await listCategoriesWithCounts();
    return NextResponse.json({ items });
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
    const input = categoryMutationSchema.parse(rawBody);
    const category = await createCategory(input);
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    const { status, body } = toHttpErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

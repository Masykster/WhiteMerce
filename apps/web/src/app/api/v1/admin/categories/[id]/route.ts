import { NextResponse } from "next/server";
import { toHttpErrorResponse } from "@/lib/api-error";
import { requireAdminApi } from "@/lib/require-admin";
import { deleteCategory } from "@/services/catalog-service";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { unauthorizedResponse } = await requireAdminApi();
  if (unauthorizedResponse) return unauthorizedResponse;

  try {
    const { id } = await context.params;
    await deleteCategory(id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    const { status, body } = toHttpErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

import { NextResponse } from "next/server";
import { productMutationSchema } from "@whitemerce/shared/schemas";
import { toHttpErrorResponse } from "@/lib/api-error";
import { requireAdminApi } from "@/lib/require-admin";
import {
  deleteProduct,
  getProductById,
  updateProduct,
} from "@/services/catalog-service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { unauthorizedResponse } = await requireAdminApi();
  if (unauthorizedResponse) return unauthorizedResponse;

  try {
    const { id } = await context.params;
    const product = await getProductById(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ product });
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
    const input = productMutationSchema.parse(rawBody);
    const product = await updateProduct(id, input);
    return NextResponse.json({ product });
  } catch (error) {
    const { status, body } = toHttpErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { unauthorizedResponse } = await requireAdminApi();
  if (unauthorizedResponse) return unauthorizedResponse;

  try {
    const { id } = await context.params;
    await deleteProduct(id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    const { status, body } = toHttpErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

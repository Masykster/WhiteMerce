"use server";

import { revalidatePath } from "next/cache";
import { signOut } from "@/auth";
import { requireAdminSession } from "@/lib/require-admin";
import {
  categoryMutationSchema,
  orderStatusUpdateSchema,
  productMutationSchema,
} from "@whitemerce/shared/schemas";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  updateProduct,
} from "@/services/catalog-service";
import { updateOrderStatus } from "@/services/order-service";

export async function signOutAdminAction() {
  await signOut({ redirectTo: "/admin/login" });
}

export async function saveProductAction(
  productId: string | null,
  rawInput: unknown,
) {
  const session = await requireAdminSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const input = productMutationSchema.parse(rawInput);
    const product = productId
      ? await updateProduct(productId, input)
      : await createProduct(input);

    revalidatePath("/admin");
    revalidatePath("/admin/products");
    revalidatePath(`/admin/products/${product.id}`);
    return { product };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to save product",
    };
  }
}

export async function deleteProductAction(productId: string) {
  const session = await requireAdminSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    await deleteProduct(productId);
    revalidatePath("/admin");
    revalidatePath("/admin/products");
    return { deleted: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to delete product",
    };
  }
}

export async function createCategoryAction(rawInput: unknown) {
  const session = await requireAdminSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const input = categoryMutationSchema.parse(rawInput);
    const category = await createCategory(input);
    revalidatePath("/admin/categories");
    revalidatePath("/admin/products/new");
    return { category };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to create category",
    };
  }
}

export async function deleteCategoryAction(categoryId: string) {
  const session = await requireAdminSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    await deleteCategory(categoryId);
    revalidatePath("/admin/categories");
    return { deleted: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Failed to delete category",
    };
  }
}

export async function updateOrderStatusAction(
  orderId: string,
  rawStatus: unknown,
) {
  const session = await requireAdminSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const parsed = orderStatusUpdateSchema.parse({ status: rawStatus });
    const order = await updateOrderStatus(orderId, parsed.status);
    if (!order) {
      return { error: "Order not found" };
    }
    revalidatePath("/admin");
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    return { order };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to update order status",
    };
  }
}

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdminSession } from "@/lib/require-admin";
import {
  getProductById,
  listCategoriesWithCounts,
} from "@/services/catalog-service";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductById(id),
    listCategoriesWithCounts(),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="text-xs font-medium text-stone-500 hover:text-stone-900"
        >
          ← Back to Products
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-950">
          Edit {product.name}
        </h1>
      </div>

      <ProductForm categories={categories} initialProduct={product} />
    </div>
  );
}

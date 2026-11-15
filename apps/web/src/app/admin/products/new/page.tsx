import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdminSession } from "@/lib/require-admin";
import { listCategoriesWithCounts } from "@/services/catalog-service";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const session = await requireAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const categories = await listCategoriesWithCounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/products"
            className="text-xs font-medium text-stone-500 hover:text-stone-900"
          >
            ← Back to Products
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-stone-950">
            Create Product
          </h1>
        </div>
      </div>

      <ProductForm categories={categories} />
    </div>
  );
}

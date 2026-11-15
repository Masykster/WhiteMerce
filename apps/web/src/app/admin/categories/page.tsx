import { redirect } from "next/navigation";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { requireAdminSession } from "@/lib/require-admin";
import { listCategoriesWithCounts } from "@/services/catalog-service";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const session = await requireAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const categories = await listCategoriesWithCounts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-950">
          Categories
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Organize your WhiteMerce storefront navigation and collection pages.
        </p>
      </div>

      <CategoryManager categories={categories} />
    </div>
  );
}

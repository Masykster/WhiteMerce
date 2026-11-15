import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { formatPriceFromUsdCents } from "@whitemerce/shared/money";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";
import { requireAdminSession } from "@/lib/require-admin";
import { listProducts } from "@/services/catalog-service";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const session = await requireAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const catalog = await listProducts(
    { page: 1, limit: 48, sort: "newest" },
    { includeNonActive: true },
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-stone-950">
            Products ({catalog.total})
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage catalog listings, base USD pricing, and variant stock.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
        >
          <Plus className="h-4 w-4" />
          New Product
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-xs uppercase tracking-wider text-stone-500">
                <th className="px-6 py-3.5 font-medium">Product</th>
                <th className="px-6 py-3.5 font-medium">Category</th>
                <th className="px-6 py-3.5 font-medium">Status</th>
                <th className="px-6 py-3.5 font-medium">Base Price</th>
                <th className="px-6 py-3.5 font-medium">Total Stock</th>
                <th className="px-6 py-3.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {catalog.items.map((product) => {
                const totalStock = product.variants.reduce(
                  (sum, v) => sum + v.stock,
                  0,
                );
                return (
                  <tr key={product.id} className="hover:bg-stone-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-stone-950">{product.name}</p>
                      <p className="font-mono text-xs text-stone-500">
                        /{product.slug} · {product.variants.length} variants
                      </p>
                    </td>
                    <td className="px-6 py-4 text-stone-600">
                      {product.categoryName ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          product.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-stone-100 text-stone-700"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-stone-950">
                      {formatPriceFromUsdCents(product.basePriceCents, "USD")}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={
                          totalStock <= 5 ? "font-semibold text-amber-700" : ""
                        }
                      >
                        {totalStock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-100"
                        >
                          Edit
                        </Link>
                        <DeleteProductButton
                          productId={product.id}
                          productName={product.name}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

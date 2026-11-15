"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import type { z } from "zod";
import {
  categoryMutationSchema,
  type CategoryMutationInput,
} from "@whitemerce/shared/schemas";
import type { CategoryDto } from "@whitemerce/shared/types";
import {
  createCategoryAction,
  deleteCategoryAction,
} from "@/app/admin/actions";
import { useAdminUiStore } from "@/stores/admin-ui";

type CategoryFormValues = z.input<typeof categoryMutationSchema>;

export function CategoryManager({
  categories,
}: {
  categories: CategoryDto[];
}) {
  const router = useRouter();
  const pushToast = useAdminUiStore((state) => state.pushToast);
  const [busyId, setBusyId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues, unknown, CategoryMutationInput>({
    resolver: zodResolver(categoryMutationSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      imageUrl: "/images/products/tee-ivory.svg",
    },
  });

  async function onSubmit(values: CategoryMutationInput) {
    const result = await createCategoryAction(values);
    if ("error" in result && result.error) {
      pushToast(result.error, "error");
      return;
    }
    pushToast("Category created", "success");
    reset();
    router.refresh();
  }

  async function handleDelete(category: CategoryDto) {
    setBusyId(category.id);
    const result = await deleteCategoryAction(category.id);
    setBusyId(null);

    if ("error" in result && result.error) {
      pushToast(result.error, "error");
      return;
    }
    pushToast(`Removed ${category.name}`, "success");
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 lg:col-span-2">
        <h2 className="text-base font-semibold text-stone-950">New Category</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-stone-600">
              Name
            </label>
            <input
              type="text"
              {...register("name")}
              placeholder="Lighting"
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm outline-none focus:border-stone-950"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-stone-600">
              Slug
            </label>
            <input
              type="text"
              {...register("slug")}
              placeholder="lighting"
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2 font-mono text-sm outline-none focus:border-stone-950"
            />
            {errors.slug && (
              <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-stone-600">
              Description
            </label>
            <textarea
              rows={3}
              {...register("description")}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm outline-none focus:border-stone-950"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-stone-600">
              Image Path / URL
            </label>
            <input
              type="text"
              {...register("imageUrl")}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2 font-mono text-xs outline-none focus:border-stone-950"
            />
            {errors.imageUrl && (
              <p className="mt-1 text-xs text-red-600">
                {errors.imageUrl.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60"
          >
            {isSubmitting ? "Creating..." : "Create Category"}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white lg:col-span-3">
        <div className="border-b border-stone-200 px-6 py-4">
          <h2 className="text-base font-semibold text-stone-950">
            Existing Categories ({categories.length})
          </h2>
        </div>
        <div className="divide-y divide-stone-100">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between gap-4 px-6 py-4"
            >
              <div>
                <p className="font-medium text-stone-950">{category.name}</p>
                <p className="font-mono text-xs text-stone-500">
                  /{category.slug} · {category.productCount ?? 0} active products
                </p>
              </div>
              <button
                type="button"
                disabled={busyId === category.id}
                onClick={() => handleDelete(category)}
                className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

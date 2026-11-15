"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import type { z } from "zod";
import { PRODUCT_STATUSES } from "@whitemerce/shared/constants";
import {
  productMutationSchema,
  type ProductMutationInput,
} from "@whitemerce/shared/schemas";
import type { CategoryDto, ProductDto } from "@whitemerce/shared/types";
import { saveProductAction } from "@/app/admin/actions";
import { useAdminUiStore } from "@/stores/admin-ui";

interface ProductFormProps {
  categories: CategoryDto[];
  initialProduct?: ProductDto;
}

type ProductFormValues = z.input<typeof productMutationSchema>;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ProductForm({ categories, initialProduct }: ProductFormProps) {
  const router = useRouter();
  const pushToast = useAdminUiStore((state) => state.pushToast);
  const [serverError, setServerError] = useState<string | null>(null);
  const [imageDraft, setImageDraft] = useState("");

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues, unknown, ProductMutationInput>({
    resolver: zodResolver(productMutationSchema),
    defaultValues: initialProduct
      ? {
          categoryId: initialProduct.categoryId,
          name: initialProduct.name,
          slug: initialProduct.slug,
          description: initialProduct.description,
          basePriceCents: initialProduct.basePriceCents,
          status: initialProduct.status,
          featured: initialProduct.featured,
          images: initialProduct.images,
          variants: initialProduct.variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            name: v.name,
            options: v.options,
            priceCents: v.priceCents,
            stock: v.stock,
            isDefault: v.isDefault,
          })),
        }
      : {
          categoryId: categories[0]?.id ?? null,
          name: "",
          slug: "",
          description: "",
          basePriceCents: 4800,
          status: "active",
          featured: false,
          images: ["/images/products/tee-ivory.svg"],
          variants: [
            {
              sku: "WM-NEW-001",
              name: "Standard / M",
              options: { size: "M" },
              priceCents: 4800,
              stock: 10,
              isDefault: true,
            },
          ],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "variants",
  });

  const watchedImages = useWatch({ control, name: "images" });
  const images = watchedImages ?? [];
  const nameValue = useWatch({ control, name: "name" }) ?? "";

  function handleAddImage() {
    const trimmed = imageDraft.trim();
    if (!trimmed) return;
    setValue("images", [...images, trimmed], { shouldValidate: true });
    setImageDraft("");
  }

  function handleRemoveImage(index: number) {
    setValue(
      "images",
      images.filter((_, idx) => idx !== index),
      { shouldValidate: true },
    );
  }

  async function onSubmit(values: ProductMutationInput) {
    setServerError(null);
    const response = await saveProductAction(initialProduct?.id ?? null, values);
    if ("error" in response && response.error) {
      setServerError(response.error);
      pushToast(response.error, "error");
      return;
    }

    pushToast(
      initialProduct ? "Product updated successfully" : "Product created successfully",
      "success",
    );
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {serverError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {serverError}
        </div>
      )}

      <div className="grid gap-6 rounded-2xl border border-stone-200 bg-white p-6 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone-600">
            Product Name
          </label>
          <input
            type="text"
            {...register("name")}
            className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm outline-none focus:border-stone-950"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-xs font-medium uppercase tracking-wider text-stone-600">
              Slug
            </label>
            <button
              type="button"
              onClick={() =>
                setValue("slug", slugify(nameValue ?? ""), { shouldValidate: true })
              }
              className="text-xs font-medium text-stone-600 underline hover:text-stone-950"
            >
              Generate from name
            </button>
          </div>
          <input
            type="text"
            {...register("slug")}
            className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 font-mono text-sm outline-none focus:border-stone-950"
          />
          {errors.slug && (
            <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone-600">
            Category
          </label>
          <select
            {...register("categoryId")}
            className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-stone-950"
          >
            <option value="">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone-600">
              Base Price (USD Cents)
            </label>
            <input
              type="number"
              {...register("basePriceCents", { valueAsNumber: true })}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm outline-none focus:border-stone-950"
            />
            {errors.basePriceCents && (
              <p className="mt-1 text-xs text-red-600">
                {errors.basePriceCents.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone-600">
              Status
            </label>
            <select
              {...register("status")}
              className="w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm capitalize outline-none focus:border-stone-950"
            >
              {PRODUCT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone-600">
            Description
          </label>
          <textarea
            rows={4}
            {...register("description")}
            className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm outline-none focus:border-stone-950"
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="inline-flex items-center gap-2.5 text-sm font-medium text-stone-800">
            <input
              type="checkbox"
              {...register("featured")}
              className="h-4 w-4 rounded border-stone-300"
            />
            Feature on Storefront homepage
          </label>
        </div>
      </div>

      {/* Product Images */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-base font-semibold text-stone-950">Product Images</h2>
        <p className="mt-1 text-xs text-stone-500">
          Use local paths (e.g. /images/products/tee-ivory.svg) or HTTPS URLs.
        </p>

        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={imageDraft}
            onChange={(event) => setImageDraft(event.target.value)}
            placeholder="/images/products/tee-ivory.svg"
            className="flex-1 rounded-xl border border-stone-300 px-3.5 py-2 text-sm outline-none focus:border-stone-950"
          />
          <button
            type="button"
            onClick={handleAddImage}
            className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-stone-100"
          >
            Add Image
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          {images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs"
            >
              <span className="max-w-xs truncate font-mono">{url}</span>
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="text-stone-500 hover:text-red-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        {errors.images && (
          <p className="mt-2 text-xs text-red-600">{errors.images.message}</p>
        )}
      </div>

      {/* Variants */}
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-stone-950">Variants</h2>
            <p className="mt-1 text-xs text-stone-500">
              Pricing stored in canonical USD cents (e.g. 4800 = $48.00).
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              append({
                sku: `WM-SKU-${fields.length + 1}`,
                name: `Variant ${fields.length + 1}`,
                options: {},
                priceCents: 4800,
                stock: 10,
                isDefault: false,
              })
            }
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 px-3.5 py-2 text-xs font-medium hover:bg-stone-100"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Variant
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-3 rounded-xl border border-stone-200 bg-stone-50/70 p-4 sm:grid-cols-5"
            >
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase text-stone-500">
                  SKU
                </label>
                <input
                  type="text"
                  {...register(`variants.${index}.sku`)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 font-mono text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase text-stone-500">
                  Name
                </label>
                <input
                  type="text"
                  {...register(`variants.${index}.name`)}
                  className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase text-stone-500">
                  Price (USD Cents)
                </label>
                <input
                  type="number"
                  {...register(`variants.${index}.priceCents`, {
                    valueAsNumber: true,
                  })}
                  className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase text-stone-500">
                  Stock
                </label>
                <input
                  type="number"
                  {...register(`variants.${index}.stock`, { valueAsNumber: true })}
                  className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs"
                />
              </div>
              <div className="flex items-end justify-between gap-2">
                <label className="inline-flex items-center gap-1.5 text-xs text-stone-700">
                  <input
                    type="checkbox"
                    {...register(`variants.${index}.isDefault`)}
                  />
                  Default
                </label>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="rounded-lg p-1.5 text-stone-500 hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove variant"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {errors.variants && (
          <p className="mt-2 text-xs text-red-600">{errors.variants.message}</p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-stone-950 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60"
        >
          {isSubmitting
            ? "Saving..."
            : initialProduct
              ? "Save Changes"
              : "Create Product"}
        </button>
      </div>
    </form>
  );
}

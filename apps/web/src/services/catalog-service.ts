import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
} from "drizzle-orm";
import type {
  CategoryDto,
  PaginatedProductsDto,
  ProductDto,
  ProductVariantDto,
} from "@whitemerce/shared/types";
import type {
  CategoryMutationInput,
  ProductFilterInput,
  ProductMutationInput,
} from "@whitemerce/shared/schemas";
import { db } from "@/db";
import { categories, products, productVariants } from "@/db/schema";
import { mediaAdapter } from "@/lib/media";

export class CatalogError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "CatalogError";
    this.status = status;
  }
}

function mapVariantRow(row: typeof productVariants.$inferSelect): ProductVariantDto {
  return {
    id: row.id,
    productId: row.productId,
    sku: row.sku,
    name: row.name,
    options: row.options ?? {},
    priceCents: row.priceCents,
    stock: row.stock,
    isDefault: row.isDefault,
  };
}

async function hydrateProducts(
  productRows: Array<typeof products.$inferSelect>,
): Promise<ProductDto[]> {
  if (productRows.length === 0) {
    return [];
  }

  const productIds = productRows.map((p) => p.id);
  const categoryIds = Array.from(
    new Set(
      productRows
        .map((p) => p.categoryId)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const [variantRows, categoryRows] = await Promise.all([
    db
      .select()
      .from(productVariants)
      .where(inArray(productVariants.productId, productIds))
      .orderBy(desc(productVariants.isDefault), asc(productVariants.priceCents)),
    categoryIds.length > 0
      ? db.select().from(categories).where(inArray(categories.id, categoryIds))
      : Promise.resolve([]),
  ]);

  const categoryMap = new Map(categoryRows.map((c) => [c.id, c]));
  const variantsByProduct = new Map<string, ProductVariantDto[]>();
  for (const variant of variantRows) {
    const existing = variantsByProduct.get(variant.productId) ?? [];
    existing.push(mapVariantRow(variant));
    variantsByProduct.set(variant.productId, existing);
  }

  return productRows.map((row) => {
    const category = row.categoryId ? categoryMap.get(row.categoryId) : undefined;
    return {
      id: row.id,
      categoryId: row.categoryId,
      categoryName: category?.name ?? null,
      categorySlug: category?.slug ?? null,
      name: row.name,
      slug: row.slug,
      description: row.description,
      basePriceCents: row.basePriceCents,
      status: row.status,
      featured: row.featured,
      images: row.images ?? [],
      variants: variantsByProduct.get(row.id) ?? [],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  });
}

export async function listCategoriesWithCounts(): Promise<CategoryDto[]> {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      imageUrl: categories.imageUrl,
      productCount: count(products.id),
    })
    .from(categories)
    .leftJoin(
      products,
      and(eq(products.categoryId, categories.id), eq(products.status, "active")),
    )
    .groupBy(categories.id)
    .orderBy(asc(categories.name));

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    imageUrl: row.imageUrl,
    productCount: Number(row.productCount),
  }));
}

export async function createCategory(
  input: CategoryMutationInput,
): Promise<CategoryDto> {
  const imageUrl = input.imageUrl
    ? mediaAdapter.validateImageUrl(input.imageUrl)
    : null;

  const [created] = await db
    .insert(categories)
    .values({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      imageUrl,
    })
    .returning();

  if (!created) {
    throw new CatalogError("Failed to create category", 500);
  }

  return {
    id: created.id,
    name: created.name,
    slug: created.slug,
    description: created.description,
    imageUrl: created.imageUrl,
    productCount: 0,
  };
}

export async function deleteCategory(id: string): Promise<void> {
  const [deleted] = await db
    .delete(categories)
    .where(eq(categories.id, id))
    .returning({ id: categories.id });

  if (!deleted) {
    throw new CatalogError("Category not found", 404);
  }
}

export async function listProducts(
  filter: Partial<ProductFilterInput> = {},
  options: { includeNonActive?: boolean } = {},
): Promise<PaginatedProductsDto> {
  const page = filter.page ?? 1;
  const limit = filter.limit ?? 12;
  const sort = filter.sort ?? "newest";
  const conditions = [];

  if (!options.includeNonActive) {
    conditions.push(eq(products.status, "active"));
  } else if (filter.status) {
    conditions.push(eq(products.status, filter.status));
  }

  if (filter.featured !== undefined) {
    conditions.push(eq(products.featured, filter.featured));
  }

  if (filter.q) {
    const pattern = `%${filter.q}%`;
    conditions.push(
      or(ilike(products.name, pattern), ilike(products.description, pattern)),
    );
  }

  if (filter.category) {
    const [matchedCategory] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, filter.category))
      .limit(1);

    if (!matchedCategory) {
      return {
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
    conditions.push(eq(products.categoryId, matchedCategory.id));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const orderByClause =
    sort === "price-asc"
      ? [asc(products.basePriceCents), desc(products.createdAt)]
      : sort === "price-desc"
        ? [desc(products.basePriceCents), desc(products.createdAt)]
        : sort === "name-asc"
          ? [asc(products.name)]
          : [desc(products.createdAt)];

  const [countResult, rows] = await Promise.all([
    db.select({ total: count() }).from(products).where(whereClause),
    db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(...orderByClause)
      .limit(limit)
      .offset((page - 1) * limit),
  ]);

  const total = Number(countResult[0]?.total ?? 0);
  const items = await hydrateProducts(rows);

  return {
    items,
    total,
    page,
    limit,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}

export async function getProductBySlug(
  slug: string,
  options: { includeNonActive?: boolean } = {},
): Promise<ProductDto | null> {
  const conditions = [eq(products.slug, slug)];
  if (!options.includeNonActive) {
    conditions.push(eq(products.status, "active"));
  }

  const [row] = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .limit(1);

  if (!row) {
    return null;
  }

  const [hydrated] = await hydrateProducts([row]);
  return hydrated ?? null;
}

export async function getProductById(id: string): Promise<ProductDto | null> {
  const [row] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!row) {
    return null;
  }

  const [hydrated] = await hydrateProducts([row]);
  return hydrated ?? null;
}

function normalizeDefaultVariantFlags(
  variants: ProductMutationInput["variants"],
) {
  const hasExplicitDefault = variants.some((v) => v.isDefault);
  return variants.map((variant, index) => ({
    ...variant,
    isDefault: hasExplicitDefault ? variant.isDefault : index === 0,
  }));
}

export async function createProduct(
  input: ProductMutationInput,
): Promise<ProductDto> {
  const validatedImages = input.images.map((url) =>
    mediaAdapter.validateImageUrl(url),
  );
  const normalizedVariants = normalizeDefaultVariantFlags(input.variants);

  const createdId = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(products)
      .values({
        categoryId: input.categoryId ?? null,
        name: input.name,
        slug: input.slug,
        description: input.description,
        basePriceCents: input.basePriceCents,
        status: input.status,
        featured: input.featured,
        images: validatedImages,
      })
      .returning({ id: products.id });

    if (!inserted) {
      throw new CatalogError("Failed to create product", 500);
    }

    await tx.insert(productVariants).values(
      normalizedVariants.map((variant) => ({
        productId: inserted.id,
        sku: variant.sku,
        name: variant.name,
        options: variant.options,
        priceCents: variant.priceCents,
        stock: variant.stock,
        isDefault: variant.isDefault,
      })),
    );

    return inserted.id;
  });

  const created = await getProductById(createdId);
  if (!created) {
    throw new CatalogError("Failed to load created product", 500);
  }
  return created;
}

export async function updateProduct(
  id: string,
  input: ProductMutationInput,
): Promise<ProductDto> {
  const validatedImages = input.images.map((url) =>
    mediaAdapter.validateImageUrl(url),
  );
  const normalizedVariants = normalizeDefaultVariantFlags(input.variants);

  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(products)
      .set({
        categoryId: input.categoryId ?? null,
        name: input.name,
        slug: input.slug,
        description: input.description,
        basePriceCents: input.basePriceCents,
        status: input.status,
        featured: input.featured,
        images: validatedImages,
        updatedAt: sql`now()`,
      })
      .where(eq(products.id, id))
      .returning({ id: products.id });

    if (!updated) {
      throw new CatalogError("Product not found", 404);
    }

    const existingVariants = await tx
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(eq(productVariants.productId, id));
    const existingIds = new Set(existingVariants.map((v) => v.id));

    const retainedIds: string[] = [];
    for (const variant of normalizedVariants) {
      if (variant.id && existingIds.has(variant.id)) {
        retainedIds.push(variant.id);
        await tx
          .update(productVariants)
          .set({
            sku: variant.sku,
            name: variant.name,
            options: variant.options,
            priceCents: variant.priceCents,
            stock: variant.stock,
            isDefault: variant.isDefault,
          })
          .where(
            and(
              eq(productVariants.id, variant.id),
              eq(productVariants.productId, id),
            ),
          );
      } else {
        const [insertedVariant] = await tx
          .insert(productVariants)
          .values({
            productId: id,
            sku: variant.sku,
            name: variant.name,
            options: variant.options,
            priceCents: variant.priceCents,
            stock: variant.stock,
            isDefault: variant.isDefault,
          })
          .returning({ id: productVariants.id });
        if (insertedVariant) {
          retainedIds.push(insertedVariant.id);
        }
      }
    }

    const toDelete = existingVariants
      .map((v) => v.id)
      .filter((existingId) => !retainedIds.includes(existingId));

    if (toDelete.length > 0) {
      await tx
        .delete(productVariants)
        .where(
          and(
            eq(productVariants.productId, id),
            inArray(productVariants.id, toDelete),
          ),
        );
    }
  });

  const updatedProduct = await getProductById(id);
  if (!updatedProduct) {
    throw new CatalogError("Product not found after update", 404);
  }
  return updatedProduct;
}

export async function deleteProduct(id: string): Promise<void> {
  const [deleted] = await db
    .delete(products)
    .where(eq(products.id, id))
    .returning({ id: products.id });

  if (!deleted) {
    throw new CatalogError("Product not found", 404);
  }
}

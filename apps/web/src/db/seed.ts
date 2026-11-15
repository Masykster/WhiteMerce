import { existsSync } from "node:fs";
import path from "node:path";
import { config as loadDotenv } from "dotenv";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./index";
import {
  categories,
  orderItems,
  orders,
  products,
  productVariants,
  users,
} from "./schema";

for (const candidate of [
  path.resolve(process.cwd(), ".env"),
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(process.cwd(), "../../.env"),
]) {
  if (existsSync(candidate)) {
    loadDotenv({ path: candidate, override: false });
  }
}

async function seed() {
  console.log("Seeding WhiteMerce PostgreSQL database...");

  const adminHash = await bcrypt.hash("Admin123!", 10);
  const customerHash = await bcrypt.hash("Customer123!", 10);

  await db
    .insert(users)
    .values([
      {
        name: "WhiteMerce Admin",
        email: "admin@whitemerce.local",
        passwordHash: adminHash,
        role: "admin",
      },
      {
        name: "Maya Lin",
        email: "customer@whitemerce.local",
        passwordHash: customerHash,
        role: "customer",
      },
    ])
    .onConflictDoNothing({ target: users.email });

  const categorySeed = [
    {
      name: "Apparel",
      slug: "apparel",
      description: "Tailored heavyweight organic cotton and technical wool essentials.",
      imageUrl: "/images/products/tee-ivory.svg",
    },
    {
      name: "Footwear",
      slug: "footwear",
      description: "Architectural leather sneakers and minimalist everyday silhouettes.",
      imageUrl: "/images/products/runner-chalk.svg",
    },
    {
      name: "Accessories",
      slug: "accessories",
      description: "Structured canvas totes, brushed steel timepieces, and leather goods.",
      imageUrl: "/images/products/tote-canvas.svg",
    },
    {
      name: "Home Objects",
      slug: "home-objects",
      description: "Matte ceramic vessels, desk trays, and ambient workspace objects.",
      imageUrl: "/images/products/ceramic-vessel.svg",
    },
  ];

  await db
    .insert(categories)
    .values(categorySeed)
    .onConflictDoNothing({ target: categories.slug });

  const allCategories = await db.select().from(categories);
  const categoryBySlug = new Map(allCategories.map((c) => [c.slug, c.id]));

  const catalogSeed = [
    {
      categorySlug: "apparel",
      name: "Alabaster Heavyweight Tee",
      slug: "alabaster-heavyweight-tee",
      description:
        "280gsm organic combed cotton jersey with dropped shoulders, clean rib collar, and garment-washed drape.",
      basePriceCents: 4800,
      status: "active" as const,
      featured: true,
      images: ["/images/products/tee-ivory.svg", "/images/products/tee-slate.svg"],
      variants: [
        {
          sku: "WM-TEE-IVR-M",
          name: "Ivory / M",
          options: { color: "Ivory", size: "M" },
          priceCents: 4800,
          stock: 24,
          isDefault: true,
        },
        {
          sku: "WM-TEE-IVR-L",
          name: "Ivory / L",
          options: { color: "Ivory", size: "L" },
          priceCents: 4800,
          stock: 18,
          isDefault: false,
        },
        {
          sku: "WM-TEE-SLT-M",
          name: "Slate / M",
          options: { color: "Slate", size: "M" },
          priceCents: 5000,
          stock: 14,
          isDefault: false,
        },
      ],
    },
    {
      categorySlug: "apparel",
      name: "Atelier Overshirt Jacket",
      slug: "atelier-overshirt-jacket",
      description:
        "Structured Japanese twill overshirt featuring concealed corozo buttons and twin architectural chest pockets.",
      basePriceCents: 14500,
      status: "active" as const,
      featured: true,
      images: ["/images/products/overshirt-stone.svg"],
      variants: [
        {
          sku: "WM-OVR-STN-M",
          name: "Warm Stone / M",
          options: { color: "Warm Stone", size: "M" },
          priceCents: 14500,
          stock: 12,
          isDefault: true,
        },
        {
          sku: "WM-OVR-BLK-L",
          name: "Obsidian / L",
          options: { color: "Obsidian", size: "L" },
          priceCents: 14900,
          stock: 3,
          isDefault: false,
        },
      ],
    },
    {
      categorySlug: "footwear",
      name: "Chalk Court Runner",
      slug: "chalk-court-runner",
      description:
        "Full-grain calfskin upper paired with a tonal Vibram cupsole for crisp all-day cushioning.",
      basePriceCents: 18500,
      status: "active" as const,
      featured: true,
      images: ["/images/products/runner-chalk.svg"],
      variants: [
        {
          sku: "WM-RUN-CHK-41",
          name: "Chalk / EU 41",
          options: { color: "Chalk", size: "EU 41" },
          priceCents: 18500,
          stock: 15,
          isDefault: true,
        },
        {
          sku: "WM-RUN-CHK-42",
          name: "Chalk / EU 42",
          options: { color: "Chalk", size: "EU 42" },
          priceCents: 18500,
          stock: 9,
          isDefault: false,
        },
        {
          sku: "WM-RUN-ASH-43",
          name: "Ash Grey / EU 43",
          options: { color: "Ash Grey", size: "EU 43" },
          priceCents: 19200,
          stock: 6,
          isDefault: false,
        },
      ],
    },
    {
      categorySlug: "footwear",
      name: "Studio Leather Mule",
      slug: "studio-leather-mule",
      description:
        "Slip-on vegetable-tanned leather mule engineered for studio transitions and effortless travel.",
      basePriceCents: 13200,
      status: "active" as const,
      featured: false,
      images: ["/images/products/mule-sand.svg"],
      variants: [
        {
          sku: "WM-MUL-SND-40",
          name: "Sand / EU 40",
          options: { color: "Sand", size: "EU 40" },
          priceCents: 13200,
          stock: 11,
          isDefault: true,
        },
        {
          sku: "WM-MUL-SND-42",
          name: "Sand / EU 42",
          options: { color: "Sand", size: "EU 42" },
          priceCents: 13200,
          stock: 4,
          isDefault: false,
        },
      ],
    },
    {
      categorySlug: "accessories",
      name: "Monolith Canvas Tote",
      slug: "monolith-canvas-tote",
      description:
        "18oz waxed cotton duck tote with reinforced saddle-stitched handles and a padded 16-inch laptop sleeve.",
      basePriceCents: 8900,
      status: "active" as const,
      featured: true,
      images: ["/images/products/tote-canvas.svg"],
      variants: [
        {
          sku: "WM-TOT-NAT-OS",
          name: "Natural Ecru / One Size",
          options: { color: "Natural Ecru", size: "One Size" },
          priceCents: 8900,
          stock: 28,
          isDefault: true,
        },
        {
          sku: "WM-TOT-CHR-OS",
          name: "Charcoal / One Size",
          options: { color: "Charcoal", size: "One Size" },
          priceCents: 9200,
          stock: 16,
          isDefault: false,
        },
      ],
    },
    {
      categorySlug: "accessories",
      name: "Brushed Steel Chrono",
      slug: "brushed-steel-chrono",
      description:
        "38mm matte 316L stainless steel case with sapphire crystal and Swiss quartz movement.",
      basePriceCents: 24000,
      status: "active" as const,
      featured: false,
      images: ["/images/products/watch-steel.svg"],
      variants: [
        {
          sku: "WM-WTC-STL-38",
          name: "Brushed Silver / 38mm",
          options: { finish: "Brushed Silver", diameter: "38mm" },
          priceCents: 24000,
          stock: 7,
          isDefault: true,
        },
      ],
    },
    {
      categorySlug: "home-objects",
      name: "Fluted Ceramic Vessel",
      slug: "fluted-ceramic-vessel",
      description:
        "Wheel-thrown stoneware vase finished in satin porcelain glaze, signed by the studio.",
      basePriceCents: 6800,
      status: "active" as const,
      featured: true,
      images: ["/images/products/ceramic-vessel.svg"],
      variants: [
        {
          sku: "WM-VES-POR-S",
          name: "Porcelain Matte / Tall",
          options: { finish: "Porcelain Matte", height: "24cm" },
          priceCents: 6800,
          stock: 19,
          isDefault: true,
        },
        {
          sku: "WM-VES-CLY-S",
          name: "Raw Clay / Tall",
          options: { finish: "Raw Clay", height: "24cm" },
          priceCents: 7200,
          stock: 2,
          isDefault: false,
        },
      ],
    },
    {
      categorySlug: "home-objects",
      name: "Anodized Desk Valet Tray",
      slug: "anodized-desk-valet-tray",
      description:
        "CNC-milled bead-blasted aluminum tray lined with micro-suede to organize everyday desk instruments.",
      basePriceCents: 5400,
      status: "active" as const,
      featured: false,
      images: ["/images/products/valet-tray.svg"],
      variants: [
        {
          sku: "WM-TRY-SLV-STD",
          name: "Silver Mist / Standard",
          options: { finish: "Silver Mist" },
          priceCents: 5400,
          stock: 30,
          isDefault: true,
        },
      ],
    },
  ];

  for (const item of catalogSeed) {
    const existing = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, item.slug))
      .limit(1);

    if (existing.length > 0) {
      continue;
    }

    const [inserted] = await db
      .insert(products)
      .values({
        categoryId: categoryBySlug.get(item.categorySlug) ?? null,
        name: item.name,
        slug: item.slug,
        description: item.description,
        basePriceCents: item.basePriceCents,
        status: item.status,
        featured: item.featured,
        images: item.images,
      })
      .returning({ id: products.id });

    if (inserted) {
      await db.insert(productVariants).values(
        item.variants.map((variant) => ({
          productId: inserted.id,
          sku: variant.sku,
          name: variant.name,
          options: variant.options,
          priceCents: variant.priceCents,
          stock: variant.stock,
          isDefault: variant.isDefault,
        })),
      );
    }
  }

  const existingOrders = await db.select({ id: orders.id }).from(orders).limit(1);
  if (existingOrders.length === 0) {
    const allProducts = await db.select().from(products);
    const allVariants = await db.select().from(productVariants);
    const tee = allProducts.find((p) => p.slug === "alabaster-heavyweight-tee");
    const teeVariant = allVariants.find((v) => v.sku === "WM-TEE-IVR-M");
    const runner = allProducts.find((p) => p.slug === "chalk-court-runner");
    const runnerVariant = allVariants.find((v) => v.sku === "WM-RUN-CHK-41");

    const now = Date.now();
    const dayMs = 86_400_000;

    if (tee && teeVariant) {
      const [usdOrder] = await db
        .insert(orders)
        .values({
          orderNumber: "WM-2026-1001",
          customerEmail: "maya@example.com",
          customerName: "Maya Lin",
          shippingAddress: {
            line1: "742 Mercer Street",
            city: "New York",
            state: "NY",
            postalCode: "10012",
            country: "United States",
          },
          currency: "USD",
          exchangeRate: 1,
          subtotalAmount: 9600,
          shippingAmount: 1200,
          taxAmount: 768,
          totalAmount: 11568,
          totalUsdCents: 11568,
          status: "delivered",
          paymentStatus: "paid",
          paymentProvider: "stripe",
          createdAt: new Date(now - 4 * dayMs),
          updatedAt: new Date(now - 2 * dayMs),
        })
        .returning({ id: orders.id });

      if (usdOrder) {
        await db.insert(orderItems).values({
          orderId: usdOrder.id,
          productId: tee.id,
          variantId: teeVariant.id,
          productName: tee.name,
          variantName: teeVariant.name,
          sku: teeVariant.sku,
          unitPriceAmount: 4800,
          unitPriceUsdCents: 4800,
          quantity: 2,
          lineTotalAmount: 9600,
        });
      }
    }

    if (runner && runnerVariant) {
      const [idrOrder] = await db
        .insert(orders)
        .values({
          orderNumber: "WM-2026-1002",
          customerEmail: "budi@example.co.id",
          customerName: "Budi Santoso",
          shippingAddress: {
            line1: "Jl. Senopati No. 88",
            city: "Jakarta Selatan",
            state: "DKI Jakarta",
            postalCode: "12190",
            country: "Indonesia",
          },
          currency: "IDR",
          exchangeRate: 16_000,
          subtotalAmount: 2_960_000,
          shippingAmount: 0,
          taxAmount: 236_800,
          totalAmount: 3_196_800,
          totalUsdCents: 19_980,
          status: "processing",
          paymentStatus: "paid",
          paymentProvider: "dev",
          createdAt: new Date(now - 1 * dayMs),
          updatedAt: new Date(now - 1 * dayMs),
        })
        .returning({ id: orders.id });

      if (idrOrder) {
        await db.insert(orderItems).values({
          orderId: idrOrder.id,
          productId: runner.id,
          variantId: runnerVariant.id,
          productName: runner.name,
          variantName: runnerVariant.name,
          sku: runnerVariant.sku,
          unitPriceAmount: 2_960_000,
          unitPriceUsdCents: 18_500,
          quantity: 1,
          lineTotalAmount: 2_960_000,
        });
      }
    }
  }

  console.log("WhiteMerce seed completed successfully.");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Failed to seed database:", error);
  process.exit(1);
});

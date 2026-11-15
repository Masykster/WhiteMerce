import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type {
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  ProductStatus,
  SupportedCurrency,
  UserRole,
} from "@whitemerce/shared/constants";
import type { ShippingAddressDto } from "@whitemerce/shared/types";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type<UserRole>().notNull().default("customer"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull(),
    basePriceCents: integer("base_price_cents").notNull(),
    status: text("status").$type<ProductStatus>().notNull().default("draft"),
    featured: boolean("featured").notNull().default(false),
    images: jsonb("images").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("products_status_idx").on(table.status),
    index("products_category_idx").on(table.categoryId),
    check("products_base_price_positive", sql`${table.basePriceCents} > 0`),
  ],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull().unique(),
    name: text("name").notNull(),
    options: jsonb("options").$type<Record<string, string>>().notNull().default({}),
    priceCents: integer("price_cents").notNull(),
    stock: integer("stock").notNull().default(0),
    isDefault: boolean("is_default").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("variants_product_idx").on(table.productId),
    check("variants_stock_non_negative", sql`${table.stock} >= 0`),
    check("variants_price_positive", sql`${table.priceCents} > 0`),
  ],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderNumber: text("order_number").notNull().unique(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    customerEmail: text("customer_email").notNull(),
    customerName: text("customer_name").notNull(),
    shippingAddress: jsonb("shipping_address").$type<ShippingAddressDto>().notNull(),
    currency: text("currency").$type<SupportedCurrency>().notNull().default("USD"),
    exchangeRate: integer("exchange_rate").notNull().default(1),
    subtotalAmount: integer("subtotal_amount").notNull(),
    shippingAmount: integer("shipping_amount").notNull(),
    taxAmount: integer("tax_amount").notNull(),
    totalAmount: integer("total_amount").notNull(),
    totalUsdCents: integer("total_usd_cents").notNull(),
    status: text("status").$type<OrderStatus>().notNull().default("pending"),
    paymentStatus: text("payment_status")
      .$type<PaymentStatus>()
      .notNull()
      .default("unpaid"),
    paymentProvider: text("payment_provider")
      .$type<PaymentProvider>()
      .notNull()
      .default("dev"),
    devPaymentToken: text("dev_payment_token"),
    stripeSessionId: text("stripe_session_id").unique(),
    stripePaymentIntentId: text("stripe_payment_intent_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("orders_email_idx").on(table.customerEmail),
    index("orders_created_at_idx").on(table.createdAt),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    variantId: uuid("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    productName: text("product_name").notNull(),
    variantName: text("variant_name").notNull(),
    sku: text("sku").notNull(),
    unitPriceAmount: integer("unit_price_amount").notNull(),
    unitPriceUsdCents: integer("unit_price_usd_cents").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalAmount: integer("line_total_amount").notNull(),
  },
  (table) => [index("order_items_order_idx").on(table.orderId)],
);

export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(),
  provider: text("provider").$type<PaymentProvider>().notNull(),
  type: text("type").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }).defaultNow().notNull(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));

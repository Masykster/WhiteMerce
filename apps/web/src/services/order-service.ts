import { and, count, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import type { OrderStatus } from "@whitemerce/shared/constants";
import type { AnalyticsOverviewDto, OrderDto } from "@whitemerce/shared/types";
import type { OrderLookupInput } from "@whitemerce/shared/schemas";
import { db } from "@/db";
import { orderItems, orders, products, productVariants } from "@/db/schema";

export function mapOrderRow(
  order: typeof orders.$inferSelect,
  items: Array<typeof orderItems.$inferSelect>,
): OrderDto {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerEmail: order.customerEmail,
    customerName: order.customerName,
    shippingAddress: order.shippingAddress,
    currency: order.currency,
    exchangeRate: order.exchangeRate,
    subtotalAmount: order.subtotalAmount,
    shippingAmount: order.shippingAmount,
    taxAmount: order.taxAmount,
    totalAmount: order.totalAmount,
    totalUsdCents: order.totalUsdCents,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentProvider: order.paymentProvider,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: items.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      productName: item.productName,
      variantName: item.variantName,
      sku: item.sku,
      unitPriceAmount: item.unitPriceAmount,
      unitPriceUsdCents: item.unitPriceUsdCents,
      quantity: item.quantity,
      lineTotalAmount: item.lineTotalAmount,
    })),
  };
}

export async function findOrderByLookup(
  input: OrderLookupInput,
): Promise<OrderDto | null> {
  let orderRow: typeof orders.$inferSelect | undefined;

  if (input.sessionId) {
    const [row] = await db
      .select()
      .from(orders)
      .where(eq(orders.stripeSessionId, input.sessionId))
      .limit(1);
    orderRow = row;
  } else if (input.orderNumber && input.email) {
    const [row] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.orderNumber, input.orderNumber.toUpperCase()),
          eq(orders.customerEmail, input.email.toLowerCase()),
        ),
      )
      .limit(1);
    orderRow = row;
  }

  if (!orderRow) {
    return null;
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderRow.id));

  return mapOrderRow(orderRow, items);
}

export async function getOrderById(id: string): Promise<OrderDto | null> {
  const [orderRow] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, id))
    .limit(1);

  if (!orderRow) {
    return null;
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderRow.id));

  return mapOrderRow(orderRow, items);
}

export async function listAdminOrders(filter?: {
  status?: OrderStatus;
  limit?: number;
}): Promise<Array<Omit<OrderDto, "items" | "shippingAddress">>> {
  const whereClause = filter?.status ? eq(orders.status, filter.status) : undefined;
  const rows = await db
    .select()
    .from(orders)
    .where(whereClause)
    .orderBy(desc(orders.createdAt))
    .limit(filter?.limit ?? 50);

  return rows.map((row) => ({
    id: row.id,
    orderNumber: row.orderNumber,
    customerEmail: row.customerEmail,
    customerName: row.customerName,
    currency: row.currency,
    exchangeRate: row.exchangeRate,
    subtotalAmount: row.subtotalAmount,
    shippingAmount: row.shippingAmount,
    taxAmount: row.taxAmount,
    totalAmount: row.totalAmount,
    totalUsdCents: row.totalUsdCents,
    status: row.status,
    paymentStatus: row.paymentStatus,
    paymentProvider: row.paymentProvider,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<OrderDto | null> {
  const [updated] = await db
    .update(orders)
    .set({
      status,
      updatedAt: sql`now()`,
    })
    .where(eq(orders.id, id))
    .returning();

  if (!updated) {
    return null;
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, updated.id));

  return mapOrderRow(updated, items);
}

export function aggregateDailyRevenue(
  paidOrders: Array<{ createdAt: Date; totalUsdCents: number }>,
  days = 14,
  now = new Date(),
) {
  const buckets = new Map<string, { revenueUsdCents: number; ordersCount: number }>();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const d = new Date(now);
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - offset);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, { revenueUsdCents: 0, ordersCount: 0 });
  }

  for (const order of paidOrders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.revenueUsdCents += order.totalUsdCents;
      bucket.ordersCount += 1;
    }
  }

  return Array.from(buckets.entries()).map(([date, data]) => ({
    date,
    revenueUsdCents: data.revenueUsdCents,
    ordersCount: data.ordersCount,
  }));
}

export async function getAnalyticsOverview(): Promise<AnalyticsOverviewDto> {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setUTCHours(0, 0, 0, 0);
  fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 13);

  const [
    paidAgg,
    pendingAgg,
    activeProductsAgg,
    lowStockAgg,
    recentPaidOrders,
    recentOrders,
  ] = await Promise.all([
    db
      .select({
        totalRevenueUsdCents: sql<number>`coalesce(sum(${orders.totalUsdCents}), 0)`,
        paidOrdersCount: count(),
      })
      .from(orders)
      .where(eq(orders.paymentStatus, "paid")),
    db
      .select({ pendingOrdersCount: count() })
      .from(orders)
      .where(inArray(orders.status, ["pending", "processing"])),
    db
      .select({ activeProductsCount: count() })
      .from(products)
      .where(eq(products.status, "active")),
    db
      .select({ lowStockVariantsCount: count() })
      .from(productVariants)
      .where(lte(productVariants.stock, 5)),
    db
      .select({
        createdAt: orders.createdAt,
        totalUsdCents: orders.totalUsdCents,
      })
      .from(orders)
      .where(
        and(
          eq(orders.paymentStatus, "paid"),
          gte(orders.createdAt, fourteenDaysAgo),
        ),
      ),
    listAdminOrders({ limit: 8 }),
  ]);

  return {
    totalRevenueUsdCents: Number(paidAgg[0]?.totalRevenueUsdCents ?? 0),
    paidOrdersCount: Number(paidAgg[0]?.paidOrdersCount ?? 0),
    pendingOrdersCount: Number(pendingAgg[0]?.pendingOrdersCount ?? 0),
    activeProductsCount: Number(activeProductsAgg[0]?.activeProductsCount ?? 0),
    lowStockVariantsCount: Number(lowStockAgg[0]?.lowStockVariantsCount ?? 0),
    dailyRevenue: aggregateDailyRevenue(recentPaidOrders, 14),
    recentOrders,
  };
}

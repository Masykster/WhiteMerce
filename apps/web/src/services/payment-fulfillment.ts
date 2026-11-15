import { and, eq, gte, sql } from "drizzle-orm";
import type { PaymentProvider } from "@whitemerce/shared/constants";
import type { OrderDto } from "@whitemerce/shared/types";
import { db } from "@/db";
import { orderItems, orders, productVariants, webhookEvents } from "@/db/schema";
import { mapOrderRow } from "./order-service";

export class FulfillmentError extends Error {
  readonly status: number;

  constructor(message: string, status = 409) {
    super(message);
    this.name = "FulfillmentError";
    this.status = status;
  }
}

export interface FulfillmentResult {
  duplicate: boolean;
  order: OrderDto | null;
}

export interface FulfillmentDeps {
  hasProcessedEvent(eventId: string): Promise<boolean>;
  recordEvent(eventId: string, provider: PaymentProvider, type: string): Promise<void>;
  findOrderById(orderId: string): Promise<typeof orders.$inferSelect | null>;
  findOrderItems(orderId: string): Promise<Array<typeof orderItems.$inferSelect>>;
  decrementVariantStock(variantId: string, quantity: number): Promise<boolean>;
  markOrderPaid(
    orderId: string,
    stripePaymentIntentId?: string | null,
  ): Promise<typeof orders.$inferSelect | null>;
  markOrderCancelled(orderId: string): Promise<typeof orders.$inferSelect | null>;
}

function createDrizzleFulfillmentDeps(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
): FulfillmentDeps {
  return {
    async hasProcessedEvent(eventId) {
      const [existing] = await tx
        .select({ id: webhookEvents.id })
        .from(webhookEvents)
        .where(eq(webhookEvents.id, eventId))
        .limit(1);
      return Boolean(existing);
    },
    async recordEvent(eventId, provider, type) {
      await tx
        .insert(webhookEvents)
        .values({ id: eventId, provider, type })
        .onConflictDoNothing({ target: webhookEvents.id });
    },
    async findOrderById(orderId) {
      const [row] = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);
      return row ?? null;
    },
    async findOrderItems(orderId) {
      return tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));
    },
    async decrementVariantStock(variantId, quantity) {
      const [updated] = await tx
        .update(productVariants)
        .set({
          stock: sql`${productVariants.stock} - ${quantity}`,
        })
        .where(
          and(
            eq(productVariants.id, variantId),
            gte(productVariants.stock, quantity),
          ),
        )
        .returning({ id: productVariants.id });
      return Boolean(updated);
    },
    async markOrderPaid(orderId, stripePaymentIntentId) {
      const [updated] = await tx
        .update(orders)
        .set({
          paymentStatus: "paid",
          status: "processing",
          stripePaymentIntentId: stripePaymentIntentId ?? null,
          updatedAt: sql`now()`,
        })
        .where(eq(orders.id, orderId))
        .returning();
      return updated ?? null;
    },
    async markOrderCancelled(orderId) {
      const [updated] = await tx
        .update(orders)
        .set({
          paymentStatus: "failed",
          status: "cancelled",
          updatedAt: sql`now()`,
        })
        .where(eq(orders.id, orderId))
        .returning();
      return updated ?? null;
    },
  };
}

export async function processPaidOrderWithDeps(
  deps: FulfillmentDeps,
  params: {
    eventId: string;
    provider: PaymentProvider;
    eventType: string;
    orderId: string;
    stripePaymentIntentId?: string | null;
  },
): Promise<FulfillmentResult> {
  if (await deps.hasProcessedEvent(params.eventId)) {
    const existing = await deps.findOrderById(params.orderId);
    const items = existing ? await deps.findOrderItems(existing.id) : [];
    return {
      duplicate: true,
      order: existing ? mapOrderRow(existing, items) : null,
    };
  }

  const order = await deps.findOrderById(params.orderId);
  if (!order) {
    throw new FulfillmentError("Order not found for fulfillment", 404);
  }

  if (order.paymentStatus === "paid") {
    await deps.recordEvent(params.eventId, params.provider, params.eventType);
    const items = await deps.findOrderItems(order.id);
    return { duplicate: true, order: mapOrderRow(order, items) };
  }

  const items = await deps.findOrderItems(order.id);
  for (const item of items) {
    if (item.variantId) {
      const decremented = await deps.decrementVariantStock(
        item.variantId,
        item.quantity,
      );
      if (!decremented) {
        throw new FulfillmentError(
          `Insufficient stock to fulfill ${item.productName} (${item.variantName})`,
          409,
        );
      }
    }
  }

  const updated = await deps.markOrderPaid(
    order.id,
    params.stripePaymentIntentId,
  );
  await deps.recordEvent(params.eventId, params.provider, params.eventType);

  return {
    duplicate: false,
    order: updated ? mapOrderRow(updated, items) : null,
  };
}

export async function processCancelledOrderWithDeps(
  deps: FulfillmentDeps,
  params: {
    eventId: string;
    provider: PaymentProvider;
    eventType: string;
    orderId: string;
  },
): Promise<FulfillmentResult> {
  if (await deps.hasProcessedEvent(params.eventId)) {
    const existing = await deps.findOrderById(params.orderId);
    const items = existing ? await deps.findOrderItems(existing.id) : [];
    return {
      duplicate: true,
      order: existing ? mapOrderRow(existing, items) : null,
    };
  }

  const order = await deps.findOrderById(params.orderId);
  if (!order) {
    throw new FulfillmentError("Order not found", 404);
  }

  const items = await deps.findOrderItems(order.id);
  if (order.paymentStatus === "paid") {
    await deps.recordEvent(params.eventId, params.provider, params.eventType);
    return { duplicate: true, order: mapOrderRow(order, items) };
  }

  const updated = await deps.markOrderCancelled(order.id);
  await deps.recordEvent(params.eventId, params.provider, params.eventType);
  return {
    duplicate: false,
    order: updated ? mapOrderRow(updated, items) : null,
  };
}

export async function fulfillPaidOrder(params: {
  eventId: string;
  provider: PaymentProvider;
  eventType: string;
  orderId: string;
  stripePaymentIntentId?: string | null;
}): Promise<FulfillmentResult> {
  return db.transaction(async (tx) => {
    const deps = createDrizzleFulfillmentDeps(tx);
    return processPaidOrderWithDeps(deps, params);
  });
}

export async function cancelUnpaidOrder(params: {
  eventId: string;
  provider: PaymentProvider;
  eventType: string;
  orderId: string;
}): Promise<FulfillmentResult> {
  return db.transaction(async (tx) => {
    const deps = createDrizzleFulfillmentDeps(tx);
    return processCancelledOrderWithDeps(deps, params);
  });
}

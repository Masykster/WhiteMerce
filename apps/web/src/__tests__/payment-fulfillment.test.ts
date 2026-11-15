import { describe, expect, it } from "vitest";
import type { orderItems, orders } from "@/db/schema";
import {
  FulfillmentError,
  processPaidOrderWithDeps,
  type FulfillmentDeps,
} from "../services/payment-fulfillment";

function createMockDeps(stockStart = 5): {
  deps: FulfillmentDeps;
  getStock: () => number;
  getOrder: () => typeof orders.$inferSelect;
} {
  let stock = stockStart;
  const processedEvents = new Set<string>();
  let orderRow: typeof orders.$inferSelect = {
    id: "order-1",
    orderNumber: "WM-20261115-ABC123",
    userId: null,
    customerEmail: "buyer@example.com",
    customerName: "Buyer",
    shippingAddress: {
      line1: "100 Main St",
      city: "Jakarta",
      state: "DKI",
      postalCode: "12190",
      country: "Indonesia",
    },
    currency: "USD",
    exchangeRate: 1,
    subtotalAmount: 9600,
    shippingAmount: 1200,
    taxAmount: 768,
    totalAmount: 11568,
    totalUsdCents: 11568,
    status: "pending",
    paymentStatus: "unpaid",
    paymentProvider: "dev",
    devPaymentToken: "tok",
    stripeSessionId: null,
    stripePaymentIntentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const items: Array<typeof orderItems.$inferSelect> = [
    {
      id: "item-1",
      orderId: "order-1",
      productId: "prod-1",
      variantId: "var-1",
      productName: "Alabaster Tee",
      variantName: "Ivory / M",
      sku: "WM-TEE-IVR-M",
      unitPriceAmount: 4800,
      unitPriceUsdCents: 4800,
      quantity: 2,
      lineTotalAmount: 9600,
    },
  ];

  const deps: FulfillmentDeps = {
    async hasProcessedEvent(eventId) {
      return processedEvents.has(eventId);
    },
    async recordEvent(eventId) {
      processedEvents.add(eventId);
    },
    async findOrderById(id) {
      return id === orderRow.id ? orderRow : null;
    },
    async findOrderItems() {
      return items;
    },
    async decrementVariantStock(_variantId, quantity) {
      if (stock < quantity) {
        return false;
      }
      stock -= quantity;
      return true;
    },
    async markOrderPaid(_orderId, pi) {
      orderRow = {
        ...orderRow,
        paymentStatus: "paid",
        status: "processing",
        stripePaymentIntentId: pi ?? null,
      };
      return orderRow;
    },
    async markOrderCancelled() {
      orderRow = { ...orderRow, paymentStatus: "failed", status: "cancelled" };
      return orderRow;
    },
  };

  return {
    deps,
    getStock: () => stock,
    getOrder: () => orderRow,
  };
}

describe("payment-fulfillment idempotency & stock atomicity", () => {
  it("decrements stock once and ignores duplicate webhook events", async () => {
    const mock = createMockDeps(5);

    const first = await processPaidOrderWithDeps(mock.deps, {
      eventId: "evt_1",
      provider: "stripe",
      eventType: "checkout.session.completed",
      orderId: "order-1",
      stripePaymentIntentId: "pi_1",
    });

    expect(first.duplicate).toBe(false);
    expect(first.order?.paymentStatus).toBe("paid");
    expect(mock.getStock()).toBe(3);

    const second = await processPaidOrderWithDeps(mock.deps, {
      eventId: "evt_1",
      provider: "stripe",
      eventType: "checkout.session.completed",
      orderId: "order-1",
    });

    expect(second.duplicate).toBe(true);
    expect(mock.getStock()).toBe(3);
  });

  it("throws 409 when variant stock cannot satisfy order quantity", async () => {
    const mock = createMockDeps(1);

    await expect(
      processPaidOrderWithDeps(mock.deps, {
        eventId: "evt_low",
        provider: "dev",
        eventType: "dev.checkout.completed",
        orderId: "order-1",
      }),
    ).rejects.toThrow(FulfillmentError);
  });
});

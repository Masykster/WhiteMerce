import { randomBytes } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import type { PaymentProvider } from "@whitemerce/shared/constants";
import {
  calculateOrderTotalsInCurrency,
  convertUsdCentsToDisplayAmount,
  toStripeUnitAmount,
} from "@whitemerce/shared/money";
import type {
  CheckoutRequestInput,
  DevConfirmCheckoutInput,
} from "@whitemerce/shared/schemas";
import type {
  CheckoutSessionResponseDto,
  OrderDto,
} from "@whitemerce/shared/types";
import { db } from "@/db";
import { orderItems, orders, products, productVariants } from "@/db/schema";
import { getCurrencyRates, getEnv, isDevCheckoutAllowed } from "@/lib/env";
import { getStripeClient } from "@/lib/stripe";
import {
  cancelUnpaidOrder,
  fulfillPaidOrder,
} from "./payment-fulfillment";
import { mapOrderRow } from "./order-service";

export class CheckoutError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "CheckoutError";
    this.status = status;
  }
}

export interface PricedCatalogVariant {
  productId: string;
  productName: string;
  productStatus: string;
  variantId: string;
  variantName: string;
  sku: string;
  priceCents: number; // USD cents
  stock: number;
}

export function mergeRequestedCartQuantities(
  items: CheckoutRequestInput["items"],
): Array<{ productId: string; variantId: string; quantity: number }> {
  const byVariant = new Map<
    string,
    { productId: string; variantId: string; quantity: number }
  >();
  for (const item of items) {
    const existing = byVariant.get(item.variantId);
    if (existing) {
      if (existing.productId !== item.productId) {
        throw new CheckoutError("Mismatched product and variant combination", 400);
      }
      existing.quantity = Math.min(99, existing.quantity + item.quantity);
    } else {
      byVariant.set(item.variantId, { ...item });
    }
  }
  return Array.from(byVariant.values());
}

export function buildServerValidatedOrderData(
  input: CheckoutRequestInput,
  catalogVariants: PricedCatalogVariant[],
  rates = getCurrencyRates(),
) {
  const mergedItems = mergeRequestedCartQuantities(input.items);
  const variantMap = new Map(catalogVariants.map((v) => [v.variantId, v]));

  const pricedItems = mergedItems.map((requested) => {
    const variant = variantMap.get(requested.variantId);
    if (!variant || variant.productId !== requested.productId) {
      throw new CheckoutError("One or more cart items are no longer available", 404);
    }
    if (variant.productStatus !== "active") {
      throw new CheckoutError(
        `${variant.productName} is currently unavailable for purchase`,
        409,
      );
    }
    if (variant.stock < requested.quantity) {
      throw new CheckoutError(
        `Insufficient stock for ${variant.productName} (${variant.variantName}). Available: ${variant.stock}`,
        409,
      );
    }

    const unitPriceAmount = convertUsdCentsToDisplayAmount(
      variant.priceCents,
      input.currency,
      rates,
    );

    return {
      productId: variant.productId,
      variantId: variant.variantId,
      productName: variant.productName,
      variantName: variant.variantName,
      sku: variant.sku,
      unitPriceUsdCents: variant.priceCents,
      unitPriceAmount,
      quantity: requested.quantity,
      lineTotalAmount: unitPriceAmount * requested.quantity,
    };
  });

  const totals = calculateOrderTotalsInCurrency(
    pricedItems.map((item) => ({
      unitPriceUsdCents: item.unitPriceUsdCents,
      quantity: item.quantity,
    })),
    input.currency,
    rates,
  );

  return { pricedItems, totals };
}

function generateOrderNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = randomBytes(3).toString("hex").toUpperCase();
  return `WM-${datePart}-${randomPart}`;
}

export async function createCheckoutSession(
  input: CheckoutRequestInput,
): Promise<CheckoutSessionResponseDto> {
  const env = getEnv();
  const rates = getCurrencyRates();
  const stripe = getStripeClient();
  const devAllowed = isDevCheckoutAllowed();

  const paymentProvider: PaymentProvider = stripe
    ? "stripe"
    : devAllowed
      ? "dev"
      : (() => {
          throw new CheckoutError(
            "Payment gateway is not configured on the server.",
            503,
          );
        })();

  const variantIds = Array.from(new Set(input.items.map((item) => item.variantId)));
  const dbRows = await db
    .select({
      productId: products.id,
      productName: products.name,
      productStatus: products.status,
      variantId: productVariants.id,
      variantName: productVariants.name,
      sku: productVariants.sku,
      priceCents: productVariants.priceCents,
      stock: productVariants.stock,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(inArray(productVariants.id, variantIds));

  const { pricedItems, totals } = buildServerValidatedOrderData(
    input,
    dbRows,
    rates,
  );

  const orderNumber = generateOrderNumber();
  const devToken =
    paymentProvider === "dev" ? randomBytes(24).toString("hex") : null;

  const createdOrder = await db.transaction(async (tx) => {
    const [inserted] = await tx
      .insert(orders)
      .values({
        orderNumber,
        customerEmail: input.customerEmail.toLowerCase(),
        customerName: input.customerName,
        shippingAddress: input.shippingAddress,
        currency: totals.currency,
        exchangeRate: totals.exchangeRate,
        subtotalAmount: totals.subtotalAmount,
        shippingAmount: totals.shippingAmount,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        totalUsdCents: totals.totalUsdCents,
        status: "pending",
        paymentStatus: "unpaid",
        paymentProvider,
        devPaymentToken: devToken,
      })
      .returning();

    if (!inserted) {
      throw new CheckoutError("Failed to create order", 500);
    }

    await tx.insert(orderItems).values(
      pricedItems.map((item) => ({
        orderId: inserted.id,
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
    );

    return inserted;
  });

  if (paymentProvider === "stripe" && stripe) {
    const lineItems = pricedItems.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: totals.currency.toLowerCase(),
        unit_amount: toStripeUnitAmount(item.unitPriceAmount, totals.currency),
        product_data: {
          name: `${item.productName} — ${item.variantName}`,
          metadata: { sku: item.sku },
        },
      },
    }));

    if (totals.shippingAmount > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: totals.currency.toLowerCase(),
          unit_amount: toStripeUnitAmount(totals.shippingAmount, totals.currency),
          product_data: {
            name: "Standard Shipping",
            metadata: { sku: "SHIPPING" },
          },
        },
      });
    }

    if (totals.taxAmount > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: totals.currency.toLowerCase(),
          unit_amount: toStripeUnitAmount(totals.taxAmount, totals.currency),
          product_data: {
            name: "Estimated Tax (8%)",
            metadata: { sku: "TAX" },
          },
        },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: createdOrder.customerEmail,
      line_items: lineItems,
      metadata: {
        orderId: createdOrder.id,
        orderNumber: createdOrder.orderNumber,
      },
      success_url: `${env.STOREFRONT_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.STOREFRONT_URL}/checkout/cancel?orderNumber=${encodeURIComponent(createdOrder.orderNumber)}`,
    });

    await db
      .update(orders)
      .set({ stripeSessionId: session.id })
      .where(eq(orders.id, createdOrder.id));

    if (!session.url) {
      throw new CheckoutError("Stripe did not return a checkout URL", 502);
    }

    return {
      orderNumber: createdOrder.orderNumber,
      checkoutUrl: session.url,
      paymentProvider: "stripe",
      currency: totals.currency,
      totalAmount: totals.totalAmount,
    };
  }

  const checkoutUrl = `${env.STOREFRONT_URL}/checkout/dev-pay?orderNumber=${encodeURIComponent(
    createdOrder.orderNumber,
  )}&token=${encodeURIComponent(devToken ?? "")}`;

  return {
    orderNumber: createdOrder.orderNumber,
    checkoutUrl,
    paymentProvider: "dev",
    currency: totals.currency,
    totalAmount: totals.totalAmount,
  };
}

export async function getDevCheckoutPreview(
  orderNumber: string,
  token: string,
): Promise<OrderDto> {
  if (!isDevCheckoutAllowed()) {
    throw new CheckoutError(
      "Development test checkout is disabled in this environment.",
      403,
    );
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.orderNumber, orderNumber.toUpperCase()),
        eq(orders.paymentProvider, "dev"),
      ),
    )
    .limit(1);

  if (!order || !order.devPaymentToken || order.devPaymentToken !== token) {
    throw new CheckoutError("Invalid or expired dev checkout session", 404);
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  return mapOrderRow(order, items);
}

export async function confirmDevCheckout(
  input: DevConfirmCheckoutInput,
): Promise<OrderDto> {
  if (!isDevCheckoutAllowed()) {
    throw new CheckoutError(
      "Development test checkout is disabled in this environment.",
      403,
    );
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.orderNumber, input.orderNumber.toUpperCase()),
        eq(orders.paymentProvider, "dev"),
      ),
    )
    .limit(1);

  if (!order) {
    throw new CheckoutError("Order not found for dev checkout", 404);
  }

  if (!order.devPaymentToken || order.devPaymentToken !== input.token) {
    throw new CheckoutError("Invalid dev payment confirmation token", 403);
  }

  const eventId = `dev_${input.action}_${order.id}`;
  const result =
    input.action === "cancel"
      ? await cancelUnpaidOrder({
          eventId,
          provider: "dev",
          eventType: "dev.checkout.cancelled",
          orderId: order.id,
        })
      : await fulfillPaidOrder({
          eventId,
          provider: "dev",
          eventType: "dev.checkout.completed",
          orderId: order.id,
        });

  if (!result.order) {
    throw new CheckoutError("Order could not be processed", 500);
  }

  return result.order;
}

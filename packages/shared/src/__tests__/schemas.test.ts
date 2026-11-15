import { describe, expect, it } from "vitest";
import {
  checkoutRequestSchema,
  orderLookupSchema,
  productMutationSchema,
} from "../schemas";

describe("shared Zod schemas", () => {
  it("validates checkout request and defaults currency to USD", () => {
    const parsed = checkoutRequestSchema.parse({
      items: [
        {
          productId: "11111111-1111-4111-8111-111111111111",
          variantId: "22222222-2222-4222-8222-222222222222",
          quantity: 2,
        },
      ],
      customerName: "Alex Mercer",
      customerEmail: "alex@example.com",
      shippingAddress: {
        line1: "420 Minimalist Ave",
        city: "Jakarta",
        state: "DKI Jakarta",
        postalCode: "12190",
        country: "Indonesia",
      },
    });

    expect(parsed.currency).toBe("USD");
  });

  it("rejects empty cart and invalid product slug", () => {
    const emptyCart = checkoutRequestSchema.safeParse({
      items: [],
      currency: "IDR",
      customerName: "Alex",
      customerEmail: "alex@example.com",
      shippingAddress: {
        line1: "420 Minimalist Ave",
        city: "Jakarta",
        state: "DKI",
        postalCode: "12190",
        country: "ID",
      },
    });
    expect(emptyCart.success).toBe(false);

    const badProduct = productMutationSchema.safeParse({
      name: "White Tee",
      slug: "Invalid Slug!",
      description: "Clean heavyweight organic cotton tee.",
      basePriceCents: 4500,
      status: "active",
      featured: true,
      images: ["/images/products/tee.svg"],
      variants: [
        {
          sku: "WM-TEE-BLK-M",
          name: "Black / M",
          options: { color: "Black", size: "M" },
          priceCents: 4500,
          stock: 10,
          isDefault: true,
        },
      ],
    });
    expect(badProduct.success).toBe(false);
  });

  it("requires either sessionId or orderNumber + email for lookup", () => {
    expect(orderLookupSchema.safeParse({ orderNumber: "WM-1001" }).success).toBe(false);
    expect(
      orderLookupSchema.safeParse({
        orderNumber: "WM-1001",
        email: "alex@example.com",
      }).success,
    ).toBe(true);
    expect(orderLookupSchema.safeParse({ sessionId: "cs_test_123456" }).success).toBe(true);
  });
});

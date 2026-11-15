import { describe, expect, it } from "vitest";
import {
  buildServerValidatedOrderData,
  CheckoutError,
  mergeRequestedCartQuantities,
  type PricedCatalogVariant,
} from "../services/checkout-service";

const sampleCatalog: PricedCatalogVariant[] = [
  {
    productId: "11111111-1111-4111-8111-111111111111",
    productName: "Alabaster Tee",
    productStatus: "active",
    variantId: "22222222-2222-4222-8222-222222222222",
    variantName: "Ivory / M",
    sku: "WM-TEE-IVR-M",
    priceCents: 4800,
    stock: 5,
  },
  {
    productId: "33333333-3333-4333-8333-333333333333",
    productName: "Draft Jacket",
    productStatus: "draft",
    variantId: "44444444-4444-4444-8444-444444444444",
    variantName: "Stone / L",
    sku: "WM-OVR-STN-L",
    priceCents: 14500,
    stock: 10,
  },
];

describe("checkout-service validation & pricing", () => {
  it("merges duplicate variant line items before validating stock", () => {
    const merged = mergeRequestedCartQuantities([
      {
        productId: "11111111-1111-4111-8111-111111111111",
        variantId: "22222222-2222-4222-8222-222222222222",
        quantity: 2,
      },
      {
        productId: "11111111-1111-4111-8111-111111111111",
        variantId: "22222222-2222-4222-8222-222222222222",
        quantity: 4,
      },
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.quantity).toBe(6);

    expect(() =>
      buildServerValidatedOrderData(
        {
          items: merged,
          currency: "USD",
          customerName: "Maya",
          customerEmail: "maya@example.com",
          shippingAddress: {
            line1: "123 Elm",
            city: "NYC",
            state: "NY",
            postalCode: "10001",
            country: "US",
          },
        },
        sampleCatalog,
        { USD: 1, IDR: 16_000 },
      ),
    ).toThrow(CheckoutError);
  });

  it("computes authoritative IDR prices from canonical USD cents", () => {
    const { pricedItems, totals } = buildServerValidatedOrderData(
      {
        items: [
          {
            productId: "11111111-1111-4111-8111-111111111111",
            variantId: "22222222-2222-4222-8222-222222222222",
            quantity: 2,
          },
        ],
        currency: "IDR",
        customerName: "Budi",
        customerEmail: "budi@example.co.id",
        shippingAddress: {
          line1: "Jl. Senopati 10",
          city: "Jakarta",
          state: "DKI",
          postalCode: "12190",
          country: "Indonesia",
        },
      },
      sampleCatalog,
      { USD: 1, IDR: 16_000 },
    );

    expect(pricedItems[0]?.unitPriceAmount).toBe(768_000);
    expect(totals.currency).toBe("IDR");
    expect(totals.subtotalAmount).toBe(1_536_000);
    expect(totals.totalUsdCents).toBe(11_568);
  });

  it("rejects non-active products", () => {
    expect(() =>
      buildServerValidatedOrderData(
        {
          items: [
            {
              productId: "33333333-3333-4333-8333-333333333333",
              variantId: "44444444-4444-4444-8444-444444444444",
              quantity: 1,
            },
          ],
          currency: "USD",
          customerName: "Maya",
          customerEmail: "maya@example.com",
          shippingAddress: {
            line1: "123 Elm",
            city: "NYC",
            state: "NY",
            postalCode: "10001",
            country: "US",
          },
        },
        sampleCatalog,
        { USD: 1, IDR: 16_000 },
      ),
    ).toThrow(/unavailable/);
  });
});

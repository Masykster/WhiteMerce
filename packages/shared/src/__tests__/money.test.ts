import { describe, expect, it } from "vitest";
import {
  calculateOrderTotalsInCurrency,
  convertUsdCentsToDisplayAmount,
  formatOrderAmount,
  formatPriceFromUsdCents,
  normalizeCurrency,
  toStripeUnitAmount,
} from "../money";

describe("money & multi-currency helpers", () => {
  it("normalizes unknown currency to USD default", () => {
    expect(normalizeCurrency(undefined)).toBe("USD");
    expect(normalizeCurrency("eur")).toBe("USD");
    expect(normalizeCurrency("idr")).toBe("IDR");
    expect(normalizeCurrency("USD")).toBe("USD");
  });

  it("converts USD cents to IDR rounded to nearest 100 rupiah", () => {
    expect(convertUsdCentsToDisplayAmount(4900, "USD")).toBe(4900);
    expect(convertUsdCentsToDisplayAmount(4900, "IDR", { USD: 1, IDR: 16_000 })).toBe(
      784_000,
    );
  });

  it("formats USD and IDR prices cleanly", () => {
    expect(formatPriceFromUsdCents(4900, "USD")).toBe("$49.00");
    const idrFormatted = formatOrderAmount(784_000, "IDR");
    expect(idrFormatted).toContain("784.000");
  });

  it("multiplies IDR amounts by 100 for Stripe two-decimal API units", () => {
    expect(toStripeUnitAmount(4900, "USD")).toBe(4900);
    expect(toStripeUnitAmount(784_000, "IDR")).toBe(78_400_000);
  });

  it("calculates free shipping threshold & tax in both USD and IDR", () => {
    const underThreshold = calculateOrderTotalsInCurrency(
      [{ unitPriceUsdCents: 4900, quantity: 1 }],
      "USD",
    );
    expect(underThreshold.subtotalAmount).toBe(4900);
    expect(underThreshold.shippingAmount).toBe(1200);
    expect(underThreshold.taxAmount).toBe(392);
    expect(underThreshold.totalAmount).toBe(6492);
    expect(underThreshold.totalUsdCents).toBe(6492);

    const overThresholdIdr = calculateOrderTotalsInCurrency(
      [{ unitPriceUsdCents: 6000, quantity: 2 }],
      "IDR",
      { USD: 1, IDR: 16_000 },
    );
    expect(overThresholdIdr.shippingAmount).toBe(0);
    expect(overThresholdIdr.subtotalAmount).toBe(1_920_000);
    expect(overThresholdIdr.taxAmount).toBe(153_600);
    expect(overThresholdIdr.totalAmount).toBe(2_073_600);
    expect(overThresholdIdr.totalUsdCents).toBe(12_960);
  });
});

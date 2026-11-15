import {
  DEFAULT_CURRENCY,
  DEFAULT_CURRENCY_RATES,
  FLAT_SHIPPING_USD_CENTS,
  FREE_SHIPPING_THRESHOLD_USD_CENTS,
  SUPPORTED_CURRENCIES,
  TAX_RATE,
  type SupportedCurrency,
} from "./constants";

export interface CurrencyRateMap {
  USD: number;
  IDR: number;
}

export function normalizeCurrency(value?: string | null): SupportedCurrency {
  if (!value) {
    return DEFAULT_CURRENCY;
  }
  const upper = value.trim().toUpperCase();
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(upper)
    ? (upper as SupportedCurrency)
    : DEFAULT_CURRENCY;
}

export function resolveRates(
  idrRate?: number,
): CurrencyRateMap {
  const safeIdrRate =
    typeof idrRate === "number" && Number.isFinite(idrRate) && idrRate > 0
      ? idrRate
      : DEFAULT_CURRENCY_RATES.IDR;
  return {
    USD: 1,
    IDR: safeIdrRate,
  };
}

/**
 * Converts canonical USD cents into the display unit of the target currency:
 * - USD: integer cents (e.g. 4900 -> $49.00)
 * - IDR: integer whole Rupiah rounded to nearest 100 (e.g. 4900 cents * 16000 / 100 -> Rp 784.000)
 */
export function convertUsdCentsToDisplayAmount(
  usdCents: number,
  currency: SupportedCurrency,
  rates: CurrencyRateMap = DEFAULT_CURRENCY_RATES,
): number {
  if (currency === "USD") {
    return Math.round(usdCents);
  }
  const rawRupiah = (usdCents / 100) * rates.IDR;
  return Math.round(rawRupiah / 100) * 100;
}

/**
 * Formats an already-stored order amount:
 * - USD amounts are stored in cents -> divide by 100
 * - IDR amounts are stored in whole Rupiah -> formatted directly without decimals
 */
export function formatOrderAmount(
  amount: number,
  currency: SupportedCurrency,
): string {
  if (currency === "IDR") {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

export function formatPriceFromUsdCents(
  usdCents: number,
  currency: SupportedCurrency,
  rates: CurrencyRateMap = DEFAULT_CURRENCY_RATES,
): string {
  const converted = convertUsdCentsToDisplayAmount(usdCents, currency, rates);
  return formatOrderAmount(converted, currency);
}

/**
 * Stripe treats IDR as a two-decimal currency (smallest minor unit is `sen`),
 * so whole Rupiah amounts must be multiplied by 100 for Stripe Checkout `unit_amount`.
 */
export function toStripeUnitAmount(
  amount: number,
  currency: SupportedCurrency,
): number {
  if (currency === "IDR") {
    return Math.round(amount * 100);
  }
  return Math.round(amount);
}

export interface PricedUsdItem {
  unitPriceUsdCents: number;
  quantity: number;
}

export interface OrderTotalsBreakdown {
  currency: SupportedCurrency;
  exchangeRate: number;
  subtotalUsdCents: number;
  shippingUsdCents: number;
  taxUsdCents: number;
  totalUsdCents: number;
  subtotalAmount: number;
  shippingAmount: number;
  taxAmount: number;
  totalAmount: number;
}

export function calculateOrderTotalsInCurrency(
  items: PricedUsdItem[],
  currency: SupportedCurrency,
  rates: CurrencyRateMap = DEFAULT_CURRENCY_RATES,
): OrderTotalsBreakdown {
  const subtotalUsdCents = items.reduce(
    (sum, item) => sum + item.unitPriceUsdCents * item.quantity,
    0,
  );
  const shippingUsdCents =
    subtotalUsdCents === 0 || subtotalUsdCents >= FREE_SHIPPING_THRESHOLD_USD_CENTS
      ? 0
      : FLAT_SHIPPING_USD_CENTS;
  const taxUsdCents = Math.round(subtotalUsdCents * TAX_RATE);
  const totalUsdCents = subtotalUsdCents + shippingUsdCents + taxUsdCents;

  if (currency === "USD") {
    return {
      currency,
      exchangeRate: 1,
      subtotalUsdCents,
      shippingUsdCents,
      taxUsdCents,
      totalUsdCents,
      subtotalAmount: subtotalUsdCents,
      shippingAmount: shippingUsdCents,
      taxAmount: taxUsdCents,
      totalAmount: totalUsdCents,
    };
  }

  const subtotalAmount = items.reduce(
    (sum, item) =>
      sum + convertUsdCentsToDisplayAmount(item.unitPriceUsdCents, "IDR", rates) * item.quantity,
    0,
  );
  const shippingAmount = convertUsdCentsToDisplayAmount(
    shippingUsdCents,
    "IDR",
    rates,
  );
  const taxAmount = Math.round((subtotalAmount * TAX_RATE) / 100) * 100;
  const totalAmount = subtotalAmount + shippingAmount + taxAmount;

  return {
    currency,
    exchangeRate: rates.IDR,
    subtotalUsdCents,
    shippingUsdCents,
    taxUsdCents,
    totalUsdCents,
    subtotalAmount,
    shippingAmount,
    taxAmount,
    totalAmount,
  };
}

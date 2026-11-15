export const SUPPORTED_CURRENCIES = ["USD", "IDR"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: SupportedCurrency = "USD";
export const CURRENCY_COOKIE_NAME = "wm_currency";

export const DEFAULT_CURRENCY_RATES: Record<SupportedCurrency, number> = {
  USD: 1,
  IDR: 16_000,
};

export const PRODUCT_STATUSES = ["draft", "active", "archived"] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const ORDER_STATUSES = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["unpaid", "paid", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_PROVIDERS = ["stripe", "dev"] as const;
export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

export const USER_ROLES = ["customer", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Canonical shipping & tax rules anchored to USD cents. */
export const FREE_SHIPPING_THRESHOLD_USD_CENTS = 10_000; // $100.00
export const FLAT_SHIPPING_USD_CENTS = 1_200; // $12.00
export const TAX_RATE = 0.08; // 8%

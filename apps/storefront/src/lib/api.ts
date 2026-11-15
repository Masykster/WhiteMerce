import type { AstroCookies } from "astro";
import { createWhiteMerceClient } from "@whitemerce/shared/client";
import {
  CURRENCY_COOKIE_NAME,
  DEFAULT_CURRENCY_RATES,
  type SupportedCurrency,
} from "@whitemerce/shared/constants";
import { normalizeCurrency, resolveRates } from "@whitemerce/shared/money";

export function getPublicApiBaseUrl(): string {
  return (
    import.meta.env.PUBLIC_API_URL ||
    (typeof process !== "undefined" ? process.env.PUBLIC_API_URL : undefined) ||
    "http://localhost:3000"
  );
}

export function getServerApiBaseUrl(): string {
  return (
    (typeof process !== "undefined" ? process.env.API_INTERNAL_URL : undefined) ||
    import.meta.env.PUBLIC_API_URL ||
    "http://localhost:3000"
  );
}

export function getUsdToIdrRate(): number {
  const raw =
    import.meta.env.PUBLIC_USD_TO_IDR_RATE ||
    (typeof process !== "undefined"
      ? process.env.PUBLIC_USD_TO_IDR_RATE
      : undefined);
  const parsed = raw ? Number(raw) : DEFAULT_CURRENCY_RATES.IDR;
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_CURRENCY_RATES.IDR;
}

export function getCurrencyRates() {
  return resolveRates(getUsdToIdrRate());
}

export function getCurrencyFromCookies(cookies: AstroCookies): SupportedCurrency {
  const value = cookies.get(CURRENCY_COOKIE_NAME)?.value;
  return normalizeCurrency(value);
}

export function createServerApiClient() {
  return createWhiteMerceClient({ baseUrl: getServerApiBaseUrl() });
}

export function createBrowserApiClient() {
  return createWhiteMerceClient({ baseUrl: getPublicApiBaseUrl() });
}

import { atom } from "nanostores";
import {
  CURRENCY_COOKIE_NAME,
  DEFAULT_CURRENCY,
  type SupportedCurrency,
} from "@whitemerce/shared/constants";
import { normalizeCurrency } from "@whitemerce/shared/money";

const STORAGE_KEY = "whitemerce.currency";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1] ?? "") : null;
}

function readInitialCurrency(): SupportedCurrency {
  if (typeof window === "undefined") {
    return DEFAULT_CURRENCY;
  }

  const fromCookie = readCookie(CURRENCY_COOKIE_NAME);
  if (fromCookie) {
    return normalizeCurrency(fromCookie);
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return normalizeCurrency(stored);
  } catch {
    return DEFAULT_CURRENCY;
  }
}

export const $currency = atom<SupportedCurrency>(readInitialCurrency());

export function hydrateCurrencyFromServer(serverCurrency: SupportedCurrency) {
  if ($currency.get() !== serverCurrency) {
    $currency.set(serverCurrency);
  }
}

export function setCurrency(next: SupportedCurrency) {
  const normalized = normalizeCurrency(next);
  $currency.set(normalized);

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, normalized);
    } catch {
      // Ignore storage quota / private mode errors
    }
  }

  if (typeof document !== "undefined") {
    document.cookie = `${CURRENCY_COOKIE_NAME}=${encodeURIComponent(normalized)}; Path=/; SameSite=Lax; Max-Age=31536000`;
  }
}

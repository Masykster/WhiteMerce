import { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import {
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@whitemerce/shared/constants";
import {
  $currency,
  hydrateCurrencyFromServer,
  setCurrency,
} from "@/stores/currency";

interface CurrencySwitcherProps {
  initialCurrency: SupportedCurrency;
}

export function CurrencySwitcher({ initialCurrency }: CurrencySwitcherProps) {
  const storeCurrency = useStore($currency);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    hydrateCurrencyFromServer(initialCurrency);
    setMounted(true);
  }, [initialCurrency]);

  const activeCurrency = mounted ? storeCurrency : initialCurrency;

  return (
    <div
      role="group"
      aria-label="Currency selector"
      className="inline-flex items-center rounded-full border border-stone-300 bg-white p-0.5 text-xs"
    >
      {SUPPORTED_CURRENCIES.map((code) => {
        const active = activeCurrency === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setCurrency(code)}
            className={`rounded-full px-2.5 py-1 font-medium transition ${
              active
                ? "bg-stone-950 text-white"
                : "text-stone-600 hover:text-stone-950"
            }`}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}

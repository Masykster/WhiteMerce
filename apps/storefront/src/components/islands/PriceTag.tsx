import { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import type { SupportedCurrency } from "@whitemerce/shared/constants";
import {
  formatPriceFromUsdCents,
  resolveRates,
} from "@whitemerce/shared/money";
import { $currency } from "@/stores/currency";

interface PriceTagProps {
  usdCents: number;
  initialCurrency: SupportedCurrency;
  idrRate: number;
  className?: string;
}

export function PriceTag({
  usdCents,
  initialCurrency,
  idrRate,
  className,
}: PriceTagProps) {
  const storeCurrency = useStore($currency);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeCurrency = mounted ? storeCurrency : initialCurrency;
  const rates = resolveRates(idrRate);

  return (
    <span className={className}>
      {formatPriceFromUsdCents(usdCents, activeCurrency, rates)}
    </span>
  );
}

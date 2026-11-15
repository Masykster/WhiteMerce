import { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import type { SupportedCurrency } from "@whitemerce/shared/constants";
import {
  formatPriceFromUsdCents,
  resolveRates,
} from "@whitemerce/shared/money";
import type { ProductDto } from "@whitemerce/shared/types";
import { addToCart, openCart } from "@/stores/cart";
import { $currency } from "@/stores/currency";

interface AddToCartPanelProps {
  product: ProductDto;
  initialCurrency: SupportedCurrency;
  idrRate: number;
}

export function AddToCartPanel({
  product,
  initialCurrency,
  idrRate,
}: AddToCartPanelProps) {
  const defaultVariant =
    product.variants.find((v) => v.isDefault) ?? product.variants[0];
  const [selectedId, setSelectedId] = useState(defaultVariant?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const storeCurrency = useStore($currency);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedVariant =
    product.variants.find((v) => v.id === selectedId) ?? defaultVariant;

  if (!selectedVariant) {
    return (
      <p className="text-sm text-stone-500">
        This product currently has no available variants.
      </p>
    );
  }

  const currency = mounted ? storeCurrency : initialCurrency;
  const rates = resolveRates(idrRate);
  const inStock = selectedVariant.stock > 0;

  function handleAdd() {
    if (!selectedVariant || selectedVariant.stock <= 0) return;

    addToCart({
      productId: product.id,
      variantId: selectedVariant.id,
      slug: product.slug,
      name: product.name,
      variantName: selectedVariant.name,
      sku: selectedVariant.sku,
      unitPriceUsdCents: selectedVariant.priceCents,
      quantity,
      imageUrl: product.images[0] ?? "/images/products/tee-ivory.svg",
      maxStock: selectedVariant.stock,
    });

    setJustAdded(true);
    openCart();
    setTimeout(() => setJustAdded(false), 1800);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between border-b border-stone-200 pb-4">
        <p className="text-2xl font-semibold tracking-tight text-stone-950">
          {formatPriceFromUsdCents(selectedVariant.priceCents, currency, rates)}
        </p>
        <span
          className={`text-xs font-medium ${
            inStock ? "text-emerald-700" : "text-red-600"
          }`}
        >
          {inStock ? `${selectedVariant.stock} in stock` : "Out of stock"}
        </span>
      </div>

      <div>
        <p className="mb-2.5 text-xs font-medium uppercase tracking-wider text-stone-500">
          Select Variant
        </p>
        <div className="flex flex-wrap gap-2">
          {product.variants.map((variant) => {
            const active = variant.id === selectedVariant.id;
            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => {
                  setSelectedId(variant.id);
                  setQuantity(1);
                }}
                className={`rounded-xl border px-3.5 py-2 text-xs font-medium transition ${
                  active
                    ? "border-stone-950 bg-stone-950 text-white"
                    : "border-stone-300 bg-white text-stone-800 hover:border-stone-950"
                }`}
              >
                {variant.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="inline-flex items-center rounded-full border border-stone-300 bg-white">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="p-3 text-stone-600 hover:text-stone-950"
            aria-label="Decrease quantity"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-8 text-center text-sm font-medium">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() =>
              setQuantity((q) =>
                Math.min(Math.max(1, selectedVariant.stock), q + 1),
              )
            }
            disabled={!inStock || quantity >= selectedVariant.stock}
            className="p-3 text-stone-600 hover:text-stone-950 disabled:opacity-40"
            aria-label="Increase quantity"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          disabled={!inStock}
          onClick={handleAdd}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-stone-950 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          {justAdded ? (
            <>
              <Check className="h-4 w-4" />
              Added to Bag
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" />
              {inStock ? "Add to Bag" : "Sold Out"}
            </>
          )}
        </button>
      </div>

      <p className="font-mono text-[11px] text-stone-400">
        SKU: {selectedVariant.sku}
      </p>
    </div>
  );
}

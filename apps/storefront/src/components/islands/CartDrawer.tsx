import { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import type { SupportedCurrency } from "@whitemerce/shared/constants";
import {
  formatPriceFromUsdCents,
  resolveRates,
} from "@whitemerce/shared/money";
import {
  $cartItems,
  $cartSubtotalUsdCents,
  $isCartOpen,
  closeCart,
  removeCartItem,
  updateCartItemQuantity,
} from "@/stores/cart";
import { $currency } from "@/stores/currency";

interface CartDrawerProps {
  initialCurrency: SupportedCurrency;
  idrRate: number;
}

export function CartDrawer({ initialCurrency, idrRate }: CartDrawerProps) {
  const isOpen = useStore($isCartOpen);
  const items = useStore($cartItems);
  const subtotalUsdCents = useStore($cartSubtotalUsdCents);
  const storeCurrency = useStore($currency);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) {
    return null;
  }

  const currency = storeCurrency ?? initialCurrency;
  const rates = resolveRates(idrRate);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close cart drawer"
        onClick={closeCart}
        className="fixed inset-0 bg-black/35 backdrop-blur-[1px]"
      />

      <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-5">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            <h2 className="text-base font-semibold tracking-tight">Your Bag</h2>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-full p-1.5 text-stone-500 transition hover:bg-stone-100 hover:text-stone-950"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-sm font-medium text-stone-800">
                Your WhiteMerce bag is empty.
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Explore our seasonal essentials and studio objects.
              </p>
              <a
                href="/products"
                onClick={closeCart}
                className="mt-5 rounded-full bg-stone-950 px-5 py-2.5 text-xs font-medium text-white hover:bg-stone-800"
              >
                Browse Catalog
              </a>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {items.map((item) => (
                <li key={item.variantId} className="flex gap-4 py-4">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-24 w-20 rounded-xl border border-stone-200 bg-stone-100 object-cover"
                  />
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <a
                          href={`/products/${item.slug}`}
                          onClick={closeCart}
                          className="text-sm font-medium text-stone-950 hover:underline"
                        >
                          {item.name}
                        </a>
                        <button
                          type="button"
                          onClick={() => removeCartItem(item.variantId)}
                          aria-label={`Remove ${item.name}`}
                          className="text-stone-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {item.variantName}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full border border-stone-300">
                        <button
                          type="button"
                          onClick={() =>
                            updateCartItemQuantity(item.variantId, item.quantity - 1)
                          }
                          aria-label="Decrease quantity"
                          className="p-1.5 text-stone-600 hover:text-stone-950"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2.5 text-xs font-medium">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateCartItemQuantity(item.variantId, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.maxStock}
                          aria-label="Increase quantity"
                          className="p-1.5 text-stone-600 hover:text-stone-950 disabled:opacity-40"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <span className="text-sm font-medium text-stone-950">
                        {formatPriceFromUsdCents(
                          item.unitPriceUsdCents * item.quantity,
                          currency,
                          rates,
                        )}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-stone-200 bg-stone-50 px-6 py-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-600">Subtotal ({currency})</span>
              <span className="text-base font-semibold text-stone-950">
                {formatPriceFromUsdCents(subtotalUsdCents, currency, rates)}
              </span>
            </div>
            <p className="mt-1 text-xs text-stone-500">
              Free shipping on orders over{" "}
              {formatPriceFromUsdCents(10_000, currency, rates)}.
            </p>
            <a
              href="/checkout"
              onClick={closeCart}
              className="mt-4 block w-full rounded-full bg-stone-950 py-3 text-center text-sm font-medium text-white transition hover:bg-stone-800"
            >
              Proceed to Checkout
            </a>
          </div>
        )}
      </aside>
    </div>
  );
}

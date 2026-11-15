import { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import { ShoppingBag } from "lucide-react";
import { $cartItemCount, openCart } from "@/stores/cart";

export function CartButton() {
  const count = useStore($cartItemCount);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const displayCount = mounted ? count : 0;

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Open shopping bag (${displayCount} items)`}
      className="relative inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-900 transition hover:border-stone-950"
    >
      <ShoppingBag className="h-3.5 w-3.5" />
      <span>Bag</span>
      <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-stone-950 px-1 text-[10px] font-semibold text-white">
        {displayCount}
      </span>
    </button>
  );
}

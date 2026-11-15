import { useEffect } from "react";
import { clearCart } from "@/stores/cart";

export function CartClearOnSuccess({ shouldClear }: { shouldClear: boolean }) {
  useEffect(() => {
    if (shouldClear) {
      clearCart();
    }
  }, [shouldClear]);

  return null;
}

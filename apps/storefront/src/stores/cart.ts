import { atom, computed } from "nanostores";
import type { CartItemDto } from "@whitemerce/shared/types";

const CART_STORAGE_KEY = "whitemerce.cart.v1";

function loadInitialCart(): CartItemDto[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (item): item is CartItemDto =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as CartItemDto).variantId === "string" &&
        typeof (item as CartItemDto).productId === "string" &&
        typeof (item as CartItemDto).unitPriceUsdCents === "number" &&
        typeof (item as CartItemDto).quantity === "number" &&
        (item as CartItemDto).quantity > 0,
    );
  } catch {
    return [];
  }
}

function persistCart(items: CartItemDto[]) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage errors
  }
}

export const $cartItems = atom<CartItemDto[]>(loadInitialCart());
export const $isCartOpen = atom<boolean>(false);

export const $cartItemCount = computed($cartItems, (items) =>
  items.reduce((sum, item) => sum + item.quantity, 0),
);

export const $cartSubtotalUsdCents = computed($cartItems, (items) =>
  items.reduce((sum, item) => sum + item.unitPriceUsdCents * item.quantity, 0),
);

export function openCart() {
  $isCartOpen.set(true);
}

export function closeCart() {
  $isCartOpen.set(false);
}

export function addToCart(incoming: CartItemDto) {
  const current = $cartItems.get();
  const existing = current.find((item) => item.variantId === incoming.variantId);
  const clampedIncomingQty = Math.max(
    1,
    Math.min(incoming.quantity, Math.max(1, incoming.maxStock)),
  );

  let next: CartItemDto[];
  if (existing) {
    next = current.map((item) =>
      item.variantId === incoming.variantId
        ? {
            ...item,
            maxStock: incoming.maxStock,
            unitPriceUsdCents: incoming.unitPriceUsdCents,
            quantity: Math.min(
              Math.max(1, incoming.maxStock),
              Math.min(99, item.quantity + clampedIncomingQty),
            ),
          }
        : item,
    );
  } else {
    next = [...current, { ...incoming, quantity: clampedIncomingQty }];
  }

  $cartItems.set(next);
  persistCart(next);
}

export function updateCartItemQuantity(variantId: string, quantity: number) {
  const current = $cartItems.get();
  if (quantity <= 0) {
    removeCartItem(variantId);
    return;
  }

  const next = current.map((item) =>
    item.variantId === variantId
      ? {
          ...item,
          quantity: Math.min(99, Math.min(Math.max(1, item.maxStock), quantity)),
        }
      : item,
  );

  $cartItems.set(next);
  persistCart(next);
}

export function removeCartItem(variantId: string) {
  const next = $cartItems.get().filter((item) => item.variantId !== variantId);
  $cartItems.set(next);
  persistCart(next);
}

export function clearCart() {
  $cartItems.set([]);
  persistCart([]);
}

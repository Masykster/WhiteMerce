import { beforeEach, describe, expect, it } from "vitest";
import {
  $cartItemCount,
  $cartItems,
  $cartSubtotalUsdCents,
  addToCart,
  clearCart,
  removeCartItem,
  updateCartItemQuantity,
} from "../stores/cart";

describe("Nanostores shopping cart", () => {
  beforeEach(() => {
    clearCart();
  });

  it("merges quantities for identical variants and respects stock cap", () => {
    addToCart({
      productId: "p1",
      variantId: "v1",
      slug: "alabaster-tee",
      name: "Alabaster Tee",
      variantName: "Ivory / M",
      sku: "WM-TEE-IVR-M",
      unitPriceUsdCents: 4800,
      quantity: 2,
      imageUrl: "/images/products/tee-ivory.svg",
      maxStock: 3,
    });

    addToCart({
      productId: "p1",
      variantId: "v1",
      slug: "alabaster-tee",
      name: "Alabaster Tee",
      variantName: "Ivory / M",
      sku: "WM-TEE-IVR-M",
      unitPriceUsdCents: 4800,
      quantity: 5,
      imageUrl: "/images/products/tee-ivory.svg",
      maxStock: 3,
    });

    expect($cartItems.get()).toHaveLength(1);
    expect($cartItemCount.get()).toBe(3);
    expect($cartSubtotalUsdCents.get()).toBe(14_400);
  });

  it("updates and removes items cleanly", () => {
    addToCart({
      productId: "p1",
      variantId: "v1",
      slug: "alabaster-tee",
      name: "Alabaster Tee",
      variantName: "Ivory / M",
      sku: "WM-TEE-IVR-M",
      unitPriceUsdCents: 4800,
      quantity: 1,
      imageUrl: "/images/products/tee-ivory.svg",
      maxStock: 10,
    });

    updateCartItemQuantity("v1", 4);
    expect($cartItemCount.get()).toBe(4);

    updateCartItemQuantity("v1", 0);
    expect($cartItems.get()).toHaveLength(0);

    addToCart({
      productId: "p2",
      variantId: "v2",
      slug: "tote",
      name: "Monolith Tote",
      variantName: "Ecru",
      sku: "WM-TOT-1",
      unitPriceUsdCents: 8900,
      quantity: 1,
      imageUrl: "/images/products/tote-canvas.svg",
      maxStock: 5,
    });

    removeCartItem("v2");
    expect($cartItemCount.get()).toBe(0);
  });
});

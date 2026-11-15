import { ZodError } from "zod";
import { CatalogError } from "@/services/catalog-service";
import { CheckoutError } from "@/services/checkout-service";
import { FulfillmentError } from "@/services/payment-fulfillment";

export function toHttpErrorResponse(error: unknown): {
  status: number;
  body: { error: string; details?: unknown };
} {
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: "Validation failed",
        details: error.flatten(),
      },
    };
  }

  if (
    error instanceof CatalogError ||
    error instanceof CheckoutError ||
    error instanceof FulfillmentError
  ) {
    return {
      status: error.status,
      body: { error: error.message },
    };
  }

  const pgCode =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : undefined;

  if (pgCode === "23505") {
    return {
      status: 409,
      body: { error: "A record with this unique identifier or slug already exists." },
    };
  }
  if (pgCode === "23503") {
    return {
      status: 409,
      body: { error: "Operation conflicts with related records." },
    };
  }

  console.error("Unhandled API error:", error);
  return {
    status: 500,
    body: { error: "Internal server error" },
  };
}

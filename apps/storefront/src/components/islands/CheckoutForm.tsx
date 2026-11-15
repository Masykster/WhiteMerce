import { useEffect, useState } from "react";
import { useStore } from "@nanostores/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import type { z } from "zod";
import type { SupportedCurrency } from "@whitemerce/shared/constants";
import {
  calculateOrderTotalsInCurrency,
  formatOrderAmount,
  formatPriceFromUsdCents,
  resolveRates,
} from "@whitemerce/shared/money";
import { checkoutRequestSchema } from "@whitemerce/shared/schemas";
import { createBrowserApiClient } from "@/lib/api";
import { $cartItems } from "@/stores/cart";
import { $currency } from "@/stores/currency";

const shippingDetailsSchema = checkoutRequestSchema.pick({
  customerName: true,
  customerEmail: true,
  shippingAddress: true,
});

type ShippingFormValues = z.infer<typeof shippingDetailsSchema>;

interface CheckoutFormProps {
  initialCurrency: SupportedCurrency;
  idrRate: number;
}

export function CheckoutForm({
  initialCurrency,
  idrRate,
}: CheckoutFormProps) {
  const items = useStore($cartItems);
  const storeCurrency = useStore($currency);
  const [mounted, setMounted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingDetailsSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      shippingAddress: {
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "Indonesia",
      },
    },
  });

  if (!mounted) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-8 text-sm text-stone-500">
        Loading checkout summary...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center">
        <h2 className="text-lg font-semibold text-stone-950">
          Your bag is empty
        </h2>
        <p className="mt-2 text-sm text-stone-500">
          Add at least one item before proceeding to checkout.
        </p>
        <a
          href="/products"
          className="mt-6 inline-block rounded-full bg-stone-950 px-6 py-3 text-sm font-medium text-white hover:bg-stone-800"
        >
          Explore Products
        </a>
      </div>
    );
  }

  const currency = storeCurrency ?? initialCurrency;
  const rates = resolveRates(idrRate);
  const totals = calculateOrderTotalsInCurrency(
    items.map((item) => ({
      unitPriceUsdCents: item.unitPriceUsdCents,
      quantity: item.quantity,
    })),
    currency,
    rates,
  );

  async function onSubmit(values: ShippingFormValues) {
    setSubmitError(null);
    try {
      const payload = checkoutRequestSchema.parse({
        ...values,
        currency,
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
      });

      const response = await createBrowserApiClient().createCheckout(payload);
      window.location.href = response.checkoutUrl;
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to initiate checkout. Please verify your cart.",
      );
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 lg:col-span-7"
      >
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-stone-950">
            Contact &amp; Shipping Details
          </h2>
          <p className="mt-1 text-xs text-stone-500">
            Checkout currency is currently set to{" "}
            <strong className="font-semibold text-stone-900">{currency}</strong>.
          </p>
        </div>

        {submitError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {submitError}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone-600">
              Full Name
            </label>
            <input
              type="text"
              {...register("customerName")}
              placeholder="Maya Lin"
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm outline-none focus:border-stone-950"
            />
            {errors.customerName && (
              <p className="mt-1 text-xs text-red-600">
                {errors.customerName.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone-600">
              Email Address
            </label>
            <input
              type="email"
              {...register("customerEmail")}
              placeholder="maya@example.com"
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm outline-none focus:border-stone-950"
            />
            {errors.customerEmail && (
              <p className="mt-1 text-xs text-red-600">
                {errors.customerEmail.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone-600">
            Street Address
          </label>
          <input
            type="text"
            {...register("shippingAddress.line1")}
            placeholder="Jl. Senopati No. 88"
            className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm outline-none focus:border-stone-950"
          />
          {errors.shippingAddress?.line1 && (
            <p className="mt-1 text-xs text-red-600">
              {errors.shippingAddress.line1.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone-600">
            Apartment / Suite (Optional)
          </label>
          <input
            type="text"
            {...register("shippingAddress.line2")}
            className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm outline-none focus:border-stone-950"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone-600">
              City
            </label>
            <input
              type="text"
              {...register("shippingAddress.city")}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm outline-none focus:border-stone-950"
            />
            {errors.shippingAddress?.city && (
              <p className="mt-1 text-xs text-red-600">
                {errors.shippingAddress.city.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone-600">
              State / Province
            </label>
            <input
              type="text"
              {...register("shippingAddress.state")}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm outline-none focus:border-stone-950"
            />
            {errors.shippingAddress?.state && (
              <p className="mt-1 text-xs text-red-600">
                {errors.shippingAddress.state.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone-600">
              Postal Code
            </label>
            <input
              type="text"
              {...register("shippingAddress.postalCode")}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm outline-none focus:border-stone-950"
            />
            {errors.shippingAddress?.postalCode && (
              <p className="mt-1 text-xs text-red-600">
                {errors.shippingAddress.postalCode.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone-600">
              Country
            </label>
            <input
              type="text"
              {...register("shippingAddress.country")}
              className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm outline-none focus:border-stone-950"
            />
            {errors.shippingAddress?.country && (
              <p className="mt-1 text-xs text-red-600">
                {errors.shippingAddress.country.message}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-stone-950 py-3.5 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60"
        >
          <Lock className="h-4 w-4" />
          {isSubmitting
            ? "Creating Checkout Session..."
            : `Continue to Payment (${formatOrderAmount(totals.totalAmount, currency)})`}
        </button>
      </form>

      <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-6 sm:p-8 lg:col-span-5">
        <h2 className="text-lg font-semibold tracking-tight text-stone-950">
          Order Summary
        </h2>

        <ul className="mt-5 divide-y divide-stone-100">
          {items.map((item) => (
            <li
              key={item.variantId}
              className="flex items-center justify-between gap-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium text-stone-950">{item.name}</p>
                <p className="text-xs text-stone-500">
                  {item.variantName} × {item.quantity}
                </p>
              </div>
              <span className="font-medium text-stone-950">
                {formatPriceFromUsdCents(
                  item.unitPriceUsdCents * item.quantity,
                  currency,
                  rates,
                )}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-5 space-y-2 border-t border-stone-200 pt-4 text-sm">
          <div className="flex justify-between text-stone-600">
            <span>Subtotal</span>
            <span>{formatOrderAmount(totals.subtotalAmount, currency)}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Shipping</span>
            <span>
              {totals.shippingAmount === 0
                ? "Free"
                : formatOrderAmount(totals.shippingAmount, currency)}
            </span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Estimated Tax (8%)</span>
            <span>{formatOrderAmount(totals.taxAmount, currency)}</span>
          </div>
          <div className="flex justify-between border-t border-stone-100 pt-3 text-base font-semibold text-stone-950">
            <span>Total ({currency})</span>
            <span>{formatOrderAmount(totals.totalAmount, currency)}</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

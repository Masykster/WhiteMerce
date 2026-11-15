import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatOrderAmount } from "@whitemerce/shared/money";
import type { OrderDto } from "@whitemerce/shared/types";
import { createBrowserApiClient } from "@/lib/api";

const lookupFormSchema = z.object({
  orderNumber: z.string().trim().min(4, "Order number is required"),
  email: z.string().trim().pipe(z.email("Enter a valid email address")),
});

type LookupFormValues = z.infer<typeof lookupFormSchema>;

export function OrderLookupForm() {
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LookupFormValues>({
    resolver: zodResolver(lookupFormSchema),
  });

  async function onSubmit(values: LookupFormValues) {
    setLookupError(null);
    setOrder(null);
    try {
      const res = await createBrowserApiClient().lookupOrder(values);
      setOrder(res.order);
    } catch (err) {
      setLookupError(
        err instanceof Error ? err.message : "Order could not be found.",
      );
    }
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-6 sm:grid-cols-3 sm:items-end"
      >
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone-600">
            Order Number
          </label>
          <input
            type="text"
            {...register("orderNumber")}
            placeholder="WM-2026-1001"
            className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 font-mono text-sm outline-none focus:border-stone-950"
          />
          {errors.orderNumber && (
            <p className="mt-1 text-xs text-red-600">
              {errors.orderNumber.message}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-stone-600">
            Email Used at Checkout
          </label>
          <input
            type="email"
            {...register("email")}
            placeholder="maya@example.com"
            className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm outline-none focus:border-stone-950"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-stone-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60"
        >
          {isSubmitting ? "Searching..." : "Track Order"}
        </button>
      </form>

      {lookupError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          {lookupError}
        </div>
      )}

      {order && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4">
            <div>
              <p className="font-mono text-lg font-semibold text-stone-950">
                {order.orderNumber}
              </p>
              <p className="text-xs text-stone-500">
                Placed {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium capitalize text-stone-800">
                Status: {order.status}
              </span>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium capitalize text-emerald-700">
                Payment: {order.paymentStatus}
              </span>
            </div>
          </div>

          <ul className="mt-4 divide-y divide-stone-100">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-stone-950">{item.productName}</p>
                  <p className="text-xs text-stone-500">
                    {item.variantName} × {item.quantity}
                  </p>
                </div>
                <span className="font-medium text-stone-950">
                  {formatOrderAmount(item.lineTotalAmount, order.currency)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between border-t border-stone-200 pt-4 text-base font-semibold text-stone-950">
            <span>Total ({order.currency})</span>
            <span>{formatOrderAmount(order.totalAmount, order.currency)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

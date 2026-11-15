import { useEffect, useState } from "react";
import { CheckCircle2, ShieldAlert, XCircle } from "lucide-react";
import { formatOrderAmount } from "@whitemerce/shared/money";
import type { OrderDto } from "@whitemerce/shared/types";
import { createBrowserApiClient } from "@/lib/api";

interface DevPaymentPanelProps {
  orderNumber: string;
  token: string;
}

export function DevPaymentPanel({ orderNumber, token }: DevPaymentPanelProps) {
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<"pay" | "cancel" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    createBrowserApiClient()
      .getDevCheckoutOrder(orderNumber, token)
      .then((res) => {
        if (active) {
          setOrder(res.order);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load dev checkout session.",
          );
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [orderNumber, token]);

  async function handleAction(action: "pay" | "cancel") {
    setSubmitting(action);
    setError(null);
    try {
      const { order: updated } = await createBrowserApiClient().confirmDevCheckout({
        orderNumber,
        token,
        action,
      });

      if (action === "cancel") {
        window.location.href = `/checkout/cancel?orderNumber=${encodeURIComponent(updated.orderNumber)}`;
      } else {
        window.location.href = `/checkout/success?orderNumber=${encodeURIComponent(updated.orderNumber)}&email=${encodeURIComponent(updated.customerEmail)}`;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process dev payment.",
      );
      setSubmitting(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-8 text-sm text-stone-500">
        Loading local development payment gateway...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-sm text-red-900">
        {error ?? "Invalid dev checkout session."}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
      <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
        <ShieldAlert className="h-3.5 w-3.5" />
        Development Test Checkout Mode
      </div>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-stone-950">
        Confirm Order {order.orderNumber}
      </h1>
      <p className="mt-1.5 text-sm text-stone-600">
        Simulates a signed payment completion callback: marks the order as{" "}
        <strong>paid</strong> and atomically deducts variant stock in PostgreSQL.
      </p>

      <div className="mt-6 rounded-xl border border-stone-200 bg-stone-50 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-600">Customer</span>
          <span className="font-medium text-stone-950">
            {order.customerName} ({order.customerEmail})
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-stone-600">Currency</span>
          <span className="font-mono font-medium text-stone-950">
            {order.currency}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-stone-200 pt-3 text-base font-semibold text-stone-950">
          <span>Amount Due</span>
          <span>{formatOrderAmount(order.totalAmount, order.currency)}</span>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={submitting !== null}
          onClick={() => handleAction("pay")}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-stone-950 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-60"
        >
          <CheckCircle2 className="h-4 w-4" />
          {submitting === "pay" ? "Confirming..." : "Simulate Successful Payment"}
        </button>

        <button
          type="button"
          disabled={submitting !== null}
          onClick={() => handleAction("cancel")}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-5 py-3.5 text-sm font-medium text-stone-800 transition hover:bg-stone-100 disabled:opacity-60"
        >
          <XCircle className="h-4 w-4" />
          Cancel Order
        </button>
      </div>
    </div>
  );
}

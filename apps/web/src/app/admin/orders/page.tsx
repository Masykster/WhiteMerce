import Link from "next/link";
import { redirect } from "next/navigation";
import { formatOrderAmount } from "@whitemerce/shared/money";
import { requireAdminSession } from "@/lib/require-admin";
import { listAdminOrders } from "@/services/order-service";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const session = await requireAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const orders = await listAdminOrders({ limit: 100 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-950">
          Orders ({orders.length})
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Track customer purchases in USD &amp; IDR across Stripe and dev checkout.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-xs uppercase tracking-wider text-stone-500">
                <th className="px-6 py-3.5 font-medium">Order</th>
                <th className="px-6 py-3.5 font-medium">Customer</th>
                <th className="px-6 py-3.5 font-medium">Currency</th>
                <th className="px-6 py-3.5 font-medium">Payment</th>
                <th className="px-6 py-3.5 font-medium">Fulfillment</th>
                <th className="px-6 py-3.5 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-stone-50">
                  <td className="px-6 py-4 font-mono text-xs font-medium">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="underline decoration-stone-300 underline-offset-4 hover:decoration-stone-950"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-stone-950">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-stone-500">{order.customerEmail}</p>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{order.currency}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                        order.paymentStatus === "paid"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {order.paymentStatus} · {order.paymentProvider}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium capitalize text-stone-800">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-stone-950">
                    {formatOrderAmount(order.totalAmount, order.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

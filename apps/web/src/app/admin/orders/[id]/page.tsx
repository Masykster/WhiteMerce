import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatOrderAmount } from "@whitemerce/shared/money";
import { OrderStatusControl } from "@/components/admin/OrderStatusControl";
import { requireAdminSession } from "@/lib/require-admin";
import { getOrderById } from "@/services/order-service";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/orders"
            className="text-xs font-medium text-stone-500 hover:text-stone-900"
          >
            ← Back to Orders
          </Link>
          <h1 className="mt-1 font-mono text-2xl font-semibold tracking-tight text-stone-950">
            {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Placed {new Date(order.createdAt).toLocaleString()} · Payment:{" "}
            <span className="font-medium capitalize">{order.paymentStatus}</span>{" "}
            ({order.paymentProvider})
          </p>
        </div>

        <OrderStatusControl orderId={order.id} initialStatus={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 lg:col-span-2">
          <h2 className="text-base font-semibold text-stone-950">Order Items</h2>
          <div className="mt-4 divide-y divide-stone-100">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-stone-950">{item.productName}</p>
                  <p className="text-xs text-stone-500">
                    {item.variantName} · SKU {item.sku} · Qty {item.quantity}
                  </p>
                </div>
                <p className="font-medium text-stone-950">
                  {formatOrderAmount(item.lineTotalAmount, order.currency)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2 border-t border-stone-200 pt-4 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span>{formatOrderAmount(order.subtotalAmount, order.currency)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Shipping</span>
              <span>{formatOrderAmount(order.shippingAmount, order.currency)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Tax</span>
              <span>{formatOrderAmount(order.taxAmount, order.currency)}</span>
            </div>
            <div className="flex justify-between border-t border-stone-100 pt-2 text-base font-semibold text-stone-950">
              <span>Total ({order.currency})</span>
              <span>{formatOrderAmount(order.totalAmount, order.currency)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="text-base font-semibold text-stone-950">
            Customer &amp; Shipping
          </h2>
          <div className="mt-4 space-y-3 text-sm text-stone-700">
            <div>
              <p className="text-xs uppercase tracking-wider text-stone-400">
                Customer
              </p>
              <p className="font-medium text-stone-950">{order.customerName}</p>
              <p>{order.customerEmail}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-stone-400">
                Shipping Address
              </p>
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

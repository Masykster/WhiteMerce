"use client";

import Link from "next/link";
import { AlertTriangle, DollarSign, PackageCheck, ShoppingCart } from "lucide-react";
import type { AnalyticsOverviewDto } from "@whitemerce/shared/types";
import {
  formatOrderAmount,
  formatPriceFromUsdCents,
  resolveRates,
} from "@whitemerce/shared/money";
import { useAdminUiStore } from "@/stores/admin-ui";

interface AnalyticsDashboardProps {
  overview: AnalyticsOverviewDto;
  usdToIdrRate: number;
}

export function AnalyticsDashboard({
  overview,
  usdToIdrRate,
}: AnalyticsDashboardProps) {
  const displayCurrency = useAdminUiStore((state) => state.displayCurrency);
  const rates = resolveRates(usdToIdrRate);
  const maxDailyRevenue = Math.max(
    1,
    ...overview.dailyRevenue.map((point) => point.revenueUsdCents),
  );

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-stone-500">
            Total Revenue ({displayCurrency})
            <DollarSign className="h-4 w-4 text-stone-400" />
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-950">
            {formatPriceFromUsdCents(
              overview.totalRevenueUsdCents,
              displayCurrency,
              rates,
            )}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Canonical across USD &amp; IDR paid orders
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-stone-500">
            Paid Orders
            <ShoppingCart className="h-4 w-4 text-stone-400" />
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-950">
            {overview.paidOrdersCount}
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {overview.pendingOrdersCount} pending / processing
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-stone-500">
            Active Products
            <PackageCheck className="h-4 w-4 text-stone-400" />
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-950">
            {overview.activeProductsCount}
          </p>
          <p className="mt-1 text-xs text-stone-500">Live on Astro storefront</p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <div className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-stone-500">
            Low Stock Variants
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-stone-950">
            {overview.lowStockVariantsCount}
          </p>
          <p className="mt-1 text-xs text-stone-500">5 units or fewer remaining</p>
        </div>
      </div>

      {/* 14-day Revenue Chart */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-stone-950">
              14-Day Revenue Trend
            </h2>
            <p className="text-xs text-stone-500">
              Daily settled revenue converted to {displayCurrency}
            </p>
          </div>
        </div>

        <div className="mt-6 grid h-48 grid-cols-14 items-end gap-2">
          {overview.dailyRevenue.map((point) => {
            const heightPct = Math.max(
              6,
              Math.round((point.revenueUsdCents / maxDailyRevenue) * 100),
            );
            return (
              <div
                key={point.date}
                className="group flex h-full flex-col items-center justify-end gap-2"
                title={`${point.date}: ${formatPriceFromUsdCents(point.revenueUsdCents, displayCurrency, rates)} (${point.ordersCount} orders)`}
              >
                <div className="flex w-full flex-1 items-end">
                  <div
                    className={`w-full rounded-t-md transition ${
                      point.revenueUsdCents > 0
                        ? "bg-stone-900 group-hover:bg-stone-700"
                        : "bg-stone-200"
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
                <span className="text-[10px] text-stone-400">
                  {point.date.slice(5)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Orders */}
      <section className="rounded-2xl border border-stone-200 bg-white">
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <h2 className="text-base font-semibold text-stone-950">
            Recent Orders
          </h2>
          <Link
            href="/admin/orders"
            className="text-xs font-medium text-stone-600 hover:text-stone-950"
          >
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-xs uppercase tracking-wider text-stone-500">
                <th className="px-6 py-3 font-medium">Order</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Payment</th>
                <th className="px-6 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {overview.recentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-stone-50">
                  <td className="px-6 py-3.5 font-mono text-xs font-medium">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="underline decoration-stone-300 underline-offset-4 hover:decoration-stone-900"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-3.5">
                    <p className="font-medium text-stone-900">{order.customerName}</p>
                    <p className="text-xs text-stone-500">{order.customerEmail}</p>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium capitalize text-stone-800">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                        order.paymentStatus === "paid"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {order.paymentStatus} ({order.paymentProvider})
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right font-medium text-stone-950">
                    {formatOrderAmount(order.totalAmount, order.currency)}
                  </td>
                </tr>
              ))}
              {overview.recentOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-stone-500"
                  >
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

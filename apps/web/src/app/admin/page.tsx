import { redirect } from "next/navigation";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsCharts";
import { getEnv } from "@/lib/env";
import { requireAdminSession } from "@/lib/require-admin";
import { getAnalyticsOverview } from "@/services/order-service";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const session = await requireAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const overview = await getAnalyticsOverview();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-950">
          Store Overview
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Real-time revenue, inventory alerts, and recent checkout activity.
        </p>
      </div>

      <AnalyticsDashboard
        overview={overview}
        usdToIdrRate={getEnv().USD_TO_IDR_RATE}
      />
    </div>
  );
}

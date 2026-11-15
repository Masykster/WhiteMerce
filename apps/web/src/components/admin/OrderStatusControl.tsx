"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ORDER_STATUSES,
  type OrderStatus,
} from "@whitemerce/shared/constants";
import { updateOrderStatusAction } from "@/app/admin/actions";
import { useAdminUiStore } from "@/stores/admin-ui";

export function OrderStatusControl({
  orderId,
  initialStatus,
}: {
  orderId: string;
  initialStatus: OrderStatus;
}) {
  const router = useRouter();
  const pushToast = useAdminUiStore((state) => state.pushToast);
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const result = await updateOrderStatusAction(orderId, status);
    setSaving(false);

    if ("error" in result && result.error) {
      pushToast(result.error, "error");
      return;
    }

    pushToast(`Order status updated to ${status}`, "success");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={status}
        onChange={(event) => setStatus(event.target.value as OrderStatus)}
        className="rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm capitalize outline-none focus:border-stone-950"
      >
        {ORDER_STATUSES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <button
        type="button"
        disabled={saving || status === initialStatus}
        onClick={handleSave}
        className="rounded-xl bg-stone-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800 disabled:opacity-50"
      >
        {saving ? "Updating..." : "Update Status"}
      </button>
    </div>
  );
}

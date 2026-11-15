"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteProductAction } from "@/app/admin/actions";
import { useAdminUiStore } from "@/stores/admin-ui";

export function DeleteProductButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const router = useRouter();
  const pushToast = useAdminUiStore((state) => state.pushToast);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Delete "${productName}"? This cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    const result = await deleteProductAction(productId);
    setDeleting(false);

    if ("error" in result && result.error) {
      pushToast(result.error, "error");
      return;
    }

    pushToast(`Deleted ${productName}`, "success");
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={deleting}
      onClick={handleDelete}
      className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-50"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {deleting ? "..." : "Delete"}
    </button>
  );
}

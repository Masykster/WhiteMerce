"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShoppingBag,
  Store,
  X,
} from "lucide-react";
import { SUPPORTED_CURRENCIES } from "@whitemerce/shared/constants";
import { signOutAdminAction } from "@/app/admin/actions";
import { useAdminUiStore } from "@/stores/admin-ui";

interface AdminShellProps {
  userName: string;
  userEmail: string;
  storefrontUrl: string;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package, exact: false },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, exact: false },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, exact: false },
];

export function AdminShell({
  userName,
  userEmail,
  storefrontUrl,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const {
    sidebarOpen,
    setSidebarOpen,
    displayCurrency,
    setDisplayCurrency,
    toasts,
    dismissToast,
  } = useAdminUiStore();

  return (
    <div className="min-h-screen bg-stone-50 text-stone-950">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-stone-200 bg-white transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-stone-200 px-6">
          <Link href="/admin" className="text-base font-semibold tracking-tight">
            WHITEMERCE <span className="text-xs font-normal text-stone-500">ADMIN</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1 text-stone-500 hover:bg-stone-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-stone-950 text-white"
                    : "text-stone-700 hover:bg-stone-100 hover:text-stone-950"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-stone-200 p-4">
          <a
            href={storefrontUrl}
            target="_blank"
            rel="noreferrer"
            className="mb-3 flex items-center justify-between rounded-xl border border-stone-200 px-3.5 py-2 text-xs font-medium text-stone-700 transition hover:bg-stone-100"
          >
            <span className="inline-flex items-center gap-2">
              <Store className="h-3.5 w-3.5" />
              Open Storefront
            </span>
          </a>
          <div className="mb-3 px-1">
            <p className="truncate text-sm font-medium text-stone-900">{userName}</p>
            <p className="truncate text-xs text-stone-500">{userEmail}</p>
          </div>
          <form action={signOutAdminAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-xl border border-stone-200 px-3.5 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-stone-200 bg-white/90 px-6 backdrop-blur">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg border border-stone-200 p-2 text-stone-700 hover:bg-stone-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="hidden text-xs font-medium uppercase tracking-[0.16em] text-stone-500 lg:block">
            Merchant Operations
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500">Dashboard Currency:</span>
            <div className="inline-flex rounded-lg border border-stone-200 bg-stone-50 p-0.5">
              {SUPPORTED_CURRENCIES.map((currency) => (
                <button
                  key={currency}
                  type="button"
                  onClick={() => setDisplayCurrency(currency)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    displayCurrency === currency
                      ? "bg-stone-950 text-white"
                      : "text-stone-600 hover:text-stone-950"
                  }`}
                >
                  {currency}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl p-6 lg:p-8">{children}</main>
      </div>

      {/* Toast stack */}
      {toasts.length > 0 && (
        <div className="fixed right-5 bottom-5 z-50 flex flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm shadow-lg ${
                toast.tone === "error"
                  ? "border-red-200 bg-red-50 text-red-900"
                  : toast.tone === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-stone-200 bg-white text-stone-900"
              }`}
            >
              <span>{toast.title}</span>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-xs opacity-60 hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

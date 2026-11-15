import Link from "next/link";
import { ArrowRight, LayoutDashboard, Server, Store } from "lucide-react";
import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const storefrontUrl = getEnv().STOREFRONT_URL;

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6 py-16">
      <div className="w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-10 shadow-sm">
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
          <Server className="h-4 w-4" />
          WhiteMerce Core Service
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-950">
          Backend API &amp; Merchant Admin
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          This Next.js 16 application powers the WhiteMerce REST API, PostgreSQL
          18 catalog &amp; order engine, Stripe/Dev checkout webhooks, and the
          authenticated merchant dashboard.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            href="/admin"
            className="inline-flex items-center justify-between rounded-xl bg-stone-950 px-5 py-3.5 text-sm font-medium text-white transition hover:bg-stone-800"
          >
            <span className="inline-flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Open Admin Dashboard
            </span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <a
            href={storefrontUrl}
            className="inline-flex items-center justify-between rounded-xl border border-stone-300 bg-white px-5 py-3.5 text-sm font-medium text-stone-900 transition hover:bg-stone-100"
          >
            <span className="inline-flex items-center gap-2">
              <Store className="h-4 w-4" />
              Visit Storefront
            </span>
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </main>
  );
}

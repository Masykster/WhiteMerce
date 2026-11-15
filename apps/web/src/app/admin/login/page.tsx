import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const session = await auth();
  if (session?.user?.role === "admin") {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
          WhiteMerce Control Center
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
          Admin Sign In
        </h1>
        <p className="mt-1.5 text-sm text-stone-600">
          Sign in with your merchant credentials to manage products, inventory,
          and orders.
        </p>

        <div className="mt-6">
          <AdminLoginForm />
        </div>

        <p className="mt-6 rounded-xl bg-stone-50 px-4 py-3 text-xs text-stone-500">
          Seeded dev account: <span className="font-mono">admin@whitemerce.local</span>{" "}
          / <span className="font-mono">Admin123!</span>
        </p>
      </div>
    </main>
  );
}

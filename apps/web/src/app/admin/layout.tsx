import { auth } from "@/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { getEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  if (!isAdmin || !session?.user) {
    return <>{children}</>;
  }

  return (
    <AdminShell
      userName={session.user.name ?? "Admin"}
      userEmail={session.user.email ?? ""}
      storefrontUrl={getEnv().STOREFRONT_URL}
    >
      {children}
    </AdminShell>
  );
}

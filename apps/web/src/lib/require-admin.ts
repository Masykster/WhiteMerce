import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function requireAdminSession() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return null;
  }
  return session;
}

export async function requireAdminApi() {
  const session = await requireAdminSession();
  if (!session) {
    return {
      session: null,
      unauthorizedResponse: NextResponse.json(
        { error: "Unauthorized: admin access required." },
        { status: 401 },
      ),
    };
  }
  return { session, unauthorizedResponse: null };
}

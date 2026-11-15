import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@whitemerce/shared/constants";
import { getEnv } from "@/lib/env";

export const authConfig = {
  secret: getEnv().AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/admin/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isAdminRoute = nextUrl.pathname.startsWith("/admin");
      const isLoginRoute = nextUrl.pathname.startsWith("/admin/login");
      if (!isAdminRoute || isLoginRoute) {
        return true;
      }

      const isAdmin = auth?.user?.role === "admin";
      if (isAdmin) {
        return true;
      }
      return false;
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user.role ?? "customer") as UserRole;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as UserRole | undefined) ?? "customer";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

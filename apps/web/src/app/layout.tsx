import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WhiteMerce Admin & API",
  description: "Backend API and merchant control center for WhiteMerce.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

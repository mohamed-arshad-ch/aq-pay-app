import type React from "react";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { WalletNotifications } from "@/components/wallet/wallet-notifications";
import { jwtVerify } from "jose";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token");

  if (!token?.value) {
    redirect("/auth/login");
  }

  try {
    // Verify the token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token.value, secret);

    if (!payload.email) {
      redirect("/auth/login");
    }
  } catch (error) {
    // If token verification fails, redirect to login
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="fixed top-4 right-4 z-50">
        <WalletNotifications />
      </div>
      <main className="flex-1 pb-16">{children}</main>
      <BottomNav />
    </div>
  );
}

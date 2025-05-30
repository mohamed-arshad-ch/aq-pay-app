import type React from "react";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminBottomNav } from "@/components/admin/admin-bottom-nav";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";

export default async function AdminLayout({
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
    const payload = await verifyToken(token.value);

    if (!payload || payload.role !== "ADMIN") {
      redirect("/dashboard");
    }
  } catch (error) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <AdminHeader />
      <main className="pt-16">
        <div className="container mx-auto p-4">{children}</div>
      </main>
      <AdminBottomNav />
    </div>
  );
}

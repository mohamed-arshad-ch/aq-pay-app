import type React from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminHeader } from "@/components/admin/admin-header";
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
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <AdminSidebar />
      <main className="pt-16 md:pt-0 md:ml-64">
        <div className="container mx-auto p-4 md:p-6">{children}</div>
      </main>
      {/* <AdminBottomNav /> */}
    </div>
  );
}

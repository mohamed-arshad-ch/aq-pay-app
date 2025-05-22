import type React from "react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminBottomNav } from "@/components/admin/admin-bottom-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <main className="pt-16 md:pt-0 md:ml-64">
        <div className="container mx-auto p-4 md:p-6">{children}</div>
      </main>
      {/* <AdminBottomNav /> */}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  FileText,
  Home,
  Lock,
  Menu,
  Settings,
  Shield,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const sidebarLinks = [
  {
    title: "Home",
    href: "/admin/dashboard",
    icon: Home,
  },
  {
    title: "Transactions",
    href: "/admin/transactions",
    icon: CreditCard,
  },
  {
    title: "Wallet",
    href: "/admin/wallet",
    icon: Wallet,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: FileText,
  },
  // {
  //   title: "Analytics",
  //   href: "/admin/analytics",
  //   icon: BarChart3,
  // },
  // {
  //   title: "Security",
  //   href: "/admin/security",
  //   icon: Shield,
  // },
  // {
  //   title: "Access Control",
  //   href: "/admin/access-control",
  //   icon: Lock,
  // },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const NavContent = () => (
    <nav className="flex flex-col gap-1">
      {sidebarLinks.map((link) => {
        const isActive =
          pathname === link.href ||
          (link.href === "/admin/dashboard" && pathname === "/admin") ||
          (link.href === "/admin/transactions" &&
            pathname.startsWith("/admin/transactions/")) ||
          (link.href === "/admin/wallet" &&
            pathname.startsWith("/admin/wallet/"));
        return (
          <Button
            key={link.href}
            variant={isActive ? "secondary" : "ghost"}
            className={cn(
              "justify-start",
              isActive && "bg-secondary font-medium"
            )}
            asChild
            onClick={() => setIsOpen(false)}
          >
            <Link href={link.href}>
              <link.icon className="mr-2 h-5 w-5" />
              {link.title}
            </Link>
          </Button>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Menu */}
      <div className="fixed left-0 top-0 z-40 flex h-16 w-full items-center border-b bg-background px-4 md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex h-16 items-center border-b px-6">
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 font-semibold"
              >
                <Shield className="h-6 w-6" />
                <span>Admin Portal</span>
              </Link>
            </div>
            <div className="custom-scrollbar flex-1 overflow-y-auto px-3 py-4">
              <NavContent />
            </div>
          </SheetContent>
        </Sheet>
        <Link
          href="/admin/dashboard"
          className="ml-4 flex items-center gap-2 font-semibold"
        >
          <Shield className="h-6 w-6" />
          <span>Admin Portal</span>
        </Link>
      </div>

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r bg-background shadow-sm md:flex">
        <div className="flex h-16 items-center border-b px-6">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 font-semibold"
          >
            <Shield className="h-6 w-6" />
            <span>Admin Portal</span>
          </Link>
        </div>
        <div className="custom-scrollbar flex-1 overflow-y-auto px-3 py-4">
          <NavContent />
        </div>
      </aside>
    </>
  );
}

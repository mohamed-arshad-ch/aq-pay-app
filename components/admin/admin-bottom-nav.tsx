"use client"

import { usePathname, useRouter } from "next/navigation"
import { BarChart3, FileText, Home, Settings, Users } from "lucide-react"
import { cn } from "@/lib/utils"

export function AdminBottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    {
      name: "Home",
      href: "/admin/dashboard",
      icon: Home,
      active: pathname === "/admin/dashboard" || pathname === "/admin",
    },
    {
      name: "Transactions",
      href: "/admin/transactions",
      icon: BarChart3,
      active: pathname.startsWith("/admin/transactions"),
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: Users,
      active: pathname.startsWith("/admin/users"),
    },
    {
      name: "Reports",
      href: "/admin/reports",
      icon: FileText,
      active: pathname.startsWith("/admin/reports"),
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
      active: pathname.startsWith("/admin/settings"),
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.name}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full transition-colors",
              item.active ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => router.push(item.href)}
          >
            <item.icon className="h-5 w-5 mb-1" />
            <span className="text-xs">{item.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRightLeft, Plus, Bell } from "lucide-react"
import { useAppSelector } from "@/store/hooks"
import { Badge } from "@/components/ui/badge"

export function QuickActions() {
  const router = useRouter()
  const { unreadNotifications } = useAppSelector((state) => state.dashboard)

  const actions = [
    {
      name: "Transfer",
      icon: ArrowRightLeft,
      onClick: () => router.push("/dashboard/transfer"),
      primary: true,
    },
    {
      name: "Add Account",
      icon: Plus,
      onClick: () => router.push("/dashboard/accounts/new"),
      primary: false,
    },
    {
      name: "Notifications",
      icon: Bell,
      onClick: () => router.push("/dashboard/notifications"),
      primary: false,
      badge: unreadNotifications > 0 ? unreadNotifications : undefined,
    },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Quick Actions</h2>

      <div className="grid grid-cols-3 gap-3">
        {actions.map((action) => (
          <Card key={action.name} className={action.primary ? "bg-primary text-primary-foreground" : ""}>
            <CardContent className="p-3 flex flex-col items-center justify-center text-center">
              <Button
                variant={action.primary ? "secondary" : "ghost"}
                size="icon"
                className="h-10 w-10 rounded-full relative mb-2"
                onClick={action.onClick}
              >
                <action.icon className="h-5 w-5" />
                {action.badge && (
                  <Badge
                    className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
                    variant="destructive"
                  >
                    {typeof action.badge === "number" ? (action.badge > 9 ? "9+" : action.badge) : ""}
                  </Badge>
                )}
              </Button>
              <p className="text-xs font-medium">{action.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

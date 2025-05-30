"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowDownLeft,
  BarChart3,
  CheckCircle,
  CreditCard,
  DollarSign,
  Users,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency-utils";
import { AdminRecentTransactions } from "./admin-recent-transactions";
import { AdminRecentUsers } from "./admin-recent-users";
import { AdminActivityLog } from "./admin-activity-log";
import { AdminStatsOverview } from "./admin-stats-overview";
import { useAppSelector } from "@/store/hooks";

export function AdminDashboardContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { data: kpiData } = useAppSelector((state) => state.reports.kpi);

  // Handle transaction click
  const handleTransactionClick = (id: string) => {
    router.push(`/admin/transactions/${id}`);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section */}
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Overview of system performance and recent activities.
        </p>
      </div>

      {/* Key Metrics - First Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Pending Transactions Card */}
        <Card className="border-l-4 border-l-yellow-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 sm:pb-2">
            <CardTitle className="text-sm sm:text-base font-medium">
              Pending Transactions
            </CardTitle>
            <div className="flex items-center space-x-1">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">--</div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Awaiting review or approval
            </p>
            <Button
              variant="link"
              className="px-0 text-xs sm:text-sm text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300"
              onClick={() => router.push("/admin/transactions?status=PENDING")}
            >
              View all pending
            </Button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Successfully processed today
            </p>
            <Button
              variant="link"
              className="px-0 text-xs text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
              onClick={() =>
                router.push("/admin/transactions?status=COMPLETED")
              }
            >
              View completed
            </Button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed (24h)</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Failed in the last 24 hours
            </p>
            <Button
              variant="link"
              className="px-0 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              onClick={() => router.push("/admin/transactions?status=FAILED")}
            >
              View failed
            </Button>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">
              Currently active on platform
            </p>
            <Button
              variant="link"
              className="px-0 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              onClick={() => router.push("/admin/users")}
            >
              View all users
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Transactions
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Transaction Volume
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Sessions
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Card */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-6 sm:space-y-8">
            <div className="flex items-center justify-center h-24 sm:h-32">
              <p className="text-sm sm:text-base text-muted-foreground">
                No recent transactions available
              </p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => router.push("/admin/transactions")}
            >
              View All Transactions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Section */}
      <div className="mt-6">
        <Tabs defaultValue="overview" className="space-y-4">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex w-full sm:w-auto">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">
                Overview
              </TabsTrigger>
              <TabsTrigger value="users" className="text-xs sm:text-sm">
                Recent Users
              </TabsTrigger>
              <TabsTrigger value="transactions" className="text-xs sm:text-sm">
                Recent Transactions
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs sm:text-sm">
                Activity Log
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4">
            <AdminStatsOverview isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="users" className="space-y-4">
            <AdminRecentUsers isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="transactions" className="space-y-4">
            <AdminRecentTransactions isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="activity" className="space-y-4">
            <AdminActivityLog isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

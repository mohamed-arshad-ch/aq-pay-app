"use client";

import { useEffect, useState } from "react";
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
  Loader2, // Import Loader2
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
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchDashboardData } from "@/store/slices/dashboardSlice";

export function AdminDashboardContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  // State to store the counts and their loading state
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [transactionVolume, setTransactionVolume] = useState(0);
  const [isStatsLoading, setIsStatsLoading] = useState(true); // Loading state for direct API call
  const [isReduxLoading, setIsReduxLoading] = useState(true); // Loading state for Redux data

  // Fetch initial dashboard statistics (key metrics and grid stats)
  useEffect(() => {
    const fetchData = async () => {
      setIsStatsLoading(true); // Set loading true before fetching
      try {
        const response = await fetch("/api/admin/dashboard", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await response.json();

        // Update transaction counts
        if (data.transactions) {
          setPendingCount(
            data.transactions.filter((t: any) => t.status === "PENDING").length
          );
          setCompletedCount(
            data.transactions.filter((t: any) => t.status === "COMPLETED")
              .length
          );
          setRejectedCount(
            data.transactions.filter((t: any) => t.status === "REJECTED")
              .length
          );
          setTotalTransactions(data.transactions.length);
        }

        // Update other stats from the API response
        setTotalUsers(data.totalUsers || 0);
        // Assuming your API response has 'activeUsers' and 'transactionVolume' directly
        setActiveUsers(data.activeUsers || 0); // Make sure your API returns this
        setTransactionVolume(data.transactionVolume || 0); // Make sure your API returns this
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        // Optionally, handle error state for displaying to the user
      } finally {
        setIsStatsLoading(false); // Set loading false after fetch attempt
      }
    };

    fetchData();
  }, []); // Empty dependency array means this runs once on mount

  // Fetch data for other components (like recent users, transactions, activity logs) using Redux
  useEffect(() => {
    setIsReduxLoading(true); // Set Redux loading true before dispatch
    dispatch(fetchDashboardData()).finally(() => setIsReduxLoading(false)); // Set false after Redux thunk completes
  }, [dispatch]);

  const renderLoader = () => (
    <div className="flex items-center justify-center h-full min-h-[50px]">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

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
            <CardTitle className="text-sm font-medium">
              Pending Transactions
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {isStatsLoading ? (
              renderLoader()
            ) : (
              <div className="text-2xl font-bold">{pendingCount}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Awaiting review or approval
            </p>
            <Button
              variant="link"
              className="px-0 text-xs text-yellow-600 hover:text-yellow-700"
              onClick={() => router.push("/admin/transactions?status=PENDING")}
            >
              View pending
            </Button>
          </CardContent>
        </Card>

        {/* Completed Transactions Card */}
        <Card className="border-l-4 border-l-green-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              renderLoader()
            ) : (
              <div className="text-2xl font-bold">{completedCount}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Successfully processed today
            </p>
            <Button
              variant="link"
              className="px-0 text-xs text-green-600 hover:text-green-700"
              onClick={() =>
                router.push("/admin/transactions?status=COMPLETED")
              }
            >
              View completed
            </Button>
          </CardContent>
        </Card>

        {/* Rejected Transactions Card */}
        <Card className="border-l-4 border-l-red-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              renderLoader()
            ) : (
              <div className="text-2xl font-bold">{rejectedCount}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Rejected transactions
            </p>
            <Button
              variant="link"
              className="px-0 text-xs text-red-600 hover:text-red-700"
              onClick={() => router.push("/admin/transactions?status=REJECTED")}
            >
              View rejected
            </Button>
          </CardContent>
        </Card>

        {/* Active Users Card */}
        <Card className="border-l-4 border-l-blue-400">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              renderLoader()
            ) : (
              <div className="text-2xl font-bold">{activeUsers}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Currently active on platform
            </p>
            <Button
              variant="link"
              className="px-0 text-xs text-blue-600 hover:text-blue-700"
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
            {isStatsLoading ? (
              renderLoader()
            ) : (
              <div className="text-2xl font-bold">{totalUsers}</div>
            )}
            <p className="text-xs text-muted-foreground">Registered users</p>
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
            {isStatsLoading ? (
              renderLoader()
            ) : (
              <div className="text-2xl font-bold">{totalTransactions}</div>
            )}
            <p className="text-xs text-muted-foreground">
              All time transactions
            </p>
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
            {isStatsLoading ? (
              renderLoader()
            ) : (
              <div className="text-2xl font-bold">
                {formatCurrency(transactionVolume, "USD")}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Total processed amount
            </p>
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
            {isStatsLoading ? (
              renderLoader()
            ) : (
              // Assuming 'activeSessions' comes from the direct API call as well
              <div className="text-2xl font-bold">
                {/* Replace with actual data if available from API */}
                --
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Real-time active users
            </p>
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
            {isReduxLoading ? ( // Use isReduxLoading for Redux-dependent components
              <div className="flex items-center justify-center h-24 sm:h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <AdminRecentTransactions isLoading={isReduxLoading} />
            )}
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
            <AdminStatsOverview isLoading={isReduxLoading} />
          </TabsContent>
          <TabsContent value="users" className="space-y-4">
            <AdminRecentUsers isLoading={isReduxLoading} />
          </TabsContent>
          <TabsContent value="transactions" className="space-y-4">
            <AdminRecentTransactions isLoading={isReduxLoading} />
          </TabsContent>
          <TabsContent value="activity" className="space-y-4">
            <AdminActivityLog isLoading={isReduxLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
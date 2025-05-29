"use client";

import { useAppSelector } from "@/store/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ClockIcon,
  PercentIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";

export function KpiDashboard() {
  const { data } = useAppSelector((state) => state.reports.kpi);

  if (!data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            {/* <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader> */}
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">No data available</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Transaction Volume
          </CardTitle>
          <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.transactionVolume.daily.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Transactions today</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Avg. Approval Time
          </CardTitle>
          <ClockIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.averageApprovalTime.current.toFixed(1)} min
          </div>
          <div className="mt-2 flex items-center text-xs">
            {data.averageApprovalTime.percentChange < 0 ? (
              <div className="flex items-center text-green-500">
                <ArrowDownIcon className="mr-1 h-3 w-3" />
                {Math.abs(data.averageApprovalTime.percentChange).toFixed(1)}%
                from last period
              </div>
            ) : (
              <div className="flex items-center text-red-500">
                <ArrowUpIcon className="mr-1 h-3 w-3" />
                {data.averageApprovalTime.percentChange.toFixed(1)}% from last
                period
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rejection Rate</CardTitle>
          <PercentIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.rejectionRate.current.toFixed(1)}%
          </div>
          <div className="mt-2 flex items-center text-xs">
            {data.rejectionRate.percentChange < 0 ? (
              <div className="flex items-center text-green-500">
                <ArrowDownIcon className="mr-1 h-3 w-3" />
                {Math.abs(data.rejectionRate.percentChange).toFixed(1)}% from
                last period
              </div>
            ) : (
              <div className="flex items-center text-red-500">
                <ArrowUpIcon className="mr-1 h-3 w-3" />
                {data.rejectionRate.percentChange.toFixed(1)}% from last period
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">User Growth</CardTitle>
          <UsersIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+{data.userGrowth.daily}</div>
          <p className="text-xs text-muted-foreground">New users today</p>
          <div className="mt-2 flex items-center text-xs">
            <div className="flex items-center text-green-500">
              <ArrowUpIcon className="mr-1 h-3 w-3" />
              {data.userGrowth.percentChange.toFixed(1)}% from last period
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            System Performance
          </CardTitle>
          <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.systemPerformance.uptime.toFixed(2)}%
          </div>
          <p className="text-xs text-muted-foreground">System uptime</p>
        </CardContent>
      </Card>
    </div>
  );
}

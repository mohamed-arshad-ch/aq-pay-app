"use client";

import { useAppSelector } from "@/store/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TransactionStatus } from "@/types";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/currency-utils";

export function RecentTransactions() {
  const router = useRouter();
  const { recentTransactions = [] } = useAppSelector(
    (state) => state.dashboard
  );
  const { currency } = useAppSelector((state) => state.settings);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.PENDING:
        return "text-yellow-500";
      case TransactionStatus.COMPLETED:
        return "text-green-500";
      case TransactionStatus.REJECTED:
        return "text-red-500";
      case TransactionStatus.CANCELLED:
        return "text-gray-500";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Transactions</h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1"
          onClick={() => router.push("/dashboard/transactions")}
        >
          View All <ArrowRight className="h-3 w-3" />
        </Button>
      </div>

      <Card>
        <CardHeader className="px-4 py-3 border-b">
          <CardTitle className="text-sm font-medium">
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 divide-y">
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No recent transactions</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

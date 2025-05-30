"use client";

import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { TransactionStatus, TransactionType } from "@/types"; // Ensure TransactionType is imported
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/currency-utils";
import React, { useEffect } from "react";
import { fetchDashboardData } from "@/store/slices/dashboardSlice";

// Import the correct async thunk from your dashboardSlice

export function RecentTransactions() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { currency } = useAppSelector((state) => state.settings);

  // Fix the selector to avoid state redeclaration
  const {
    recentTransactions = [],
    isLoading,
    error,
  } = useAppSelector((state) => {
    console.log("Full dashboard state:", state.dashboard); // Debug full state
    return state.dashboard;
  });

  // Fetch dashboard data (which includes recent transactions) on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching dashboard data...");
        const result = await dispatch(fetchDashboardData()).unwrap();
        console.log("API Response:", result);
        // Add a delay and check if state was updated
        setTimeout(() => {
          console.log("Current transactions:", recentTransactions);
        }, 100);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };

    fetchData();
  }, [dispatch]);

  // Log whenever recentTransactions changes
  useEffect(() => {
    console.log("recentTransactions updated:", recentTransactions);
  }, [recentTransactions]);

  // Group transactions by status
  const groupedTransactions = recentTransactions.reduce((acc, transaction) => {
    // Add debug log to check each transaction
    console.log("Processing transaction:", transaction);

    if (!transaction?.status) {
      console.log("Transaction missing status:", transaction);
      return acc;
    }

    const status = transaction.status;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(transaction);
    return acc;
  }, {} as Record<TransactionStatus, any[]>);

  // Add debug log after grouping
  console.log("Final grouped transactions:", groupedTransactions);

  // Make sure TransactionStatus enum matches your backend values
  const statusOrder = [
    "PENDING",
    "COMPLETED",
    "REJECTED",
    "CANCELLED", // Include if you want to display cancelled transactions
  ] as TransactionStatus[];

  const getStatusDetails = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.PENDING:
        return {
          color:
            "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-700",
          textColor: "text-yellow-700 dark:text-yellow-300",
          label: "Pending",
        };
      case TransactionStatus.COMPLETED:
        return {
          color:
            "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-700",
          textColor: "text-green-700 dark:text-green-300",
          label: "Completed",
        };
      case TransactionStatus.REJECTED:
        return {
          color: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-700",
          textColor: "text-red-700 dark:text-red-300",
          label: "Rejected",
        };
      case TransactionStatus.CANCELLED:
        return {
          color:
            "bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-700",
          textColor: "text-gray-700 dark:text-gray-300",
          label: "Cancelled",
        };
      default:
        return {
          color:
            "bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-700",
          textColor: "text-gray-700 dark:text-gray-300",
          label: "Unknown",
        };
    }
  };

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

  // Helper function to get transaction icon based on TransactionType
  const getTransactionIcon = (transaction: { type: TransactionType }) => {
    const isDeposit = transaction.type === TransactionType.DEPOSIT;

    return (
      <div
        className={cn(
          "p-2 rounded-full",
          isDeposit
            ? "bg-green-100 dark:bg-green-800"
            : "bg-red-100 dark:bg-red-800"
        )}
      >
        {isDeposit ? (
          <ArrowDownLeft className="h-4 w-4 text-green-600 dark:text-green-300" />
        ) : (
          <ArrowUpRight className="h-4 w-4 text-red-600 dark:text-red-300" />
        )}
      </div>
    );
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

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              Loading recent transactions...
            </p>
          </CardContent>
        </Card>
      ) : recentTransactions.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              No recent transactions found.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Add debug output */}
          {process.env.NODE_ENV === "development" && (
            <div className="text-xs text-muted-foreground">
              <p>Total transactions: {recentTransactions.length}</p>
              <p>
                Status groups: {Object.keys(groupedTransactions).join(", ")}
              </p>
            </div>
          )}

          {statusOrder.map((status) => {
            const transactions = groupedTransactions[status] || [];

            // Debug log for each status group
            console.log(`Status ${status}:`, transactions);

            if (transactions.length === 0) return null;

            const { color, textColor, label } = getStatusDetails(status);

            return (
              <Card key={status} className={cn("border", color)}>
                <CardHeader className="px-4 py-3 border-b">
                  <CardTitle className={cn("text-sm font-medium", textColor)}>
                    {label} Transactions ({transactions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 divide-y">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer"
                      onClick={() =>
                        router.push(`/dashboard/transactions/${transaction.id}`)
                      }
                    >
                      <div className="flex items-center space-x-4">
                        {getTransactionIcon(transaction)}
                        <div>
                          <p className="font-medium">
                            {transaction.description || "Transaction"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(
                              transaction.date || transaction.createdAt
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={cn(
                            "font-medium",
                            transaction.type === "DEPOSIT"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          )}
                        >
                          {transaction.type === "DEPOSIT" ? "+" : "-"}
                          {formatCurrency(
                            transaction.amount,
                            transaction.currency || currency
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

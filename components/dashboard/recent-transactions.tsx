"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// Types (Keep these definitions here or import them)
enum TransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED",
}

enum TransactionType {
  DEPOSIT = "DEPOSIT",
  WITHDRAWAL = "WITHDRAWAL",
  TRANSFER = "TRANSFER",
  PAYMENT = "PAYMENT",
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  type: TransactionType;
  status: TransactionStatus;
  description?: string;
  accountName?: string;
  date?: string; // date might be provided by API
  createdAt: string; // fallback if date is not available
  bankAccount?: {
    accountName: string;
  } | null;
}

export function RecentTransactions() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const defaultCurrency = "USD";

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/user/dashboard", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to fetch dashboard data"
          );
        }

        const data = await response.json();
        const fetchedTransactions = data.recentTransactions || [];

        const formattedTransactions = fetchedTransactions.map((tx: any) => ({
          ...tx,
          accountName: tx.bankAccount?.accountName || undefined,
        }));
        setTransactions(formattedTransactions);
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const transactionStats = useMemo(() => {
    const stats: {
      [key in TransactionStatus]: {
        transactions: Transaction[];
        count: number;
      };
    } = {
      [TransactionStatus.PENDING]: { transactions: [], count: 0 },
      [TransactionStatus.COMPLETED]: { transactions: [], count: 0 },
      [TransactionStatus.REJECTED]: { transactions: [], count: 0 },
    };

    const sortedTransactions = [...transactions].sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt);
      const dateB = new Date(b.date || b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    sortedTransactions.forEach((transaction) => {
      const statusKey = transaction.status as TransactionStatus;
      if (stats[statusKey]) {
        if (stats[statusKey].transactions.length < 5) {
          stats[statusKey].transactions.push(transaction);
        }
        stats[statusKey].count++;
      }
    });

    return stats;
  }, [transactions]);

  const getStatusConfig = (status: TransactionStatus) => {
    const configs = {
      [TransactionStatus.PENDING]: {
        label: "Pending",
        icon: Clock,
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-50 dark:bg-amber-950",
        borderColor: "border-amber-400 dark:border-amber-800",
        badgeVariant: "secondary" as const, // Use secondary for a light background
        tabColor:
          "data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800",
      },
      [TransactionStatus.COMPLETED]: {
        label: "Completed",
        icon: CheckCircle,
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-50 dark:bg-emerald-950",
        borderColor: "border-emerald-400 dark:border-emerald-800",
        badgeVariant: "secondary" as const, // Changed to secondary for light background
        tabColor:
          "data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800",
      },
      [TransactionStatus.REJECTED]: {
        label: "Rejected",
        icon: XCircle,
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-50 dark:bg-red-950",
        borderColor: "border-red-400 dark:border-red-800",
        badgeVariant: "secondary" as const, // Changed to secondary for light background
        tabColor:
          "data-[state=active]:bg-red-100 data-[state=active]:text-red-800",
      },
    };
    return configs[status] || configs[TransactionStatus.PENDING];
  };

  const formatCurrency = (amount: number, currency: string) => {
    const actualCurrency = currency || defaultCurrency;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: actualCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";

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
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  const getTransactionIcon = (transaction: Transaction) => {
    const isDeposit = transaction.type === TransactionType.DEPOSIT;
    const isTransfer = transaction.type === TransactionType.TRANSFER;
    // For other types, it defaults to withdrawal icon or can be adjusted
    // const isWithdrawal = transaction.type === TransactionType.WITHDRAWAL;

    return (
      <div
        className={cn(
          "p-2 rounded-full",
          isDeposit
            ? "bg-emerald-100 dark:bg-emerald-800"
            : isTransfer
            ? "bg-blue-100 dark:bg-blue-800"
            : "bg-red-100 dark:bg-red-800" // Default for withdrawal/payment
        )}
      >
        {isDeposit ? (
          <ArrowDownLeft className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
        ) : isTransfer ? (
          <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-300" />
        ) : (
          <ArrowUpRight className="h-4 w-4 text-red-600 dark:text-red-300" />
        )}
      </div>
    );
  };

  const renderTransactionList = (
    transactionsToRender: Transaction[],
    status: TransactionStatus
  ) => {
    const config = getStatusConfig(status);

    if (transactionsToRender.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <config.icon className={cn("h-12 w-12 mb-3", config.color)} />
          <p className="text-muted-foreground text-sm">
            No {config.label.toLowerCase()} transactions found.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {transactionsToRender.slice(0, 5).map((transaction) => { // Render max 5 in tab view
          const statusConfig = getStatusConfig(transaction.status);
          return (
            <Card
              key={transaction.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-lg border-l-4",
                statusConfig.borderColor,
                "hover:scale-[1.02]"
              )}
              onClick={() =>
                router.push(`/dashboard/transactions/${transaction.id}`)
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getTransactionIcon(transaction)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">
                          {transaction.description ||
                            `${transaction.type.toLowerCase()} transaction`}
                        </p>
                        {/* Status Badge with dynamic colors and light background */}
                        <Badge
                          variant={statusConfig.badgeVariant}
                          className={cn(
                            "text-xs font-medium px-2 py-1",
                            statusConfig.bgColor, // Apply light background
                            statusConfig.color    // Apply text color
                          )}
                        >
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(transaction.date || transaction.createdAt)}
                      </p>
                      {transaction.accountName && (
                        <p className="text-xs text-muted-foreground font-medium">
                          {transaction.accountName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        "font-bold text-sm",
                        transaction.type === TransactionType.DEPOSIT
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      )}
                    >
                      {transaction.type === TransactionType.DEPOSIT ? "+" : "-"}
                      {formatCurrency(
                        transaction.amount,
                        transaction.currency || defaultCurrency
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {transaction.type.toLowerCase()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const totalTransactions = transactions.length;

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-3 text-muted-foreground">
              Loading transactions...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-600 dark:text-red-400 text-sm">
              Failed to load transactions: {error}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setTransactions([]);
                setIsLoading(true);
                setError(null);
                const retryFetch = async () => {
                  setIsLoading(true);
                  setError(null);
                  try {
                    const response = await fetch("/api/user/dashboard", {
                      method: "GET",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                    });
                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(
                        errorData.message ||
                          "Failed to fetch dashboard data on retry"
                      );
                    }
                    const data = await response.json();
                    const fetchedTransactions = data.recentTransactions || [];
                    const formattedTransactions = fetchedTransactions.map(
                      (tx: any) => ({
                        ...tx,
                        accountName: tx.bankAccount?.accountName || undefined,
                      })
                    );
                    setTransactions(formattedTransactions);
                  } catch (err: any) {
                    setError(
                      err.message || "Failed to retry fetching transactions."
                    );
                  } finally {
                    setIsLoading(false);
                  }
                };
                retryFetch();
              }}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            Recent Transactions
            {totalTransactions > 0 && (
              <Badge variant="secondary" className="text-xs">
                {totalTransactions}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs gap-1 hover:bg-primary/10"
            onClick={() => router.push("/dashboard/transactions")}
          >
            View All <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {totalTransactions === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No recent transactions found.
            </p>
          </div>
        ) : (
          <Tabs defaultValue={TransactionStatus.PENDING} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              {Object.entries(transactionStats).map(([status, data]) => {
                const config = getStatusConfig(status as TransactionStatus);
                return (
                  <TabsTrigger
                    key={status}
                    value={status}
                    className={cn(
                      "flex items-center justify-center gap-2 py-2 flex-col sm:flex-row text-sm", // Added flex-col for small screens
                      config.tabColor
                    )}
                  >
                    <config.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{config.label}</span> {/* Hide label on small screens */}
                    <span className="sm:hidden">{config.label.charAt(0)}</span> {/* Show initial on small screens */}
                    {data.count > 0 && (
                      <Badge
                        variant={config.badgeVariant}
                        className={cn(
                          "ml-0 sm:ml-1.5 h-5 min-w-[20px] px-1", // Adjust margin for responsiveness
                          config.bgColor, // Apply light background
                          config.color    // Apply text color
                        )}
                      >
                        {data.count}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {Object.entries(transactionStats).map(([status, data]) => (
              <TabsContent key={status} value={status} className="space-y-4">
                {renderTransactionList(
                  data.transactions.slice(0, 5), // Ensure only top 5 are shown
                  status as TransactionStatus
                )}
                {data.count > 5 && (
                  <div className="text-center pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() =>
                        router.push(`/dashboard/transactions?status=${status}`)
                      }
                    >
                      View {data.count - 5} more transactions
                    </Button>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchTransactions,
  clearTransactionsFilter,
  setStatusFilter,
  setAccountFilter,
  setDateRangeFilter,
} from "@/store/slices/transactionsSlice";
import { getWalletTransactions } from "@/store/slices/walletSlice";
import { fetchAccounts } from "@/store/slices/accountsSlice";
import {
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  FilterX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { TransactionHistorySkeleton } from "@/components/transactions/transaction-history-skeleton";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/currency-utils";
import {
  TransactionStatus,
  TransactionType,
  Transaction,
  BankAccount,
  WalletTransaction,
  WalletTransactionType,
  WalletTransactionStatus,
} from "@/types";
import { format } from "date-fns";

type CombinedTransaction = (Transaction | WalletTransaction) & {
  _source: 'bank' | 'wallet';
  _uniqueKey: string;
};

export function TransactionHistory() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { transactions, filteredTransactions, filter, isLoading, error } =
    useAppSelector((state) => state.transactions);
  const {
    transactions: walletTransactions,
    pendingTransactions: pendingWalletTransactions,
    isLoading: walletLoading,
  } = useAppSelector((state) => state.wallet);
  const { accounts } = useAppSelector((state) => state.accounts);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(fetchTransactions());
    dispatch(getWalletTransactions());
    dispatch(fetchAccounts());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error,
      });
    }
  }, [error]);

  // Memoized combined and filtered transactions
  const displayedTransactions = useMemo(() => {
    // Step 1: Combine all transactions with source tracking and unique keys
    const combinedTransactions: CombinedTransaction[] = [];

    // Add bank transactions (already filtered by Redux)
    filteredTransactions?.forEach((tx: Transaction) => {
      if (tx) {
        combinedTransactions.push({
          ...tx,
          _source: 'bank',
          _uniqueKey: `bank-${tx.id}`,
        });
      }
    });

    // Add wallet transactions
    walletTransactions?.forEach((tx: WalletTransaction) => {
      if (tx) {
        combinedTransactions.push({
          ...tx,
          _source: 'wallet',
          _uniqueKey: `wallet-${tx.id}`,
        });
      }
    });

    // Add pending wallet transactions
    pendingWalletTransactions?.forEach((tx: WalletTransaction) => {
      if (tx) {
        combinedTransactions.push({
          ...tx,
          _source: 'wallet',
          _uniqueKey: `wallet-pending-${tx.id}`,
        });
      }
    });

    // Step 2: Remove duplicates based on unique key
    const uniqueTransactions = combinedTransactions.reduce((acc, tx) => {
      if (!acc.some(existing => existing._uniqueKey === tx._uniqueKey)) {
        acc.push(tx);
      }
      return acc;
    }, [] as CombinedTransaction[]);

    // Step 3: Apply wallet transaction filters (since Redux filters only apply to bank transactions)
    let filteredWalletTransactions = uniqueTransactions;

    // Apply status filter to wallet transactions
    if (filter?.status) {
      filteredWalletTransactions = filteredWalletTransactions.filter((tx) => {
        if (tx._source === 'wallet') {
          // Map wallet statuses to transaction statuses
          const walletTx = tx as WalletTransaction & { _source: 'wallet'; _uniqueKey: string };
          switch (filter.status) {
            case TransactionStatus.COMPLETED:
              return walletTx.status === WalletTransactionStatus.COMPLETED;
            case TransactionStatus.PENDING:
              return walletTx.status === WalletTransactionStatus.PENDING;
            case TransactionStatus.REJECTED:
              return walletTx.status === WalletTransactionStatus.FAILED;
            default:
              return true;
          }
        }
        return true; // Keep bank transactions (already filtered by Redux)
      });
    }

    // Apply date range filter to wallet transactions
    if (filter?.dateRange?.from || filter?.dateRange?.to) {
      filteredWalletTransactions = filteredWalletTransactions.filter((tx) => {
        if (tx._source === 'wallet') {
          const txDate = new Date(tx.date).getTime();
          
          if (filter.dateRange?.from) {
            const fromDate = new Date(filter.dateRange.from).getTime();
            if (txDate < fromDate) return false;
          }
          
          if (filter.dateRange?.to) {
            const toDate = new Date(filter.dateRange.to).getTime();
            if (txDate > toDate) return false;
          }
        }
        return true; // Keep bank transactions (already filtered by Redux)
      });
    }

    // Step 4: Apply search term filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filteredWalletTransactions = filteredWalletTransactions.filter((tx) => {
        if (!tx) return false;

        const isWalletTx = tx._source === 'wallet';
        
        // Search in common fields
        const matchesDescription = tx.description?.toLowerCase().includes(term) || false;
        const matchesId = tx.id?.toLowerCase().includes(term) || false;

        // Search in transaction-specific fields
        let matchesAccountName = false;
        if (!isWalletTx) {
          const bankTx = tx as Transaction;
          matchesAccountName = 
            (bankTx.fromAccountName?.toLowerCase().includes(term) || false) ||
            (bankTx.toAccountName?.toLowerCase().includes(term) || false);
        }

        return matchesDescription || matchesId || matchesAccountName;
      });
    }

    // Step 5: Sort by date (most recent first)
    filteredWalletTransactions.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });

    return filteredWalletTransactions;
  }, [
    filteredTransactions,
    walletTransactions,
    pendingWalletTransactions,
    searchTerm,
    filter,
  ]);

  const handleRefresh = async () => {
    await Promise.all([
      dispatch(fetchTransactions()),
      dispatch(getWalletTransactions()),
    ]);
  };

  const handleViewDetails = (id: string, isWalletTransaction: boolean) => {
    if (isWalletTransaction) {
      router.push(`/dashboard/wallet/transactions/${id}`);
    } else {
      router.push(`/dashboard/transactions/${id}`);
    }
  };

  const handleClearFilters = () => {
    dispatch(clearTransactionsFilter());
    setSearchTerm("");
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown date";

    try {
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
    } catch (error) {
      return "Invalid date";
    }
  };

  const getStatusBadge = (
    status: TransactionStatus | WalletTransactionStatus
  ) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;

    switch (status) {
      case TransactionStatus.COMPLETED:
      case WalletTransactionStatus.COMPLETED:
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
          >
            Completed
          </Badge>
        );
      case TransactionStatus.PENDING:
      case WalletTransactionStatus.PENDING:
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
          >
            Pending
          </Badge>
        );
      case TransactionStatus.REJECTED:
      case WalletTransactionStatus.FAILED:
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
          >
            Rejected
          </Badge>
        );
      case TransactionStatus.CANCELLED:
        return (
          <Badge
            variant="outline"
            className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
          >
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading || walletLoading) {
    return <TransactionHistorySkeleton />;
  }

  if (
    (!transactions || transactions.length === 0) &&
    (!walletTransactions || walletTransactions.length === 0)
  ) {
    return (
      <div className="container px-4 py-6 pb-20">
        <h1 className="text-2xl font-bold tracking-tight mb-6">Transactions</h1>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No transactions found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="container px-2 sm:px-4 py-4 sm:py-6 pb-16 sm:pb-20">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-4 sm:mb-6">
          Transactions
        </h1>

        <div className="space-y-3 sm:space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              className="pl-9 h-9 sm:h-10 text-sm sm:text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Card>
            <CardHeader className="p-3 sm:p-4 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base">Filters</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 sm:h-8 gap-1 text-xs"
                  onClick={handleClearFilters}
                >
                  <FilterX className="h-3.5 w-3.5" />
                  <span>Clear</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Status</p>
                <Select
                  value={filter?.status || ""}
                  onValueChange={(value) =>
                    dispatch(
                      setStatusFilter((value as TransactionStatus) || null)
                    )
                  }
                >
                  <SelectTrigger className="h-8 text-xs sm:text-sm">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value={TransactionStatus.COMPLETED}>
                      Completed
                    </SelectItem>
                    <SelectItem value={TransactionStatus.PENDING}>
                      Pending
                    </SelectItem>
                    <SelectItem value={TransactionStatus.REJECTED}>
                      Failed
                    </SelectItem>
                    <SelectItem value={TransactionStatus.CANCELLED}>
                      Cancelled
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Account</p>
                <Select
                  value={filter?.accountId || ""}
                  onValueChange={(value) =>
                    dispatch(setAccountFilter(value || null))
                  }
                >
                  <SelectTrigger className="h-8 text-xs sm:text-sm">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {accounts?.map((account: BankAccount) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.accountName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Date</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-8 w-full justify-start text-left font-normal text-xs sm:text-sm",
                        !filter?.dateRange?.from &&
                          !filter?.dateRange?.to &&
                          "text-muted-foreground"
                      )}
                    >
                      {filter?.dateRange?.from ? (
                        filter?.dateRange?.to ? (
                          <>
                            {format(new Date(filter.dateRange.from), "LLL dd")}{" "}
                            - {format(new Date(filter.dateRange.to), "LLL dd")}
                          </>
                        ) : (
                          format(new Date(filter.dateRange.from), "LLL dd, y")
                        )
                      ) : (
                        "Pick a date"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={
                        filter?.dateRange?.from
                          ? new Date(filter.dateRange.from)
                          : new Date()
                      }
                      selected={{
                        from: filter?.dateRange?.from
                          ? new Date(filter.dateRange.from)
                          : undefined,
                        to: filter?.dateRange?.to
                          ? new Date(filter.dateRange.to)
                          : undefined,
                      }}
                      onSelect={(range) => {
                        dispatch(
                          setDateRangeFilter({
                            from: range?.from ? range.from.toISOString() : null,
                            to: range?.to ? range.to.toISOString() : null,
                          })
                        );
                      }}
                      numberOfMonths={1}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          {!displayedTransactions || displayedTransactions.length === 0 ? (
            <Card>
              <CardContent className="p-6 sm:p-8 text-center">
                <p className="text-sm sm:text-base text-muted-foreground">
                  No transactions found
                </p>
                {(filter?.status ||
                  filter?.accountId ||
                  filter?.dateRange?.from ||
                  filter?.dateRange?.to ||
                  searchTerm) && (
                  <Button
                    variant="link"
                    onClick={handleClearFilters}
                    className="mt-2 text-sm sm:text-base"
                  >
                    Clear filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {displayedTransactions.map((transaction) => {
                if (!transaction) return null;
                const isWalletTransaction = transaction._source === 'wallet';
                return (
                  <Card
                    key={transaction._uniqueKey}
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() =>
                      handleViewDetails(transaction.id, isWalletTransaction)
                    }
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div
                          className={cn(
                            "rounded-full p-1.5 sm:p-2",
                            (
                              isWalletTransaction
                                ? (transaction as WalletTransaction).type ===
                                  WalletTransactionType.DEPOSIT
                                : (transaction as Transaction).type === TransactionType.DEPOSIT
                            )
                              ? "bg-green-100 dark:bg-green-900"
                              : "bg-red-100 dark:bg-red-900"
                          )}
                        >
                          {(
                            isWalletTransaction
                              ? (transaction as WalletTransaction).type ===
                                WalletTransactionType.DEPOSIT
                              : (transaction as Transaction).type === TransactionType.DEPOSIT
                          ) ? (
                            <ArrowDownLeft
                              className={cn(
                                "h-3.5 w-3.5 sm:h-4 sm:w-4",
                                "text-green-600 dark:text-green-400"
                              )}
                            />
                          ) : (
                            <ArrowUpRight
                              className={cn(
                                "h-3.5 w-3.5 sm:h-4 sm:w-4",
                                "text-red-600 dark:text-red-400"
                              )}
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                            <p className="font-medium text-sm sm:text-base truncate">
                              {transaction.description || "Unnamed Transaction"}
                            </p>
                            <div className="flex items-center">
                              <p
                                className={cn(
                                  "font-medium text-sm sm:text-base",
                                  (
                                    isWalletTransaction
                                      ? (transaction as WalletTransaction).type ===
                                        WalletTransactionType.DEPOSIT
                                      : (transaction as Transaction).type ===
                                        TransactionType.DEPOSIT
                                  )
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-red-600 dark:text-red-400"
                                )}
                              >
                                {(
                                  isWalletTransaction
                                    ? (transaction as WalletTransaction).type ===
                                      WalletTransactionType.DEPOSIT
                                    : (transaction as Transaction).type ===
                                      TransactionType.DEPOSIT
                                )
                                  ? "+"
                                  : "-"}
                                {formatCurrency(
                                  transaction.amount,
                                  transaction.currency
                                )}
                              </p>
                              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground ml-1" />
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-1 gap-1 sm:gap-2">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <p className="text-xs text-muted-foreground">
                                {formatDate(transaction.date)}
                              </p>
                              {getStatusBadge(transaction.status)}
                            </div>
                            <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                              {isWalletTransaction
                                ? "Wallet Transaction"
                                : (transaction as Transaction).fromAccountName ||
                                  (transaction as Transaction).toAccountName ||
                                  "Unknown Account"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PullToRefresh>
  );
}
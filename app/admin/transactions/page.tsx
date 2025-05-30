"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getWalletTransactions } from "@/store/slices/walletSlice";
import { TransactionTable } from "@/components/admin/transaction-management/transaction-table";
import { TransactionFilterDrawer } from "@/components/admin/transaction-management/transaction-filter-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RefreshCw,
  Search,
  SlidersHorizontal,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Transaction } from "@/types";
import { fetchAllWalletTransactions } from "@/api/wallet";

export default function AdminTransactionsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { transactions, isLoading } = useAppSelector((state) => state.wallet);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await fetchAllWalletTransactions();
        console.log("All wallet transactions:", result);
        dispatch({
          type: "wallet/setAllTransactions",
          payload: result,
        });
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };
    fetchData();
  }, [dispatch]);

  const handleViewTransaction = (transaction: Transaction) => {
    router.push(`/admin/transactions/${transaction.id}`);
  };

  const handleRefresh = async () => {
    try {
      const result = await fetchAllWalletTransactions();
      console.log("All wallet transactions (refresh):", result);
      dispatch({
        type: "wallet/setAllTransactions",
        payload: result,
      });
    } catch (error) {
      console.error("Error refreshing transactions:", error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const filteredTransactions = transactions.filter(
    (transaction: Transaction) => {
      const matchesSearch = searchTerm
        ? transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
        : true;

      return matchesSearch;
    }
  );

  const pendingTransactions = filteredTransactions.filter(
    (t: Transaction) => t.status === "PENDING"
  );
  const rejectedTransactions = filteredTransactions.filter(
    (t: Transaction) => t.status === "REJECTED"
  );
  const completedTransactions = filteredTransactions.filter(
    (t: Transaction) => t.status === "COMPLETED"
  );

  const totalAmount = filteredTransactions.reduce(
    (sum: number, t: Transaction) =>
      sum + (t.type === "DEPOSIT" ? t.amount : -t.amount),
    0
  );

  const NoTransactionsMessage = () => (
    <div className="flex h-[300px] sm:h-[400px] flex-col items-center justify-center text-center p-4">
      <AlertCircle className="mb-4 h-8 sm:h-12 w-8 sm:w-12 text-muted-foreground" />
      <h3 className="mb-2 text-base sm:text-lg font-medium">
        No Transactions Found
      </h3>
      <p className="mb-4 text-xs sm:text-sm text-muted-foreground max-w-md">
        There are no transactions in the system yet. Transactions will appear
        here once they are created.
      </p>
    </div>
  );

  return (
    <div className="container mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold">Transactions</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterOpen(true)}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0 sm:px-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 sm:px-2">
            <div className="text-lg sm:text-2xl font-bold">
              {filteredTransactions.length}
            </div>
          </CardContent>
        </Card>
        <Card className="p-3 sm:p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0 sm:px-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Pending Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 sm:px-2">
            <div className="text-lg sm:text-2xl font-bold">
              {pendingTransactions.length}
            </div>
          </CardContent>
        </Card>
        <Card className="p-3 sm:p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0 sm:px-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Rejected Transactions
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 sm:px-2">
            <div className="text-lg sm:text-2xl font-bold">
              {rejectedTransactions.length}
            </div>
          </CardContent>
        </Card>
        <Card className="p-3 sm:p-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-0 sm:px-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Net Amount
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 sm:px-2">
            <div className="text-lg sm:text-2xl font-bold">
              {formatCurrency(totalAmount)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-4 w-full">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8 h-10 text-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex min-w-full sm:min-w-0">
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              All
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs sm:text-sm">
              Pending
            </TabsTrigger>
            <TabsTrigger value="rejected" className="text-xs sm:text-sm">
              Rejected
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs sm:text-sm">
              Completed
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content */}
        <TabsContent value="all" className="mt-0 sm:mt-2">
          {filteredTransactions.length === 0 && !isLoading ? (
            <NoTransactionsMessage />
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <TransactionTable
                transactions={filteredTransactions}
                isLoading={isLoading}
                onViewTransaction={handleViewTransaction}
              />
            </div>
          )}
        </TabsContent>
        <TabsContent value="pending" className="mt-0 sm:mt-2">
          {pendingTransactions.length === 0 && !isLoading ? (
            <NoTransactionsMessage />
          ) : (
            <TransactionTable
              transactions={pendingTransactions}
              isLoading={isLoading}
              onViewTransaction={handleViewTransaction}
            />
          )}
        </TabsContent>
        <TabsContent value="rejected" className="mt-0 sm:mt-2">
          {rejectedTransactions.length === 0 && !isLoading ? (
            <NoTransactionsMessage />
          ) : (
            <TransactionTable
              transactions={rejectedTransactions}
              isLoading={isLoading}
              onViewTransaction={handleViewTransaction}
            />
          )}
        </TabsContent>
        <TabsContent value="completed" className="mt-0 sm:mt-2">
          {completedTransactions.length === 0 && !isLoading ? (
            <NoTransactionsMessage />
          ) : (
            <TransactionTable
              transactions={completedTransactions}
              isLoading={isLoading}
              onViewTransaction={handleViewTransaction}
            />
          )}
        </TabsContent>
      </Tabs>

      <TransactionFilterDrawer
        open={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />
    </div>
  );
}

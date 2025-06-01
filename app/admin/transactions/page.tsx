"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getWalletTransactions } from "@/store/slices/walletSlice";
import { TransactionTable } from "@/components/admin/transaction-management/transaction-table";
import { TransactionFilterDrawer } from "@/components/admin/transaction-management/transaction-filter-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, Search, SlidersHorizontal, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Transaction } from "@/types";
import { WalletTransactionStatus, TransactionStatus } from "@/types";

// Map between TransactionStatus and WalletTransactionStatus
const statusMapping: Record<TransactionStatus, WalletTransactionStatus> = {
  [TransactionStatus.PENDING]: WalletTransactionStatus.PENDING,
  [TransactionStatus.APPROVED]: WalletTransactionStatus.COMPLETED,
  [TransactionStatus.REJECTED]: WalletTransactionStatus.CANCELLED,
  [TransactionStatus.CANCELLED]: WalletTransactionStatus.CANCELLED,
  [TransactionStatus.COMPLETED]: WalletTransactionStatus.COMPLETED,
  [TransactionStatus.FAILED]: WalletTransactionStatus.FAILED,
};

const COMPLETED_STATUS = WalletTransactionStatus.COMPLETED;
const REJECTED_STATUS = WalletTransactionStatus.CANCELLED;

import { transferApi } from "@/api";
import { toast } from "@/components/ui/use-toast";

export default function AdminTransactionsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const { transactions, isLoading } = useAppSelector((state) => state.wallet);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ description: "", amount: 0 });
  const defaultTab = searchParams.get("status")?.toLowerCase() || "all";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await transferApi.getTransactions();
        console.log("All wallet transactions:", result.transactions);
        dispatch({
          type: "wallet/setAllTransactions",
          payload: result.transactions,
        });
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };
    fetchData();
  }, [dispatch]);

  // Updated handleViewTransaction to use the passed transaction directly
  const handleViewTransaction = (transaction: Transaction) => {
    try {
      if (!transaction.id) {
        throw new Error("Invalid transaction ID");
      }
      setSelectedTransaction(transaction);
      setEditForm({
        description: transaction.description || "",
        amount: transaction.amount,
      });
    } catch (error) {
      console.error("Error setting transaction details:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load transaction details",
      });
    }
  };

  const handleApproveTransaction = async (transaction: Transaction) => {
    try {
      if (!transaction.id) {
        throw new Error("Invalid transaction ID");
      }
      // Use the new status API endpoint
      const result = await transferApi.approveTransactionNew(transaction.id);
      dispatch({
        type: "wallet/updateTransactionStatus",
        payload: { id: transaction.id, status: COMPLETED_STATUS },
      });
      setSelectedTransaction(null);
      toast({
        title: "Success",
        description: result.message || "Transaction approved successfully",
      });
      
      // Show wallet update message if balance was updated
      if (result.walletUpdated && result.newBalance !== null) {
        toast({
          title: "Wallet Updated",
          description: `Wallet balance updated to ${result.newBalance}`,
        });
      }
    } catch (error) {
      console.error("Error approving transaction:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve transaction",
      });
    }
  };

  const handleRejectTransaction = async (transaction: Transaction) => {
    try {
      if (!transaction.id) {
        throw new Error("Invalid transaction ID");
      }
      // Use the new status API endpoint
      const result = await transferApi.rejectTransactionNew(transaction.id);
      dispatch({
        type: "wallet/updateTransactionStatus",
        payload: { id: transaction.id, status: REJECTED_STATUS },
      });
      setSelectedTransaction(null);
      toast({
        title: "Success",
        description: result.message || "Transaction rejected successfully",
      });
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject transaction",
      });
    }
  };

  const handleEditTransaction = async () => {
    try {
      if (!selectedTransaction?.id) {
        throw new Error("Invalid transaction ID");
      }
      await transferApi.updateTransaction(selectedTransaction.id, {
        amount: editForm.amount,
        description: editForm.description,
      });
      dispatch({
        type: "wallet/updateTransaction",
        payload: {
          id: selectedTransaction.id,
          description: editForm.description,
          amount: editForm.amount,
        },
      });
      setSelectedTransaction({
        ...selectedTransaction,
        description: editForm.description,
        amount: editForm.amount,
      });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update transaction",
      });
    }
  };

  const handleRefresh = async () => {
    try {
      const result = await transferApi.getTransactions();
      console.log("All wallet transactions (refresh):", result.transactions);
      dispatch({
        type: "wallet/setAllTransactions",
        payload: result.transactions,
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

  const handleTabChange = (value: string) => {
    const status = value.toUpperCase();
    if (value === "all") {
      router.push("/admin/transactions");
    } else {
      router.push(`/admin/transactions?status=${status}`);
    }
  };

  const pendingTransactions = filteredTransactions.filter(
    (t: Transaction) => t.status === TransactionStatus.PENDING
  );
  const rejectedTransactions = filteredTransactions.filter(
    (t: Transaction) => t.status === TransactionStatus.REJECTED
  );
  const completedTransactions = filteredTransactions.filter(
    (t: Transaction) => t.status === TransactionStatus.COMPLETED
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
      <Tabs
        defaultValue={defaultTab}
        className="space-y-4"
        onValueChange={handleTabChange}
      >
        <div className="overflow-x-auto">
          <TabsList className="inline-flex min-w-full sm:min-w-0">
            <TabsTrigger
              value="all"
              className="text-xs sm:text-sm"
              onClick={() => router.push("/admin/transactions")}
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className="text-xs sm:text-sm"
              onClick={() => router.push("/admin/transactions?status=PENDING")}
            >
              Pending
            </TabsTrigger>
            <TabsTrigger
              value="rejected"
              className="text-xs sm:text-sm"
              onClick={() => router.push("/admin/transactions?status=REJECTED")}
            >
              Rejected
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="text-xs sm:text-sm"
              onClick={() =>
                router.push("/admin/transactions?status=COMPLETED")
              }
            >
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
            <div className="rounded-lg border overflow-hidden">
              <TransactionTable
                transactions={pendingTransactions}
                isLoading={isLoading}
                onViewTransaction={handleViewTransaction}
              />
            </div>
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

      {/* Transaction Details Modal */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => {
        setSelectedTransaction(null);
        setIsEditing(false);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Transaction" : "Transaction Details"}</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={editForm.amount}
                      onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Transaction ID</p>
                    <p className="text-sm">{selectedTransaction.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Description</p>
                    <p className="text-sm">{selectedTransaction.description || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Amount</p>
                    <p className="text-sm">{formatCurrency(selectedTransaction.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Type</p>
                    <p className="text-sm">{selectedTransaction.type}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-sm">{selectedTransaction.status}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedTransaction(null);
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
            {selectedTransaction?.status === "PENDING" && !isEditing && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleRejectTransaction(selectedTransaction)}
                >
                  Reject
                </Button>
                <Button
                  onClick={() => handleApproveTransaction(selectedTransaction)}
                >
                  Approve
                </Button>
                <Button
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              </>
            )}
            {isEditing && (
              <Button
                onClick={handleEditTransaction}
                disabled={!editForm.description || editForm.amount <= 0}
              >
                Save
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TransactionFilterDrawer
        open={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />
    </div>
  );
}
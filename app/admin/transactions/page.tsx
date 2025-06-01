"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { getWalletTransactions, updateTransactionStatus } from "@/store/slices/walletSlice";
import type { WalletTransaction } from "@/types";
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
  ArrowLeft,
  User,
  CreditCard,
  Calendar,
  DollarSign,
  Pencil,
  Save,
  X,
  Loader2,
  Copy,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Transaction } from "@/types";
import { fetchAllWalletTransactions } from "@/api/wallet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { fetchTransactionDetails, pollTransactionStatus } from "@/store/slices/transactionsSlice";

export default function AdminTransactionsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const { transactions, isLoading } = useAppSelector((state) => state.wallet);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<WalletTransaction | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAmount, setEditedAmount] = useState("");
  const [editedLocation, setEditedLocation] = useState("");
  const [editedTime, setEditedTime] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const defaultTab = searchParams.get("status")?.toLowerCase() || "all";
  const [isLoadingTransactionDetails, setIsLoadingTransactionDetails] = useState(false);

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

  useEffect(() => {
    if (selectedTransactionId) {
      console.log("Fetching transaction details for ID:", selectedTransactionId);
      setIsLoadingTransactionDetails(true); // Set loading to true
      dispatch(fetchTransactionDetails(selectedTransactionId))
        .unwrap()
        .then((result) => {
          console.log("Transaction details fetched successfully:", result);
          setTransaction(result);
          setEditedAmount(result.amount?.toString() || "");
          setEditedLocation(result?.location || "");
          if (result.date) {
            try {
              const date = new Date(result.date);
              if (!isNaN(date.getTime())) {
                const formattedDate = date.toISOString().slice(0, 16);
                setEditedTime(formattedDate);
              } else {
                setEditedTime("");
              }
            } catch (error) {
              console.error("Error formatting initial date:", error);
              setEditedTime("");
            }
          }
        })
        .catch((error) => {
          console.error("Failed to fetch transaction details:", error);
          toast({
            title: "Error",
            description: "Failed to load transaction details",
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsLoadingTransactionDetails(false); // Set loading to false
        });
    }
  }, [selectedTransactionId, dispatch]);

  useEffect(() => {
    if (transaction?.status === "PENDING" && transaction?.id) {
      const interval = setInterval(() => {
        dispatch(pollTransactionStatus(transaction.id));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [transaction?.status, transaction?.id, dispatch]);

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransactionId(transaction.id);
    setIsModalOpen(true);
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

  const handleTabChange = (value: string) => {
    const status = value.toUpperCase();
    if (value === "all") {
      router.push("/admin/transactions");
    } else {
      router.push(`/admin/transactions?status=${status}`);
    }
  };

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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      return format(date, "PPP p");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        description: "Transaction ID copied to clipboard",
        duration: 2000,
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({
        variant: "destructive",
        description: "Failed to copy to clipboard",
        duration: 2000,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>;
      case "FAILED":
        return <Badge className="bg-red-500 hover:bg-red-600">Failed</Badge>;
      case "PROCESSING":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Processing</Badge>;
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600">{status || "Unknown"}</Badge>;
    }
  };

  const handleApprove = async () => {
    if (!transaction?.id) return;
    setIsApproving(true);
    try {
      await dispatch(
        updateTransactionStatus({
          id: transaction.id,
          status: "COMPLETED",
        })
      ).unwrap();
      toast({
        title: "Transaction approved",
        description: "The transaction has been approved successfully.",
        variant: "default",
      });
    } catch (err) {
      console.error("Error approving transaction:", err);
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to approve transaction",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!transaction?.id) return;
    setIsRejecting(true);
    try {
      await dispatch(
        updateTransactionStatus({
          id: transaction.id,
          status: "REJECTED",
        })
      ).unwrap();
      toast({
        title: "Transaction rejected",
        description: "The transaction has been rejected successfully.",
        variant: "default",
      });
    } catch (err) {
      console.error("Error rejecting transaction:", err);
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to reject transaction",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const handleEdit = async () => {
    if (!transaction?.id) return;
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/user/wallet/transactions/${transaction.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: transaction.status,
          amount: parseFloat(editedAmount) || transaction.amount,
          location: editedLocation || transaction.location,
          date: editedTime || transaction.date,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to update transaction`);
      }

      const updatedTransaction = await response.json();
      console.log("Transaction updated successfully:", updatedTransaction);
      await dispatch(fetchTransactionDetails(transaction.id)).unwrap(); // Re-fetch details to ensure UI is updated
      setIsEditing(false);
      toast({
        title: "Transaction updated",
        description: "The transaction has been updated successfully.",
        variant: "default",
      });
    } catch (err) {
      console.error("Error updating transaction:", err);
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to update transaction",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

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

      {/* Transaction Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) {
          setSelectedTransactionId(null);
          setIsEditing(false);
        }
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          {/* Conditional rendering for transaction details */}
          {isLoadingTransactionDetails ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i}>
                    <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                    <div className="h-5 w-40 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : !transaction ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No transaction selected</p>
            </div>
          ) : ( // Display actual transaction details when available
            <div className="space-y-6">
              {/* Transaction Information */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Transaction Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Transaction ID</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="flex items-center gap-2 cursor-pointer group"
                            onClick={() => copyToClipboard(transaction.id)}
                          >
                            <p className="font-medium text-blue-600 hover:text-blue-800 break-all">
                              {transaction.id}
                            </p>
                            <Copy className="h-4 w-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Click to copy ID</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Amount</p>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedAmount}
                        onChange={(e) => setEditedAmount(e.target.value)}
                        placeholder="Enter amount"
                        step="0.01"
                        min="0"
                      />
                    ) : (
                      <p className="font-medium">{formatCurrency(transaction.amount || 0)}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Type</p>
                    <p className="font-medium capitalize">
                      {transaction.type?.toLowerCase() || "Unknown"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <div className="mt-1">{getStatusBadge(transaction.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Date</p>
                    {isEditing ? (
                      <Input
                        type="datetime-local"
                        value={editedTime}
                        onChange={(e) => setEditedTime(e.target.value)}
                      />
                    ) : (
                      <p className="font-medium">{formatDate(transaction.date)}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Location</p>
                    {isEditing ? (
                      <Input
                        value={editedLocation}
                        onChange={(e) => setEditedLocation(e.target.value)}
                        placeholder="Enter location"
                      />
                    ) : (
                      <p className="font-medium">{transaction.location || "N/A"}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* User Information */}
              {transaction.user && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">User Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Name</p>
                      <p className="font-medium">
                        {transaction.user.firstName || ""} {transaction.user.lastName || ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Email</p>
                      <p className="font-medium">{transaction.user.email || "N/A"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Bank Account Information */}
              {transaction.bankAccountId && transaction.bankAccount && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Bank Account Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Account Name</p>
                      <p className="font-medium">{transaction.bankAccount?.accountName || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Account Number</p>
                      <p className="font-medium">{transaction.bankAccount?.accountNumber || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Bank Name</p>
                      <p className="font-medium">{transaction.bankAccount?.bankName || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Account Type</p>
                      <p className="font-medium">{transaction.bankAccount?.accountType || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Balance</p>
                      <p className="font-medium">{transaction.bankAccount?.balance ? formatCurrency(transaction.bankAccount.balance) : "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Currency</p>
                      <p className="font-medium">{transaction.bankAccount?.currency || "N/A"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {(transaction?.status === "PENDING" || transaction?.status === "REJECTED") && (
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      disabled={isUpdating}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button onClick={handleEdit} disabled={isUpdating}>
                      {isUpdating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="destructive"
                      onClick={handleReject}
                      disabled={isLoading || isRejecting || isApproving || !transaction} // Disable if transaction is not loaded
                    >
                      {isRejecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        "Reject"
                      )}
                    </Button>
                    <Button
                      variant="default"
                      onClick={handleApprove}
                      disabled={isLoading || isApproving || isRejecting || !transaction} // Disable if transaction is not loaded
                    >
                      {isApproving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        "Approve"
                      )}
                    </Button>
                    {transaction?.type === "DEPOSIT" && (
                      <Button variant="outline" onClick={() => setIsEditing(true)} disabled={!transaction}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
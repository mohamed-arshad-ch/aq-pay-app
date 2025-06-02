"use client";

import { useState, useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import {
  updateTransactionStatus,
  addNotification,
} from "@/store/slices/walletSlice";
import {
  fetchWalletTransactions,
  updateTransactionStatus as apiUpdateTransactionStatus,
} from "@/lib/wallet-client";
import type { WalletTransaction, User, BankAccount } from "@/types";
import { WalletTransactionStatus } from "@/types";
import { formatCurrency } from "@/lib/currency-utils";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from "uuid";
import {
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { transferApi } from "@/lib";

export function WalletTransactionsManagement() {
  const dispatch = useAppDispatch();
  const [transactions, setTransactions] = useState<(WalletTransaction & { user: User; account?: BankAccount })[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<WalletTransaction | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<WalletTransactionStatus>(
    WalletTransactionStatus.PENDING
  );
  const [adminNote, setAdminNote] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [editedAmount, setEditedAmount] = useState("");
  const [editedLocation, setEditedLocation] = useState("");
  const [editedTime, setEditedTime] = useState("");

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const result = await transferApi.getTransactions();

      // Filter only deposit transactions
      const depositTransactions = result.transactions.filter((tx: WalletTransaction) => tx.type === 'DEPOSIT');

      // Sort transactions by status order (PENDING first, CANCELLED/FAILED, then COMPLETED)
      const sortedTransactions = depositTransactions.sort((a: WalletTransaction, b: WalletTransaction) => {
        const statusOrder = {
          [WalletTransactionStatus.PENDING]: 0,
          [WalletTransactionStatus.CANCELLED]: 1,
          [WalletTransactionStatus.FAILED]: 1,
          [WalletTransactionStatus.COMPLETED]: 2
        };
        return statusOrder[a.status] - statusOrder[b.status];
      });

      setTransactions(sortedTransactions);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch transactions",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleStatusChange = async () => {
    if (!selectedTransaction) return;

    setIsUpdating(true);
    try {
      const result = await apiUpdateTransactionStatus(
        selectedTransaction.id,
        newStatus,
        adminNote,
        {
          amount: parseFloat(editedAmount),
          location: editedLocation,
          date: editedTime,
        }
      );

      // Update the transaction in the local state
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === selectedTransaction.id
            ? {
              ...tx,
              status: newStatus,
              adminNote,
              amount: parseFloat(editedAmount),
              location: editedLocation,
              date: editedTime,
            }
            : tx
        )
      );

      // Update the transaction in the Redux store
      dispatch(
        updateTransactionStatus({
          transactionId: selectedTransaction.id,
          status: newStatus,
          adminNote,
        })
      );

      // Add a notification for the user
      const notificationMessage =
        newStatus === WalletTransactionStatus.COMPLETED
          ? `Your send request of ${formatCurrency(
            selectedTransaction.amount,
            selectedTransaction.currency
          )} has been approved.`
          : `Your send request of ${formatCurrency(
            selectedTransaction.amount,
            selectedTransaction.currency
          )} has been rejected.${adminNote ? ` Reason: ${adminNote}` : ""}`;

      dispatch(
        addNotification({
          id: uuidv4(),
          transactionId: selectedTransaction.id,
          message: notificationMessage,
          status: "unread",
          createdAt: new Date().toISOString(),
          type:
            newStatus === WalletTransactionStatus.COMPLETED
              ? "success"
              : "error",
        })
      );

      toast({
        title: "Status Updated",
        description: `Transaction status has been updated to ${newStatus === WalletTransactionStatus.COMPLETED ? 'approved' : 'rejected'
          }.`,
      });

      setIsDialogOpen(false);
      setAdminNote("");

      // Re-fetch transactions to get updated order
      await fetchTransactions();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update transaction status",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const openStatusDialog = (transaction: WalletTransaction) => {
    if (transaction.status !== WalletTransactionStatus.PENDING) {
      toast({
        title: "Cannot Update",
        description: "Only pending transactions can be updated.",
      });
      return;
    }
    setSelectedTransaction(transaction);
    setNewStatus(WalletTransactionStatus.COMPLETED); // Default to approve
    setEditedAmount(transaction.amount.toString());
    setEditedLocation(transaction.location || "");
    setEditedTime(transaction.date);
    setAdminNote("");
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: WalletTransactionStatus) => {
    switch (status) {
      case WalletTransactionStatus.PENDING:
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 border-yellow-300"
          >
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case WalletTransactionStatus.COMPLETED:
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-300"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case WalletTransactionStatus.FAILED:
      case WalletTransactionStatus.CANCELLED:
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 border-red-300"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Deposit Requests</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTransactions}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deposit Requests Management</CardTitle>
          <CardDescription>
            Review and manage deposit requests from users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No send requests found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px]">ID</TableHead>
                    <TableHead className="min-w-[150px]">User Name</TableHead>
                    <TableHead className="min-w-[100px]">Amount</TableHead>
                    <TableHead className="min-w-[150px]">Bank Account</TableHead>
                    <TableHead className="min-w-[120px]">Date</TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="text-right min-w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[100px]">
                            {transaction.id}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 flex-shrink-0"
                            onClick={() => {
                              if (transaction.reference) {
                                navigator.clipboard.writeText(
                                  transaction.reference
                                );
                                toast({
                                  title: "Reference Copied",
                                  description:
                                    "Transaction reference copied to clipboard",
                                });
                              }
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="truncate font-medium">
                            {transaction.user?.username || transaction.userId}
                          </span>
                          {transaction.account?.accountName && (
                            <span className="text-sm text-muted-foreground truncate">
                              {transaction.account.accountName}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(
                          transaction.amount,
                          transaction.currency
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="truncate max-w-[130px] block">
                          {transaction.paymentMethod}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {formatDistanceToNow(new Date(transaction.date), {
                            addSuffix: true,
                          })}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        {transaction.status ===
                          WalletTransactionStatus.PENDING && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openStatusDialog(transaction)}
                            >
                              Update
                            </Button>
                          )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Update Transaction Status</DialogTitle>
            <DialogDescription>
              Review and update the transaction details before approving or
              rejecting.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[60vh] pr-2">
            {selectedTransaction && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Reference</p>
                    <p className="font-medium break-all">{selectedTransaction.reference}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">User</p>
                    <p className="font-medium">
                      {selectedTransaction.userName || selectedTransaction.userId}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={editedAmount}
                        onChange={(e) => setEditedAmount(e.target.value)}
                        placeholder="Enter amount"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={editedLocation}
                        onChange={(e) => setEditedLocation(e.target.value)}
                        placeholder="Enter location"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="datetime-local"
                      value={editedTime}
                      onChange={(e) => setEditedTime(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={newStatus}
                      onValueChange={(value) =>
                        setNewStatus(value as WalletTransactionStatus)
                      }
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={WalletTransactionStatus.COMPLETED}>
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                            Approve
                          </div>
                        </SelectItem>
                        <SelectItem value={WalletTransactionStatus.FAILED}>
                          <div className="flex items-center">
                            <XCircle className="h-4 w-4 mr-2 text-red-500" />
                            Reject
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminNote">Admin Note (Optional)</Label>
                    <Textarea
                      id="adminNote"
                      placeholder="Add a note about this decision"
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isUpdating}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleStatusChange}
                disabled={isUpdating}
                className="w-full sm:w-auto"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Transaction"
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
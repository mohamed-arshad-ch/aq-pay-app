"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  Trash2,
  Loader2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { BankIcon } from "@/components/accounts/bank-icon";
import { AccountDetailsSkeleton } from "@/components/accounts/account-details-skeleton";
import { cn } from "@/lib/utils";
import { TransactionStatus, TransactionType, BankAccount } from "@/types";
import { formatCurrency } from "@/lib/currency-utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AccountDetailsProps {
  id: string;
}

export function AccountDetails({ id }: AccountDetailsProps) {
  const router = useRouter();
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]); // You can define a proper Transaction type
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingDefault, setIsUpdatingDefault] = useState(false);

  const fetchAccountDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/user/accounts/details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch account details");
      }

      const data = await response.json();
      setAccount(data.account);
    } catch (error) {
      console.error("Error fetching account details:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch account details");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch account details. Please try again.",
      });
      router.push("/dashboard/accounts");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountDetails();
  }, [id, router]);

  const handleEdit = () => {
    router.push(`/dashboard/accounts/edit/${id}`);
  };

  const handleNewTransfer = () => {
    router.push(`/dashboard/transfer?fromAccount=${id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/user/accounts/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      toast({
        title: "Account deleted",
        description: "Your account has been successfully deleted.",
      });
      router.push("/dashboard/accounts");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete account. Please try again.",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleToggleDefault = async (newDefaultStatus: boolean) => {
    if (!account) return;
    
    try {
      setIsUpdatingDefault(true);
      const response = await fetch(`/api/user/accounts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          isDefault: newDefaultStatus 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update default status");
      }

      // Update local state
      setAccount(prev => prev ? { ...prev, isDefault: newDefaultStatus } : null);
      
      toast({
        title: newDefaultStatus ? "Set as default account" : "Removed as default account",
        description: newDefaultStatus 
          ? "This account is now your default account." 
          : "This account is no longer your default account.",
      });
    } catch (error) {
      console.error("Error updating default status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update default status. Please try again.",
      });
    } finally {
      setIsUpdatingDefault(false);
    }
  };

  // Early return for loading state
  if (isLoading || !account) {
    return <AccountDetailsSkeleton />;
  }

  // Main component return
  return (
    <div className="container max-w-2xl mx-auto px-4 py-6 pb-20">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Account Details</h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BankIcon bankName={account.bankName} className="h-8 w-8" />
                <div>
                  <CardTitle>{account.accountName}</CardTitle>
                  <CardDescription>{account.bankName}</CardDescription>
                </div>
              </div>
              {account.isDefault && (
                <Badge
                  variant="outline"
                  className="bg-primary/10 text-primary border-primary/20"
                >
                  Default
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="mt-4 space-y-4">
              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Account Number
                  </p>
                  <p className="font-medium">
                    •••• {account.accountNumber.slice(-4)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account Type</p>
                  <p className="font-medium">{account.accountType}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Account Holder
                  </p>
                  <p className="font-medium">
                    {account.accountHolderName || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">IFSC Code</p>
                  <p className="font-medium font-mono">
                    {account.ifscCode || "N/A"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Routing Number
                  </p>
                  <p className="font-medium">
                    {account.routingNumber ? account.routingNumber : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Branch</p>
                  <p className="font-medium">{account.branchName || "N/A"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="font-medium">
                    {formatCurrency(account.balance, account.currency || "USD")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Currency</p>
                  <p className="font-medium">{account.currency || "USD"}</p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label 
                    htmlFor="default-toggle" 
                    className="text-sm font-medium"
                  >
                    Default Account
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Use this account as your primary account for transfers
                  </p>
                </div>
                <Switch
                  id="default-toggle"
                  checked={account.isDefault}
                  onCheckedChange={handleToggleDefault}
                  disabled={isUpdatingDefault}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button onClick={handleNewTransfer} className="w-full">
              New Transfer
            </Button>
            <div className="flex w-full gap-3">
              <Button variant="outline" onClick={handleEdit} className="flex-1">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                className="flex-1"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>

        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <Card key={transaction.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "rounded-full p-2",
                          transaction.type === TransactionType.DEPOSIT
                            ? "bg-green-100 dark:bg-green-900"
                            : "bg-red-100 dark:bg-red-900"
                        )}
                      >
                        {transaction.type === TransactionType.DEPOSIT ? (
                          <ArrowDownLeft
                            className={cn(
                              "h-4 w-4",
                              "text-green-600 dark:text-green-400"
                            )}
                          />
                        ) : (
                          <ArrowUpRight
                            className={cn(
                              "h-4 w-4",
                              "text-red-600 dark:text-red-400"
                            )}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">
                            {transaction.description}
                          </p>
                          <p
                            className={cn(
                              "font-medium",
                              transaction.type === TransactionType.DEPOSIT
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            )}
                          >
                            {transaction.type === TransactionType.DEPOSIT
                              ? "+"
                              : "-"}
                            {formatCurrency(
                              transaction.amount,
                              account.currency || "USD"
                            )}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-muted-foreground">
                            {formatDate(transaction.date)}
                          </p>
                          <p
                            className={cn(
                              "text-xs font-medium",
                              getStatusColor(transaction.status)
                            )}
                          >
                            {transaction.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/dashboard/transactions")}
              >
                View All Transactions
              </Button>
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  No transactions found for this account.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove it from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
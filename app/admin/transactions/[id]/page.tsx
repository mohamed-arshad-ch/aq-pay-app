"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { transferApi } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import {
  ArrowLeft,
  AlertCircle,
  Pencil,
  Save,
  X,
  Loader2,
  Copy,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WalletTransaction, WalletTransactionStatus } from "@/types";

// Extended type for API response that includes user and bankAccount
interface WalletTransactionWithRelations extends Omit<WalletTransaction, 'bankAccount'> {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  bankAccount?: {
    id: string;
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
}

function TransactionDetailsSkeleton() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-10 w-[150px]" />
      </div>

      <div className="grid gap-6">
        <Card className="p-6">
          <Skeleton className="h-6 w-[200px] mb-4" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i}>
                <Skeleton className="h-4 w-[100px] mb-2" />
                <Skeleton className="h-5 w-[150px]" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return format(date, "PPP p");
  } catch (error) {
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
    toast({
      variant: "destructive",
      description: "Failed to copy to clipboard",
      duration: 2000,
    });
  }
};

interface TransactionDetailsPageProps {
  params: { id: string };
}

export default function TransactionDetailsPage({ params }: TransactionDetailsPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const router = useRouter();
  const [transaction, setTransaction] = useState<WalletTransactionWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Local state for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editedAmount, setEditedAmount] = useState("");
  const [editedLocation, setEditedLocation] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [editedTime, setEditedTime] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // Handle async params
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolvedParamsValue = await Promise.resolve(params);
        setResolvedParams(resolvedParamsValue);
      } catch (error) {
        console.error("Error resolving params:", error);
        setResolvedParams(null);
      }
    };
    resolveParams();
  }, [params]);

  // Fetch transaction details
  useEffect(() => {
    if (resolvedParams?.id) {
      const fetchTransaction = async () => {
        try {
          setIsLoading(true);
          setError(null);
          const result = await transferApi.getTransaction(resolvedParams.id);
          setTransaction(result.transaction);
        } catch (error) {
          console.error("Failed to fetch transaction details:", error);
          setError(error instanceof Error ? error.message : "Failed to fetch transaction");
        } finally {
          setIsLoading(false);
        }
      };
      fetchTransaction();
    }
  }, [resolvedParams?.id]);

  // Initialize edit values when transaction is loaded
  useEffect(() => {
    if (transaction) {
      setEditedAmount(transaction.amount?.toString() || "");
      setEditedLocation(transaction.location || "");
      setEditedDescription(transaction.description || "");
      
      if (transaction.date) {
        try {
          const date = new Date(transaction.date);
          if (!isNaN(date.getTime())) {
            const formattedDate = date.toISOString().slice(0, 16);
            setEditedTime(formattedDate);
          } else {
            setEditedTime("");
          }
        } catch (error) {
          setEditedTime("");
        }
      }
    }
  }, [transaction]);

  const handleApprove = async () => {
    if (!transaction?.id) return;
    setIsApproving(true);
    try {
      // Use the new status API endpoint
      const result = await transferApi.approveTransactionNew(transaction.id);
      setTransaction(result.transaction);
      toast({
        title: "Transaction approved",
        description: result.message || "The transaction has been approved successfully.",
      });
      
      // Show wallet update message if balance was updated
      if (result.walletUpdated && result.newBalance !== null) {
        toast({
          title: "Wallet Updated",
          description: `Wallet balance updated to ${formatCurrency(result.newBalance || 0)}`,
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to approve transaction",
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
      // Use the new status API endpoint
      const result = await transferApi.rejectTransactionNew(transaction.id);
      setTransaction(result.transaction);
      toast({
        title: "Transaction rejected",
        description: result.message || "The transaction has been rejected successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to reject transaction",
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
      const result = await transferApi.updateTransaction(transaction.id, {
        amount: parseFloat(editedAmount) || transaction.amount,
        location: editedLocation || transaction.location,
        description: editedDescription || transaction.description,
        date: editedTime || transaction.date,
      });
      
      setTransaction(result.transaction);
      setIsEditing(false);
      
      toast({
        title: "Transaction updated",
        description: "The transaction has been updated successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update transaction",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!resolvedParams || isLoading) {
    return <TransactionDetailsSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-red-500 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Transaction</h2>
          <p>{error}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-gray-500 text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Transaction Not Found</h2>
          <p>The transaction with ID "{resolvedParams.id}" could not be found.</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
      case "CANCELLED":
      case "REJECTED":
        return <Badge className="bg-red-500 hover:bg-red-600">Rejected</Badge>;
      case "FAILED":
        return <Badge className="bg-red-500 hover:bg-red-600">Failed</Badge>;
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600">{status || "Unknown"}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Transaction Details</h1>
        <div className="flex gap-2">
          {transaction.status === WalletTransactionStatus.PENDING && (
            <>
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
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Details
                </Button>
              )}
            </>
          )}
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Transactions
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Transaction Information Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Transaction Information</h2>
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
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500 mb-1">Description</p>
              {isEditing ? (
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="Enter description"
                  rows={3}
                />
              ) : (
                <p className="font-medium">{transaction.description || "N/A"}</p>
              )}
            </div>
          </div>
        </Card>

        {/* User Information Card */}
        {transaction.user && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">User Information</h2>
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
          </Card>
        )}

        {/* Bank Account Information Card */}
        {transaction.bankAccount && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Bank Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Account Name</p>
                <p className="font-medium">{transaction.bankAccount.accountName || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Account Number</p>
                <p className="font-medium">{transaction.bankAccount.accountNumber || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Bank Name</p>
                <p className="font-medium">{transaction.bankAccount.bankName || "N/A"}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Show approve/reject buttons only for pending transactions */}
        {transaction.status === WalletTransactionStatus.PENDING && !isEditing && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="flex gap-4 justify-end">
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={isRejecting || isApproving}
              >
                {isRejecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  "Reject Transaction"
                )}
              </Button>
              <Button
                variant="default"
                onClick={handleApprove}
                disabled={isApproving || isRejecting}
              >
                {isApproving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  "Approve Transaction"
                )}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
} 
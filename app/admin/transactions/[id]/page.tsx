"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { updateTransaction } from "@/store/slices/walletSlice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import {
  ArrowLeft,
  User,
  CreditCard,
  Calendar,
  DollarSign,
  AlertCircle,
  Pencil,
  Save,
  X,
  Loader2,
  Copy,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface BankAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
}

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  description: string;
  date: string;
  user: User;
  bankAccount: BankAccount;
  location?: string;
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

        <Card className="p-6">
          <Skeleton className="h-6 w-[200px] mb-4" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i}>
                <Skeleton className="h-4 w-[100px] mb-2" />
                <Skeleton className="h-5 w-[150px]" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <Skeleton className="h-6 w-[200px] mb-4" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3].map((i) => (
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

// Add this helper function at the top of your file, after the imports
const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);
    // Check if date is valid
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

export default function TransactionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { id } = use(params);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAmount, setEditedAmount] = useState("");
  const [editedLocation, setEditedLocation] = useState("");
  const [editedTime, setEditedTime] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const response = await fetch(`/api/admin/wallet/admin_transactions/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch transaction");
        }
        const data = await response.json();
        setTransaction(data);

        // Initialize edit values
        setEditedAmount(data.amount.toString());
        setEditedLocation(data.location || "");

        // Format the date for datetime-local input
        try {
          const date = new Date(data.date);
          if (!isNaN(date.getTime())) {
            // Format date to YYYY-MM-DDThh:mm
            const formattedDate = date.toISOString().slice(0, 16);
            setEditedTime(formattedDate);
          } else {
            setEditedTime("");
          }
        } catch (error) {
          console.error("Error formatting initial date:", error);
          setEditedTime("");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransaction();
  }, [id]);

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      const response = await fetch(`/api/admin/wallet/admin_transactions/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "COMPLETED" }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve transaction");
      }

      const updatedTransaction = await response.json();

      // Update both local state and Redux store
      setTransaction(updatedTransaction.transaction || updatedTransaction);
      dispatch(
        updateTransaction(updatedTransaction.transaction || updatedTransaction)
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to approve transaction"
      );
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsRejecting(true);
      const response = await fetch(`/api/admin/wallet/admin_transactions/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "REJECTED", // Make sure this matches your WalletTransactionStatus enum
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reject transaction");
      }

      const updatedTransaction = await response.json();

      // Update both local state and Redux store
      setTransaction(updatedTransaction.transaction);
      dispatch(updateTransaction(updatedTransaction.transaction));

      // Show success message
      toast({
        title: "Transaction rejected",
        description: "The transaction has been rejected successfully.",
        variant: "default",
      });
    } catch (err) {
      console.error("Reject error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to reject transaction"
      );

      // Show error message
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
    if (!transaction) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/wallet/admin_transactions/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: transaction.status,
          amount: parseFloat(editedAmount),
          location: editedLocation,
          date: editedTime,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update transaction");
      }

      const updatedTransaction = await response.json();
      setTransaction(updatedTransaction.transaction); // Update local component state
      setIsEditing(false);

      // Update the transaction in the Redux store
      dispatch(updateTransaction(updatedTransaction.transaction));

      // The component should re-render automatically with the updated 'transaction' state
      // and Redux store data. No full page reload (window.location.reload()) is needed.
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update transaction"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <TransactionDetailsSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Transaction not found</div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-500">Pending</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-500">Rejected</Badge>;
      case "FAILED":
        return <Badge className="bg-red-500">Failed</Badge>;
      case "PROCESSING":
        return <Badge className="bg-blue-500">Processing</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Transaction Details</h1>
        <div className="flex gap-2">
          {transaction?.status === "PENDING" &&
            transaction?.type === "DEPOSIT" && (
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
          <Button variant="outline" onClick={() => window.history.back()}>
            Back to Transactions
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Transaction Information Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Transaction Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Transaction ID</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="flex items-center gap-2 cursor-pointer group"
                      onClick={() => copyToClipboard(transaction?.id)}
                    >
                      <p className="font-medium text-blue-600 hover:text-blue-800">
                        {transaction?.id}
                      </p>
                      <Copy className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Click to copy ID</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              {isEditing ? (
                <div className="mt-1">
                  <Input
                    type="number"
                    value={editedAmount}
                    onChange={(e) => setEditedAmount(e.target.value)}
                    placeholder="Enter amount"
                  />
                </div>
              ) : (
                <p className="font-medium">
                  {formatCurrency(transaction?.amount)}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="font-medium capitalize">
                {transaction?.type?.toLowerCase() || "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <div className="mt-1">{getStatusBadge(transaction?.status)}</div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date</p>
              {isEditing ? (
                <div className="mt-1">
                  <Input
                    type="datetime-local"
                    value={editedTime}
                    onChange={(e) => setEditedTime(e.target.value)}
                  />
                </div>
              ) : (
                <p className="font-medium">{formatDate(transaction?.date)}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Location</p>
              {isEditing ? (
                <div className="mt-1">
                  <Input
                    value={editedLocation}
                    onChange={(e) => setEditedLocation(e.target.value)}
                    placeholder="Enter location"
                  />
                </div>
              ) : (
                <p className="font-medium">{transaction?.location || "N/A"}</p>
              )}
            </div>
          </div>
        </Card>

        {/* User Information Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">
                {transaction?.user?.firstName} {transaction?.user?.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{transaction?.user?.email}</p>
            </div>
          </div>
        </Card>

        {/* Bank Account Information Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Bank Account Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Account Name</p>
              <p className="font-medium">
                {transaction?.bankAccount?.accountName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Number</p>
              <p className="font-medium">
                {transaction?.bankAccount?.accountNumber}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Bank Name</p>
              <p className="font-medium">
                {transaction?.bankAccount?.bankName}
              </p>
            </div>
          </div>
        </Card>

        {/* Show approve/reject buttons only for pending transactions */}
        {transaction?.status === "PENDING" && !isEditing && (
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
        )}
      </div>
    </div>
  );
}

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
<<<<<<< HEAD
  Pencil,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
=======
} from "lucide-react";
>>>>>>> 9d8d36d4c07b30a25b6e973f0c6d0ee89d3c2521

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
<<<<<<< HEAD
  location?: string;
=======
>>>>>>> 9d8d36d4c07b30a25b6e973f0c6d0ee89d3c2521
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
<<<<<<< HEAD
  const [isEditing, setIsEditing] = useState(false);
  const [editedAmount, setEditedAmount] = useState("");
  const [editedLocation, setEditedLocation] = useState("");
  const [editedTime, setEditedTime] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
=======
>>>>>>> 9d8d36d4c07b30a25b6e973f0c6d0ee89d3c2521

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const response = await fetch(`/api/admin/wallet/transactions/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch transaction");
        }
        const data = await response.json();
        setTransaction(data);
<<<<<<< HEAD
        // Initialize edit values
        setEditedAmount(data.amount.toString());
        setEditedLocation(data.location || "");
        setEditedTime(data.date);
=======
>>>>>>> 9d8d36d4c07b30a25b6e973f0c6d0ee89d3c2521
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
      const response = await fetch(`/api/admin/wallet/transactions/${id}`, {
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
      setTransaction(updatedTransaction);

      // Update the transaction in the Redux store
      dispatch(updateTransaction(updatedTransaction));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to approve transaction"
      );
    }
  };

  const handleReject = async () => {
    try {
      const response = await fetch(`/api/admin/wallet/transactions/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "REJECTED" }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject transaction");
      }

      const updatedTransaction = await response.json();
      setTransaction(updatedTransaction);

      // Update the transaction in the Redux store
      dispatch(updateTransaction(updatedTransaction));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reject transaction"
      );
    }
  };

<<<<<<< HEAD
  const handleEdit = async () => {
    if (!transaction) return;
  
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/wallet/transactions/${id}`, {
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
  

=======
>>>>>>> 9d8d36d4c07b30a25b6e973f0c6d0ee89d3c2521
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
<<<<<<< HEAD
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
=======
        <Button variant="outline" onClick={() => window.history.back()}>
          Back to Transactions
        </Button>
>>>>>>> 9d8d36d4c07b30a25b6e973f0c6d0ee89d3c2521
      </div>

      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Transaction Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Transaction ID</p>
<<<<<<< HEAD
              <p className="font-medium">{transaction?.id}</p>
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
=======
              <p className="font-medium">{transaction.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="font-medium">
                {formatCurrency(transaction.amount)}
              </p>
>>>>>>> 9d8d36d4c07b30a25b6e973f0c6d0ee89d3c2521
            </div>
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="font-medium capitalize">
<<<<<<< HEAD
                {transaction?.type.toLowerCase()}
=======
                {transaction.type.toLowerCase()}
>>>>>>> 9d8d36d4c07b30a25b6e973f0c6d0ee89d3c2521
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
<<<<<<< HEAD
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
                <p className="font-medium">
                  {format(new Date(transaction?.date), "PPP p")}
                </p>
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
=======
              <div className="mt-1">{getStatusBadge(transaction.status)}</div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">
                {format(new Date(transaction.date), "PPP p")}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="font-medium">{transaction.description}</p>
>>>>>>> 9d8d36d4c07b30a25b6e973f0c6d0ee89d3c2521
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">
<<<<<<< HEAD
                {transaction.user?.firstName} {transaction.user?.lastName}
=======
                {transaction.user.firstName} {transaction.user.lastName}
>>>>>>> 9d8d36d4c07b30a25b6e973f0c6d0ee89d3c2521
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
<<<<<<< HEAD
              <p className="font-medium">{transaction.user?.email}</p>
=======
              <p className="font-medium">{transaction.user.email}</p>
>>>>>>> 9d8d36d4c07b30a25b6e973f0c6d0ee89d3c2521
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Bank Account Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Account Name</p>
              <p className="font-medium">
<<<<<<< HEAD
                {transaction.bankAccount?.accountName}
=======
                {transaction.bankAccount.accountName}
>>>>>>> 9d8d36d4c07b30a25b6e973f0c6d0ee89d3c2521
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Number</p>
              <p className="font-medium">
<<<<<<< HEAD
                {transaction.bankAccount?.accountNumber}
=======
                {transaction.bankAccount.accountNumber}
>>>>>>> 9d8d36d4c07b30a25b6e973f0c6d0ee89d3c2521
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Bank Name</p>
<<<<<<< HEAD
              <p className="font-medium">{transaction.bankAccount?.bankName}</p>
=======
              <p className="font-medium">{transaction.bankAccount.bankName}</p>
>>>>>>> 9d8d36d4c07b30a25b6e973f0c6d0ee89d3c2521
            </div>
          </div>
        </Card>

<<<<<<< HEAD
        {transaction?.status === "PENDING" && !isEditing && (
=======
        {transaction.status === "PENDING" && (
>>>>>>> 9d8d36d4c07b30a25b6e973f0c6d0ee89d3c2521
          <div className="flex gap-4 justify-end">
            <Button variant="destructive" onClick={handleReject}>
              Reject Transaction
            </Button>
            <Button variant="default" onClick={handleApprove}>
              Approve Transaction
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

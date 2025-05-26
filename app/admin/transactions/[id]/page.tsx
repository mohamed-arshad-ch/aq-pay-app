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
} from "lucide-react";

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

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const response = await fetch(`/api/admin/wallet/transactions/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch transaction");
        }
        const data = await response.json();
        setTransaction(data);
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
        <Button variant="outline" onClick={() => window.history.back()}>
          Back to Transactions
        </Button>
      </div>

      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Transaction Information
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Transaction ID</p>
              <p className="font-medium">{transaction.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="font-medium">
                {formatCurrency(transaction.amount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="font-medium capitalize">
                {transaction.type.toLowerCase()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
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
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">
                {transaction.user.firstName} {transaction.user.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{transaction.user.email}</p>
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
                {transaction.bankAccount.accountName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Number</p>
              <p className="font-medium">
                {transaction.bankAccount.accountNumber}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Bank Name</p>
              <p className="font-medium">{transaction.bankAccount.bankName}</p>
            </div>
          </div>
        </Card>

        {transaction.status === "PENDING" && (
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

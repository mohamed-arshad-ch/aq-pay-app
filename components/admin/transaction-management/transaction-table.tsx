"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency-utils";
import { format } from "date-fns";
import { Eye, Copy, MoreHorizontal } from "lucide-react";
import type { Transaction } from "@/types";
import { TransactionSkeleton } from "./transaction-skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface TransactionTableProps {
  transactions: Transaction[];
  isLoading: boolean;
  onViewTransaction: (transaction: Transaction) => void;
}

export function TransactionTable({
  transactions,
  isLoading,
  onViewTransaction,
}: TransactionTableProps) {
  const [sortField, setSortField] = useState<keyof Transaction>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const router = useRouter();

  const handleSort = (field: keyof Transaction) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === "string" && typeof bValue === "string") {
      if (sortField === "date") {
        const aDate = new Date(aValue);
        const bDate = new Date(bValue);
        return sortDirection === "asc"
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      }
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "PENDING":
        return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "FAILED":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case "PROCESSING":
        return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
      default:
        return <Badge>{status}</Badge>;
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

  const handleViewDetails = (transactionId: string) => {
    router.push(`/admin/transactions/${transactionId}`);
  };

  if (isLoading) {
    return <TransactionSkeleton />;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort("id")}
            >
              ID
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort("date")}
            >
              Date
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort("amount")}
            >
              Amount
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort("type")}
            >
              Type
            </TableHead>
            <TableHead
              className="cursor-pointer"
              onClick={() => handleSort("status")}
            >
              Status
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTransactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="font-mono text-blue-600 hover:text-blue-800 cursor-pointer flex items-center gap-2 w-fit"
                        onClick={() => copyToClipboard(transaction.id)}
                      >
                        <span>{transaction.id.slice(0, 8)}...</span>
                        <Copy className="h-3 w-3 opacity-50" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to copy full ID</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell>
                {format(new Date(transaction.date), "MMM d, yyyy HH:mm")}
              </TableCell>
              <TableCell>{formatCurrency(transaction.amount)}</TableCell>
              <TableCell>{transaction.type}</TableCell>
              <TableCell>{getStatusBadge(transaction.status)}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(transaction.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View details</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewTransaction(transaction)}
                    className="h-8 w-8 p-0"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

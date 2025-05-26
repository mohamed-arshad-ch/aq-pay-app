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
import { Eye } from "lucide-react";
import type { Transaction } from "@/types";
import { TransactionSkeleton } from "./transaction-skeleton";

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
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (aValue instanceof Date && bValue instanceof Date) {
      return sortDirection === "asc"
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime();
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
              <TableCell className="font-mono">
                {transaction.id.slice(0, 8)}...
              </TableCell>
              <TableCell>
                {format(new Date(transaction.date), "MMM d, yyyy HH:mm")}
              </TableCell>
              <TableCell>{formatCurrency(transaction.amount)}</TableCell>
              <TableCell>{transaction.type}</TableCell>
              <TableCell>{getStatusBadge(transaction.status)}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewTransaction(transaction)}
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">View transaction</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

"use client";
import { ArrowDownLeft, ArrowUpRight, MoreHorizontal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/currency-utils";
import { useAppSelector } from "@/store/hooks";

export function AdminRecentTransactions({
  isLoading = false,
}: {
  isLoading?: boolean;
}) {
  const { data: transactions } = useAppSelector((state) => state.transactions);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>
          Recent transactions across the platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center space-x-4 rounded-md border p-4"
              >
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">
              No recent transactions available
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>From / To</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.slice(0, 5).map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${
                            transaction.type === "DEPOSIT" ||
                            transaction.type === "TRANSFER"
                              ? "bg-green-50"
                              : "bg-red-50"
                          }`}
                        >
                          {transaction.type === "DEPOSIT" ||
                          transaction.type === "TRANSFER" ? (
                            <ArrowDownLeft
                              className={`h-5 w-5 ${
                                transaction.type === "DEPOSIT" ||
                                transaction.type === "TRANSFER"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            />
                          ) : (
                            <ArrowUpRight className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">
                            {transaction.type.charAt(0) +
                              transaction.type.slice(1).toLowerCase()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ID: {transaction.id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {transaction.fromAccount}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        to {transaction.toAccount}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          transaction.status === "COMPLETED"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : transaction.status === "PENDING"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : transaction.status === "FAILED"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                        }
                      >
                        {transaction.status.charAt(0) +
                          transaction.status.slice(1).toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(transaction.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          {transaction.status === "PENDING" && (
                            <>
                              <DropdownMenuItem>Approve</DropdownMenuItem>
                              <DropdownMenuItem>Reject</DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem>Export Receipt</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

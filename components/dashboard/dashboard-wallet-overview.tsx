"use client";

import { useAppSelector } from "@/store/hooks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency-utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { WalletStatus } from "@/types";
import { WalletStatsGrid } from "./wallet-stats-grid";

export function DashboardWalletOverview() {
  const { wallet, transactions, isLoading } = useAppSelector(
    (state) => state.wallet
  );

  if (isLoading || !wallet) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-8 w-40" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-4 w-24" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full mb-4" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Calculate total deposits and sends for the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentTransactions = transactions.filter(
    (tx) => new Date(tx.date) >= sevenDaysAgo
  );

  const totalDeposits = recentTransactions
    .filter((tx) => tx.type === "DEPOSIT")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalSends = recentTransactions
    .filter((tx) => tx.type === "WITHDRAWAL")
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <CardTitle>Wallet</CardTitle>
            </div>
            <WalletStatusBadge status={wallet.status} />
          </div>
          <CardDescription>Your digital wallet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Available Balance
              </div>
              <div className="text-3xl font-bold text-primary">
                {formatCurrency(wallet.balance, wallet.currency)}
              </div>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <Button asChild size="sm" className="flex-1 md:flex-none">
                <Link href="/dashboard/wallet/deposit">Add Money</Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="flex-1 md:flex-none"
              >
                <Link href="/dashboard/wallet/send">Send</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <WalletStatsGrid
        totalDeposits={totalDeposits}
        totalSends={totalSends}
        currency={wallet.currency}
      />
    </div>
  );
}

function WalletStatusBadge({ status }: { status: WalletStatus }) {
  switch (status) {
    case "ACTIVE":
      return <Badge className="bg-green-500 text-xs">Active</Badge>;
    case "SUSPENDED":
      return (
        <Badge
          variant="outline"
          className="border-yellow-500 text-yellow-500 text-xs"
        >
          Suspended
        </Badge>
      );
    case "CLOSED":
      return (
        <Badge variant="destructive" className="text-xs">
          Closed
        </Badge>
      );
    default:
      return null;
  }
}

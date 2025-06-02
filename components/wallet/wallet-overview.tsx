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
import type { WalletStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

export function WalletOverview() {
  const { wallet, isLoading } = useAppSelector((state) => state.wallet);

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

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Wallet Balance</CardTitle>
            <CardDescription>Your available funds</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold mb-6 text-primary">
          {formatCurrency(wallet.balance, wallet.currency)}
        </div>

      </CardContent>
    </Card>
  );
}

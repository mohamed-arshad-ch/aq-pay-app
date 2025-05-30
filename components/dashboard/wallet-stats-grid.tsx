import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatCurrency } from "@/lib/currency-utils";

interface WalletStatsGridProps {
  totalDeposits: number;
  totalSends: number;
  currency: string;
}

export function WalletStatsGrid({
  totalDeposits,
  totalSends,
  currency,
}: WalletStatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex items-center text-green-600 mb-2">
          <ArrowUpRight className="h-5 w-5 mr-2" />
          <span className="text-sm font-medium">Money Added</span>
        </div>
        <div className="text-2xl font-bold">
          {formatCurrency(totalDeposits, currency)}
        </div>
        <div className="text-sm text-muted-foreground mt-1">Last 7 days</div>
      </div>

      <div className="bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex items-center text-blue-600 mb-2">
          <ArrowDownRight className="h-5 w-5 mr-2" />
          <span className="text-sm font-medium">Money Sent</span>
        </div>
        <div className="text-2xl font-bold">
          {formatCurrency(totalSends, currency)}
        </div>
        <div className="text-sm text-muted-foreground mt-1">Last 7 days</div>
      </div>
    </div>
  );
}

"use client";

import type React from "react";
import { useState } from "react";
import { Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BankAccount } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { BankIcon } from "@/components/accounts/bank-icon";
import { formatCurrency } from "@/lib/currency-utils";

interface AccountCardProps {
  account: BankAccount;
  onClick?: () => void;
}

export function AccountCard({ account, onClick }: AccountCardProps) {
  const [isShareOpen, setIsShareOpen] = useState(false);

  const formatAccountNumber = (accountNumber: string) => {
    // Show only last 4 digits
    return `•••• •••• •••• ${accountNumber.slice(-4)}`;
  };

  const handleShare = (method: string) => {
    // In a real app, this would integrate with the Web Share API or native sharing
    toast({
      title: `Shared via ${method}`,
      description: `Account details have been shared via ${method}`,
    });
    setIsShareOpen(false);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Generate a gradient based on the bank name for visual variety
  const getCardGradient = (bankName: string) => {
    const gradients = [
      "bg-gradient-to-r from-blue-600 to-blue-400",
      "bg-gradient-to-r from-purple-600 to-purple-400",
      "bg-gradient-to-r from-emerald-600 to-emerald-400",
      "bg-gradient-to-r from-rose-600 to-rose-400",
      "bg-gradient-to-r from-amber-600 to-amber-400",
    ];

    // Use a hash of the bank name to select a consistent gradient
    const hash = bankName
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[hash % gradients.length];
  };

  return (
    <div className="p-[3px] sm:p-[4px] md:p-[5px] w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transition-all duration-300">
      <div
        className={cn(
          "relative rounded-xl overflow-hidden shadow-lg transition-all hover:shadow-xl",
          getCardGradient(account.bankName),
          onClick && "cursor-pointer"
        )}
        onClick={onClick}
      >
        {/* Inner glow effect */}
        <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-white/20 to-transparent" />

        {/* Card content */}
        <div className="h-48 sm:h-52 md:h-56 lg:h-60 w-full p-4 sm:p-5 md:p-6 text-white relative flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3 sm:mb-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm opacity-80 truncate">{account.bankName}</p>
              <h3 className="font-bold text-sm sm:text-base md:text-lg mt-1 truncate">{account.accountName}</h3>
            </div>
            <div onClick={handleShareClick} className="ml-2 flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1.5 sm:p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                    <Share2 className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleShare("Email")}>
                    Email
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare("SMS")}>
                    SMS
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShare("Copy Link")}>
                    Copy Link
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mt-4 sm:mt-6">
            <p className="text-xs sm:text-sm opacity-80">Card Number</p>
            <p className="font-mono text-sm sm:text-base md:text-lg tracking-wider break-all sm:break-normal">
              {formatAccountNumber(account.accountNumber)}
            </p>
          </div>

          <div className="mt-4 sm:mt-6 flex justify-between items-end">
            <div className="flex-1">
              {/* Balance could be shown here if needed */}
            </div>
            {account.isDefault && (
              <div className="bg-white/20 px-2 py-1 rounded text-xs font-medium flex-shrink-0">
                Default
              </div>
            )}
          </div>
        </div>

        {/* Card chip design - responsive sizing */}
        <div className="absolute top-4 sm:top-5 md:top-6 right-4 sm:right-5 md:right-6">
          <div className="w-8 h-6 sm:w-10 sm:h-7 md:w-12 md:h-9 rounded-md bg-gradient-to-br from-yellow-300 to-yellow-400 border border-yellow-500/30 shadow-inner grid grid-cols-3 grid-rows-3 gap-[1px] p-[1px] sm:p-[2px]">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-yellow-600/30 rounded-[1px]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
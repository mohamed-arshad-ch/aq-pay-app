"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getWalletDetails,
  getWalletTransactions,
} from "@/store/slices/walletSlice";
import { WalletOverview } from "./wallet-overview";
import { WalletTransactionHistory } from "./wallet-transaction-history";
import { WalletSkeleton } from "./wallet-skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle, SendIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { WalletTransactionStatus } from "@/types";
import { formatCurrency } from "@/lib/currency-utils";
import Swal from "sweetalert2";

export function WalletDashboard() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { wallet, isLoading, error, transactions, pendingTransactions } =
    useAppSelector((state) => state.wallet);
  const [activeTab, setActiveTab] = useState("overview");
  const [previousTransactions, setPreviousTransactions] = useState<
    { id: string; status: WalletTransactionStatus }[]
  >([]);

  useEffect(() => {
    dispatch(getWalletDetails());
    dispatch(getWalletTransactions());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      Swal.fire({
        position: "bottom-end",
        icon: "error",
        title: "Error",
        text: error,
        showConfirmButton: false,
        timer: 3000,
        toast: true,
        customClass: {
          popup: "swal2-toast",
          title: "swal2-toast-title",
          htmlContainer: "swal2-toast-content",
        },
      });
    }
  }, [error]);

  // Watch for transaction status changes
  useEffect(() => {
    const allTransactions = [...transactions, ...pendingTransactions];

    allTransactions.forEach((transaction) => {
      const previousTransaction = previousTransactions.find(
        (t) => t.id === transaction.id
      );

      if (
        previousTransaction &&
        previousTransaction.status !== transaction.status
      ) {
        // Show SweetAlert notification for status change
        if (transaction.status === WalletTransactionStatus.COMPLETED) {
          Swal.fire({
            position: "bottom-end",
            icon: "success",
            title: "Transaction Approved",
            text: `Your send request of ${formatCurrency(
              transaction.amount,
              transaction.currency
            )} has been approved.`,
            showConfirmButton: false,
            timer: 3000,
            toast: true,
            customClass: {
              popup: "swal2-toast",
              title: "swal2-toast-title",
              htmlContainer: "swal2-toast-content",
            },
          });
        } else if (
          transaction.status === WalletTransactionStatus.FAILED ||
          transaction.status === WalletTransactionStatus.CANCELLED
        ) {
          Swal.fire({
            position: "bottom-end",
            icon: "error",
            title: "Transaction Rejected",
            text: `Your send request of ${formatCurrency(
              transaction.amount,
              transaction.currency
            )} has been rejected.${
              transaction.adminNote ? ` Reason: ${transaction.adminNote}` : ""
            }`,
            showConfirmButton: false,
            timer: 3000,
            toast: true,
            customClass: {
              popup: "swal2-toast",
              title: "swal2-toast-title",
              htmlContainer: "swal2-toast-content",
            },
          });
        }
      }
    });

    // Update previous transactions state
    setPreviousTransactions(
      allTransactions.map((t) => ({ id: t.id, status: t.status }))
    );
  }, [transactions, pendingTransactions]);

  const handleRefresh = async () => {
    try {
      await dispatch(getWalletDetails()).unwrap();
      await dispatch(getWalletTransactions()).unwrap();
    } catch (error) {
      // Error is already handled in the error useEffect
    }
  };

  if (isLoading && !wallet) {
    return <WalletSkeleton />;
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <h1 className="text-2xl font-bold">My Wallet</h1>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
        <Button
          onClick={() => router.push("/dashboard/wallet/deposit")}
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-12"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Add Balance
        </Button>
        <Button
          onClick={() => router.push("/dashboard/wallet/send")}
          variant="outline"
          className="border-primary text-primary hover:bg-primary/10 h-12"
        >
          <SendIcon className="mr-2 h-5 w-5" />
          Send Money
        </Button>
      </div>

      <Tabs
        defaultValue="overview"
        className="w-full max-w-4xl mx-auto"
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Transaction History</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-6">
          <WalletOverview />
        </TabsContent>
        <TabsContent value="history" className="mt-6">
          <WalletTransactionHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}

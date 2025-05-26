"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { sendFromWallet } from "@/store/slices/walletSlice";
import type { BankAccount } from "@/types";
import { formatCurrency } from "@/lib/currency-utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import Swal from "sweetalert2";

export function WalletSendForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { wallet, isLoading } = useAppSelector((state) => state.wallet);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  const [amount, setAmount] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{
    amount?: string;
    bankAccountId?: string;
  }>({});

  // Check if user has sufficient balance
  const hasSufficientBalance = wallet && Number(amount) <= wallet.balance;

  const fetchAccounts = async () => {
    try {
      setIsLoadingAccounts(true);
      const response = await fetch("/api/user/accounts");
      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch accounts. Please try again.",
      });
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const newErrors: { amount?: string; bankAccountId?: string } = {};

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = "Please enter a valid amount greater than 0";
    }

    if (!bankAccountId) {
      newErrors.bankAccountId = "Please select a bank account";
    }

    if (!hasSufficientBalance) {
      newErrors.amount = "Insufficient balance";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear errors
    setErrors({});

    try {
      // Process the send request
      const result = await dispatch(
        sendFromWallet({
          amount: Number(amount),
          bankAccountId,
          description: description || "Send to bank account",
        })
      ).unwrap();

      // Show success message with SweetAlert
      await Swal.fire({
        position: "bottom-end",
        icon: "success",
        title: "Send Request Submitted",
        text: `Your request to send ${formatCurrency(
          Number(amount),
          wallet?.currency || "USD"
        )} to your bank account is pending approval.`,
        showConfirmButton: false,
        timer: 3000,
        toast: true,
        customClass: {
          popup: "swal2-toast",
          title: "swal2-toast-title",
          htmlContainer: "swal2-toast-content",
        },
      });

      // Redirect to wallet dashboard
      router.push("/dashboard/wallet");
    } catch (error) {
      // Show error message with SweetAlert
      Swal.fire({
        position: "bottom-end",
        icon: "error",
        title: "Send Request Failed",
        text:
          (error as Error).message ||
          "An error occurred while processing your send request.",
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
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-20">
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="p-0 h-8 w-8"
          onClick={() => router.push("/dashboard/wallet")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold">Send Money</h1>
      </div>

      <Card className="w-full">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl sm:text-2xl">
            Send to Bank Account
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Transfer funds from your wallet to your bank account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <Label htmlFor="amount">Amount</Label>
                  <span className="text-sm text-muted-foreground">
                    Available:{" "}
                    {wallet
                      ? formatCurrency(wallet.balance, wallet.currency)
                      : "Loading..."}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {wallet?.currency === "USD"
                      ? "$"
                      : wallet?.currency === "EUR"
                      ? "€"
                      : wallet?.currency === "GBP"
                      ? "£"
                      : wallet?.currency === "SAR"
                      ? "﷼"
                      : "$"}
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    className="pl-8 h-12 text-base"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="0.01"
                    min="0"
                  />
                </div>
                {errors.amount && (
                  <p className="text-sm text-red-500">{errors.amount}</p>
                )}

                {amount && !hasSufficientBalance && (
                  <div className="flex items-start mt-2 text-sm text-red-500">
                    <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                    <span>Insufficient balance</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankAccount">Bank Account</Label>
                <Select
                  value={bankAccountId}
                  onValueChange={setBankAccountId}
                  disabled={isLoadingAccounts}
                >
                  <SelectTrigger id="bankAccount" className="h-12 text-base">
                    <SelectValue
                      placeholder={
                        isLoadingAccounts
                          ? "Loading accounts..."
                          : "Select a bank account"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingAccounts ? (
                      <SelectItem value="loading" disabled>
                        Loading accounts...
                      </SelectItem>
                    ) : accounts.length === 0 ? (
                      <SelectItem value="no-accounts" disabled>
                        No bank accounts available
                      </SelectItem>
                    ) : (
                      accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.bankName} - {account.accountName} (****
                          {account.accountNumber.slice(-4)})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.bankAccountId && (
                  <p className="text-sm text-red-500">{errors.bankAccountId}</p>
                )}
                {!isLoadingAccounts && accounts.length === 0 && (
                  <div className="flex items-start mt-2 text-sm text-amber-600">
                    <AlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                    <span>
                      You need to add a bank account before you can send funds.{" "}
                      <Button
                        variant="link"
                        className="p-0 h-auto text-primary underline"
                        onClick={() => router.push("/dashboard/accounts/new")}
                      >
                        Add a bank account
                      </Button>
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add a note for this transaction"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px] text-base"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={
                  isLoading ||
                  isLoadingAccounts ||
                  !hasSufficientBalance ||
                  accounts.length === 0
                }
              >
                {isLoading ? "Processing..." : "Send Money"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col text-sm text-muted-foreground border-t pt-4">
          <p className="mb-2">
            <strong>Note:</strong> Send requests require admin approval and
            typically take 1-3 business days to process.
          </p>
          <p>
            By proceeding, you agree to our terms and conditions regarding money
            transfers and wallet usage.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

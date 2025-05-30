// components/wallet/WalletDepositForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { depositToWallet } from "@/store/slices/walletSlice";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";
import { formatCurrency } from "@/lib/currency-utils";

const formSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Amount must be a positive number",
    }),
  description: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  time: z.string().min(1, "Time is required"),
});

type FormValues = z.infer<typeof formSchema>;

export function WalletDepositForm() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isLoading, wallet } = useAppSelector((state) => state.wallet);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      description: "",
      location: "",
      time: new Date().toISOString().slice(0, 16),
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      const amount = Number(values.amount);

      const dateTime = new Date(values.time);
      const isoDateTime = dateTime.toISOString();

      // depositToWallet will now create a PENDING transaction
      await dispatch(
        depositToWallet({
          amount,
          description: values.description || "",
          status: "PENDING", // Explicitly set status to PENDING
          location: values.location,
          time: isoDateTime,
        })
      ).unwrap();

      await Swal.fire({
        position: "bottom-end",
        icon: "success",
        title: "Deposit Request Sent Successfully", // Changed title to reflect pending state
        text: `${formatCurrency(
          amount,
          wallet?.currency || "USD"
        )} deposit request has been sent to admin for approval.`, // Updated message
        showConfirmButton: false,
        timer: 3000, // Increased timer for a clearer message
        toast: true,
        customClass: {
          popup: "swal2-toast",
          title: "swal2-toast-title",
          htmlContainer: "swal2-toast-content",
        },
      });
      form.reset();
      router.push("/dashboard/wallet");
    } catch (error) {
      Swal.fire({
        position: "bottom-end",
        icon: "error",
        title: "Failed to Send Deposit Request", // Changed title
        text:
          error instanceof Error
            ? error.message
            : "Failed to send deposit request",
        showConfirmButton: false,
        timer: 3000,
        toast: true,
        customClass: {
          popup: "swal2-toast",
          title: "swal2-toast-title",
          htmlContainer: "swal2-toast-content",
        },
      });
    } finally {
      setIsSubmitting(false);
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
        <h1 className="text-xl sm:text-2xl font-bold">Add Balance</h1>
      </div>

      <Card className="w-full">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl sm:text-2xl">
            Add Funds to Wallet
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Request to add money to your wallet. Funds will be available upon
            admin approval.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
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
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="pl-8 h-12 text-base"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter location"
                        className="h-12 text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date and Time</FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        className="h-12 text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add a note for this deposit"
                        className="min-h-[100px] text-base resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={isLoading || isSubmitting}
              >
                {isLoading || isSubmitting ? "Processing..." : "Request Funds"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="mt-6 text-sm text-muted-foreground space-y-2">
        <p className="flex items-center gap-2">
          <span className="font-medium">Note:</span>
          Your deposit request will be reviewed by an admin. Funds will be added
          to your wallet upon approval.
        </p>
        <p>
          By proceeding, you agree to our terms and conditions regarding wallet
          usage.
        </p>
      </div>
    </div>
  );
}

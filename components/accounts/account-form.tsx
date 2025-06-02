"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";

const accountFormSchema = z.object({
  accountHolderName: z.string().min(2, {
    message: "Account holder name must be at least 2 characters.",
  }),
  accountNumber: z
    .string()
    .min(8, {
      message: "Account number must be at least 8 characters.",
    })
    .max(17, {
      message: "Account number must not exceed 17 characters.",
    })
    .regex(/^\d+$/, {
      message: "Account number must contain only digits.",
    }),
  ifscCode: z
    .string()
    .length(11, {
      message: "IFSC code must be exactly 11 characters.",
    })
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, {
      message:
        "IFSC code must be in the format: AAAA0XXXXXX (first 4 letters, then 0, then 6 alphanumeric characters).",
    }),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

interface AccountFormProps {
  id?: string;
}

export function AccountForm({ id }: AccountFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const isEditMode = !!id;

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
    },
  });

  useEffect(() => {
    if (isEditMode) {
      const fetchAccountData = async () => {
        try {
          const response = await fetch(`/api/user/accounts/details`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: "get", id }),
          });
          if (!response.ok) {
            throw new Error("Failed to fetch account");
          }
          const accountData = await response.json();

          form.reset({
            accountHolderName: accountData.accountHolderName || "",
            accountNumber: accountData.accountNumber,
            ifscCode: accountData.ifscCode || "",
          });
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description:
              error instanceof Error
                ? error.message
                : "Failed to fetch account",
          });
        }
      };

      fetchAccountData();
    }
  }, [form, isEditMode, id]);

  const onSubmit = async (data: AccountFormValues) => {
    try {
      setIsLoading(true);
      console.log("data", data);
      if (isEditMode) {
        const response = await fetch(`/api/user/accounts/details`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "update", id, ...data }),
        });

        if (!response.ok) {
          throw new Error("Failed to update account");
        }

        const updatedAccount = await response.json();
        console.log("updatedAccount", updatedAccount);

        toast({
          title: "Success",
          description: "Account updated successfully",
        });
      } else {
        const response = await fetch("/api/user/accounts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Failed to create account");
        }

        const newAccount = await response.json();
        console.log("new account", newAccount);

        toast({
          title: "Success",
          description: "Account created successfully",
        });
      }

      router.push("/dashboard/accounts");
    } catch (error) {
      console.error("Error submitting account:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Something went wrong",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (isEditMode && id) {
      try {
        const response = await fetch(`/api/user/accounts/details`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "delete", id }),
        });

        if (!response.ok) {
          throw new Error("Failed to delete account");
        }

        toast({
          title: "Account deleted",
          description: "Your account has been successfully deleted.",
        });

        router.push("/dashboard/accounts");
      } catch (error) {
        console.error("Error deleting account:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to delete account",
        });
      }
    }
    setDeleteDialogOpen(false);
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-20">
      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="p-0 h-8 w-8"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl sm:text-2xl font-bold">
          {isEditMode ? "Edit Account" : "Add Account"}
        </h1>
      </div>

      <Card className="w-full">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl sm:text-2xl">
            {isEditMode ? "Edit Bank Account" : "Add Bank Account"}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Enter your bank account details to link it with your wallet
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-6">
                {/* Account Holder Name Field */}
                <FormField
                  control={form.control}
                  name="accountHolderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Account Holder Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., John Doe"
                          {...field}
                          className="mt-1"
                        />
                      </FormControl>
                      <FormDescription className="text-xs mt-1">
                        The name of the person who owns this account.
                      </FormDescription>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {/* Account Number Field */}
                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter account number"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormDescription>
                        Your account number is kept secure and only the last 4
                        digits will be displayed.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* IFSC Code Field */}
                <FormField
                  control={form.control}
                  name="ifscCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IFSC Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter IFSC code (e.g., HDFC0001234)"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase();
                            field.onChange(value);
                          }}
                          maxLength={11}
                        />
                      </FormControl>
                      <FormDescription>
                        The 11-character IFSC code that identifies your bank
                        branch in India.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6">
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isLoading}
            className="w-full sm:w-auto sm:ml-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? "Updating..." : "Adding..."}
              </>
            ) : (
              <>{isEditMode ? "Update Account" : "Add Account"}</>
            )}
          </Button>

          {isEditMode && (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Account
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

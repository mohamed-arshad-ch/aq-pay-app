"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addAccount,
  updateAccount,
  fetchAccount,
  setDefaultAccount,
  deleteAccount,
} from "@/store/slices/accountsSlice";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AccountType } from "@/types";
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

// List of banks for the dropdown
const BANKS = [
  // Public Sector Banks
  "State Bank of India",
  "Punjab National Bank",
  "Bank of Baroda",
  "Canara Bank",
  "Union Bank of India",
  "Bank of India",
  "Central Bank of India",
  "Indian Overseas Bank",
  "UCO Bank",
  "Bank of Maharashtra",
  "Punjab & Sind Bank",
  "Indian Bank",
  
  // Private Sector Banks
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "IndusInd Bank",
  "Yes Bank",
  "IDFC First Bank",
  "Federal Bank",
  "South Indian Bank",
  "Karur Vysya Bank",
  "City Union Bank",
  "Dhanlaxmi Bank",
  "Jammu & Kashmir Bank",
  "RBL Bank",
  "Tamilnad Mercantile Bank",
  "Lakshmi Vilas Bank",
  "Nainital Bank",
  "Catholic Syrian Bank",
  "Bandhan Bank",
  "AU Small Finance Bank",
  "Equitas Small Finance Bank",
  "Ujjivan Small Finance Bank",
  "Suryoday Small Finance Bank",
  "ESAF Small Finance Bank",
  "Fincare Small Finance Bank",
  "Jana Small Finance Bank",
  "North East Small Finance Bank",
  "Capital Small Finance Bank",
  "Unity Small Finance Bank",
  
  // Regional Rural Banks (Major ones)
  "Andhra Pradesh Grameena Vikas Bank",
  "Andhra Pragathi Grameena Bank",
  "Arunachal Pradesh Rural Bank",
  "Assam Gramin Vikash Bank",
  "Bihar Gramin Bank",
  "Chhattisgarh Rajya Gramin Bank",
  "Gujarat State Co-operative Bank",
  "Himachal Pradesh Gramin Bank",
  "J&K Grameen Bank",
  "Jharkhand Rajya Gramin Bank",
  "Karnataka Gramin Bank",
  "Kerala Gramin Bank",
  "Madhya Pradesh Gramin Bank",
  "Maharashtra Gramin Bank",
  "Manipur Rural Bank",
  "Meghalaya Rural Bank",
  "Mizoram Rural Bank",
  "Nagaland Rural Bank",
  "Odisha Gramya Bank",
  "Puduvai Bharathiar Grama Bank",
  "Punjab Gramin Bank",
  "Rajasthan Marudhara Gramin Bank",
  "Sarva Haryana Gramin Bank",
  "Tamil Nadu Grama Bank",
  "Telangana Grameena Bank",
  "Tripura Gramin Bank",
  "Uttar Bihar Gramin Bank",
  "Uttarakhand Gramin Bank",
  "Uttar Pradesh Gramin Bank",
  "West Bengal Gramin Bank",
  
  // Cooperative Banks (Major ones)
  "Saraswat Cooperative Bank",
  "Cosmos Cooperative Bank",
  "TJSB Sahakari Bank",
  "Bassein Catholic Cooperative Bank",
  "Mumbai District Central Cooperative Bank",
  "Delhi State Cooperative Bank",
  "Gujarat State Cooperative Bank",
  "Maharashtra State Cooperative Bank",
  "Karnataka State Cooperative Bank",
  "Tamil Nadu State Cooperative Bank",
  "Andhra Pradesh State Cooperative Bank",
  "Telangana State Cooperative Bank",
  "West Bengal State Cooperative Bank",
  "Punjab State Cooperative Bank",
  "Haryana State Cooperative Bank",
  "Rajasthan State Cooperative Bank",
  "Uttar Pradesh Cooperative Bank",
  "Bihar State Cooperative Bank",
  "Odisha State Cooperative Bank",
  "Assam State Cooperative Bank",
  
  // Payment Banks
  "Paytm Payments Bank",
  "Airtel Payments Bank",
  "India Post Payments Bank",
  "Fino Payments Bank",
  "Jio Payments Bank",
  "NSDL Payments Bank",
  
  // Foreign Banks (Operating in India)
  "Citibank",
  "Standard Chartered Bank",
  "HSBC",
  "Deutsche Bank",
  "Barclays Bank",
  "Royal Bank of Scotland",
  "Bank of America",
  "JPMorgan Chase Bank",
  "First Abu Dhabi Bank",
  "Mashreq Bank",
  "Doha Bank",
  "Emirates NBD",
  "Qatar National Bank",
  "Sumitomo Mitsui Banking Corporation",
  "Mizuho Bank",
  "Bank of Tokyo-Mitsubishi UFJ",
  
  // Others
  "Other",
];

const accountFormSchema = z.object({
  accountName: z.string().min(2, {
    message: "Account name must be at least 2 characters.",
  }),
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
  routingNumber: z
    .string()
    .length(9, {
      message: "Routing number must be exactly 9 digits.",
    })
    .regex(/^\d+$/, {
      message: "Routing number must contain only digits.",
    }),
  ifscCode: z
    .string()
    .length(11, {
      message: "IFSC code must be exactly 11 characters.",
    })
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, {
      message:
        "IFSC code must be in the format: AAAA0XXXXXX (first 4 letters, then 0, then 6 alphanumeric characters).",
    })
    .optional(),
  bankName: z.string().min(1, {
    message: "Please select a bank.",
  }),
  branchName: z.string().optional(),
  accountType: z.nativeEnum(AccountType, {
    errorMap: () => ({ message: "Please select an account type." }),
  }),
  isDefault: z.boolean(),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

interface AccountFormProps {
  id?: string;
}

export function AccountForm({ id }: AccountFormProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { selectedAccount, error } = useAppSelector((state) => state.accounts);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const isEditMode = !!id;

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      accountName: "",
      accountHolderName: "",
      accountNumber: "",
      routingNumber: "",
      ifscCode: "",
      bankName: "",
      branchName: "",
      accountType: AccountType.SAVINGS,
      isDefault: false,
    },
  });

  useEffect(() => {
    if (isEditMode) {
      const fetchAccountData = async () => {
        try {
          const response = await fetch(`/api/user/accounts/${id}`);
          if (!response.ok) {
            throw new Error("Failed to fetch account");
          }
          const accountData = await response.json();

          form.reset({
            accountName: accountData.accountName,
            accountHolderName: accountData.accountHolderName || "",
            accountNumber: accountData.accountNumber,
            routingNumber: accountData.routingNumber || "",
            ifscCode: accountData.ifscCode || "",
            bankName: accountData.bankName,
            branchName: accountData.branchName || "",
            accountType: accountData.accountType,
            isDefault: accountData.isDefault,
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

  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error,
      });
    }
  }, [error]);

  const onSubmit = async (data: AccountFormValues) => {
    try {
      setIsLoading(true);
      console.log("data", data);
      if (isEditMode) {
        const response = await fetch(`/api/user/accounts/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
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
    if (isEditMode && selectedAccount) {
      try {
        const response = await fetch(
          `/api/user/accounts/${selectedAccount.id}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete account");
        }

        toast({
          title: "Account deleted",
          description: "Your account has been successfully deleted.",
        });
        router.push("/dashboard/accounts");
      } catch (error) {
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

  const formatRoutingNumber = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, "");
    return digits;
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
              {/* Existing form fields wrapped in grid containers */}
              <div className="space-y-6">
                {/* Account Name & Holder Name Section */}
                <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
                  {/* Account Name Field */}
                  <FormField
                    control={form.control}
                    name="accountName"
                    render={({ field }) => (
                      <FormItem className="col-span-2 sm:col-span-1">
                        <FormLabel className="text-sm font-medium">
                          Account Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Primary Checking"
                            {...field}
                            className="mt-1"
                          />
                        </FormControl>
                        <FormDescription className="text-xs mt-1">
                          This is how the account will be displayed.
                        </FormDescription>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  {/* Account Holder Name Field */}
                  <FormField
                    control={form.control}
                    name="accountHolderName"
                    render={({ field }) => (
                      <FormItem className="col-span-2 sm:col-span-1">
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
                </div>

                {/* Account & Routing Number Section */}
                <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
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

                  {/* Routing Number Field */}
                  <FormField
                    control={form.control}
                    name="routingNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Routing Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter 9-digit routing number"
                            {...field}
                            onChange={(e) => {
                              const formattedValue = formatRoutingNumber(
                                e.target.value
                              );
                              field.onChange(formattedValue);
                            }}
                            maxLength={9}
                          />
                        </FormControl>
                        <FormDescription>
                          The 9-digit number that identifies your bank.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Bank Details Section */}
                <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
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

                  {/* Bank Name Field */}
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a bank" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {BANKS.map((bank) => (
                              <SelectItem key={bank} value={bank}>
                                {bank}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Additional Details Section */}
                <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
                  {/* Branch Name Field */}
                  <FormField
                    control={form.control}
                    name="branchName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch Name (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Downtown Branch"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Account Type Field */}
                  <FormField
                    control={form.control}
                    name="accountType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select account type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={AccountType.CHECKING}>
                              Checking
                            </SelectItem>
                            <SelectItem value={AccountType.SAVINGS}>
                              Savings
                            </SelectItem>
                            <SelectItem value={AccountType.CREDIT}>
                              Credit
                            </SelectItem>
                            <SelectItem value={AccountType.INVESTMENT}>
                              Investment
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Default Account Switch */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-1">
                    <Label
                      htmlFor="default-account"
                      className="text-sm font-medium"
                    >
                      Set as default account
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      This account will be used as the default for transactions.
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            id="default-account"
                            aria-label="Set as default account"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditMode ? "Updating..." : "Create Account"}
                    </>
                  ) : isEditMode ? (
                    "Update Account"
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>

        <CardFooter className="flex flex-col text-sm text-muted-foreground border-t pt-4">
          <p className="mb-2">
            <strong>Note:</strong> Your bank account information is securely
            stored and encrypted.
          </p>
          <p>
            By adding a bank account, you agree to our terms and conditions
            regarding account linking and verification.
          </p>
        </CardFooter>
      </Card>

      {/* Delete Dialog - Make it responsive */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-[425px] p-4 sm:p-6">
          <AlertDialogHeader className="space-y-2">
            <AlertDialogTitle className="text-lg font-semibold">
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This action cannot be undone. This will permanently delete your
              account and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
            <AlertDialogCancel className="w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

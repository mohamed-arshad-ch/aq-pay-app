"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { AccountCard } from "@/components/accounts/account-card";
import { EmptyAccounts } from "@/components/accounts/empty-accounts";
import { AccountsListSkeleton } from "@/components/accounts/accounts-list-skeleton";
import type { BankAccount } from "@/types";
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

export function AccountsList() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
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
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    await fetchAccounts();
    toast({
      title: "Refreshed",
      description: "Your accounts have been updated.",
    });
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/accounts/edit/${id}`);
  };

  const handleDelete = (id: string) => {
    setAccountToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (accountToDelete) {
      try {
        const response = await fetch(`/api/user/accounts/details`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "delete", id: accountToDelete }),
        });

        if (!response.ok) {
          throw new Error("Failed to delete account");
        }

        // Update local state after successful deletion
        setAccounts((prevAccounts) =>
          prevAccounts.filter((acc) => acc.id !== accountToDelete)
        );

        toast({
          title: "Account deleted",
          description: "Your account has been successfully deleted.",
        });
      } catch (error) {
        console.error("Error deleting account:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete account. Please try again.",
        });
      }
    }
    setDeleteDialogOpen(false);
    setAccountToDelete(null);
  };

  const handleViewDetails = (id: string) => {
    router.push(`/dashboard/accounts/${id}`);
  };

  const handleAddAccount = () => {
    router.push("/dashboard/accounts/new");
  };

  if (isLoading) {
    return <AccountsListSkeleton />;
  }

  return (
    <>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="container px-4 py-6 space-y-6 pb-20 max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">Your Accounts</h1>
            <Button size="sm" onClick={handleAddAccount} className="gap-1">
              <PlusIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Add Account</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>

          {!accounts || accounts.length === 0 ? (
            <EmptyAccounts onAddAccount={handleAddAccount} />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {accounts.map((account: BankAccount) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onClick={() => handleViewDetails(account.id)}
                />
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove it from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

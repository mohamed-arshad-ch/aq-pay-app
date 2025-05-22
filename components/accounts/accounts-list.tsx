"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAccounts, deleteAccount } from "@/store/slices/accountsSlice";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { SwipeableItem } from "@/components/ui/swipeable-item";
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

// Local storage key
const ACCOUNTS_STORAGE_KEY = "money_manager_accounts";

// Helper functions for local storage
const getStoredAccounts = (): BankAccount[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

const setStoredAccounts = (accounts: BankAccount[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
};

export function AccountsList() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  useEffect(() => {
    // Load accounts from local storage when component mounts
    const storedAccounts = getStoredAccounts();
    setAccounts(storedAccounts);
    setIsLoading(false);
  }, []);

  const handleRefresh = async () => {
    try {
      const storedAccounts = getStoredAccounts();
      setAccounts(storedAccounts);
      toast({
        title: "Refreshed",
        description: "Your accounts have been updated from local storage.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh accounts.",
      });
    }
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
        const updatedAccounts = accounts.filter(
          (acc) => acc.id !== accountToDelete
        );
        setStoredAccounts(updatedAccounts);
        setAccounts(updatedAccounts);
        toast({
          title: "Account deleted",
          description: "Your account has been successfully deleted.",
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete account.",
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
                <SwipeableItem
                  key={account.id}
                  onEdit={() => handleEdit(account.id)}
                  onDelete={() => handleDelete(account.id)}
                  className="h-full"
                >
                  <AccountCard
                    account={account}
                    onClick={() => handleViewDetails(account.id)}
                  />
                </SwipeableItem>
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove it from local storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

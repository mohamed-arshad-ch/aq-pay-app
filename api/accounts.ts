import type { BankAccount, Transaction } from "@/types";

// Helper function to simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Local storage keys
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

export const accountsApi = {
  getAccounts: async (): Promise<BankAccount[]> => {
    try {
      const response = await fetch("/api/user/accounts");
      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }
      return response.json();
    } catch (error) {
      // Fallback to local storage
      return getStoredAccounts();
    }
  },

  getAccount: async (id: string): Promise<BankAccount> => {
    try {
      const response = await fetch(`/api/user/accounts/${id}`);
      if (!response.ok) {
        throw new Error("Account not found");
      }
      return response.json();
    } catch (error) {
      // Fallback to local storage
      const accounts = getStoredAccounts();
      const account = accounts.find((acc) => acc.id === id);
      if (!account) {
        throw new Error("Account not found");
      }
      return account;
    }
  },

  addAccount: async (
    accountData: Partial<BankAccount>
  ): Promise<BankAccount> => {
    try {
      const response = await fetch("/api/user/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(accountData),
      });
      if (!response.ok) {
        throw new Error("Failed to add account");
      }
      return response.json();
    } catch (error) {
      // Fallback to local storage
      const accounts = getStoredAccounts();
      const newAccount: BankAccount = {
        id: crypto.randomUUID(),
        ...accountData,
        balance: 0,
        currency: "USD",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as BankAccount;

      // If this is the first account or it's set as default, update other accounts
      if (newAccount.isDefault) {
        accounts.forEach((account) => {
          account.isDefault = false;
        });
      }

      accounts.push(newAccount);
      setStoredAccounts(accounts);
      return newAccount;
    }
  },

  updateAccount: async (
    id: string,
    accountData: Partial<BankAccount>
  ): Promise<BankAccount> => {
    try {
      const response = await fetch(`/api/user/accounts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(accountData),
      });
      if (!response.ok) {
        throw new Error("Failed to update account");
      }
      return response.json();
    } catch (error) {
      // Fallback to local storage
      const accounts = getStoredAccounts();
      const index = accounts.findIndex((acc) => acc.id === id);
      if (index === -1) {
        throw new Error("Account not found");
      }

      const updatedAccount = {
        ...accounts[index],
        ...accountData,
        updatedAt: new Date().toISOString(),
      };

      // If setting as default, update other accounts
      if (accountData.isDefault) {
        accounts.forEach((account) => {
          if (account.id !== id) {
            account.isDefault = false;
          }
        });
      }

      accounts[index] = updatedAccount;
      setStoredAccounts(accounts);
      return updatedAccount;
    }
  },

  deleteAccount: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`/api/user/accounts/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete account");
      }
    } catch (error) {
      // Fallback to local storage
      const accounts = getStoredAccounts();
      const filteredAccounts = accounts.filter((acc) => acc.id !== id);
      setStoredAccounts(filteredAccounts);
    }
  },

  setDefaultAccount: async (id: string): Promise<BankAccount> => {
    try {
      const response = await fetch(`/api/user/accounts/${id}/default`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to set default account");
      }
      return response.json();
    } catch (error) {
      // Fallback to local storage
      const accounts = getStoredAccounts();
      const account = accounts.find((acc) => acc.id === id);
      if (!account) {
        throw new Error("Account not found");
      }

      // Update all accounts
      const updatedAccounts = accounts.map((acc) => ({
        ...acc,
        isDefault: acc.id === id,
      }));

      setStoredAccounts(updatedAccounts);
      return { ...account, isDefault: true };
    }
  },

  getAccountBalance: async (id: string): Promise<{ balance: number }> => {
    try {
      const response = await fetch(`/api/user/accounts/${id}/balance`);
      if (!response.ok) {
        throw new Error("Failed to get account balance");
      }
      return response.json();
    } catch (error) {
      // Fallback to local storage
      const accounts = getStoredAccounts();
      const account = accounts.find((acc) => acc.id === id);
      if (!account) {
        throw new Error("Account not found");
      }
      return { balance: account.balance };
    }
  },

  getAccountTransactions: async (id: string): Promise<Transaction[]> => {
    try {
      const response = await fetch(`/api/user/accounts/${id}/transactions`);
      if (!response.ok) {
        throw new Error("Failed to fetch account transactions");
      }
      return response.json();
    } catch (error) {
      // Return empty array for transactions in local storage mode
      return [];
    }
  },
};

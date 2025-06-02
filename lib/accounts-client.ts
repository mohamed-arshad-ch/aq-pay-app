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
      const response = await fetch("/api/user/accounts/details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "get", id }),
      });
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as BankAccount;

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
      const response = await fetch("/api/user/accounts/details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "update", id, ...accountData }),
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

      accounts[index] = updatedAccount;
      setStoredAccounts(accounts);
      return updatedAccount;
    }
  },

  deleteAccount: async (id: string): Promise<void> => {
    try {
      const response = await fetch("/api/user/accounts/details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "delete", id }),
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
      // Since we removed the isDefault field, we'll just return the account
      // This functionality may need to be removed or reimplemented
      const response = await fetch("/api/user/accounts/details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "get", id }),
      });
      if (!response.ok) {
        throw new Error("Failed to get account");
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

  getAccountBalance: async (id: string): Promise<{ balance: number }> => {
    try {
      // Since we removed the balance field, return 0 or implement wallet balance check
      return { balance: 0 };
    } catch (error) {
      return { balance: 0 };
    }
  },

  getAccountTransactions: async (id: string): Promise<Transaction[]> => {
    try {
      // This would need to be implemented in the wallet transactions API
      // For now, return empty array
      return [];
    } catch (error) {
      return [];
    }
  },
}; 
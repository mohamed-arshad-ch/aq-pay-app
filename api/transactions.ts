import {
  type Transaction,
  TransactionStatus,
  TransactionType,
  TransactionCategory,
} from "@/types";

// Helper function to simulate API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to get account details
const getAccountDetails = async (accountId: string) => {
  // In a real app, this would be an API call to get account details
  // For demo purposes, we'll use mock data
  if (accountId === "1") {
    return {
      name: "Primary Checking",
      number: "1234567890",
    };
  } else if (accountId === "2") {
    return {
      name: "Savings Account",
      number: "0987654321",
    };
  }
  return null;
};

export const transactionsApi = {
  getTransactions: async (): Promise<Transaction[]> => {
    const response = await fetch("/api/user/wallet/transactions");
    if (!response.ok) {
      throw new Error("Failed to fetch transactions");
    }
    return response.json();
  },

  getTransaction: async (id: string): Promise<Transaction> => {
    const response = await fetch(`/api/user/wallet/transactions/${id}`);
    if (!response.ok) {
      throw new Error("Failed to fetch transaction");
    }
    return response.json();
  },

  createTransaction: async (
    transactionData: Partial<Transaction>
  ): Promise<Transaction> => {
    const response = await fetch("/api/user/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transactionData),
    });
    if (!response.ok) {
      throw new Error("Failed to create transaction");
    }
    return response.json();
  },

  approveTransaction: async (id: string): Promise<Transaction> => {
    const response = await fetch(`/api/user/transactions/${id}/approve`, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error("Failed to approve transaction");
    }
    return response.json();
  },

  rejectTransaction: async (
    id: string,
    reason: string
  ): Promise<Transaction> => {
    const response = await fetch(`/api/user/transactions/${id}/reject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) {
      throw new Error("Failed to reject transaction");
    }
    return response.json();
  },

  cancelTransaction: async (id: string): Promise<Transaction> => {
    const response = await fetch(`/api/user/transactions/${id}/cancel`, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error("Failed to cancel transaction");
    }
    return response.json();
  },

  getTransactionHistory: async (filters?: any): Promise<Transaction[]> => {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(
      `/api/user/wallet/transactions/history?${queryParams}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch transaction history");
    }
    return response.json();
  },
};

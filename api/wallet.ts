import type { Wallet, WalletTransaction } from "@/types";
import {
  WalletTransactionStatus,
  WalletStatus,
  WalletTransactionType,
} from "@/types";
import { v4 as uuidv4 } from "uuid";

// Initialize localStorage with default wallet if it doesn't exist
const initializeWallet = () => {
  // Check if wallet exists in localStorage
  if (!localStorage.getItem("wallet")) {
    const initialWallet: Wallet = {
      id: "wallet-1",
      userId: "user-1",
      balance: 0, // Start with zero balance
      currency: "USD",
      status: WalletStatus.ACTIVE,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem("wallet", JSON.stringify(initialWallet));
  }

  // Check if transactions exist in localStorage
  if (!localStorage.getItem("walletTransactions")) {
    localStorage.setItem("walletTransactions", JSON.stringify([]));
  }
};

// Helper function to get wallet from localStorage
const getWalletFromStorage = (): Wallet => {
  initializeWallet();
  const walletData = localStorage.getItem("wallet");
  return walletData ? JSON.parse(walletData) : null;
};

// Helper function to get transactions from localStorage
const getTransactionsFromStorage = (): WalletTransaction[] => {
  initializeWallet();
  const transactionsData = localStorage.getItem("walletTransactions");
  return transactionsData ? JSON.parse(transactionsData) : [];
};

// Helper function to save wallet to localStorage
const saveWalletToStorage = (wallet: Wallet) => {
  localStorage.setItem("wallet", JSON.stringify(wallet));
};

// Helper function to save transactions to localStorage
const saveTransactionsToStorage = (transactions: WalletTransaction[]) => {
  localStorage.setItem("walletTransactions", JSON.stringify(transactions));
};

// Fetch wallet details
export async function fetchWalletDetails(): Promise<Wallet> {
  const response = await fetch("/api/user/wallet");
  if (!response.ok) {
    throw new Error("Failed to fetch wallet details");
  }
  return response.json();
}

// Fetch wallet transactions for the logged-in user
export async function fetchWalletTransactions(): Promise<WalletTransaction[]> {
  const response = await fetch("/api/user/wallet/transactions");
  if (!response.ok) {
    throw new Error("Failed to fetch wallet transactions");
  }
  return response.json();
}

// Fetch all wallet transactions (admin only)
export async function fetchAllWalletTransactions(): Promise<
  WalletTransaction[]
> {
  const response = await fetch("/api/admin/wallet/transactions");
  if (!response.ok) {
    throw new Error("Failed to fetch all wallet transactions");
  }
  return response.json();
}

// Add balance to wallet
export async function addWalletBalance(
  amount: number,
  description: string,
  status: string,
  location: string,
  time: string
): Promise<{ transaction: WalletTransaction; newBalance: number }> {
  const response = await fetch("/api/user/wallet", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount, description, status, location, time }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to add balance");
  }

  return response.json();
}

// Send money from wallet
export async function sendWalletBalance(
  amount: number,
  bankAccountId: string,
  description: string
): Promise<{ transaction: WalletTransaction }> {
  const response = await fetch("/api/user/wallet/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount, bankAccountId, description }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to send money");
  }

  return response.json();
}

// Update transaction status (for admin use)
export const updateTransactionStatus = async (
  transactionId: string,
  status: WalletTransactionStatus,
  adminNote?: string,
  updates?: {
    amount?: number;
    location?: string;
    date?: string;
  }
): Promise<{
  transaction: WalletTransaction;
  walletUpdated?: boolean;
  newBalance?: number;
}> => {
  try {
    const response = await fetch(
      `/api/admin/wallet/transactions/${transactionId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          adminNote,
          ...updates,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update transaction status");
    }

    return response.json();
  } catch (error) {
    console.error("Error updating transaction status:", error);
    throw error;
  }
};

// Get all pending send transactions (for admin use)
export const getPendingSendTransactions = async (): Promise<
  WalletTransaction[]
> => {
  try {
    // In a real app, this would be an API call
    // const response = await apiClient.get('/admin/wallet/transactions/pending')
    // return response.data

    // For development, use localStorage
    return new Promise((resolve) => {
      setTimeout(() => {
        const transactions = getTransactionsFromStorage();
        const pendingTransactions = transactions.filter(
          (t) => t.status === "PENDING" && t.type === "WITHDRAWAL"
        );
        resolve(pendingTransactions);
      }, 500);
    });
  } catch (error) {
    console.error("Error fetching pending send transactions:", error);
    throw error;
  }
};

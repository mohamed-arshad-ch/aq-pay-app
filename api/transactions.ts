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
    await delay(1000);
    return [];
  },

  getTransaction: async (id: string): Promise<Transaction> => {
    await delay(800);
    throw new Error("Transaction not found");
  },

  createTransaction: async (
    transactionData: Partial<Transaction>
  ): Promise<Transaction> => {
    await delay(1500);

    // Generate a transaction ID
    const transactionId = `TX${Date.now().toString().slice(-9)}`;

    // Get account details
    let fromAccountDetails = null;
    let toAccountDetails = null;

    if (
      transactionData.fromAccountId &&
      transactionData.fromAccountId !== "external"
    ) {
      fromAccountDetails = await getAccountDetails(
        transactionData.fromAccountId
      );
    }

    if (
      transactionData.toAccountId &&
      transactionData.toAccountId !== "external"
    ) {
      toAccountDetails = await getAccountDetails(transactionData.toAccountId);
    }

    // Determine transaction type
    let type = TransactionType.PAYMENT;
    if (transactionData.fromAccountId === "external") {
      type = TransactionType.DEPOSIT;
    } else if (transactionData.category === TransactionCategory.WITHDRAWAL) {
      type = TransactionType.WITHDRAWAL;
    } else if (transactionData.category === TransactionCategory.TRANSFER) {
      type = TransactionType.TRANSFER;
    }

    // Create new transaction
    const newTransaction: Transaction = {
      id: transactionId,
      userId: transactionData.userId || "1",
      fromAccountId: transactionData.fromAccountId || "",
      fromAccountName:
        fromAccountDetails?.name || transactionData.fromAccountName || "",
      fromAccountNumber:
        fromAccountDetails?.number || transactionData.fromAccountNumber || "",
      toAccountId: transactionData.toAccountId || "",
      toAccountName:
        toAccountDetails?.name || transactionData.toAccountName || "",
      toAccountNumber:
        toAccountDetails?.number || transactionData.toAccountNumber || "",
      amount: transactionData.amount || 0,
      currency: "USD",
      description: transactionData.description || "",
      category: transactionData.category || TransactionCategory.PAYMENT,
      status: TransactionStatus.PENDING,
      type,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return newTransaction;
  },

  approveTransaction: async (id: string): Promise<Transaction> => {
    await delay(1000);
    throw new Error("Transaction not found");
  },

  rejectTransaction: async (
    id: string,
    reason: string
  ): Promise<Transaction> => {
    await delay(1000);
    throw new Error("Transaction not found");
  },

  cancelTransaction: async (id: string): Promise<Transaction> => {
    await delay(1000);
    throw new Error("Transaction not found");
  },

  getTransactionHistory: async (filters?: any): Promise<Transaction[]> => {
    await delay(1000);
    return [];
  },
};

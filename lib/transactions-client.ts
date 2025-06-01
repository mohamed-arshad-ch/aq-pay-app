import { Transaction, TransactionStatus } from "@/types";

export const transactionsApi = {
  getTransactions: async (): Promise<Transaction[]> => {
    const response = await fetch("/api/user/transactions");
    if (!response.ok) {
      throw new Error("Failed to fetch transactions");
    }
    return response.json();
  },

  getTransaction: async (id: string): Promise<Transaction> => {
    const response = await fetch(`/api/user/transactions/${id}`);
    if (!response.ok) {
      throw new Error("Failed to fetch transaction");
    }
    return response.json();
  },

  createTransaction: async (transactionData: Partial<Transaction>): Promise<Transaction> => {
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
    console.log("Approving transaction:", id);
    
    const response = await fetch(`/api/admin/wallet/transactions/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "COMPLETED" }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Approve transaction error:", errorData);
      throw new Error(errorData.error || `HTTP ${response.status}: Failed to approve transaction`);
    }

    const result = await response.json();
    console.log("Approve transaction result:", result);
    
    return result;
  },

  rejectTransaction: async (id: string): Promise<Transaction> => {
    console.log("Rejecting transaction:", id);
    
    const response = await fetch(`/api/admin/wallet/transactions/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "REJECTED" }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Reject transaction error:", errorData);
      throw new Error(errorData.error || `HTTP ${response.status}: Failed to reject transaction`);
    }

    const result = await response.json();
    console.log("Reject transaction result:", result);
    
    return result;
  },

  resetTransaction: async (id: string): Promise<Transaction> => {
    console.log("Resetting transaction:", id);
    
    const response = await fetch(`/api/admin/wallet/transactions/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "PENDING" }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Reset transaction error:", errorData);
      throw new Error(errorData.error || `HTTP ${response.status}: Failed to reset transaction`);
    }

    const result = await response.json();
    console.log("Reset transaction result:", result);
    
    return result;
  },

  updateTransaction: async (id: string, data: Partial<Transaction>): Promise<Transaction> => {
    console.log("Updating transaction:", id, data);
    
    const response = await fetch(`/api/admin/wallet/transactions/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Update transaction error:", errorData);
      throw new Error(errorData.error || `HTTP ${response.status}: Failed to update transaction`);
    }

    const result = await response.json();
    console.log("Update transaction result:", result);
    
    return result;
  },

  cancelTransaction: async (id: string): Promise<Transaction> => {
    const response = await fetch(`/api/admin/wallet/transactions/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    if (!response.ok) {
      throw new Error("Failed to cancel transaction");
    }
    return response.json();
  },

  getTransactionHistory: async (filters?: any): Promise<Transaction[]> => {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await fetch(`/api/user/transactions/history?${queryParams}`);
    if (!response.ok) {
      throw new Error("Failed to fetch transaction history");
    }
    return response.json();
  },

  // Get transaction details by ID using POST request (new endpoint)
  getTransactionById: async (id: string): Promise<any> => {
    const response = await fetch("/api/transfer/transaction", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      throw new Error("Failed to fetch transaction details");
    }
    return response.json();
  },
}; 
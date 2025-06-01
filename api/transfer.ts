import { WalletTransaction, WalletTransactionStatus, WalletTransactionType } from "@/types";

export interface TransferFilters {
  status?: WalletTransactionStatus;
  type?: WalletTransactionType;
  userId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface TransferResponse {
  transactions: WalletTransaction[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface CreateTransferRequest {
  amount: number;
  type: WalletTransactionType;
  description: string;
  bankAccountId?: string;
  location?: string;
  currency?: string;
}

export interface UpdateTransferRequest {
  amount?: number;
  description?: string;
  location?: string;
  date?: string;
  adminNote?: string;
}

export interface UpdateTransferStatusRequest {
  status: WalletTransactionStatus;
  adminNote?: string;
  amount?: number;
  description?: string;
  location?: string;
  date?: string;
}

export const transferApi = {
  // Get all transactions with optional filtering
  getTransactions: async (filters: TransferFilters = {}): Promise<TransferResponse> => {
    const queryParams = new URLSearchParams();
    
    if (filters.status) queryParams.append("status", filters.status);
    if (filters.type) queryParams.append("type", filters.type);
    if (filters.userId) queryParams.append("userId", filters.userId);
    if (filters.search) queryParams.append("search", filters.search);
    if (filters.limit) queryParams.append("limit", filters.limit.toString());
    if (filters.offset) queryParams.append("offset", filters.offset.toString());

    const response = await fetch(`/api/transfer?${queryParams.toString()}`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: Failed to fetch transactions`);
    }
    
    return response.json();
  },

  // Get transaction details by ID
  getTransaction: async (id: string): Promise<{ transaction: WalletTransaction }> => {
    const response = await fetch(`/api/transfer/${id}`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: Failed to fetch transaction`);
    }
    
    return response.json();
  },

  // Create a new transaction
  createTransaction: async (data: CreateTransferRequest): Promise<{ transaction: WalletTransaction; message: string }> => {
    const response = await fetch("/api/transfer", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: Failed to create transaction`);
    }

    return response.json();
  },

  // Update transaction details (admin only)
  updateTransaction: async (id: string, data: UpdateTransferRequest): Promise<{ transaction: WalletTransaction; message: string }> => {
    const response = await fetch(`/api/transfer/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: Failed to update transaction`);
    }

    return response.json();
  },

  // Update transaction status (approve/reject)
  updateTransactionStatus: async (id: string, data: UpdateTransferStatusRequest): Promise<{
    transaction: WalletTransaction;
    message: string;
    walletUpdated?: boolean;
    newBalance?: number;
  }> => {
    const response = await fetch(`/api/transfer/${id}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: Failed to update transaction status`);
    }

    return response.json();
  },

  // Approve transaction
  approveTransaction: async (id: string, adminNote?: string): Promise<{
    transaction: WalletTransaction;
    message: string;
    walletUpdated?: boolean;
    newBalance?: number;
  }> => {
    return transferApi.updateTransactionStatus(id, {
      status: WalletTransactionStatus.COMPLETED,
      adminNote,
    });
  },

  // Reject transaction
  rejectTransaction: async (id: string, adminNote?: string): Promise<{
    transaction: WalletTransaction;
    message: string;
    walletUpdated?: boolean;
    newBalance?: number;
  }> => {
    return transferApi.updateTransactionStatus(id, {
      status: WalletTransactionStatus.CANCELLED,
      adminNote,
    });
  },

  // Delete transaction (admin only)
  deleteTransaction: async (id: string): Promise<{ message: string }> => {
    const response = await fetch(`/api/transfer/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: Failed to delete transaction`);
    }

    return response.json();
  },
}; 
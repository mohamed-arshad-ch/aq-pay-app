import type { WalletTransaction, WalletTransactionStatus, WalletTransactionType } from "@/types";

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

const apiClient = {
  get: async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: Request failed`);
    }
    return response.json();
  },

  post: async (url: string, data: any) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: Request failed`);
    }
    return response.json();
  },

  put: async (url: string, data: any) => {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: Request failed`);
    }
    return response.json();
  },

  delete: async (url: string) => {
    const response = await fetch(url, {
      method: "DELETE",
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: Request failed`);
    }
    return response.json();
  },
};

const transferApi = {
  // Get all transactions with optional filtering
  getTransactions: async (filters: TransferFilters = {}): Promise<TransferResponse> => {
    const queryParams = new URLSearchParams();
    
    if (filters.status) queryParams.append("status", filters.status);
    if (filters.type) queryParams.append("type", filters.type);
    if (filters.userId) queryParams.append("userId", filters.userId);
    if (filters.search) queryParams.append("search", filters.search);
    if (filters.limit) queryParams.append("limit", filters.limit.toString());
    if (filters.offset) queryParams.append("offset", filters.offset.toString());

    return apiClient.get(`/api/transfer?${queryParams.toString()}`);
  },

  // Get transaction details by ID
  getTransaction: async (id: string): Promise<{ transaction: WalletTransaction }> => {
    return apiClient.get(`/api/transfer/${id}`);
  },

  // Create a new transaction
  createTransaction: async (data: CreateTransferRequest): Promise<{ transaction: WalletTransaction; message: string }> => {
    return apiClient.post("/api/transfer", data);
  },

  // Update transaction details (admin only)
  updateTransaction: async (id: string, data: UpdateTransferRequest): Promise<{ transaction: WalletTransaction; message: string }> => {
    return apiClient.put(`/api/transfer/${id}`, data);
  },

  // Update transaction status (approve/reject)
  updateTransactionStatus: async (id: string, data: UpdateTransferStatusRequest): Promise<{
    transaction: WalletTransaction;
    message: string;
    walletUpdated?: boolean;
    newBalance?: number;
  }> => {
    return apiClient.post(`/api/transfer/${id}`, data);
  },

  // Approve transaction
  approveTransaction: async (id: string, adminNote?: string): Promise<{
    transaction: WalletTransaction;
    message: string;
    walletUpdated?: boolean;
    newBalance?: number;
  }> => {
    // Dynamic import to avoid circular references
    const { WalletTransactionStatus } = await import("@/types");
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
    // Dynamic import to avoid circular references
    const { WalletTransactionStatus } = await import("@/types");
    return transferApi.updateTransactionStatus(id, {
      status: WalletTransactionStatus.CANCELLED,
      adminNote,
    });
  },

  // Delete transaction (admin only)
  deleteTransaction: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete(`/api/transfer/${id}`);
  },
};

// Export for ES modules
export { transferApi };

// Default export for compatibility
export default transferApi; 
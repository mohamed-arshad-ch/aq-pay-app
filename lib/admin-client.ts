import type { Transaction } from "@/types";

const apiClient = {
  get: async (url: string) => {
    const response = await fetch(url);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `HTTP ${response.status}: Request failed`);
    }
    return response.json();
  },

  post: async (url: string, data?: any) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
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

export const adminApi = {
  // Dashboard
  getDashboardStats: async () => {
    return apiClient.get("/api/admin/dashboard");
  },

  // Users management
  getUsers: async (filters?: any) => {
    const queryParams = filters ? new URLSearchParams(filters).toString() : "";
    return apiClient.get(`/api/admin/users${queryParams ? `?${queryParams}` : ""}`);
  },

  getUser: async (id: string) => {
    return apiClient.get(`/api/admin/users/${id}`);
  },

  updateUser: async (id: string, userData: any) => {
    return apiClient.put(`/api/admin/users/${id}`, userData);
  },

  deleteUser: async (id: string) => {
    return apiClient.delete(`/api/admin/users/${id}`);
  },

  // Wallet and transactions
  getAllTransactions: async (filters?: any) => {
    const queryParams = filters ? new URLSearchParams(filters).toString() : "";
    return apiClient.get(`/api/admin/wallet/transactions${queryParams ? `?${queryParams}` : ""}`);
  },

  getTransaction: async (id: string) => {
    return apiClient.get(`/api/admin/wallet/transactions/${id}`);
  },

  updateTransactionStatus: async (id: string, data: any) => {
    return apiClient.post(`/api/admin/wallet/transactions/${id}`, data);
  },

  approveTransaction: async (id: string, adminNote?: string) => {
    return apiClient.post(`/api/admin/wallet/transactions/${id}`, {
      status: "COMPLETED",
      adminNote,
    });
  },

  rejectTransaction: async (id: string, adminNote?: string) => {
    return apiClient.post(`/api/admin/wallet/transactions/${id}`, {
      status: "REJECTED",
      adminNote,
    });
  },

  // System settings
  getSystemSettings: async () => {
    return apiClient.get("/api/admin/settings");
  },

  updateSystemSettings: async (settings: any) => {
    return apiClient.put("/api/admin/settings", settings);
  },

  // Security and access control
  getRoles: async () => {
    return apiClient.get("/api/admin/roles");
  },

  createRole: async (roleData: any) => {
    return apiClient.post("/api/admin/roles", roleData);
  },

  updateRole: async (id: string, roleData: any) => {
    return apiClient.put(`/api/admin/roles/${id}`, roleData);
  },

  deleteRole: async (id: string) => {
    return apiClient.delete(`/api/admin/roles/${id}`);
  },

  getPermissions: async () => {
    return apiClient.get("/api/admin/permissions");
  },

  // Audit logs
  getAuditLogs: async (filters?: any) => {
    const queryParams = filters ? new URLSearchParams(filters).toString() : "";
    return apiClient.get(`/api/admin/audit-logs${queryParams ? `?${queryParams}` : ""}`);
  },

  // Reports
  generateReport: async (reportType: string, filters?: any) => {
    return apiClient.post("/api/admin/reports", { type: reportType, filters });
  },

  exportReport: async (reportId: string, format: string) => {
    return apiClient.get(`/api/admin/reports/${reportId}/export?format=${format}`);
  },
}; 
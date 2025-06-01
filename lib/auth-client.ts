import type { User } from "@/types";

interface LoginResponse {
  user: User;
  token: string;
}

interface RegisterResponse {
  user: User;
  token: string;
}

interface ResetPasswordResponse {
  success: boolean;
  message: string;
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
};

export const authApi = {
  login: (credentials: {
    username: string;
    password: string;
    rememberMe: boolean;
  }): Promise<LoginResponse> => {
    return apiClient.post("/api/auth/login", credentials);
  },

  register: (userData: any): Promise<RegisterResponse> => {
    return apiClient.post("/api/auth/register", userData);
  },

  logout: (): Promise<void> => {
    return apiClient.post("/api/auth/logout");
  },

  resetPassword: (email: string): Promise<ResetPasswordResponse> => {
    return apiClient.post("/api/auth/reset-password", { email });
  },

  verifyResetCode: (
    token: string,
    code: string
  ): Promise<ResetPasswordResponse> => {
    return apiClient.post(`/api/auth/verify-reset/${token}`, { code });
  },

  setNewPassword: (
    token: string,
    password: string
  ): Promise<ResetPasswordResponse> => {
    return apiClient.post(`/api/auth/new-password/${token}`, { password });
  },

  refreshToken: (): Promise<{ token: string }> => {
    return apiClient.post("/api/auth/refresh-token");
  },

  getProfile: (): Promise<User> => {
    return apiClient.get("/api/auth/profile");
  },

  updateProfile: (userData: Partial<User>): Promise<User> => {
    return apiClient.put("/api/auth/profile", userData);
  },

  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ResetPasswordResponse> => {
    return apiClient.post("/api/auth/change-password", data);
  },
}; 
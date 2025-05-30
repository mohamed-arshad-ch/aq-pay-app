import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { TransactionStatus, TransactionType } from "@/types";

interface AccountStatus {
  id: string;
  name: string;
  accountNumber: string;
  balance: number;
  status: string;
}

interface RecentTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  createdAt?: string;
  status: TransactionStatus;
  type: TransactionType;
  accountName?: string;
  accountId: string;
  currency?: string;
}

interface DashboardState {
  totalBalance: number;
  pendingAmount: number;
  completedAmount: number;
  rejectedAmount: number;
  accountStatuses: AccountStatus[];
  recentTransactions: RecentTransaction[];
  unreadNotifications: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  stats: {
    pendingCount: number;
    completedCount: number;
    rejectedCount: number;
    activeUsers: number;
  };
}

const initialState: DashboardState = {
  totalBalance: 0,
  pendingAmount: 0,
  completedAmount: 0,
  rejectedAmount: 0,
  accountStatuses: [],
  recentTransactions: [],
  unreadNotifications: 0,
  isLoading: false,
  error: null,
  lastUpdated: null,
  stats: {
    pendingCount: 0,
    completedCount: 0,
    rejectedCount: 0,
    activeUsers: 0,
  },
};

// Async thunks
export const fetchDashboardData = createAsyncThunk(
  "dashboard/fetchData",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/admin/dashboard");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      const data = await response.json();

      // Ensure stats are properly formatted
      const formattedStats = {
        pendingCount: data.pendingTransactions?.length || 0,
        completedCount: data.completedTransactions?.length || 0,
        rejectedCount: data.rejectedTransactions?.length || 0,
        activeUsers: data.activeUsers || 0,
      };

      return {
        ...data,
        stats: formattedStats,
        // Ensure recentTransactions is always an array
        recentTransactions: data.recentTransactions || [],
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to fetch dashboard data"
      );
    }
  }
);

export const pollTransactionStatus = createAsyncThunk(
  "dashboard/pollTransactionStatus",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { dashboard: DashboardState };
      // Ensure recentTransactions is an array, default to empty if undefined/null
      const recentTransactions = state.dashboard.recentTransactions || [];

      const pendingTransactions = recentTransactions.filter(
        (tx) => tx.status === TransactionStatus.PENDING
      );

      if (pendingTransactions.length === 0) {
        return { updatedTransactions: [] };
      }

      // Check for transaction status updates
      const response = await fetch("/api/user/transactions/status-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionIds: pendingTransactions.map((tx) => tx.id),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to check transaction status");
      }

      const data = await response.json();
      return { updatedTransactions: data.updatedTransactions || [] };
    } catch (error) {
      console.error("Transaction status poll error:", error);
      return rejectWithValue("Failed to update transaction status.");
    }
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    clearDashboardError: (state) => {
      state.error = null;
    },
    markNotificationsAsRead: (state) => {
      state.unreadNotifications = 0;
    },
    updateTransactionStatus: (state, action) => {
      const { transactionId, newStatus } = action.payload;
      const transactionIndex = state.recentTransactions.findIndex(
        (tx) => tx.id === transactionId
      );
      if (transactionIndex !== -1) {
        state.recentTransactions[transactionIndex].status = newStatus;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch dashboard data
      .addCase(fetchDashboardData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        // Ensure stats are properly set with default values if missing
        state.stats = {
          pendingCount: 0,
          completedCount: 0,
          rejectedCount: 0,
          activeUsers: 0,
          ...action.payload.stats,
        };
        // Update other state properties
        state.recentTransactions = action.payload.recentTransactions;
        state.totalBalance = action.payload.totalBalance || 0;
        state.pendingAmount = action.payload.pendingAmount || 0;
        state.completedAmount = action.payload.completedAmount || 0;
        state.rejectedAmount = action.payload.rejectedAmount || 0;
        state.accountStatuses = action.payload.accountStatuses || [];
        state.unreadNotifications = action.payload.unreadNotifications || 0;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Poll transaction status
      .addCase(pollTransactionStatus.pending, (state) => {
        // Don't set loading state for polling to avoid UI flickering
      })
      .addCase(pollTransactionStatus.fulfilled, (state, action) => {
        const { updatedTransactions } = action.payload;

        // Update transactions that have status changes
        updatedTransactions.forEach((updatedTx: RecentTransaction) => {
          const index = state.recentTransactions.findIndex(
            (tx) => tx.id === updatedTx.id
          );
          if (index !== -1) {
            state.recentTransactions[index] = {
              ...state.recentTransactions[index],
              ...updatedTx,
            };
          }
        });

        if (updatedTransactions.length > 0) {
          state.lastUpdated = new Date().toISOString();
        }
      })
      .addCase(pollTransactionStatus.rejected, (state, action) => {
        // Silently handle polling errors to avoid disrupting user experience
        console.error("Transaction status polling failed:", action.payload);
      });
  },
});

export const {
  clearDashboardError,
  markNotificationsAsRead,
  updateTransactionStatus,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;

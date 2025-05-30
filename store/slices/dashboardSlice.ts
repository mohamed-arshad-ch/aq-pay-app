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
  status: TransactionStatus;
  type: TransactionType;
  accountName: string;
  accountId: string;
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
};

// Async thunks
export const fetchDashboardData = createAsyncThunk(
  "dashboard/fetchData",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/user/dashboard");
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data");
      }
      const data = await response.json();
      console.log("Dashboard API Response:", data); // Debug log
      return data;
    } catch (error) {
      console.error("Dashboard fetch error:", error);
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
      const pendingTransactions = state.dashboard.recentTransactions.filter(
        (tx) => tx.status === TransactionStatus.PENDING
      );

      if (pendingTransactions.length === 0) {
        return { updatedTransactions: [] };
      }

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // In a real app, you would check the status of pending transactions
      // For this example, we'll randomly update some pending transactions
      const updatedTransactions = pendingTransactions.map((tx) => {
        // Randomly update status (30% chance to update)
        if (Math.random() < 0.3) {
          return {
            ...tx,
            status:
              Math.random() < 0.8
                ? TransactionStatus.COMPLETED
                : TransactionStatus.REJECTED,
          };
        }
        return tx;
      });

      return { updatedTransactions };
    } catch (error) {
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        // Make sure we're properly setting the transactions
        state.recentTransactions = action.payload.recentTransactions;
        state.lastUpdated = new Date().toISOString();
        console.log("Updated dashboard state:", state.recentTransactions); // Debug log
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearDashboardError, markNotificationsAsRead } =
  dashboardSlice.actions;

export default dashboardSlice.reducer;

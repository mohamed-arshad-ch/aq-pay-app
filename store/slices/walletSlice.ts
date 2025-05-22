import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { Wallet, WalletTransaction } from "@/types";
import { WalletTransactionStatus } from "@/types";
import {
  fetchWalletDetails,
  addWalletBalance,
  sendWalletBalance,
  fetchWalletTransactions,
} from "@/api/wallet";

interface WalletState {
  wallet: Wallet | null;
  transactions: WalletTransaction[];
  pendingTransactions: WalletTransaction[];
  isLoading: boolean;
  error: string | null;
  transactionsLoading: boolean;
  transactionsError: string | null;
  notifications: WalletNotification[];
  hasUnreadNotifications: boolean;
}

export interface WalletNotification {
  id: string;
  transactionId: string;
  message: string;
  status: "unread" | "read";
  createdAt: string;
  type: "success" | "error" | "info";
}

const initialState: WalletState = {
  wallet: null,
  transactions: [],
  pendingTransactions: [],
  isLoading: false,
  error: null,
  transactionsLoading: false,
  transactionsError: null,
  notifications: [],
  hasUnreadNotifications: false,
};

// Async thunks
export const getWalletDetails = createAsyncThunk(
  "wallet/getWalletDetails",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchWalletDetails();
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const getWalletTransactions = createAsyncThunk(
  "wallet/getWalletTransactions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchWalletTransactions();
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const depositToWallet = createAsyncThunk(
  "wallet/depositToWallet",
  async (
    { amount, description }: { amount: number; description: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await addWalletBalance(amount, description);
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const sendFromWallet = createAsyncThunk(
  "wallet/sendFromWallet",
  async (
    {
      amount,
      bankAccountId,
      description,
    }: { amount: number; bankAccountId: string; description: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await sendWalletBalance(
        amount,
        bankAccountId,
        description
      );
      return response;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    addPendingTransaction: (
      state,
      action: PayloadAction<WalletTransaction>
    ) => {
      state.pendingTransactions.unshift(action.payload);
    },
    clearPendingTransactions: (state) => {
      state.pendingTransactions = [];
    },
    updateWalletBalance: (state, action: PayloadAction<number>) => {
      if (state.wallet) {
        state.wallet.balance = action.payload;
      }
    },
    addNotification: (state, action: PayloadAction<WalletNotification>) => {
      state.notifications.unshift(action.payload);
      state.hasUnreadNotifications = true;
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(
        (n) => n.id === action.payload
      );
      if (notification) {
        notification.status = "read";
      }
      state.hasUnreadNotifications = state.notifications.some(
        (n) => n.status === "unread"
      );
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach((notification) => {
        notification.status = "read";
      });
      state.hasUnreadNotifications = false;
    },
    updateTransactionStatus: (
      state,
      action: PayloadAction<{
        transactionId: string;
        status: WalletTransactionStatus;
        adminNote?: string;
      }>
    ) => {
      const { transactionId, status, adminNote } = action.payload;

      // Find the transaction in either pendingTransactions or transactions
      const pendingTransaction = state.pendingTransactions.find(
        (t) => t.id === transactionId
      );
      const transaction = state.transactions.find(
        (t) => t.id === transactionId
      );

      const targetTransaction = pendingTransaction || transaction;

      if (targetTransaction) {
        // Update transaction status and note
        targetTransaction.status = status;
        targetTransaction.updatedAt = new Date().toISOString();
        if (adminNote) {
          targetTransaction.adminNote = adminNote;
        }

        // Handle balance updates
        if (state.wallet) {
          if (status === WalletTransactionStatus.COMPLETED) {
            // Deduct from balance when approved
            state.wallet.balance -= targetTransaction.amount;
          } else if (
            (status === WalletTransactionStatus.FAILED ||
              status === WalletTransactionStatus.CANCELLED) &&
            targetTransaction.status === WalletTransactionStatus.PENDING
          ) {
            // Refund the balance if the transaction was pending and is now rejected/cancelled
            state.wallet.balance += targetTransaction.amount;
          }
        }

        // Move transaction between arrays based on status
        if (pendingTransaction) {
          // Remove from pendingTransactions
          state.pendingTransactions = state.pendingTransactions.filter(
            (t) => t.id !== transactionId
          );
          // Add to main transactions array
          state.transactions.unshift(targetTransaction);
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Get wallet details
      .addCase(getWalletDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getWalletDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.wallet = action.payload;
      })
      .addCase(getWalletDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Get wallet transactions
      .addCase(getWalletTransactions.pending, (state) => {
        state.transactionsLoading = true;
        state.transactionsError = null;
      })
      .addCase(getWalletTransactions.fulfilled, (state, action) => {
        state.transactionsLoading = false;
        state.transactions = action.payload;
      })
      .addCase(getWalletTransactions.rejected, (state, action) => {
        state.transactionsLoading = false;
        state.transactionsError = action.payload as string;
      })
      // Deposit to wallet
      .addCase(depositToWallet.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(depositToWallet.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.wallet) {
          state.wallet.balance = action.payload.newBalance;
        }
        state.transactions.unshift(action.payload.transaction);
        state.pendingTransactions = state.pendingTransactions.filter(
          (tx) => tx.id !== action.payload.transaction.id
        );
      })
      .addCase(depositToWallet.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Send from wallet
      .addCase(sendFromWallet.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendFromWallet.fulfilled, (state, action) => {
        state.isLoading = false;
        // Only add to pendingTransactions, not to main transactions array
        state.pendingTransactions.unshift(action.payload.transaction);
      })
      .addCase(sendFromWallet.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  addPendingTransaction,
  clearPendingTransactions,
  updateWalletBalance,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  updateTransactionStatus,
} = walletSlice.actions;

export default walletSlice.reducer;

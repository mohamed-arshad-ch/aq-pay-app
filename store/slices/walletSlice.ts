import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { Wallet, WalletTransaction } from "@/types";
import { WalletTransactionStatus, WalletTransactionType } from "@/types";
import {
  fetchWalletDetails,
  fetchWalletTransactions,
  addWalletBalance,
  sendWalletBalance,
} from "@/api/wallet";

interface WalletState {
  wallet: Wallet | null;
  transactions: WalletTransaction[];
  pendingTransactions: WalletTransaction[];
  isLoading: boolean;
  error: string | null;
  notifications: Array<{
    id: string;
    message: string;
    type: string;
    read: boolean;
    createdAt: string;
  }>;
}

const initialState: WalletState = {
  wallet: null,
  transactions: [],
  pendingTransactions: [],
  isLoading: false,
  error: null,
  notifications: [],
};

// Async thunks
export const getWalletDetails = createAsyncThunk(
  "wallet/getWalletDetails",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchWalletDetails();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to fetch wallet details"
      );
    }
  }
);

export const getWalletTransactions = createAsyncThunk(
  "wallet/getWalletTransactions",
  async (_, { rejectWithValue }) => {
    try {
      return await fetchWalletTransactions();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : "Failed to fetch wallet transactions"
      );
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
      return await addWalletBalance(amount, description);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to add balance"
      );
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
    }: {
      amount: number;
      bankAccountId: string;
      description: string;
    },
    { rejectWithValue }
  ) => {
    try {
      return await sendWalletBalance(amount, bankAccountId, description);
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to send money"
      );
    }
  }
);

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    clearWalletError: (state) => {
      state.error = null;
    },
    setAllTransactions: (state, action: PayloadAction<WalletTransaction[]>) => {
      state.transactions = action.payload;
    },
    updateTransaction: (
      state,
      action: PayloadAction<WalletTransaction & { wallet?: Wallet }>
    ) => {
      const index = state.transactions.findIndex(
        (t) => t.id === action.payload.id
      );
      if (index !== -1) {
        state.transactions[index] = action.payload;
      }

      // Update wallet balance only if:
      // 1. The transaction is completed
      // 2. It's a TRANSFER type transaction
      // 3. The wallet object is provided
      if (
        action.payload.wallet &&
        state.wallet &&
        action.payload.status === WalletTransactionStatus.COMPLETED &&
        action.payload.type === WalletTransactionType.TRANSFER
      ) {
        state.wallet.balance = action.payload.wallet.balance;
      }
    },
    updateTransactionStatus: (
      state,
      action: PayloadAction<{
        transactionId: string;
        status: WalletTransactionStatus;
        wallet?: Wallet;
      }>
    ) => {
      const { transactionId, status, wallet } = action.payload;
      const transaction = state.transactions.find(
        (t) => t.id === transactionId
      );
      if (transaction) {
        transaction.status = status;
        if (wallet && state.wallet) {
          state.wallet.balance = wallet.balance;
        }
      }
    },
    addNotification: (
      state,
      action: PayloadAction<{
        message: string;
        type: string;
      }>
    ) => {
      state.notifications.unshift({
        id: Math.random().toString(36).substr(2, 9),
        message: action.payload.message,
        type: action.payload.type,
        read: false,
        createdAt: new Date().toISOString(),
      });
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(
        (n) => n.id === action.payload
      );
      if (notification) {
        notification.read = true;
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach((notification) => {
        notification.read = true;
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Wallet Details
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
      // Get Wallet Transactions
      .addCase(getWalletTransactions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getWalletTransactions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.transactions = action.payload.filter(
          (t) => t.status !== WalletTransactionStatus.PENDING
        );
        state.pendingTransactions = action.payload.filter(
          (t) => t.status === WalletTransactionStatus.PENDING
        );
      })
      .addCase(getWalletTransactions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Deposit to Wallet
      .addCase(depositToWallet.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(depositToWallet.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.wallet) {
          state.wallet.balance = action.payload.newBalance;
        }
        state.transactions = [
          action.payload.transaction,
          ...state.transactions,
        ];
      })
      .addCase(depositToWallet.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Send from Wallet
      .addCase(sendFromWallet.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendFromWallet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingTransactions = [
          action.payload.transaction,
          ...state.pendingTransactions,
        ];
      })
      .addCase(sendFromWallet.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  clearWalletError,
  setAllTransactions,
  updateTransaction,
  updateTransactionStatus,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = walletSlice.actions;
export default walletSlice.reducer;

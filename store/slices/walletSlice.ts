// store/slices/walletSlice.ts
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
  addWalletBalance, // This API call will now return the PENDING transaction
  sendWalletBalance,
} from "@/api/wallet";

interface WalletState {
  wallet: Wallet | null;
  transactions: WalletTransaction[];
  pendingTransactions: WalletTransaction[]; // This array will hold pending transactions
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

// Async thunks (No changes to depositToWallet's definition, but its return type implies the backend change)
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
    {
      amount,
      description,
      status, // This should be 'PENDING' for initial deposit requests
      location,
      time,
    }: {
      amount: number;
      description: string;
      status: string;
      location: string;
      time: string;
    },
    { rejectWithValue }
  ) => {
    try {
      // The addWalletBalance API call will now return the created PENDING transaction
      const response = await addWalletBalance(
        amount,
        description,
        status,
        location,
        time
      );
      return response.transaction; // Access the transaction property
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
    // This reducer is key for updating transaction status and balance when approved
    updateTransaction: (
      state,
      action: PayloadAction<WalletTransaction & { wallet?: Wallet }>
    ) => {
      const { id, status, type, wallet } = action.payload;
      const index = state.transactions.findIndex((t) => t.id === id);
      const pendingIndex = state.pendingTransactions.findIndex(
        (t) => t.id === id
      );

      // If the transaction exists in pending and is now completed, move it to transactions
      if (
        pendingIndex !== -1 &&
        status === WalletTransactionStatus.COMPLETED
      ) {
        const completedTransaction = state.pendingTransactions[pendingIndex];
        state.pendingTransactions.splice(pendingIndex, 1); // Remove from pending
        state.transactions.unshift({ ...completedTransaction, ...action.payload }); // Add to main transactions
      } else if (index !== -1) {
        // Otherwise, just update an existing transaction in the main list
        state.transactions[index] = { ...state.transactions[index], ...action.payload };
      }

      // Update wallet balance only if the transaction is completed AND it's a DEPOSIT or TRANSFER
      // The wallet object should be provided when the balance is updated
      if (
        wallet &&
        state.wallet &&
        status === WalletTransactionStatus.COMPLETED &&
        (type === WalletTransactionType.DEPOSIT || type === WalletTransactionType.TRANSFER)
      ) {
        state.wallet.balance = wallet.balance;
      }
    },
    updateTransactionStatus: ( // Consider deprecating or merging this into updateTransaction for consistency
      state,
      action: PayloadAction<{
        transactionId: string;
        status: WalletTransactionStatus;
        wallet?: Wallet; // Include wallet for balance update
      }>
    ) => {
      const { transactionId, status, wallet } = action.payload;
      const transaction = state.transactions.find(
        (t) => t.id === transactionId
      );
      const pendingTransaction = state.pendingTransactions.find(
        (t) => t.id === transactionId
      );

      if (pendingTransaction) {
        pendingTransaction.status = status;
        if (status === WalletTransactionStatus.COMPLETED) {
          state.transactions.unshift(pendingTransaction); // Move to main transactions
          state.pendingTransactions = state.pendingTransactions.filter(
            (t) => t.id !== transactionId
          ); // Remove from pending
          if (wallet && state.wallet) {
            state.wallet.balance = wallet.balance;
          }
        }
      } else if (transaction) {
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
      // Deposit to Wallet (Modified)
      .addCase(depositToWallet.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(depositToWallet.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add the PENDING transaction to the pendingTransactions array
        state.pendingTransactions = [
          action.payload, // action.payload is now just the transaction object
          ...state.pendingTransactions,
        ];
        // DO NOT update state.wallet.balance here. It will be updated when the transaction is completed.
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
  updateTransactionStatus, // Keep this, as it's useful for admin side to update status
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = walletSlice.actions;
export default walletSlice.reducer;
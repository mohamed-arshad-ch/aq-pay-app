// store/slices/usersSlice.ts
import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

export interface Account {
  id: string;
  accountNumber: string;
  accountHolderName: string;
  accountName: string;
  routingNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string;
  accountType: string;
  isDefault: boolean;
  balance: number;
  currency: string; // Add currency to the Account interface
  type: "SAVINGS" | "CHECKING" | "CREDIT_CARD" | "LOAN" | "UNKNOWN"; // Example types, added UNKNOWN for safety
  status: "ACTIVE" | "CLOSED" | "PENDING"; // Example statuses
  createdAt: string; // Ensure this is a string as it comes from JSON

}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  createdAt: string; // Changed to string to match serialized Date from API
  lastLogin: string; // Changed to string to match serialized Date from API
  twoFactorEnabled: boolean;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  role: string;
  linkedAccounts: number;
  transactionCount: number;
  transactionVolume: number;
  riskLevel: string;
  kycStatus: string;
  accounts?: Account[]; // Make accounts optional, to be fetched on demand
  notes?: string;
}

export interface UsersState {
  data: User[] | null;
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/admin/users");
      console.log(response);
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching users:", error);
      return rejectWithValue("Failed to fetch users");
    }
  }
);

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<User[]>) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
  },
});

export default usersSlice.reducer;
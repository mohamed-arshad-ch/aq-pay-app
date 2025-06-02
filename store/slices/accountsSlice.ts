import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { accountsApi } from "@/api"
import type { BankAccount, Transaction } from "@/types"

interface AccountsState {
  accounts: BankAccount[]
  selectedAccount: BankAccount | null
  accountTransactions: Transaction[]
  isLoading: boolean
  error: string | null
}

const initialState: AccountsState = {
  accounts: [],
  selectedAccount: null,
  accountTransactions: [],
  isLoading: false,
  error: null,
}

// Async thunks
export const fetchAccounts = createAsyncThunk("accounts/fetchAccounts", async (_, { rejectWithValue }) => {
  try {
    const response = await accountsApi.getAccounts()
    return response
  } catch (error) {
    return rejectWithValue("Failed to fetch accounts")
  }
})

export const fetchAccount = createAsyncThunk("accounts/fetchAccount", async (id: string, { rejectWithValue }) => {
  try {
    const response = await fetch("/api/user/accounts/details", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: "get", id }),
    });
    if (!response.ok) {
      throw new Error("Failed to fetch account details");
    }
    return await response.json();
  } catch (error) {
    return rejectWithValue("Failed to fetch account details");
  }
})

export const fetchAccountTransactions = createAsyncThunk(
  "accounts/fetchAccountTransactions",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await accountsApi.getAccountTransactions(id)
      return response
    } catch (error) {
      return rejectWithValue("Failed to fetch account transactions")
    }
  },
)

export const addAccount = createAsyncThunk(
  "accounts/addAccount",
  async (accountData: Partial<BankAccount>, { rejectWithValue }) => {
    try {
      const response = await accountsApi.addAccount(accountData)
      return response
    } catch (error) {
      return rejectWithValue("Failed to add account")
    }
  },
)

export const updateAccount = createAsyncThunk(
  "accounts/updateAccount",
  async ({ id, data }: { id: string; data: Partial<BankAccount> }, { rejectWithValue }) => {
    try {
      const response = await accountsApi.updateAccount(id, data)
      return response
    } catch (error) {
      return rejectWithValue("Failed to update account")
    }
  },
)

export const deleteAccount = createAsyncThunk("accounts/deleteAccount", async (id: string, { rejectWithValue }) => {
  try {
    await accountsApi.deleteAccount(id)
    return id
  } catch (error) {
    return rejectWithValue("Failed to delete account")
  }
})

export const setDefaultAccount = createAsyncThunk(
  "accounts/setDefaultAccount",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await accountsApi.setDefaultAccount(id)
      return response
    } catch (error) {
      return rejectWithValue("Failed to set default account")
    }
  },
)

const accountsSlice = createSlice({
  name: "accounts",
  initialState,
  reducers: {
    setAccounts: (state, action: PayloadAction<BankAccount[]>) => {
      state.accounts = action.payload
    },
    selectAccount: (state, action: PayloadAction<BankAccount>) => {
      state.selectedAccount = action.payload
    },
    clearSelectedAccount: (state) => {
      state.selectedAccount = null
    },
    clearAccountsError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // Fetch accounts
    builder.addCase(fetchAccounts.pending, (state) => {
      state.isLoading = true
      state.error = null
    })
    builder.addCase(fetchAccounts.fulfilled, (state, action) => {
      state.isLoading = false
      state.accounts = action.payload
    })
    builder.addCase(fetchAccounts.rejected, (state, action) => {
      state.isLoading = false
      state.error = action.payload as string
    })

    // Fetch single account
    builder.addCase(fetchAccount.pending, (state) => {
      state.isLoading = true
      state.error = null
    })
    builder.addCase(fetchAccount.fulfilled, (state, action) => {
      state.isLoading = false
      state.selectedAccount = action.payload
    })
    builder.addCase(fetchAccount.rejected, (state, action) => {
      state.isLoading = false
      state.error = action.payload as string
    })

    // Fetch account transactions
    builder.addCase(fetchAccountTransactions.pending, (state) => {
      state.isLoading = true
      state.error = null
    })
    builder.addCase(fetchAccountTransactions.fulfilled, (state, action) => {
      state.isLoading = false
      state.accountTransactions = action.payload
    })
    builder.addCase(fetchAccountTransactions.rejected, (state, action) => {
      state.isLoading = false
      state.error = action.payload as string
    })

    // Add account
    builder.addCase(addAccount.pending, (state) => {
      state.isLoading = true
      state.error = null
    })
    builder.addCase(addAccount.fulfilled, (state, action) => {
      state.isLoading = false
      state.accounts.push(action.payload)
    })
    builder.addCase(addAccount.rejected, (state, action) => {
      state.isLoading = false
      state.error = action.payload as string
    })

    // Update account
    builder.addCase(updateAccount.pending, (state) => {
      state.isLoading = true
      state.error = null
    })
    builder.addCase(updateAccount.fulfilled, (state, action) => {
      state.isLoading = false
      const index = state.accounts.findIndex((account) => account.id === action.payload.id)
      if (index !== -1) {
        state.accounts[index] = action.payload
      }
      state.selectedAccount = action.payload
    })
    builder.addCase(updateAccount.rejected, (state, action) => {
      state.isLoading = false
      state.error = action.payload as string
    })

    // Delete account
    builder.addCase(deleteAccount.pending, (state) => {
      state.isLoading = true
      state.error = null
    })
    builder.addCase(deleteAccount.fulfilled, (state, action) => {
      state.isLoading = false
      state.accounts = state.accounts.filter((account) => account.id !== action.payload)
      if (state.selectedAccount && state.selectedAccount.id === action.payload) {
        state.selectedAccount = null
      }
    })
    builder.addCase(deleteAccount.rejected, (state, action) => {
      state.isLoading = false
      state.error = action.payload as string
    })

    // Set default account
    builder.addCase(setDefaultAccount.pending, (state) => {
      state.isLoading = true
      state.error = null
    })
    builder.addCase(setDefaultAccount.fulfilled, (state, action) => {
      state.isLoading = false
      // Since we removed the isDefault field, just update the selected account
      state.selectedAccount = action.payload
    })
    builder.addCase(setDefaultAccount.rejected, (state, action) => {
      state.isLoading = false
      state.error = action.payload as string
    })
  },
})

export const { setAccounts, selectAccount, clearSelectedAccount, clearAccountsError } = accountsSlice.actions

export default accountsSlice.reducer

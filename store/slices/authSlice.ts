import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { authApi } from "@/api"
import type { User, UserRole } from "@/types"

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  role: UserRole | null
  failedAttempts: number
  lastFailedAttempt: number | null
  isLocked: boolean
  lockUntil: number | null
  twoFactorRequired: boolean
  twoFactorVerified: boolean
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  role: null,
  failedAttempts: 0,
  lastFailedAttempt: null,
  isLocked: false,
  lockUntil: null,
  twoFactorRequired: false,
  twoFactorVerified: false,
}

// Async thunks
export const loginAsync = createAsyncThunk(
  "auth/login",
  async (credentials: { username: string; password: string; rememberMe: boolean }, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials)
      return response
    } catch (error) {
      return rejectWithValue("Invalid username or password")
    }
  },
)

export const registerAsync = createAsyncThunk("auth/register", async (userData: any, { rejectWithValue }) => {
  try {
    const response = await authApi.register(userData)
    return response
  } catch (error) {
    return rejectWithValue("Registration failed")
  }
})

export const logoutAsync = createAsyncThunk("auth/logout", async (_, { rejectWithValue }) => {
  try {
    await authApi.logout()
    return null
  } catch (error) {
    return rejectWithValue("Logout failed")
  }
})

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ user: User; token: string; rememberMe?: boolean }>) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
      state.role = (action.payload.user.role as UserRole) || null
      state.error = null
      state.failedAttempts = 0
      state.lastFailedAttempt = null
      state.isLocked = false
      state.lockUntil = null
    },
    register: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
      state.error = null
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.role = null
      state.error = null
      state.twoFactorRequired = false
      state.twoFactorVerified = false

      // Clear auth token and role cookies
      document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    loginFailed: (state) => {
      state.failedAttempts += 1
      state.lastFailedAttempt = Date.now()

      // Lock account after 5 failed attempts
      if (state.failedAttempts >= 5) {
        state.isLocked = true
        state.lockUntil = Date.now() + 15 * 60 * 1000 // Lock for 15 minutes
      }
    },
    resetFailedAttempts: (state) => {
      state.failedAttempts = 0
      state.lastFailedAttempt = null
      state.isLocked = false
      state.lockUntil = null
    },
    requireTwoFactor: (state) => {
      state.twoFactorRequired = true
    },
    verifyTwoFactor: (state) => {
      state.twoFactorVerified = true
      state.twoFactorRequired = false
    },
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginAsync.pending, (state) => {
      state.isLoading = true
      state.error = null
    })
    builder.addCase(loginAsync.fulfilled, (state, action) => {
      state.isLoading = false
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
    })
    builder.addCase(loginAsync.rejected, (state, action) => {
      state.isLoading = false
      state.error = action.payload as string
    })

    // Register
    builder.addCase(registerAsync.pending, (state) => {
      state.isLoading = true
      state.error = null
    })
    builder.addCase(registerAsync.fulfilled, (state, action) => {
      state.isLoading = false
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
    })
    builder.addCase(registerAsync.rejected, (state, action) => {
      state.isLoading = false
      state.error = action.payload as string
    })

    // Logout
    builder.addCase(logoutAsync.fulfilled, (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
    })
  },
})

export const {
  login,
  register,
  logout,
  setError,
  clearError,
  loginFailed,
  resetFailedAttempts,
  requireTwoFactor,
  verifyTwoFactor,
} = authSlice.actions

export default authSlice.reducer

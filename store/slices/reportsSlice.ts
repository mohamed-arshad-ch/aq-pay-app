import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { adminApi } from "@/api/admin";

// Define types for our reports data
export interface KpiData {
  transactionVolume: {
    daily: number;
    weekly: number;
    monthly: number;
    yearToDate: number;
  };
  averageApprovalTime: {
    current: number; // in minutes
    previousPeriod: number;
    percentChange: number;
  };
  rejectionRate: {
    current: number; // percentage
    previousPeriod: number;
    percentChange: number;
  };
  userGrowth: {
    daily: number;
    weekly: number;
    monthly: number;
    percentChange: number;
  };
  systemPerformance: {
    uptime: number; // percentage
    responseTime: number; // in ms
    errorRate: number; // percentage
  };
}

export interface TransactionVolumeData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

export interface UserGrowthData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
  }[];
}

export interface TransactionPatternData {
  byCategory: {
    labels: string[];
    data: number[];
  };
  byTimeOfDay: {
    labels: string[];
    data: number[];
  };
  byDayOfWeek: {
    labels: string[];
    data: number[];
  };
}

export interface ReportsState {
  kpi: {
    data: KpiData | null;
    loading: boolean;
    error: string | null;
  };
  transactionVolume: {
    data: TransactionVolumeData | null;
    loading: boolean;
    error: string | null;
  };
  userGrowth: {
    data: UserGrowthData | null;
    loading: boolean;
    error: string | null;
  };
  transactionPatterns: {
    data: TransactionPatternData | null;
    loading: boolean;
    error: string | null;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

// Initial state
const initialState: ReportsState = {
  kpi: {
    data: null,
    loading: false,
    error: null,
  },
  transactionVolume: {
    data: null,
    loading: false,
    error: null,
  },
  userGrowth: {
    data: null,
    loading: false,
    error: null,
  },
  transactionPatterns: {
    data: null,
    loading: false,
    error: null,
  },
  dateRange: {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // 30 days ago
    endDate: new Date().toISOString().split("T")[0], // today
  },
};

// Async thunks
export const fetchKpiData = createAsyncThunk(
  "reports/fetchKpiData",
  async (
    dateRange: { startDate: string; endDate: string },
    { rejectWithValue }
  ) => {
    try {
      // In a real app, we would fetch actual KPI data
      // const response = await adminApi.getKpiData(dateRange)

      // Return empty KPI data structure
      return {
        transactionVolume: {
          daily: 0,
          weekly: 0,
          monthly: 0,
          yearToDate: 0,
        },
        averageApprovalTime: {
          current: 0,
          previousPeriod: 0,
          percentChange: 0,
        },
        rejectionRate: {
          current: 0,
          previousPeriod: 0,
          percentChange: 0,
        },
        userGrowth: {
          daily: 0,
          weekly: 0,
          monthly: 0,
          percentChange: 0,
        },
        systemPerformance: {
          uptime: 0,
          responseTime: 0,
          errorRate: 0,
        },
      };
    } catch (error) {
      return rejectWithValue("Failed to fetch KPI data");
    }
  }
);

export const fetchTransactionVolumeData = createAsyncThunk(
  "reports/fetchTransactionVolumeData",
  async (
    dateRange: { startDate: string; endDate: string },
    { rejectWithValue }
  ) => {
    try {
      // In a real app, we would call an actual endpoint
      // const response = await adminApi.getTransactionVolumeData(dateRange)

      // Return empty data structure
      return {
        labels: [],
        datasets: [
          {
            label: "Completed",
            data: [],
          },
          {
            label: "Pending",
            data: [],
          },
          {
            label: "Failed",
            data: [],
          },
        ],
      };
    } catch (error) {
      return rejectWithValue("Failed to fetch transaction volume data");
    }
  }
);

export const fetchUserGrowthData = createAsyncThunk(
  "reports/fetchUserGrowthData",
  async (
    dateRange: { startDate: string; endDate: string },
    { rejectWithValue }
  ) => {
    try {
      // In a real app, we would call an actual endpoint
      // const response = await adminApi.getUserGrowthData(dateRange)

      // Return empty data structure
      return {
        labels: [],
        datasets: [
          {
            label: "New Users",
            data: [],
          },
          {
            label: "Active Users",
            data: [],
          },
        ],
      };
    } catch (error) {
      return rejectWithValue("Failed to fetch user growth data");
    }
  }
);

export const fetchTransactionPatternData = createAsyncThunk(
  "reports/fetchTransactionPatternData",
  async (
    dateRange: { startDate: string; endDate: string },
    { rejectWithValue }
  ) => {
    try {
      // In a real app, we would call an actual endpoint
      // const response = await adminApi.getTransactionPatternData(dateRange)

      // Return empty data structure
      return {
        byCategory: {
          labels: [],
          data: [],
        },
        byTimeOfDay: {
          labels: [],
          data: [],
        },
        byDayOfWeek: {
          labels: [],
          data: [],
        },
      };
    } catch (error) {
      return rejectWithValue("Failed to fetch transaction pattern data");
    }
  }
);

// Create the slice
const reportsSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {
    setDateRange: (
      state,
      action: PayloadAction<{ startDate: string; endDate: string }>
    ) => {
      state.dateRange = action.payload;
    },
  },
  extraReducers: (builder) => {
    // KPI data
    builder
      .addCase(fetchKpiData.pending, (state) => {
        state.kpi.loading = true;
        state.kpi.error = null;
      })
      .addCase(fetchKpiData.fulfilled, (state, action) => {
        state.kpi.loading = false;
        state.kpi.data = action.payload;
      })
      .addCase(fetchKpiData.rejected, (state, action) => {
        state.kpi.loading = false;
        state.kpi.error = action.payload as string;
      });

    // Transaction volume data
    builder
      .addCase(fetchTransactionVolumeData.pending, (state) => {
        state.transactionVolume.loading = true;
        state.transactionVolume.error = null;
      })
      .addCase(fetchTransactionVolumeData.fulfilled, (state, action) => {
        state.transactionVolume.loading = false;
        state.transactionVolume.data = action.payload;
      })
      .addCase(fetchTransactionVolumeData.rejected, (state, action) => {
        state.transactionVolume.loading = false;
        state.transactionVolume.error = action.payload as string;
      });

    // User growth data
    builder
      .addCase(fetchUserGrowthData.pending, (state) => {
        state.userGrowth.loading = true;
        state.userGrowth.error = null;
      })
      .addCase(fetchUserGrowthData.fulfilled, (state, action) => {
        state.userGrowth.loading = false;
        state.userGrowth.data = action.payload;
      })
      .addCase(fetchUserGrowthData.rejected, (state, action) => {
        state.userGrowth.loading = false;
        state.userGrowth.error = action.payload as string;
      });

    // Transaction pattern data
    builder
      .addCase(fetchTransactionPatternData.pending, (state) => {
        state.transactionPatterns.loading = true;
        state.transactionPatterns.error = null;
      })
      .addCase(fetchTransactionPatternData.fulfilled, (state, action) => {
        state.transactionPatterns.loading = false;
        state.transactionPatterns.data = action.payload;
      })
      .addCase(fetchTransactionPatternData.rejected, (state, action) => {
        state.transactionPatterns.loading = false;
        state.transactionPatterns.error = action.payload as string;
      });
  },
});

export const { setDateRange } = reportsSlice.actions;
export default reportsSlice.reducer;

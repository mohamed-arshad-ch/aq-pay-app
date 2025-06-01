import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { adminApi } from "@/api";

export interface Activity {
  id: string;
  user: string;
  action: string;
  resource: string;
  timestamp: string;
  icon: string;
}

interface ActivitiesState {
  data: Activity[] | null;
  loading: boolean;
  error: string | null;
}

const initialState: ActivitiesState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchActivities = createAsyncThunk(
  "activities/fetchActivities",
  async (_, { rejectWithValue }) => {
    try {
      // In a real app, we would call an actual endpoint
      // const response = await adminApi.getActivities()

      // Return empty data structure
      return [];
    } catch (error) {
      return rejectWithValue("Failed to fetch activities");
    }
  }
);

const activitiesSlice = createSlice({
  name: "activities",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default activitiesSlice.reducer;

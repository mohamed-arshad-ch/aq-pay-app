import { configureStore } from "@reduxjs/toolkit";
import reportsReducer from "./slices/reportsSlice";
import activitiesReducer from "./slices/activitiesSlice";
import usersReducer from "./slices/usersSlice";
import { UsersState } from "./slices/usersSlice";

export interface RootState {
  reports: any; // Replace with actual type if available
  activities: any; // Replace with actual type if available
  users: UsersState;
  auth: any; // Replace with actual type if available
  ui: any; // Replace with actual type if available
  accounts: any; // Replace with actual type if available
  transactions: any; // Replace with actual type if available
  dashboard: any; // Replace with actual type if available
  wallet: any; // Replace with actual type if available
}

export const store = configureStore({
  reducer: {
    reports: reportsReducer,
    activities: activitiesReducer,
    users: usersReducer,
  },
});

export type AppDispatch = typeof store.dispatch;

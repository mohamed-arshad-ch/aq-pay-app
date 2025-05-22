import { configureStore } from "@reduxjs/toolkit";
import reportsReducer from "./slices/reportsSlice";
import activitiesReducer from "./slices/activitiesSlice";
import usersReducer, { UsersState } from "./slices/usersSlice";

export interface RootState {
  reports: any;
  activities: any;
  users: UsersState;
  auth: any;
  ui: any;
  accounts: any;
  transactions: any;
  dashboard: any;
  wallet: any;
}

const store = configureStore({
  reducer: {
    reports: reportsReducer,
    activities: activitiesReducer,
    users: usersReducer,
    auth: (state = {}) => state,
    ui: (state = {}) => state,
    accounts: (state = {}) => state,
    transactions: (state = {}) => state,
    dashboard: (state = {}) => state,
    wallet: (state = {}) => state,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ["users/fetchUsers/fulfilled"],
        // Ignore these field paths in all actions
        ignoredActionPaths: ["payload.createdAt", "payload.lastLogin"],
        // Ignore these paths in the state
        ignoredPaths: ["users.data.createdAt", "users.data.lastLogin"],
      },
    }),
});

export type AppDispatch = typeof store.dispatch;
export default store;

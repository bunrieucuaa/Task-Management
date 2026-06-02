import { configureStore, type Action, type ThunkAction } from "@reduxjs/toolkit";
import counterReducer from "@/redux/counterSlice";
import authSlice from "@/redux/authSlice";
import usersSlice from "@/redux/usersSlice";

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    auth: authSlice,
    users: usersSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

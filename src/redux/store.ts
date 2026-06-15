import { configureStore, type Action, type ThunkAction } from "@reduxjs/toolkit";
import authSlice from "@/redux/authSlice";
import usersSlice from "@/redux/usersSlice";
import projectsSlice from "@/redux/projectsSlice";
import tasksSlice from "@/redux/tasksSlice";
import commentsSlice from "@/redux/commentsSlice";

export const store = configureStore({
  reducer: {
    auth: authSlice,
    users: usersSlice,
    projects: projectsSlice,
    tasks: tasksSlice,
    comments: commentsSlice,
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

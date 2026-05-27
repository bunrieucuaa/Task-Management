import { configureStore, type Action, type ThunkAction } from '@reduxjs/toolkit'
import counterReducer from "@/redux/counterSlice";
import authSlice from '@/redux/authSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    auth: authSlice,
  },
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

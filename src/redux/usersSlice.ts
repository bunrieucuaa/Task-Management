import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type {
  ICreateUserPayload,
  IUpdateUserProfilePayload,
  IUpdateUserStatusPayload,
  IUser,
  IUserListQuery,
  IUserPagination,
  IUserWithTemporaryPasswordData,
} from "@/app/entities/user.entity";
import { UserRepository } from "@/app/repositories/UserRepository";
import { setCurrentUser } from "@/redux/authSlice";

const initialFilters: IUserListQuery = {
  page: 1,
  limit: 10,
  search: "",
  role: "",
  status: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

const initialPagination: IUserPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

export interface IUsersState {
  items: IUser[];
  selectedUser: IUser | null;
  filters: IUserListQuery;
  pagination: IUserPagination;
  loading: boolean;
  submitting: boolean;
  temporaryPasswordResult: IUserWithTemporaryPasswordData | null;
}

const initialState: IUsersState = {
  items: [],
  selectedUser: null,
  filters: initialFilters,
  pagination: initialPagination,
  loading: false,
  submitting: false,
  temporaryPasswordResult: null,
};

export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (query: IUserListQuery) => {
    const response = await new UserRepository().listUsersAsync(query);
    if (response.success && response.data) {
      return {
        items: response.data.data,
        pagination: response.data.pagination,
        filters: query,
      };
    }

    return {
      items: [],
      pagination: initialPagination,
      filters: query,
    };
  },
);

export const createUser = createAsyncThunk(
  "users/createUser",
  async (payload: ICreateUserPayload) => {
    const response = await new UserRepository().createUserAsync(payload);
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  },
);

export const fetchUserById = createAsyncThunk(
  "users/fetchUserById",
  async (id: string) => {
    const response = await new UserRepository().getUserByIdAsync(id);
    if (response.success && response.data) {
      return response.data.user;
    }
    return null;
  },
);

export const updateOwnProfile = createAsyncThunk(
  "users/updateOwnProfile",
  async (
    payload: { id: string; data: IUpdateUserProfilePayload },
    thunkAPI,
  ) => {
    const response = await new UserRepository().updateProfileAsync(
      payload.id,
      payload.data,
    );

    if (response.success && response.data) {
      thunkAPI.dispatch(setCurrentUser(response.data.user));
      return response.data.user;
    }

    return null;
  },
);

export const updateUserStatus = createAsyncThunk(
  "users/updateUserStatus",
  async (payload: { id: string; data: IUpdateUserStatusPayload }) => {
    const response = await new UserRepository().updateUserStatusAsync(
      payload.id,
      payload.data,
    );
    if (response.success && response.data) {
      return response.data.user;
    }
    return null;
  },
);

export const resetUserPassword = createAsyncThunk(
  "users/resetUserPassword",
  async (id: string) => {
    const response = await new UserRepository().resetUserPasswordAsync(id);
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  },
);

export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (id: string) => {
    const response = await new UserRepository().deleteUserAsync(id);
    if (response.success) {
      return id;
    }
    return null;
  },
);

const syncUserInList = (items: IUser[], user: IUser) =>
  items.map((item) => (item.id === user.id ? user : item));

export const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearTemporaryPasswordResult(state) {
      state.temporaryPasswordResult = null;
      return state;
    },
    updateUserFilters(state, action: { payload: Partial<IUserListQuery>; type: string }) {
      state.filters = { ...state.filters, ...action.payload };
      return state;
    },
    resetUserFilters(state) {
      state.filters = initialFilters;
      return state;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchUsers.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload.items;
      state.pagination = action.payload.pagination;
      state.filters = action.payload.filters;
    });
    builder.addCase(fetchUsers.rejected, (state) => {
      state.loading = false;
    });
    builder.addCase(createUser.pending, (state) => {
      state.submitting = true;
    });
    builder.addCase(createUser.fulfilled, (state, action) => {
      state.submitting = false;
      state.temporaryPasswordResult = action.payload;
      if (action.payload?.user) {
        state.items = [action.payload.user, ...state.items];
      }
    });
    builder.addCase(createUser.rejected, (state) => {
      state.submitting = false;
    });
    builder.addCase(fetchUserById.pending, (state) => {
      state.submitting = true;
    });
    builder.addCase(fetchUserById.fulfilled, (state, action) => {
      state.submitting = false;
      state.selectedUser = action.payload;
    });
    builder.addCase(fetchUserById.rejected, (state) => {
      state.submitting = false;
    });
    builder.addCase(updateOwnProfile.pending, (state) => {
      state.submitting = true;
    });
    builder.addCase(updateOwnProfile.fulfilled, (state, action) => {
      state.submitting = false;
      if (action.payload) {
        state.selectedUser = action.payload;
        state.items = syncUserInList(state.items, action.payload);
      }
    });
    builder.addCase(updateOwnProfile.rejected, (state) => {
      state.submitting = false;
    });
    builder.addCase(updateUserStatus.pending, (state) => {
      state.submitting = true;
    });
    builder.addCase(updateUserStatus.fulfilled, (state, action) => {
      state.submitting = false;
      if (action.payload) {
        state.items = syncUserInList(state.items, action.payload);
        if (state.selectedUser?.id === action.payload.id) {
          state.selectedUser = action.payload;
        }
      }
    });
    builder.addCase(updateUserStatus.rejected, (state) => {
      state.submitting = false;
    });
    builder.addCase(resetUserPassword.pending, (state) => {
      state.submitting = true;
    });
    builder.addCase(resetUserPassword.fulfilled, (state, action) => {
      state.submitting = false;
      state.temporaryPasswordResult = action.payload;
      if (action.payload?.user) {
        state.items = syncUserInList(state.items, action.payload.user);
      }
    });
    builder.addCase(resetUserPassword.rejected, (state) => {
      state.submitting = false;
    });
    builder.addCase(deleteUser.pending, (state) => {
      state.submitting = true;
    });
    builder.addCase(deleteUser.fulfilled, (state, action) => {
      state.submitting = false;
      if (action.payload) {
        state.items = state.items.filter((item) => String(item.id) !== action.payload);
      }
    });
    builder.addCase(deleteUser.rejected, (state) => {
      state.submitting = false;
    });
  },
});

export const { clearTemporaryPasswordResult, updateUserFilters, resetUserFilters } =
  usersSlice.actions;
export { initialFilters, initialPagination };
export default usersSlice.reducer;

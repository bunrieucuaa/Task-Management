import { createAsyncThunk, createSlice, type Dispatch } from "@reduxjs/toolkit";
import { AuthRepository } from "@/app/repositories/AuthRepository";
import { ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME } from "@/app/core/constants";
import { ERole } from "@/app/shared/enums/ERole";
import { jwtDecode, type JwtPayload } from "jwt-decode";
import { decrypt, encrypt } from "@/app/shared/config/crypto-js";
import { isAuthenValidate } from "@/app/shared/config/jwt.extention";
import type { IUser } from "@/app/entities/user.entity";

export interface IAuthState {
  loading: boolean;
  token: string;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  user: IUser | null;
  initialized: boolean;
  initializing: boolean;
  userLoading: boolean;
}

const getStoredValue = (key: string) =>
  localStorage.getItem(key) || sessionStorage.getItem(key);

export const hasStoredAuthTokens = () =>
  !!(getStoredValue(ACCESS_TOKEN_NAME) || getStoredValue(REFRESH_TOKEN_NAME));

const allowedRoles = [ERole.Admin, ERole.Member];

const resolveStoredAuthState = () => {
  const token = decrypt(getStoredValue(ACCESS_TOKEN_NAME));
  const storedRefreshToken = decrypt(getStoredValue(REFRESH_TOKEN_NAME));

  let isAuthenticated = false;
  if (token) {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const currentTime = Date.now() / 1000;
      if (decoded.exp && decoded.exp > currentTime) {
        isAuthenticated = isAuthenValidate(decoded, allowedRoles);
      } else if (storedRefreshToken) {
        isAuthenticated = true;
      }
    } catch {
      isAuthenticated = !!storedRefreshToken;
    }
  } else if (storedRefreshToken) {
    isAuthenticated = true;
  }

  return {
    token: token || "",
    isAuthenticated,
  };
};

const initialState: IAuthState = {
  loading: false,
  token: "",
  isAuthenticated: false,
  mustChangePassword: false,
  user: null,
  initialized: false,
  initializing: false,
  userLoading: false,
};

export const initializeAuth = createAsyncThunk<
  Pick<IAuthState, "token" | "isAuthenticated">,
  void,
  { state: { auth: Pick<IAuthState, "initialized" | "initializing"> } }
>(
  "auth/initialize",
  async () => resolveStoredAuthState(),
  {
    condition: (_, { getState }) => {
      const { initialized, initializing } = getState().auth;
      return !initialized && !initializing;
    },
  },
);

export const getMe = createAsyncThunk<IUser | null>("auth/getMe", async () => {
  const response = await new AuthRepository().getMeAsync();
  if (response.success && response.data?.user) {
    return response.data.user;
  }
  return null;
});

export const postLogins = createAsyncThunk(
  "login/postLogin",
  async (query: object, thunkAPI) => {
    const response = await new AuthRepository().postLoginTokenAsync(query);

    const data = response.data;
    if (response.success && data) {
      const check = isAuthenValidate(
        jwtDecode<JwtPayload>(data.accessToken),
        allowedRoles,
      );

      if (check) {
        const accessToken = encrypt(data.accessToken);
        const refreshToken = encrypt(data.refreshToken);
        localStorage.setItem(ACCESS_TOKEN_NAME, accessToken);
        localStorage.setItem(REFRESH_TOKEN_NAME, refreshToken);
        thunkAPI.dispatch(updateIsAuthenticated(true));
        thunkAPI.dispatch(setCurrentUser(data.user));
        thunkAPI.dispatch(setMustChangePassword(data.mustChangePassword ?? false));
      }

      return { isValid: check, mustChangePassword: data.mustChangePassword ?? false };
    }

    return { isValid: false, mustChangePassword: false };
  },
);

export const logoutUser = createAsyncThunk("auth/logout", async (_, thunkAPI) => {
  const response = await new AuthRepository().logoutAsync();
  if (response.success) {
    localStorage.removeItem(ACCESS_TOKEN_NAME);
    localStorage.removeItem(REFRESH_TOKEN_NAME);
    thunkAPI.dispatch(clearAuth());
    return true;
  }
  return false;
});

export const changePassword = createAsyncThunk(
  "auth/changePasswordFirstTime",
  async (data: object, thunkAPI) => {
    const response = await new AuthRepository().changePasswordAsync(data);
    if (response.success) {
      localStorage.removeItem(ACCESS_TOKEN_NAME);
      localStorage.removeItem(REFRESH_TOKEN_NAME);
      thunkAPI.dispatch(clearAuth());
      return true;
    }
    return false;
  },
);

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    updateIsAuthenticated(
      state,
      action: {
        payload: boolean;
        type: string;
      },
    ) {
      state.isAuthenticated = action.payload;
      state.initialized = true;
      return state;
    },
    setMustChangePassword(
      state,
      action: {
        payload: boolean;
        type: string;
      },
    ) {
      state.mustChangePassword = action.payload;
      state.initialized = true;
      return state;
    },
    setCurrentUser(
      state,
      action: {
        payload: IUser | null;
        type: string;
      },
    ) {
      state.user = action.payload;
      return state;
    },
    finishAuthInitialization(state) {
      state.initialized = true;
      state.initializing = false;
      return state;
    },
    clearAuth(state) {
      state.loading = false;
      state.token = "";
      state.isAuthenticated = false;
      state.mustChangePassword = false;
      state.user = null;
      state.initialized = true;
      state.initializing = false;
      state.userLoading = false;
      return state;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(initializeAuth.pending, (state) => {
      state.initializing = true;
    });
    builder.addCase(initializeAuth.fulfilled, (state, action) => {
      state.token = action.payload.token;
      state.isAuthenticated = action.payload.isAuthenticated;
      state.initialized = true;
      state.initializing = false;
    });
    builder.addCase(initializeAuth.rejected, (state) => {
      state.initialized = true;
      state.initializing = false;
    });
    builder.addCase(postLogins.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(postLogins.fulfilled, (state) => {
      state.loading = false;
      state.initialized = true;
    });
    builder.addCase(postLogins.rejected, (state) => {
      state.loading = false;
    });
    builder.addCase(getMe.pending, (state) => {
      state.userLoading = true;
    });
    builder.addCase(getMe.fulfilled, (state, action) => {
      state.user = action.payload;
      state.userLoading = false;
    });
    builder.addCase(getMe.rejected, (state) => {
      state.userLoading = false;
    });
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.userLoading = false;
    });
    builder.addCase(changePassword.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(changePassword.fulfilled, (state) => {
      state.loading = false;
      state.user = null;
      state.mustChangePassword = false;
      state.userLoading = false;
    });
    builder.addCase(changePassword.rejected, (state) => {
      state.loading = false;
    });
  },
});

export const clearAuthentication = () => (dispatch: Dispatch) => {
  localStorage.removeItem(ACCESS_TOKEN_NAME);
  sessionStorage.removeItem(ACCESS_TOKEN_NAME);
  localStorage.removeItem(REFRESH_TOKEN_NAME);
  sessionStorage.removeItem(REFRESH_TOKEN_NAME);
  dispatch(clearAuth());
};

export const {
  updateIsAuthenticated,
  setMustChangePassword,
  setCurrentUser,
  finishAuthInitialization,
  clearAuth,
} = authSlice.actions;
export default authSlice.reducer;

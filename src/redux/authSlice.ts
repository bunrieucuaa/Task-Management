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
}

const token = decrypt(localStorage.getItem(ACCESS_TOKEN_NAME));
const storedRefreshToken = decrypt(
  localStorage.getItem(REFRESH_TOKEN_NAME) ||
  sessionStorage.getItem(REFRESH_TOKEN_NAME)
);

let isAuthenticated = false;
if (token) {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const currentTime = Date.now() / 1000;
    if (decoded.exp && decoded.exp > currentTime) {
      // Access token còn hạn → xác thực bình thường
      isAuthenticated = isAuthenValidate(decoded, [ERole.Admin]);
    } else if (storedRefreshToken) {
      // Access token hết hạn nhưng còn refresh token
      // → giữ isAuthenticated = true, để interceptor tự refresh khi API đầu tiên bị 401
      isAuthenticated = true;
    }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    // Token lỗi format nhưng vẫn còn refresh token → cho qua
    isAuthenticated = !!storedRefreshToken;
  }
} else if (storedRefreshToken) {
  // Không có access token nhưng còn refresh token → cho qua
  isAuthenticated = true;
}

const initialState: IAuthState = {
  loading: false,
  token: token || "",
  isAuthenticated,
  mustChangePassword: false,
  user: null,
};

export const getMe = createAsyncThunk(
  "auth/getMe",
  async () => {
    const response = await new AuthRepository().getMeAsync();
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  },
);

export const postLogins = createAsyncThunk(
  "login/postLogin",
  async (query: object, thunkAPI) => {
    const response = await new AuthRepository().postLoginTokenAsync(query);

    const data = response.data;
    if (response.success && data) {
      const check = isAuthenValidate(
        jwtDecode<JwtPayload>(response.data.accessToken),
        [ERole.Admin],
      );
      if (check) {
        const accessToken = encrypt(data.accessToken);
        const refreshToken = encrypt(data.refreshToken);
        localStorage.setItem(ACCESS_TOKEN_NAME, accessToken);
        localStorage.setItem(REFRESH_TOKEN_NAME, refreshToken);
        thunkAPI.dispatch(updateIsAuthenticated(true));
        thunkAPI.dispatch(setMustChangePassword(data.mustChangePassword ?? false));
        // Chỉ gọi /me khi user KHÔNG cần đổi mật khẩu
        // Nếu mustChangePassword=true thì /me sẽ trả 403 → gây logout không mong muốn
        if (!data.mustChangePassword) {
          thunkAPI.dispatch(getMe());
        }
      }
      return { isValid: check, mustChangePassword: data.mustChangePassword ?? false };
    }
    return { isValid: false, mustChangePassword: false };
  },
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, thunkAPI) => {
    const response = await new AuthRepository().logoutAsync();
    if (response.success) {
      localStorage.removeItem(ACCESS_TOKEN_NAME);
      localStorage.removeItem(REFRESH_TOKEN_NAME);
      thunkAPI.dispatch(updateIsAuthenticated(false));
      return true;
    }
    return false;
  }
);

export const changePassword = createAsyncThunk(
  "auth/changePasswordFirstTime",
  async (data: object, thunkAPI) => {
    const response = await new AuthRepository().changePasswordAsync(data);
    if (response.success) {
      localStorage.removeItem(ACCESS_TOKEN_NAME);
      localStorage.removeItem(REFRESH_TOKEN_NAME);
      thunkAPI.dispatch(updateIsAuthenticated(false));
      return true;
    }
    return false;
  }
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
      return state;
    },
    clearAuth(state) {
      state.loading = false;
      state.token = "";
      state.isAuthenticated = false;
      state.mustChangePassword = false;
      return state;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(postLogins.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(postLogins.fulfilled, (state) => {
      state.loading = false;
    });
    builder.addCase(postLogins.rejected, (state) => {
      state.loading = false;
    });
    builder.addCase(getMe.fulfilled, (state, action) => {
      state.user = action.payload;
    });
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
    });
    builder.addCase(changePassword.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(changePassword.fulfilled, (state) => {
      state.loading = false;
      state.user = null;
      state.mustChangePassword = false;
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

export const { updateIsAuthenticated, setMustChangePassword, clearAuth } = authSlice.actions;
export default authSlice.reducer;

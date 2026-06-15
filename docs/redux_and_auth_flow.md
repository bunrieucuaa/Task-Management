# Redux & Luồng Auth trong dự án Task Management

## Phần A: Redux là gì? — Giải thích bằng ví dụ đời thường

### Vấn đề Redux giải quyết

Tưởng tượng bạn có **10 phòng trong 1 ngôi nhà** (10 component). Nhiều phòng cần biết **"ai đang đăng nhập?"** (user info). Nếu không có Redux:

```
                    App
                   / | \
              Login  Home  Users
                     |      |
                   Navbar  UserList
                     |
                   Avatar
                     
Nếu Avatar cần biết "user hiện tại" → phải truyền props
  App → Home → Navbar → Avatar  (truyền qua 3 tầng!)
  
Nếu UserList cũng cần → lại truyền App → Users → UserList
→ RẤT RỐI, gọi là "prop drilling"
```

**Redux giải quyết bằng cách tạo 1 "kho chung":**

```
   ┌──────────────────────────┐
   │     REDUX STORE          │  ← "Kho chung" cho toàn app
   │  ┌────────────────────┐  │
   │  │ auth: { user, ... }│  │  ← State auth
   │  │ users: { list, ...}│  │  ← State users
   │  └────────────────────┘  │
   └───────┬──────┬───────────┘
           │      │
     ┌─────┘      └─────┐
     ▼                   ▼
   Avatar              UserList
   (đọc user           (đọc users
    trực tiếp)          trực tiếp)
    
→ Bất kỳ component nào cũng đọc được, KHÔNG cần truyền props!
```

---

### 5 khái niệm cốt lõi của Redux

| Khái niệm | Ví dụ đời thường | Trong dự án |
|-----------|------------------|-------------|
| **Store** | Kho hàng trung tâm | [store.ts](file:///e:/react-task-managerment/src/redux/store.ts) |
| **Slice** | 1 kệ hàng trong kho (quản lý 1 loại dữ liệu) | [authSlice.ts](file:///e:/react-task-managerment/src/redux/authSlice.ts), [usersSlice.ts](file:///e:/react-task-managerment/src/redux/usersSlice.ts) |
| **Action** | Lệnh yêu cầu thay đổi: "Thêm hàng vào kệ" | `updateIsAuthenticated(true)`, `clearAuth()` |
| **Dispatch** | Nhân viên thực hiện lệnh | `dispatch(postLogins(data))` |
| **Selector** | Máy quét mã - đọc thông tin từ kho | `useAppSelector(state => state.auth)` |

---

### Áp dụng vào dự án — Store

```
// store.ts — "Nhà kho" chứa 3 kệ hàng
store = {
  counter: counterReducer,   ← Kệ 1: Demo counter (không quan trọng)
  auth:    authSlice,         ← Kệ 2: Thông tin đăng nhập ⭐
  users:   usersSlice,        ← Kệ 3: Danh sách users ⭐
}
```

File: [store.ts](file:///e:/react-task-managerment/src/redux/store.ts)

### Áp dụng vào dự án — authSlice (kệ hàng Auth)

```
// authSlice "chứa" những gì?
auth = {
  loading: false,              // Đang gọi API không?
  token: "",                   // Access token hiện tại
  isAuthenticated: false,      // Đã đăng nhập chưa?
  mustChangePassword: false,   // Có phải đổi mật khẩu không?
  user: null,                  // Thông tin user { id, name, email, role... }
  initialized: false,          // App đã kiểm tra auth xong chưa?
  initializing: false,         // Đang kiểm tra auth?
  userLoading: false,          // Đang load thông tin user?
}
```

File: [authSlice.ts](file:///e:/react-task-managerment/src/redux/authSlice.ts)

### Cách đọc và ghi dữ liệu Redux

```tsx
// ĐỌC dữ liệu (Selector) — bất kỳ component nào cũng dùng được
const { isAuthenticated, user } = useAppSelector(state => state.auth);

// GHI dữ liệu (Dispatch + Action)
const dispatch = useAppDispatch();
dispatch(updateIsAuthenticated(true));   // Action đồng bộ
dispatch(postLogins(data));              // Action bất đồng bộ (gọi API)
```

> [!NOTE]
> `useAppDispatch` và `useAppSelector` là 2 custom hook trong [hooks.ts](file:///e:/react-task-managerment/src/app/hooks.ts). Chúng chỉ là phiên bản "typed" (có kiểu TypeScript) của `useDispatch` và `useSelector` gốc của Redux.

### Reducer vs AsyncThunk — 2 loại Action

**Reducer (đồng bộ)** — thay đổi state NGAY LẬP TỨC:
```ts
// Định nghĩa trong authSlice.ts
reducers: {
  updateIsAuthenticated(state, action) {
    state.isAuthenticated = action.payload;  // payload = giá trị truyền vào
  },
  clearAuth(state) {
    state.isAuthenticated = false;
    state.user = null;
    // ... reset hết
  },
}

// Sử dụng:
dispatch(updateIsAuthenticated(true));
dispatch(clearAuth());
```

**AsyncThunk (bất đồng bộ)** — gọi API rồi mới thay đổi state:
```ts
// postLogins: gọi API login → nhận token → lưu localStorage → cập nhật state
export const postLogins = createAsyncThunk("login/postLogin", async (query, thunkAPI) => {
  const response = await new AuthRepository().postLoginTokenAsync(query);
  // ... xử lý response
  thunkAPI.dispatch(updateIsAuthenticated(true));
});

// AsyncThunk có 3 trạng thái tự động:
// pending   → loading = true   (đang chờ API)
// fulfilled → loading = false  (API thành công)
// rejected  → loading = false  (API thất bại)
```

---

## Phần B: Luồng Auth End-to-End

### Giai đoạn 1: Mở trình duyệt — Khởi tạo Auth

Khi user mở app lần đầu hoặc F5 refresh, luồng khởi tạo chạy:

```
┌── main.tsx ────────────────────────────────────────────────────┐
│                                                                │
│  1. setupAxiosInterceptors()                                   │
│     → Cài interceptor cho axios (tự gắn token, auto-refresh)  │
│                                                                │
│  2. <Provider store={store}>                                   │
│     → Bọc toàn app trong Redux Store                           │
│                                                                │
│  3. <AuthBootstrap />                                          │
│     → Component "vô hình" kiểm tra auth khi app khởi động     │
│                                                                │
│  4. <RouterProvider />                                         │
│     → Hệ thống routing (điều hướng URL)                       │
│                                                                │
│  5. <Toaster />                                                │
│     → Hiển thị thông báo toast                                 │
└────────────────────────────────────────────────────────────────┘
```

**AuthBootstrap** (dòng 39-57 trong [main.tsx](file:///e:/react-task-managerment/src/main.tsx#L39-L57)):

```
AuthBootstrap mount
    │
    ▼
Kiểm tra: initialized? initializing?
    │
    ├── Nếu đã init → KHÔNG LÀM GÌ
    │
    └── Nếu chưa init:
         │
         ├── hasStoredAuthTokens() = false? (không có token trong localStorage)
         │    → dispatch(finishAuthInitialization())
         │    → state: { initialized: true, isAuthenticated: false }
         │    → User sẽ bị redirect về /login
         │
         └── hasStoredAuthTokens() = true? (CÓ token cũ trong localStorage)
              → dispatch(initializeAuth())
              → Giải mã token cũ, kiểm tra hạn
              → state: { initialized: true, isAuthenticated: true/false }
```

### Giai đoạn 2: Routing & Guard — Ai được vào đâu?

Hệ thống route chia làm **2 nhóm**:

```
routes/
├── __root.tsx              ← Root layout (Outlet)
├── (auth)/                 ← 🟢 Nhóm "khách" (chưa đăng nhập)
│   ├── login.tsx           ← /login         → GuestGuard
│   ├── register.tsx        ← /register      → (không guard)
│   ├── change-password.tsx ← /change-password → MustChangePasswordGuard
│   └── reset-password.tsx  ← /reset-password
│
└── (app)/                  ← 🔒 Nhóm "nội bộ" (phải đăng nhập)
    ├── route.tsx            ← Layout chung → AuthGuard ⭐
    ├── index.tsx            ← /            (Home)
    ├── users.tsx            ← /users       (Quản lý users)
    ├── tasks.tsx            ← /tasks       (Quản lý tasks)
    └── account.tsx          ← /account     (Tài khoản cá nhân)
```

**3 Guard hoạt động như thế nào:**

````carousel
### 🔒 AuthGuard — "Bảo vệ cổng chính"
File: [AuthGuard.tsx](file:///e:/react-task-managerment/src/layouts/AuthGuard.tsx)

Dùng ở: [route.tsx](file:///e:/react-task-managerment/src/routes/(app)/route.tsx) — bọc TOÀN BỘ trang (app)

```
User truy cập /users, /tasks, /account...
    │
    ▼
AuthGuard kiểm tra Redux state:
    │
    ├── isAuthenticated = true?
    │    ├── user === null? → dispatch(getMe()) để lấy user info
    │    └── → Render <Outlet /> (hiện nội dung trang) ✅
    │
    └── isAuthenticated = false?
         → <Navigate to="/login" /> (đá về login) ❌
```
<!-- slide -->
### 🟢 GuestGuard — "Chỉ cho khách vào"
File: [GuestGuard.tsx](file:///e:/react-task-managerment/src/layouts/GuestGuard.tsx)

Dùng ở: [login.tsx](file:///e:/react-task-managerment/src/routes/(auth)/login.tsx)

```
User truy cập /login
    │
    ▼
GuestGuard kiểm tra:
    │
    ├── isAuthenticated = true?
    │    ├── mustChangePassword? → Navigate to "/change-password"
    │    └── → Navigate to "/" (đã login rồi, vào home) ❌
    │
    └── isAuthenticated = false?
         → Hiện LoginPage ✅ (đúng rồi, chưa login thì vào login)
```
<!-- slide -->
### 🔑 MustChangePasswordGuard — "Buộc đổi mật khẩu"
File: [MustChangePasswordGuard.tsx](file:///e:/react-task-managerment/src/layouts/MustChangePasswordGuard.tsx)

Dùng ở: [change-password.tsx](file:///e:/react-task-managerment/src/routes/(auth)/change-password.tsx)

```
User truy cập /change-password
    │
    ▼
MustChangePasswordGuard kiểm tra:
    │
    ├── isAuthenticated = false? → Navigate to "/login"
    │
    ├── mustChangePassword = false? → Navigate to "/"
    │   (không cần đổi password thì về home)
    │
    └── isAuthenticated = true && mustChangePassword = true?
         → Hiện ChangePasswordPage ✅
```
````

### Giai đoạn 3: Login — Luồng đăng nhập chi tiết

Đây là luồng **end-to-end** từ khi user nhấn "Đăng nhập":

```
 ① User nhập email + password, nhấn "Đăng nhập"
    │
    │  File: LoginForm.tsx (dòng 44)
    ▼
 ② form.handleSubmit(onSubmit) → Zod validate input
    │
    │  formSchema kiểm tra: email hợp lệ? password không trống?
    ▼
 ③ dispatch(postLogins({ email, password }))
    │
    │  File: authSlice.ts (dòng 90) — AsyncThunk
    │  Redux: state.auth.loading = true (pending)
    ▼
 ④ new AuthRepository().postLoginTokenAsync(query)
    │
    │  File: AuthRepository.ts (dòng 26)
    │  → gọi POST /auth/login qua axios
    ▼
 ⑤ axios-interceptor.ts: onRequestSuccess
    │  (lần này chưa có token nên không gắn header)
    │
    │  HTTP Request: POST http://localhost:3000/api/v1/auth/login
    │  Body: { email: "...", password: "..." }
    ▼
═══════════════════════ BACKEND ═══════════════════════

 ⑥ auth.route.ts → auth.controller.ts: loginHandler
    │
    │  Validate body bằng Zod (LoginRequestSchema)
    ▼
 ⑦ auth.service.ts: login()
    │  1. getUserByEmail(email) → tìm user trong DB
    │  2. verifyPassword() → so sánh password với hash (bcrypt)
    │  3. signAccessToken()  → tạo JWT access  (1 giờ)
    │  4. signRefreshToken() → tạo JWT refresh (7 ngày)
    ▼
 ⑧ Response 200:
    {
      success: true,
      data: {
        user: { id, name, email, role, avatarUrl, status },
        accessToken: "eyJhbGciOi...",
        refreshToken: "eyJhbGciOi...",
        mustChangePassword: false
      }
    }

═══════════════════════ FRONTEND ═══════════════════════

 ⑨ postLogins (authSlice.ts dòng 96-116) nhận response:
    │
    │  1. jwtDecode(accessToken) → đọc payload (role, exp...)
    │  2. isAuthenValidate() → kiểm tra role có hợp lệ?
    │  3. encrypt(accessToken) → MÃ HÓA AES
    │  4. localStorage.setItem("access_token", encrypted)
    │  5. localStorage.setItem("refresh_token", encrypted)
    │  6. dispatch(updateIsAuthenticated(true))
    │  7. dispatch(setCurrentUser(data.user))
    │  8. dispatch(setMustChangePassword(false))
    ▼
 ⑩ LoginForm.tsx onSubmit callback (dòng 47-60):
    │
    ├── result.mustChangePassword = true?
    │    → navigate("/change-password")
    │    → toast.info("Bạn cần đổi mật khẩu!")
    │
    └── result.mustChangePassword = false?
         → navigate("/")     ← chuyển về Home
         → toast.success("Đăng nhập thành công!")
    
 ⑪ Router chuyển đến "/" → AuthGuard kiểm tra:
    │  isAuthenticated = true ✅
    │  user === null → dispatch(getMe())
    │  → Gọi GET /auth/me để lấy thông tin user mới nhất
    │  → state.auth.user = { id, name, email, role... }
    ▼
 ⑫ Trang Home render thành công! 🎉
```

### Giai đoạn 4: Gọi API sau khi đã login

Mỗi khi component gọi API (ví dụ lấy danh sách users):

```
Component gọi: dispatch(fetchUsers())
    │
    ▼
axios.get("/users")
    │
    ▼  
┌── axios-interceptor.ts: onRequestSuccess (dòng 27-37) ──────┐
│  1. localStorage.getItem("access_token") → encrypted token   │
│  2. decrypt(encrypted) → token gốc                           │
│  3. config.headers.Authorization = "Bearer <token>"          │
│  → MỌI request đều được TỰ ĐỘNG gắn token!                  │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌── Backend: auth.middleware.ts: authenticate ─────────────────┐
│  1. Đọc header: Authorization: "Bearer eyJhbGci..."         │
│  2. verifyToken(token) → kiểm tra chữ ký + hạn              │
│  3. Kiểm tra type === "Access"                               │
│  4. getUserById(payload.sub) → lấy user từ DB               │
│  5. Kiểm tra user.status !== INACTIVE                        │
│  6. Kiểm tra tokenVersion khớp                               │
│  7. Kiểm tra mustChangePassword                              │
│  8. req.user = { id, email, role... }                        │
│  9. next() → chuyển tiếp cho controller                      │
└──────────────────────────────────────────────────────────────┘
```

### Giai đoạn 5: Auto-Refresh khi Access Token hết hạn

```
Component gọi API → Backend trả 401 (token hết hạn)
    │
    ▼
┌── axios-interceptor.ts: onResponseError (dòng 75-108) ──────┐
│                                                               │
│  status === 401 && _retry === false?                         │
│  (lần đầu bị 401, chưa thử refresh)                         │
│    │                                                          │
│    │  1. config._retry = true  (đánh dấu "đã thử")          │
│    │                                                          │
│    │  2. callRefreshToken():                                  │
│    │     → Lấy refresh token từ localStorage                 │
│    │     → decrypt() giải mã                                  │
│    │     → POST /auth/refresh { refreshToken }               │
│    │       (dùng axiosPublic — KHÔNG có interceptor,         │
│    │        để tránh vòng lặp vô tận!)                       │
│    │     → Backend verify refresh token                       │
│    │     → Trả về access token MỚI                           │
│    │     → encrypt() + lưu localStorage                      │
│    │                                                          │
│    │  3. Gắn token mới vào request cũ                        │
│    │  4. axios.request(config) → GỌI LẠI request ban đầu    │
│    │     → Lần này token mới, API thành công! ✅              │
│    │                                                          │
│  status === 401 && _retry === true?                          │
│  (đã thử refresh rồi mà vẫn 401)                            │
│    → Refresh token cũng hết hạn/bị revoke                    │
│    → onUnauthenticated() → clearAuthentication()             │
│    → Xóa token + redirect về /login                          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **Tại sao dùng `axiosPublic`?** (dòng 17-20 trong [axios-interceptor.ts](file:///e:/react-task-managerment/src/app/shared/config/axios-interceptor.ts#L17-L20))
> 
> Nếu gọi `/auth/refresh` qua `axios` chính (có interceptor), và refresh cũng thất bại (401), interceptor sẽ lại gọi refresh → lại 401 → lại refresh... → **VÒNG LẶP VÔ TẬN!** Dùng `axiosPublic` (không có interceptor) để tránh điều này.

### Giai đoạn 6: Logout

```
User nhấn "Đăng xuất"
    │
    ▼
dispatch(logoutUser())                    ← authSlice.ts dòng 119
    │
    ├── POST /auth/logout                  ← gọi Backend
    │    → Backend: incrementTokenVersion() ← tăng tokenVersion trong DB
    │    → Mọi token cũ (access + refresh) đều bị từ chối!
    │
    ├── localStorage.removeItem("access_token")
    ├── localStorage.removeItem("refresh_token")
    │
    └── dispatch(clearAuth())              ← Reset toàn bộ state
         → isAuthenticated = false
         → user = null
         → Router detect → AuthGuard redirect → /login
```

---

## Tổng hợp tất cả file liên quan đến Auth

### Frontend
| File | Vai trò |
|------|---------|
| [main.tsx](file:///e:/react-task-managerment/src/main.tsx) | Khởi tạo app, setup interceptor, AuthBootstrap |
| [authSlice.ts](file:///e:/react-task-managerment/src/redux/authSlice.ts) | Redux state + actions cho auth |
| [store.ts](file:///e:/react-task-managerment/src/redux/store.ts) | Redux store config |
| [hooks.ts](file:///e:/react-task-managerment/src/app/hooks.ts) | useAppDispatch, useAppSelector |
| [axios-interceptor.ts](file:///e:/react-task-managerment/src/app/shared/config/axios-interceptor.ts) | Tự gắn token + auto-refresh |
| [crypto-js.ts](file:///e:/react-task-managerment/src/app/shared/config/crypto-js.ts) | Mã hóa/giải mã token (AES) |
| [jwt.extention.ts](file:///e:/react-task-managerment/src/app/shared/config/jwt.extention.ts) | Kiểm tra role trong JWT |
| [constants.ts](file:///e:/react-task-managerment/src/app/core/constants.ts) | Tên key localStorage, base URL |
| [AuthRepository.ts](file:///e:/react-task-managerment/src/app/repositories/AuthRepository.ts) | Gọi API auth (login, me, refresh, logout) |
| [AuthGuard.tsx](file:///e:/react-task-managerment/src/layouts/AuthGuard.tsx) | Guard cho trang cần đăng nhập |
| [GuestGuard.tsx](file:///e:/react-task-managerment/src/layouts/GuestGuard.tsx) | Guard cho trang login (chặn nếu đã login) |
| [MustChangePasswordGuard.tsx](file:///e:/react-task-managerment/src/layouts/MustChangePasswordGuard.tsx) | Guard cho trang đổi mật khẩu |
| [LoginForm.tsx](file:///e:/react-task-managerment/src/components/pages/auth/LoginForm.tsx) | Form đăng nhập (UI + logic submit) |
| [(app)/route.tsx](file:///e:/react-task-managerment/src/routes/(app)/route.tsx) | Layout trang app, sử dụng AuthGuard |
| [(auth)/login.tsx](file:///e:/react-task-managerment/src/routes/(auth)/login.tsx) | Route /login, sử dụng GuestGuard |

### Backend
| File | Vai trò |
|------|---------|
| [auth.route.ts](file:///e:/task-be/src/routes/auth.route.ts) | Định nghĩa endpoint: /login, /me, /refresh, /logout |
| [auth.controller.ts](file:///e:/task-be/src/controllers/auth.controller.ts) | Nhận request, validate, gọi service |
| [auth.service.ts](file:///e:/task-be/src/services/auth.service.ts) | Logic: login, refresh, logout, changePassword |
| [auth.middleware.ts](file:///e:/task-be/src/middlewares/auth.middleware.ts) | Verify JWT + kiểm tra quyền |
| [jwt.util.ts](file:///e:/task-be/src/utils/jwt.util.ts) | Tạo và verify JWT token |

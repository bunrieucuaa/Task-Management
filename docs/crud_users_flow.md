# Luồng CRUD Users — Quản lý người dùng

> Tài liệu giải thích chi tiết luồng dữ liệu **Create / Read / Update / Delete** cho User,
> từ Frontend UI → Redux → Repository → HTTP → Backend → Database và ngược lại.

---

## Mục lục

1. [Kiến trúc tổng quan dữ liệu Users](#1-kiến-trúc-tổng-quan-dữ-liệu-users)
2. [Data Layer Pattern — Cách FE gọi API](#2-data-layer-pattern--cách-fe-gọi-api)
3. [READ — Lấy danh sách Users](#3-read--lấy-danh-sách-users)
4. [CREATE — Tạo User mới](#4-create--tạo-user-mới)
5. [UPDATE — Cập nhật thông tin & trạng thái User](#5-update--cập-nhật-thông-tin--trạng-thái-user)
6. [DELETE — Xóa User (Soft Delete)](#6-delete--xóa-user-soft-delete)
7. [Bonus: Reset Password & Update Own Profile](#7-bonus-reset-password--update-own-profile)
8. [Tổng hợp API Endpoints](#8-tổng-hợp-api-endpoints)
9. [Tổng hợp file liên quan](#9-tổng-hợp-file-liên-quan)

---

## 1. Kiến trúc tổng quan dữ liệu Users

### Luồng dữ liệu đi qua bao nhiêu tầng?

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                    │
│                                                                     │
│  ① UI Component          ② Redux Slice         ③ Repository        │
│  (UsersPage.tsx)    →    (usersSlice.ts)   →   (UserRepository.ts) │
│  [user nhìn thấy]        [quản lý state]       [gọi API]           │
│                                                                     │
│                    ③.1 BaseApiService → ③.2 BaseApiDataSource      │
│                    [wrapper chung]       [axios.get/post/...]       │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │  HTTP Request (có JWT trong header)
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          BACKEND                                    │
│                                                                     │
│  ④ Route               ⑤ Middleware         ⑥ Controller           │
│  (user.route.ts)  →   (authenticate   →   (user.controller.ts)    │
│  [match URL]           + authorize)         [validate + gọi svc]   │
│                        [kiểm tra JWT                                │
│                         + quyền ADMIN]                              │
│                                                                     │
│  ⑦ Service              ⑧ Prisma ORM        ⑨ PostgreSQL          │
│  (user.service.ts)  →  (prisma.user.xxx)  →  [Database]           │
│  [logic nghiệp vụ]     [query builder]       [lưu trữ thực tế]    │
└─────────────────────────────────────────────────────────────────────┘
```

### Ví dụ dễ hiểu: "Lấy danh sách users" đi qua từng tầng

```
① UsersPage: "Tôi cần danh sách users!"
    ↓ dispatch(fetchUsers(query))
② usersSlice: "OK, tôi gọi Repository"
    ↓ new UserRepository().listUsersAsync(query)
③ UserRepository → BaseApiService → BaseApiDataSource
    ↓ axios.get("/users", { params: query })
  ━━━ axios-interceptor tự gắn JWT token vào header ━━━
    ↓ HTTP GET /api/v1/users?page=1&limit=10
④ user.route.ts: "URL /users → authenticate → authorize(ADMIN) → listUsersHandler"
⑤ auth.middleware: "Token hợp lệ? User là ADMIN? → OK, tiếp"
⑥ user.controller: "Validate query params bằng Zod → gọi service"
⑦ user.service: "Build where clause, đếm total, query paginated"
⑧ prisma.user.findMany({ where, select, orderBy, skip, take })
⑨ PostgreSQL: trả về rows
    ↑ ngược lại qua từng tầng
    ↑ → Response JSON: { success: true, data: { data: [...], pagination: {...} } }
    ↑ → usersSlice: state.items = [...], state.pagination = {...}
    ↑ → UsersPage: render bảng users
```

---

## 2. Data Layer Pattern — Cách FE gọi API

Dự án dùng pattern **Repository → BaseApiService → BaseApiDataSource → axios**:

```
┌───────────────────────────────────────────────────────────┐
│ UserRepository (app/repositories/UserRepository.ts)       │
│  - Biết URL cụ thể: /api/v1/users                        │
│  - Biết kiểu dữ liệu trả về: IUser, IUserListData...    │
│  - Mỗi method = 1 API endpoint                           │
├───────────────────────────────────────────────────────────┤
│ BaseApiService (app/repositories/BaseApiService.ts)       │
│  - Class abstract chung cho mọi Repository                │
│  - Cung cấp method: listWithCountAsync, getOtherTypeAsync,│
│    createOtherTypeAsync, patchOtherTypeAsync,             │
│    removeOtherTypeAsync...                                │
├───────────────────────────────────────────────────────────┤
│ BaseApiDataSource (app/repositories/BaseApiDataSource.ts) │
│  - Wrapper mỏng quanh axios                               │
│  - Xử lý lỗi chung: processError() → toast.error()       │
│  - Trích res.data từ AxiosResponse                        │
├───────────────────────────────────────────────────────────┤
│ axios (thư viện HTTP client)                              │
│  - axios-interceptor tự gắn JWT + auto-refresh            │
└───────────────────────────────────────────────────────────┘
```

**Tại sao phân tầng như vậy?**
- **Tách biệt**: Component KHÔNG gọi axios trực tiếp → dễ thay đổi thư viện HTTP sau này
- **Tái sử dụng**: BaseApiService cung cấp sẵn CRUD methods → Repository chỉ cần kế thừa
- **Type-safe**: Mỗi method đều có generic type `<T>` → TypeScript kiểm tra kiểu dữ liệu

### Ánh xạ cụ thể trong UserRepository

| Method trong UserRepository | Kế thừa từ BaseApiService | HTTP | URL |
|---|---|---|---|
| `listUsersAsync(query)` | `listWithCountAsync<IUserListData>` | GET | `/users?page=1&limit=10&...` |
| `createUserAsync(value)` | `createOtherTypeAsync<IUserWithTempPass>` | POST | `/users` |
| `getUserByIdAsync(id)` | `getOtherTypeAsync<IUserResponseData>` | GET | `/users/:id` |
| `updateProfileAsync(id, value)` | `patchOtherTypeAsync<IUserResponseData>` | PATCH | `/users/:id` |
| `updateUserStatusAsync(id, value)` | `patchOtherTypeAsync<IUserResponseData>` | PATCH | `/users/:id/status` |
| `resetUserPasswordAsync(id)` | `createOtherTypeAsync<IUserWithTempPass>` | POST | `/users/:id/reset-password` |
| `deleteUserAsync(id)` | `removeOtherTypeAsync<null>` | DELETE | `/users/:id` |

File: [UserRepository.ts](../src/app/repositories/UserRepository.ts)

---

## 3. READ — Lấy danh sách Users

### 3.1 Frontend: Khi nào gọi?

```tsx
// UsersPage.tsx (dòng 53-57)
useEffect(() => {
  if (user?.role === ERole.Admin) {      // Chỉ ADMIN mới được gọi
    void dispatch(fetchUsers(query));    // Gọi khi query thay đổi
  }
}, [dispatch, query, user?.role]);
```

**`query` thay đổi khi nào?**
- User nhấn "Tìm kiếm" → `setQuery({ ...draft, page: 1 })`
- User nhấn "Prev/Next" → `setQuery(prev => ({ ...prev, page: prev.page ± 1 }))`
- User nhấn "Reset" → `setQuery(initialFilters)`
- Sau khi tạo/xóa/cập nhật user → `reloadCurrentPage()` (trick: tạo object mới cùng giá trị → trigger re-render)

### 3.2 Redux Slice: fetchUsers

```
dispatch(fetchUsers(query))
    │
    ▼
┌── usersSlice.ts ──────────────────────────────────────────────┐
│                                                                │
│  fetchUsers = createAsyncThunk("users/fetchUsers",             │
│    async (query: IUserListQuery) => {                          │
│      const response = await                                    │
│        new UserRepository().listUsersAsync(query);             │
│                                                                │
│      return {                                                  │
│        items: response.data.data,          // IUser[]          │
│        pagination: response.data.pagination, // { page, ... } │
│        filters: query,                                         │
│      };                                                        │
│    }                                                           │
│  );                                                            │
│                                                                │
│  extraReducers:                                                │
│    pending  → state.loading = true                             │
│    fulfilled → state.loading = false                           │
│                state.items = action.payload.items               │
│                state.pagination = action.payload.pagination     │
│                state.filters = action.payload.filters           │
│    rejected → state.loading = false                            │
└────────────────────────────────────────────────────────────────┘
```

### 3.3 Backend: Xử lý request

```
GET /api/v1/users?page=1&limit=10&search=john&role=ADMIN&sortBy=createdAt&sortOrder=desc

    │
    ▼
┌── user.route.ts ──────────────────────────────────────────────┐
│  router.use(authenticate);         // Mọi route đều cần JWT  │
│  router.get("/", authorize(UserRole.ADMIN), listUsersHandler) │
│                   ↑ chỉ ADMIN                                 │
└───────────────────┬───────────────────────────────────────────┘
                    ▼
┌── user.controller.ts: listUsersHandler ───────────────────────┐
│  1. ListUsersQuerySchema.safeParse(req.query)                 │
│     → Validate + transform query params bằng Zod             │
│     → page: string "1" → number 1 (z.coerce.number())        │
│     → empty string "" → undefined (emptyToUndefined)          │
│                                                                │
│  2. getAllUsers(validation.data)                               │
│                                                                │
│  3. createSuccessResponse(result) → res.json(...)             │
└───────────────────┬───────────────────────────────────────────┘
                    ▼
┌── user.service.ts: getAllUsers ────────────────────────────────┐
│                                                                │
│  1. Build WHERE clause:                                        │
│     if (search) → where.OR = [                                │
│       { name: { contains: "john", mode: "insensitive" } },   │
│       { email: { contains: "john", mode: "insensitive" } },  │
│     ]                                                          │
│     if (role)   → where.role = "ADMIN"                        │
│     if (status) → where.status = "ACTIVE"                     │
│                                                                │
│  2. Đếm tổng: prisma.user.count({ where })                   │
│                                                                │
│  3. Query phân trang:                                          │
│     prisma.user.findMany({                                    │
│       where,                                                   │
│       select: selectSafeUser,    // KHÔNG lấy password!       │
│       orderBy: { createdAt: "desc" },                         │
│       skip: (1 - 1) * 10,       // = 0                       │
│       take: 10,                   // lấy 10 records           │
│     })                                                         │
│                                                                │
│  4. Return: { data: users, pagination: { page, limit, total, │
│               totalPages } }                                   │
└────────────────────────────────────────────────────────────────┘
```

### 3.4 Response JSON trả về

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "name": "Admin",
        "email": "admin@example.com",
        "role": "ADMIN",
        "status": "ACTIVE",
        "avatarUrl": null,
        "mustChangePassword": false,
        "createdAt": "2026-06-01T00:00:00.000Z",
        "updatedAt": "2026-06-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

### 3.5 Quay lại Frontend: Render

```
Response JSON
    │
    ▼
usersSlice fulfilled:
  state.items = [{ id: 1, name: "Admin", ... }, ...]
  state.pagination = { page: 1, total: 25, totalPages: 3 }
    │
    ▼
UsersPage re-render:
  - items.map(item => <TableRow>) → hiển thị bảng
  - pagination → hiển thị "Trang 1 / 3 · Tổng 25 user"
  - Prev/Next buttons enable/disable dựa trên page hiện tại
```

---

## 4. CREATE — Tạo User mới

### Luồng end-to-end

```
 ① Admin nhấn "Tạo user" → mở UserCreateDialog
    │
    │  Nhập: name, email, role (optional, default MEMBER)
    │  Nhấn "Submit"
    ▼
 ② UsersPage.handleCreateUser(payload):
    │  dispatch(createUser(payload)).unwrap()
    ▼
 ③ usersSlice: createUser AsyncThunk
    │  new UserRepository().createUserAsync(payload)
    │  → POST /api/v1/users  body: { name, email, role }
    ▼
 ④ Backend: user.route.ts
    │  authenticate → authorize(ADMIN) → createUserHandler
    ▼
 ⑤ user.controller.ts: createUserHandler
    │  CreateUserSchema.safeParse(req.body) → validate bằng Zod
    │  → createUser(validation.data)
    ▼
 ⑥ user.service.ts: createUser
    │  1. Kiểm tra email đã tồn tại? → throw Error nếu trùng
    │  2. generateRandomPassword() → tạo mật khẩu TẠM THỜI
    │  3. generateSalt() + hashPassword() → hash password
    │  4. prisma.user.create({
    │       data: {
    │         name, email, role,
    │         passwordHash, passwordSalt,
    │         mustChangePassword: true,  ← BUỘC đổi pass lần đầu
    │         status: "ACTIVE",
    │         tokenVersion: 0,
    │       }
    │     })
    │  5. Return: { user: toUserResponse(user), temporaryPassword }
    ▼
 ⑦ Response 201:
    {
      "success": true,
      "data": {
        "user": { id: 5, name: "...", ... },
        "temporaryPassword": "xK9#mP2$"    ← mật khẩu tạm
      }
    }
    ▼
 ⑧ Quay lại Frontend:
    │  usersSlice fulfilled:
    │    state.temporaryPasswordResult = { user, temporaryPassword }
    │    state.items = [newUser, ...oldItems]  ← thêm vào ĐẦU danh sách
    │
    │  UsersPage:
    │    toast.success("Tạo user thành công!")
    │    Đóng CreateDialog
    │    Mở TemporaryPasswordDialog → hiển thị mật khẩu tạm cho Admin copy
    ▼
 ⑨ Admin gửi mật khẩu tạm cho user mới qua email/chat
    → User mới login bằng mật khẩu tạm
    → mustChangePassword = true → redirect /change-password
    → Đổi mật khẩu → dùng bình thường
```

> **⚠️ Lưu ý quan trọng:**
> - Admin KHÔNG đặt mật khẩu cho user → hệ thống **tự sinh mật khẩu ngẫu nhiên**
> - User mới **BẮT BUỘC đổi mật khẩu** lần đầu đăng nhập (`mustChangePassword: true`)
> - Mật khẩu tạm chỉ hiển thị **MỘT LẦN** trong `TemporaryPasswordDialog`

---

## 5. UPDATE — Cập nhật thông tin & trạng thái User

### 5.1 Update Status (Admin thay đổi trạng thái user)

Có 3 trạng thái: `ACTIVE` | `INACTIVE` | `BLOCKED`

```
 Admin chọn menu "Set BLOCKED" cho user #3
    │
    ▼
 UsersPage.handleUpdateStatus(3, "BLOCKED")
    │  dispatch(updateUserStatus({ id: "3", data: { status: "BLOCKED" } }))
    ▼
 usersSlice: updateUserStatus AsyncThunk
    │  new UserRepository().updateUserStatusAsync("3", { status: "BLOCKED" })
    │  → PATCH /api/v1/users/3/status  body: { status: "BLOCKED" }
    ▼
 Backend: authorize(ADMIN) → updateUserStatusHandler
    │
    │  Kiểm tra: Admin đang block chính mình? → 403 Forbidden
    │  Validate body: UpdateUserStatusSchema
    │  → updateUserStatus("3", "BLOCKED")
    ▼
 user.service.ts: updateUserStatus
    │  1. Tìm user #3 → tồn tại?
    │  2. status === BLOCKED? → tokenVersion + 1 (REVOKE mọi token!)
    │     → User #3 bị đăng xuất ngay lập tức
    │  3. prisma.user.update({ where: { id: 3 }, data: { status, tokenVersion++ } })
    ▼
 Response: { success: true, data: { user: { ...updated } } }
    ▼
 Frontend usersSlice fulfilled:
    │  syncUserInList(): thay thế user #3 trong state.items
    │  → Bảng re-render → status cột User #3 hiện "BLOCKED"
```

> **💡 Điểm hay:** Khi BLOCK user, hệ thống tăng `tokenVersion` → mọi JWT token cũ của user đó bị vô hiệu hóa ngay lập tức, ngay cả khi token chưa hết hạn!

### 5.2 Quy tắc bảo vệ (Self-protection)

Backend có nhiều **rule bảo vệ** để Admin không tự hại mình:

| Action | Rule | Code |
|--------|------|------|
| Update status | Admin KHÔNG được đổi status của chính mình | `req.user!.id === targetId → 403` |
| Delete | Admin KHÔNG được xóa chính mình | `req.user!.id === targetId → 403` |
| Reset password | Admin KHÔNG được reset pass của chính mình | `req.user.id === +id → 403` |
| Update profile | Chỉ update profile CỦA CHÍNH MÌNH | `req.user!.id !== targetId → 403` |

Frontend cũng disable button khi `isSelf = true`:
```tsx
// UsersPage.tsx (dòng 259, 285, 291, 297, 304, 311)
const isSelf = item.id === user.id;
// ...
<DropdownMenuItem disabled={submitting || isSelf} ...>
```

---

## 6. DELETE — Xóa User (Soft Delete)

> **⚠️ Dự án dùng SOFT DELETE**: Không xóa record khỏi database, mà chuyển status → `BLOCKED`

```
 Admin nhấn "Delete user" cho user #3
    │
    │  window.confirm("Xóa mềm user này?...")
    │  → User xác nhận "OK"
    ▼
 dispatch(deleteUser("3"))
    │  → DELETE /api/v1/users/3
    ▼
 Backend: authorize(ADMIN) → deleteUserHandler
    │
    │  Kiểm tra: Admin xóa chính mình? → 403
    │  → deleteUser(3)
    ▼
 user.service.ts: deleteUser
    │  1. Tìm user #3 → tồn tại?
    │  2. KHÔNG xóa record! Thay vào đó:
    │     prisma.user.update({
    │       where: { id: 3 },
    │       data: {
    │         status: "BLOCKED",        ← chuyển sang BLOCKED
    │         tokenVersion: { increment: 1 },  ← revoke token
    │       }
    │     })
    ▼
 Response: { success: true, data: null }
    ▼
 Frontend usersSlice fulfilled:
    │  state.items = items.filter(item => item.id !== "3")
    │  → User #3 biến mất khỏi bảng (ở FE)
    │  → Nhưng trong DB vẫn còn, status = BLOCKED
```

---

## 7. Bonus: Reset Password & Update Own Profile

### 7.1 Reset Password (Admin reset pass cho user khác)

```
 Admin nhấn "Reset password" cho user #3
    │
    ▼
 dispatch(resetUserPassword("3"))
    │  → POST /api/v1/users/3/reset-password  body: {}
    ▼
 Backend: authorize(ADMIN) → resetUserPasswordHandler
    │  → resetUserPassword(3)
    ▼
 user.service.ts: resetUserPassword
    │  1. Sinh mật khẩu ngẫu nhiên mới
    │  2. Hash + salt
    │  3. prisma.user.update({
    │       data: {
    │         passwordHash, passwordSalt,
    │         mustChangePassword: true,     ← buộc đổi pass
    │         tokenVersion: { increment: 1 },  ← revoke mọi token cũ
    │       }
    │     })
    │  4. Return: { user, temporaryPassword }
    ▼
 Frontend:
    │  state.temporaryPasswordResult = { user, temporaryPassword }
    │  → Mở TemporaryPasswordDialog → Admin copy pass mới gửi cho user
    │  → User login lại → buộc đổi mật khẩu
```

### 7.2 Update Own Profile (User tự sửa tên/avatar)

```
 User vào /account → sửa tên/avatar → nhấn "Lưu"
    │
    │  File: AccountPage.tsx
    ▼
 dispatch(updateOwnProfile({ id: "5", data: { name: "New Name", avatarUrl: "..." } }))
    │  → PATCH /api/v1/users/5  body: { name, avatarUrl }
    ▼
 Backend: authenticate (KHÔNG cần authorize ADMIN)
    │  → updateUserHandler
    │  Kiểm tra: req.user.id === targetId? (chỉ sửa CỦA MÌNH)
    │  → updateUser("5", { name, avatarUrl })
    ▼
 user.service.ts: updateUser
    │  1. Validate email uniqueness (nếu đổi email)
    │  2. Nếu đổi role → tokenVersion++ (revoke token)
    │  3. prisma.user.update({ where: { id: 5 }, data: { name, avatarUrl } })
    ▼
 Frontend usersSlice fulfilled:
    │  1. thunkAPI.dispatch(setCurrentUser(response.data.user))
    │     → Cập nhật LUÔN auth state (user đang login)
    │     → Sidebar/Navbar hiển thị tên mới ngay lập tức
    │  2. state.selectedUser = updatedUser
    │  3. syncUserInList() → cập nhật trong danh sách (nếu đang xem)
```

> **💡 Điểm đáng chú ý:** `updateOwnProfile` không chỉ cập nhật `usersSlice` mà còn dispatch `setCurrentUser()` vào **authSlice** — vì thông tin user đang hiển thị trên sidebar/navbar nằm trong `auth.user`, không phải `users.items`.

---

## 8. Tổng hợp API Endpoints

| Method | URL | Middleware | Quyền | Mô tả |
|--------|-----|-----------|-------|-------|
| `GET` | `/api/v1/users` | authenticate + authorize | **ADMIN** | Danh sách users (phân trang, lọc, sắp xếp) |
| `POST` | `/api/v1/users` | authenticate + authorize | **ADMIN** | Tạo user mới (sinh pass tạm) |
| `GET` | `/api/v1/users/:id` | authenticate | ADMIN hoặc chính user đó | Xem chi tiết 1 user |
| `PATCH` | `/api/v1/users/:id` | authenticate | Chỉ chính user đó | Cập nhật profile (name, avatarUrl) |
| `PATCH` | `/api/v1/users/:id/status` | authenticate + authorize | **ADMIN** | Đổi status (ACTIVE/INACTIVE/BLOCKED) |
| `POST` | `/api/v1/users/:id/reset-password` | authenticate + authorize | **ADMIN** | Reset password (sinh pass tạm mới) |
| `DELETE` | `/api/v1/users/:id` | authenticate + authorize | **ADMIN** | Soft delete (chuyển BLOCKED + revoke token) |

File: [user.route.ts](../../task-be/src/routes/user.route.ts)

---

## 9. Tổng hợp file liên quan

### Frontend

| Tầng | File | Vai trò |
|------|------|---------|
| **UI** | [UsersPage.tsx](../src/pages/users/UsersPage.tsx) | Trang chính: bảng, filter, pagination, actions |
| **UI** | [UserCreateDialog](../src/components/pages/users/UserCreateDialog.tsx) | Dialog tạo user mới |
| **UI** | [TemporaryPasswordDialog](../src/components/pages/users/TemporaryPasswordDialog.tsx) | Dialog hiển thị mật khẩu tạm |
| **UI** | [AccountPage.tsx](../src/pages/account/AccountPage.tsx) | Trang chỉnh sửa profile cá nhân |
| **Redux** | [usersSlice.ts](../src/redux/usersSlice.ts) | State + AsyncThunks cho users |
| **Repository** | [UserRepository.ts](../src/app/repositories/UserRepository.ts) | Gọi API users |
| **Base** | [BaseApiService.ts](../src/app/repositories/BaseApiService.ts) | Abstract class CRUD chung |
| **Base** | [BaseApiDataSource.ts](../src/app/repositories/BaseApiDataSource.ts) | Wrapper axios + xử lý lỗi |
| **Entity** | [user.entity.ts](../src/app/entities/user.entity.ts) | TypeScript interfaces cho User |
| **Interceptor** | [axios-interceptor.ts](../src/app/shared/config/axios-interceptor.ts) | Auto-gắn JWT + auto-refresh |

### Backend

| Tầng | File | Vai trò |
|------|------|---------|
| **Route** | [user.route.ts](../../task-be/src/routes/user.route.ts) | Định nghĩa endpoints + middleware chain |
| **Controller** | [user.controller.ts](../../task-be/src/controllers/user.controller.ts) | Validate input (Zod) + gọi service |
| **Service** | [user.service.ts](../../task-be/src/services/user.service.ts) | Logic nghiệp vụ + Prisma queries |
| **DTO** | [user.dto.ts](../../task-be/src/dtos/user.dto.ts) | Zod schemas validate request |
| **Middleware** | [auth.middleware.ts](../../task-be/src/middlewares/auth.middleware.ts) | authenticate (JWT) + authorize (role) |
| **Schema** | [schema.prisma](../../task-be/prisma/schema.prisma) | Định nghĩa model User trong database |

---

## Sơ đồ tổng kết Redux State cho Users

```
store.users = {
  items: IUser[],                        // Danh sách users hiện tại
  selectedUser: IUser | null,            // User đang xem chi tiết
  filters: {                             // Bộ lọc hiện tại
    page, limit, search, role, status, sortBy, sortOrder
  },
  pagination: {                          // Thông tin phân trang
    page, limit, total, totalPages
  },
  loading: boolean,                      // Đang fetch danh sách?
  submitting: boolean,                   // Đang create/update/delete?
  temporaryPasswordResult: {             // Kết quả tạo user / reset pass
    user: IUser,
    temporaryPassword: string
  } | null
}
```

**Cách state thay đổi theo từng action:**

| Action | items | pagination | loading | submitting | temporaryPasswordResult |
|--------|-------|-----------|---------|-----------|------------------------|
| fetchUsers.pending | - | - | ✅ true | - | - |
| fetchUsers.fulfilled | 🔄 mới | 🔄 mới | false | - | - |
| createUser.fulfilled | ➕ thêm đầu | - | - | false | 🔄 set |
| updateUserStatus.fulfilled | 🔄 sync | - | - | false | - |
| updateOwnProfile.fulfilled | 🔄 sync | - | - | false | - |
| resetUserPassword.fulfilled | 🔄 sync | - | - | false | 🔄 set |
| deleteUser.fulfilled | ➖ filter bỏ | - | - | false | - |

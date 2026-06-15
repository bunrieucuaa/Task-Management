# Luồng Layout & Routing — TanStack Router File-Based Routing

> Tài liệu giải thích chi tiết cách hệ thống Routing và Layout hoạt động trong dự án,
> từ cấu trúc file → route tree tự sinh → layout lồng nhau → guard bảo vệ → render page.

---

## Mục lục

1. [TanStack Router là gì? So sánh với React Router](#1-tanstack-router-là-gì)
2. [File-Based Routing — Cách hoạt động](#2-file-based-routing--cách-hoạt-động)
3. [Cây Route trong dự án](#3-cây-route-trong-dự-án)
4. [Layout lồng nhau — Outlet pattern](#4-layout-lồng-nhau--outlet-pattern)
5. [Guard System — Ai vào đâu?](#5-guard-system--ai-vào-đâu)
6. [Sidebar & Navigation](#6-sidebar--navigation)
7. [Luồng end-to-end: User mở trình duyệt](#7-luồng-end-to-end-user-mở-trình-duyệt)
8. [Cách thêm 1 trang mới](#8-cách-thêm-1-trang-mới)
9. [Tổng hợp file liên quan](#9-tổng-hợp-file-liên-quan)

---

## 1. TanStack Router là gì?

### So sánh nhanh

| Tiêu chí | React Router (phổ biến) | TanStack Router (dự án này) |
|----------|------------------------|---------------------------|
| Cách khai báo route | Viết `<Route path="/users">` trong code | Tạo FILE trong thư mục `routes/` → tự sinh |
| Type-safe | ❌ Không | ✅ Có (TypeScript tự biết path nào hợp lệ) |
| Code-splitting | Tự cấu hình | ✅ Tự động (`autoCodeSplitting: true`) |
| DevTools | React Router DevTools | TanStack Router DevTools |

### Thiết lập trong dự án

File [vite.config.ts](../vite.config.ts):
```ts
plugins: [
  tanstackRouter({
    target: 'react',
    autoCodeSplitting: true,  // ← tự tách code theo route
  }),
  react(),
  tailwindcss()
]
```

**Plugin `tanstackRouter`** sẽ:
1. **Quét** thư mục `src/routes/`
2. **Tự sinh** file `routeTree.gen.ts` (KHÔNG được sửa tay!)
3. **Cập nhật** mỗi khi bạn thêm/xóa/rename file trong `routes/`

---

## 2. File-Based Routing — Cách hoạt động

### Quy tắc đặt tên file → URL

```
src/routes/
│
├── __root.tsx              →  Root layout (bọc MỌI trang)
│
├── (auth)/                 →  Nhóm route (dấu ngoặc = KHÔNG thêm vào URL)
│   ├── login.tsx           →  /login
│   ├── register.tsx        →  /register
│   ├── change-password.tsx →  /change-password
│   └── reset-password.tsx  →  /reset-password
│
└── (app)/                  →  Nhóm route (dấu ngoặc = KHÔNG thêm vào URL)
    ├── route.tsx           →  Layout chung cho nhóm (app)
    ├── index.tsx           →  /           (trang Home)
    ├── users.tsx           →  /users
    ├── tasks.tsx           →  /tasks
    └── account.tsx         →  /account
```

### Quy tắc quan trọng

| Quy tắc | Ví dụ | Giải thích |
|---------|-------|-----------|
| `(tên)` — Pathless group | `(auth)/`, `(app)/` | Nhóm logic, KHÔNG thêm vào URL. `/login` chứ KHÔNG phải `/auth/login` |
| `__root.tsx` | `__root.tsx` | Layout gốc, bọc TẤT CẢ route |
| `route.tsx` | `(app)/route.tsx` | Layout cho nhóm đó (giống `_layout.tsx` trong Next.js) |
| `index.tsx` | `(app)/index.tsx` | Trang mặc định của nhóm (URL = `/`) |
| `tên.tsx` | `users.tsx` | Route lá: URL = `/users` |

### File tự sinh: routeTree.gen.ts

File [routeTree.gen.ts](../src/routeTree.gen.ts) được **plugin tự tạo**, chứa:
- Import tất cả route files
- Thiết lập quan hệ cha-con giữa routes
- Export `routeTree` để dùng trong `createRouter()`

```ts
// routeTree.gen.ts (tự sinh — KHÔNG sửa!)
const rootRouteChildren = {
  appRouteRoute: appRouteRouteWithChildren,  // (app) + children
  authChangePasswordRoute,                    // (auth)/change-password
  authLoginRoute,                             // (auth)/login
  authRegisterRoute,                          // (auth)/register
  authResetPasswordRoute,                     // (auth)/reset-password
};

export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
```

---

## 3. Cây Route trong dự án

### Sơ đồ cây quan hệ cha-con

```
__root (RootLayout)
│
│   Render: <Outlet />  +  <TanStackRouterDevtools /> (dev only)
│
├── /(app) (AppShellLayout)                      ← có Layout + AuthGuard
│   │
│   │   Render: <Layout> + <AuthGuard isPrivate={true} />
│   │   Layout = Sidebar + Header + Main content
│   │   AuthGuard = kiểm tra isAuthenticated
│   │
│   ├── / (index)     → HomePage                 ← URL: /
│   ├── /users        → UsersPage                ← URL: /users
│   ├── /tasks        → Tasks                    ← URL: /tasks
│   └── /account      → AccountPage              ← URL: /account
│
├── /(auth)/login            → GuestGuard > LoginPage         ← URL: /login
├── /(auth)/register         → GuestGuard > RegisterPage      ← URL: /register
├── /(auth)/change-password  → MustChangePasswordGuard > ...  ← URL: /change-password
└── /(auth)/reset-password   → MustChangePasswordGuard > ...  ← URL: /reset-password
```

### Quan hệ cha-con ảnh hưởng gì?

```
Khi user vào /users:

1. Router match: __root → (app) → users
2. Render theo thứ tự (ngoài → trong):

   __root.tsx:         <Outlet />
                          │
                          ▼
   (app)/route.tsx:    <Layout>
                         <AuthGuard isPrivate={true}>
                           <Outlet />     ← nội dung route con
                         </AuthGuard>
                       </Layout>
                          │
                          ▼
   (app)/users.tsx:    <UsersPage />
```

**Khi user vào /login:**

```
1. Router match: __root → (auth)/login
2. Render:

   __root.tsx:         <Outlet />
                          │
                          ▼
   (auth)/login.tsx:   <GuestGuard>
                         <LoginPage />
                       </GuestGuard>

   → KHÔNG có Layout (sidebar/header)!
   → Vì /login là con trực tiếp của __root, KHÔNG phải con của (app)
```

---

## 4. Layout lồng nhau — Outlet pattern

### `<Outlet />` là gì?

`<Outlet />` giống như **"ổ cắm"** — nơi mà route CON sẽ được "cắm" vào render.

```
Ví dụ thực tế: __root.tsx

export const Route = createRootRoute({ component: RootLayout });

const RootLayout = () => (
  <>
    <Outlet />              ← Route con render VÀO ĐÂY
    <TanStackRouterDevtools />
  </>
);
```

### Sơ đồ Layout lồng nhau khi truy cập /users

```
┌─ __root.tsx ──────────────────────────────────────────────────────┐
│                                                                   │
│  ┌─ (app)/route.tsx ─────────────────────────────────────────┐   │
│  │                                                            │   │
│  │  ┌─ Layout (layout.tsx) ────────────────────────────────┐ │   │
│  │  │                                                       │ │   │
│  │  │  ┌── Sidebar ──┐  ┌── Header ──────────────────────┐ │ │   │
│  │  │  │ Home        │  │ ☰  Home > Dashboard   🌙 🔔 🌐│ │ │   │
│  │  │  │ Tasks       │  └────────────────────────────────┘ │ │   │
│  │  │  │ Users ←     │                                      │ │   │
│  │  │  │ Settings    │  ┌── Main (Card) ─────────────────┐ │ │   │
│  │  │  │             │  │                                 │ │ │   │
│  │  │  │             │  │  ┌─ AuthGuard ────────────────┐│ │ │   │
│  │  │  │             │  │  │                             ││ │ │   │
│  │  │  │             │  │  │  ┌─ Outlet ──────────────┐ ││ │ │   │
│  │  │  │             │  │  │  │                        │ ││ │ │   │
│  │  │  │             │  │  │  │  <UsersPage />         │ ││ │ │   │
│  │  │  │             │  │  │  │                        │ ││ │ │   │
│  │  │  │             │  │  │  └────────────────────────┘ ││ │ │   │
│  │  │  │             │  │  │                             ││ │ │   │
│  │  │  │ ─────────── │  │  └─────────────────────────────┘│ │ │   │
│  │  │  │ 👤 User     │  │                                 │ │ │   │
│  │  │  │    Logout    │  └─────────────────────────────────┘ │ │   │
│  │  │  └─────────────┘                                       │ │   │
│  │  └────────────────────────────────────────────────────────┘ │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### Khi truy cập /login (KHÔNG có Layout)

```
┌─ __root.tsx ──────────────────────────────────────┐
│                                                    │
│  ┌─ (auth)/login.tsx ───────────────────────────┐ │
│  │                                               │ │
│  │  ┌─ GuestGuard ───────────────────────────┐  │ │
│  │  │                                         │  │ │
│  │  │  ┌─ AuthSplitLayout ────────────────┐  │  │ │
│  │  │  │                                   │  │  │ │
│  │  │  │  ┌──────────┐  ┌──────────────┐  │  │  │ │
│  │  │  │  │          │  │  Đăng nhập    │  │  │  │ │
│  │  │  │  │  Hình    │  │  Email: ___   │  │  │  │ │
│  │  │  │  │  minh    │  │  Pass:  ___   │  │  │  │ │
│  │  │  │  │  hoạ     │  │  [Submit]     │  │  │  │ │
│  │  │  │  │          │  │               │  │  │  │ │
│  │  │  │  └──────────┘  └──────────────┘  │  │  │ │
│  │  │  └───────────────────────────────────┘  │  │ │
│  │  └─────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────┘ │
│                                                    │
│  → KHÔNG có Sidebar, Header                        │
│  → Vì /login KHÔNG phải con của (app)/route.tsx    │
└────────────────────────────────────────────────────┘
```

---

## 5. Guard System — Ai vào đâu?

### Bảng tổng hợp Guard

| Guard | File | Dùng ở đâu | Kiểm tra gì | Nếu không đạt |
|-------|------|-----------|-------------|---------------|
| **AuthGuard** | [AuthGuard.tsx](../src/layouts/AuthGuard.tsx) | `(app)/route.tsx` | `isAuthenticated === true?` | → Redirect `/login` |
| **GuestGuard** | [GuestGuard.tsx](../src/layouts/GuestGuard.tsx) | `login.tsx`, `register.tsx` | `isAuthenticated === false?` | → Redirect `/` hoặc `/change-password` |
| **MustChangePasswordGuard** | [MustChangePasswordGuard.tsx](../src/layouts/MustChangePasswordGuard.tsx) | `change-password.tsx`, `reset-password.tsx` | `isAuthenticated && mustChangePassword` | → Redirect `/login` hoặc `/` |

### Sơ đồ quyết định: User vào URL nào → thấy gì?

```
User nhập URL trong trình duyệt
    │
    ▼
┌── Router match route ──────────────────────────────────────────┐
│                                                                 │
│  URL = /login, /register?                                       │
│  ├── GuestGuard:                                               │
│  │   ├── isAuthenticated = true?                               │
│  │   │   ├── mustChangePassword? → redirect /change-password   │
│  │   │   └── else → redirect /  (đã login, không cần vào)     │
│  │   └── isAuthenticated = false? → ✅ Hiện LoginPage          │
│  │                                                              │
│  URL = /change-password, /reset-password?                       │
│  ├── MustChangePasswordGuard:                                  │
│  │   ├── isAuthenticated = false? → redirect /login            │
│  │   ├── mustChangePassword = false? → redirect /              │
│  │   └── cả hai true? → ✅ Hiện ChangePasswordPage            │
│  │                                                              │
│  URL = /, /users, /tasks, /account?                            │
│  ├── AuthGuard (trong app/route.tsx):                          │
│  │   ├── isAuthenticated = false? → redirect /login            │
│  │   └── isAuthenticated = true?                               │
│  │       ├── user === null? → dispatch(getMe()) lấy user info  │
│  │       └── → ✅ Render <Outlet /> (trang tương ứng)          │
│  │                                                              │
│  URL = bất kỳ gì khác?                                         │
│  └── defaultNotFoundComponent → NotFound (Lottie animation)    │
└─────────────────────────────────────────────────────────────────┘
```

### AuthGuard chi tiết — Tại sao gọi getMe()?

```tsx
// AuthGuard.tsx
useEffect(() => {
  if (
    !initialized ||         // App chưa xong init auth?  → chờ
    !isAuthenticated ||     // Chưa login?                → chờ redirect
    user !== null ||        // Đã có user info?           → không cần gọi lại
    mustChangePassword ||   // Phải đổi pass?             → không cần user info
    userLoading             // Đang load?                 → chờ
  ) {
    return;
  }

  void dispatch(getMe());  // Gọi GET /auth/me để lấy thông tin mới nhất
}, [...]);
```

**Tại sao cần `getMe()`?**
- Khi F5 refresh, Redux state bị reset → `user = null`
- Token vẫn còn trong localStorage → `isAuthenticated = true` (sau initializeAuth)
- Nhưng **thông tin user** (tên, avatar, role) cần lấy lại từ server
- `getMe()` gọi `GET /auth/me` → backend verify token → trả user info mới nhất

---

## 6. Sidebar & Navigation

### Cấu trúc Sidebar

File [app-sidebar.tsx](../src/components/ui/app-sidebar.tsx):

```
┌── Sidebar ──────────────────────┐
│                                  │
│  ┌── SidebarHeader ───────────┐ │
│  │  "Task Management"         │ │
│  └────────────────────────────┘ │
│                                  │
│  ┌── SidebarContent ──────────┐ │
│  │  Application                │ │
│  │  ──────────────────────     │ │
│  │  🏠 Home          → /      │ │
│  │  🚂 Tasks Mgmt    → /tasks │ │
│  │  👥 Users Mgmt    → /users │ │  ← CHỈ hiện khi role = ADMIN
│  │  📅 Drag & Drop   → /...   │ │
│  │  ⚙️ Settings      → /...   │ │
│  └────────────────────────────┘ │
│                                  │
│  ┌── SidebarFooter ───────────┐ │
│  │  👤 NavUser                 │ │  ← Avatar + tên + dropdown menu
│  │     → Thông tin tài khoản   │ │     navigate(/account)
│  │     → Đăng xuất             │ │     dispatch(logoutUser())
│  └────────────────────────────┘ │
└──────────────────────────────────┘
```

### Menu items dựa trên Role

```tsx
// app-sidebar.tsx (dòng 23-53)
const items = [
  { title: "Home",            url: "/",      icon: Home },
  { title: "Tasks Management", url: "/tasks", icon: Train },

  // CHỈ thêm "Users Management" nếu là ADMIN
  ...(user?.role === ERole.Admin
    ? [{ title: "Users Management", url: "/users", icon: Users }]
    : []),

  { title: "Drag & Drop",    url: "/drag-drop", icon: Calendar },
  { title: "Settings",       url: "/settings",   icon: Settings },
];
```

### Active state

```tsx
// Sidebar highlight menu đang active
const { pathname } = useLocation();        // lấy URL hiện tại
const isActive = pathname === item.url;     // so sánh
<SidebarMenuButton isActive={isActive}>     // truyền vào → CSS highlight
```

### NavUser — Footer Sidebar

File [nav-footer.tsx](../src/components/ui/nav-footer.tsx):

```
NavUser đọc thông tin từ:
  const { user } = useAppSelector(state => state.auth);
                                         ↑
                                   authSlice (Redux)

Hiển thị:
  - Avatar (initials fallback: "NA" cho "Nguyen A")
  - Tên + email

Dropdown menu:
  - "Thông tin tài khoản" → navigate({ to: "/account" })
  - "Đăng xuất"           → dispatch(logoutUser()) → navigate("/login")
```

---

## 7. Luồng end-to-end: User mở trình duyệt

### Kịch bản 1: User ĐÃ login trước đó (có token trong localStorage)

```
① User mở trình duyệt → http://localhost:5173/users
    │
    ▼
② main.tsx:
    │  setupAxiosInterceptors()  → cài interceptor
    │  <Provider store={store}>  → Redux store
    │  <AuthBootstrap />         → kiểm tra auth
    │  <RouterProvider />        → bắt đầu routing
    ▼
③ AuthBootstrap:
    │  hasStoredAuthTokens() → true (có token cũ)
    │  dispatch(initializeAuth())
    │  → Giải mã token → kiểm tra hạn → isAuthenticated = true
    │  → state: { initialized: true, isAuthenticated: true, user: null }
    ▼
④ Router match: __root → (app) → users
    │
    ▼
⑤ __root.tsx: <Outlet />
    │
    ▼
⑥ (app)/route.tsx: AppShellLayout
    │  <Layout>
    │    <AuthGuard isPrivate={true} />
    │  </Layout>
    ▼
⑦ Layout renders:
    │  <SidebarProvider>
    │    <AppSidebar />        → Sidebar (nhưng user = null → chưa hiện tên)
    │    <header>...</header>  → Header bar
    │    <main>
    │      <Card>
    │        {children}         → AuthGuard
    │      </Card>
    │    </main>
    │  </SidebarProvider>
    ▼
⑧ AuthGuard:
    │  isAuthenticated = true → OK
    │  user === null → dispatch(getMe())
    │    → GET /auth/me → nhận user info
    │    → state.auth.user = { id, name, email, role... }
    │    → Sidebar re-render → hiện tên user
    │  return <Outlet />
    ▼
⑨ (app)/users.tsx: <UsersPage />
    │  → Render bảng Users + filter + pagination
    ▼
⑩ Trang hiển thị hoàn chỉnh! ✅
```

### Kịch bản 2: User CHƯA login (không có token)

```
① User mở http://localhost:5173/users
    │
    ▼
② AuthBootstrap:
    │  hasStoredAuthTokens() → false
    │  dispatch(finishAuthInitialization())
    │  → state: { initialized: true, isAuthenticated: false }
    ▼
③ Router match: __root → (app) → users
    │
    ▼
④ (app)/route.tsx → AuthGuard:
    │  isAuthenticated = false
    │  return <Navigate to="/login" />  → REDIRECT!
    ▼
⑤ Router match: __root → (auth)/login
    │
    ▼
⑥ (auth)/login.tsx → GuestGuard:
    │  isAuthenticated = false → OK
    │  return <LoginPage />
    ▼
⑦ LoginPage hiển thị (KHÔNG có Sidebar/Header) ✅
```

### Kịch bản 3: User đã login nhưng vào /login

```
① User đã login, nhập http://localhost:5173/login
    │
    ▼
② Router match: __root → (auth)/login
    │
    ▼
③ GuestGuard:
    │  isAuthenticated = true
    │  mustChangePassword = false
    │  return <Navigate to="/" replace />  → REDIRECT về Home!
    ▼
④ Router match: __root → (app) → index
    │
    ▼
⑤ <HomePage /> hiển thị ✅
```

---

## 8. Cách thêm 1 trang mới

### Ví dụ: Thêm trang `/projects` (cần login, có sidebar)

**Bước 1:** Tạo page component

```tsx
// src/pages/projects/ProjectsPage.tsx
export default function ProjectsPage() {
  return <div>Projects Page</div>;
}
```

**Bước 2:** Tạo route file trong nhóm `(app)`

```tsx
// src/routes/(app)/projects.tsx
import ProjectsPage from "@/pages/projects/ProjectsPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/projects")({
  component: ProjectsPage,
});
```

**Bước 3:** (Tự động) Plugin TanStack Router sẽ tự cập nhật `routeTree.gen.ts`

**Bước 4:** (Tuỳ chọn) Thêm vào Sidebar

```tsx
// src/components/ui/app-sidebar.tsx
const items = [
  // ... existing items
  { title: "Projects", url: "/projects", icon: FolderKanban },
];
```

**Vậy là xong!** URL `/projects` sẽ:
- Tự có Layout (Sidebar + Header) vì nằm trong `(app)/`
- Tự có AuthGuard vì `(app)/route.tsx` bọc AuthGuard
- Tự có code-splitting vì Vite plugin config `autoCodeSplitting: true`

### Ví dụ: Thêm trang `/forgot-password` (KHÔNG cần login, KHÔNG sidebar)

```tsx
// src/routes/(auth)/forgot-password.tsx
import ForgotPasswordPage from "@/pages/auth/ForgotPassword";
import GuestGuard from "@/layouts/GuestGuard";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)/forgot-password")({
  component: () => (
    <GuestGuard>
      <ForgotPasswordPage />
    </GuestGuard>
  ),
});
```

→ Trang này sẽ KHÔNG có sidebar/header, chỉ cho phép user chưa login.

---

## 9. Tổng hợp file liên quan

### Routing

| File | Vai trò |
|------|---------|
| [vite.config.ts](../vite.config.ts) | Config plugin TanStack Router + autoCodeSplitting |
| [routeTree.gen.ts](../src/routeTree.gen.ts) | File TỰ SINH — cây route cho router. **KHÔNG SỬA TAY!** |
| [main.tsx](../src/main.tsx) | `createRouter(routeTree)` + `<RouterProvider />` |
| [__root.tsx](../src/routes/__root.tsx) | Root layout — `<Outlet />` + DevTools |
| [(app)/route.tsx](../src/routes/(app)/route.tsx) | Layout nhóm (app) — Layout + AuthGuard |
| [(app)/index.tsx](../src/routes/(app)/index.tsx) | Route `/` → HomePage |
| [(app)/users.tsx](../src/routes/(app)/users.tsx) | Route `/users` → UsersPage |
| [(app)/tasks.tsx](../src/routes/(app)/tasks.tsx) | Route `/tasks` → Tasks |
| [(app)/account.tsx](../src/routes/(app)/account.tsx) | Route `/account` → AccountPage |
| [(auth)/login.tsx](../src/routes/(auth)/login.tsx) | Route `/login` → GuestGuard > LoginPage |
| [(auth)/register.tsx](../src/routes/(auth)/register.tsx) | Route `/register` → GuestGuard > RegisterPage |
| [(auth)/change-password.tsx](../src/routes/(auth)/change-password.tsx) | Route `/change-password` → MustChangePasswordGuard |
| [(auth)/reset-password.tsx](../src/routes/(auth)/reset-password.tsx) | Route `/reset-password` → MustChangePasswordGuard |

### Layout & UI

| File | Vai trò |
|------|---------|
| [layout.tsx](../src/layouts/layout.tsx) | Layout chính: Sidebar + Header + Main Card |
| [app-sidebar.tsx](../src/components/ui/app-sidebar.tsx) | Sidebar navigation (menu items + role-based) |
| [nav-footer.tsx](../src/components/ui/nav-footer.tsx) | Footer sidebar: Avatar + user info + logout |
| [NotFound.tsx](../src/pages/NotFound.tsx) | Trang 404 (Lottie animation) |

### Guards

| File | Vai trò |
|------|---------|
| [AuthGuard.tsx](../src/layouts/AuthGuard.tsx) | Chặn user chưa login ra khỏi trang (app) |
| [GuestGuard.tsx](../src/layouts/GuestGuard.tsx) | Chặn user đã login vào trang login/register |
| [MustChangePasswordGuard.tsx](../src/layouts/MustChangePasswordGuard.tsx) | Chỉ cho user cần đổi password vào |

---

## Sơ đồ tổng kết

```
                        main.tsx
                    ┌──────┴──────┐
                    │             │
              AuthBootstrap   RouterProvider
              (init auth)     (dùng routeTree)
                                  │
                           ┌──────┴──────┐
                           │             │
                      __root.tsx    NotFound (404)
                      <Outlet />
                           │
              ┌────────────┼────────────┐
              │                         │
         (app)/route.tsx          (auth)/*.tsx
         ┌────┴────┐             ┌────┴────┐
         │         │             │         │
       Layout   AuthGuard    GuestGuard  MustChange
         │         │          PasswordGuard
    ┌────┴────┐    │             │
    │         │  <Outlet />   LoginPage
  Sidebar   Header           RegisterPage
    │                         ChangePasswordPage
  NavUser                    ResetPasswordPage
    │
  Logout
  Account

         <Outlet /> renders:
         ├── /         → HomePage
         ├── /users    → UsersPage
         ├── /tasks    → Tasks
         └── /account  → AccountPage
```

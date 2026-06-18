# Frontend — Ngữ cảnh kỹ thuật

> Repo: `react-task-managerment` (package name `task-management`) → GitHub
> `bunrieucuaa/Task-Management`. Nhánh chính: `dev`, `master`.

## Stack

- **React 19** + **TypeScript 5.9** + **Vite 7** (ESM).
- **Routing:** TanStack Router (file-based, `src/routes/`, auto code-splitting). Route tree
  được generate (`routeTree.gen.ts`).
- **State:** Redux Toolkit (`@reduxjs/toolkit`) + react-redux. Store ở `src/redux/store.ts`.
- **Data fetching:** axios, qua tầng repository (xem dưới). `@tanstack/react-table` cho bảng.
- **Form:** react-hook-form + zod (`@hookform/resolvers`).
- **UI:** Tailwind CSS 4 + shadcn/ui (Radix) trong `src/components/ui/`. Toast: `sonner`.
- **Auth token:** `jwt-decode`. Đa ngôn ngữ: `src/i18n`.
- **Path alias:** `@/*` → `src/*` (xem `vite.config.ts`, `tsconfig.app.json`).

## Kiến trúc

```
pages/* & components/pages/*   →  redux thunks (slices)  →  repositories  →  BaseApiDataSource (axios)
routes/* (TanStack)            guards: layouts/*Guard.tsx
```

- **Tầng repository** (`src/app/repositories/`): `BaseApiDataSource` bọc axios (get/post/put/
  patch/delete) và **tự toast lỗi** qua `processError`. `BaseApiService<T>` là lớp CRUD trừu
  tượng; mỗi domain có `XxxRepository` kế thừa (Auth/User/Project/Task/Comment).
- **Redux slices** (`src/redux/`): `auth`, `users`, `projects`, `tasks`, `comments`. Mỗi slice
  có `createAsyncThunk` gọi repository + `extraReducers` xử lý pending/fulfilled/rejected.
- **`app/shared/config/axios-interceptor.ts`**: gắn `Authorization` từ token trong storage;
  response 401 → thử `/auth/refresh` **một lần** (instance `axiosPublic` không interceptor để
  tránh vòng lặp); refresh fail hoặc 403 (trừ `/auth/login`) → `onUnauthenticated()` (logout).
- **`app/shared/config/jwt.extention.ts`**: `isAuthenValidate(payload, roles)` — quét mọi field
  có "role" trong payload JWT, so khớp (mặc định không phân biệt hoa/thường) với danh sách roles.
- **`app/core/constants.ts`**: `BASE_API_URL`, tên key token (`ACCESS_TOKEN_NAME` v.v.) đọc từ
  `import.meta.env`.

## Quy ước & gotchas

- **Token lưu ở `localStorage` (và đôi khi `sessionStorage`)**. `authSlice.resolveStoredAuthState`
  quyết định `isAuthenticated` từ token decode + hạn + refresh token.
- `enums`: `ERole` (ADMIN/PM/MEMBER, `isPrivilegedRole`), `EResultCode` (HTTP codes),
  `ETaskStatus`, `ETaskPriority`, `EProjectStatus`, `EUserStatus`.
- `lib/utils.ts` → `cn()` (clsx + tailwind-merge) dùng khắp UI.
- `BaseApiDataSource` nuốt lỗi và trả `response.data` (hoặc `{}`); slice kiểm tra
  `response.success && response.data`. Khi test slice → mock repository, không mock axios.
- `import.meta.env` chỉ tồn tại trong môi trường Vite/Vitest (không phải Node thuần).

## Lệnh thường dùng

```bash
npm run dev      # vite dev server (cổng 5173)
npm run build    # vite build + tsc -b
npm run lint     # eslint
npm test         # vitest (xem testing.md)
```

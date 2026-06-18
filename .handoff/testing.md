# Frontend — Test suite

## Cách chạy

```bash
npm test              # chạy 1 lần (vitest run)
npm run test:watch    # watch mode
npm run test:coverage # kèm coverage (v8) → ./coverage
```

- Runner: **Vitest 3** + **jsdom** + **@testing-library/react** (`vitest.config.ts`).
- Alias `@` → `src` (mirror `vite.config.ts`). KHÔNG nạp plugin TanStack Router khi test.
- Setup chung: `src/test/setup.ts` (jest-dom matchers, polyfill `matchMedia`/`scrollIntoView`,
  cleanup + clear storage/mocks sau mỗi test). Env `VITE_BASE_API_URL` set sẵn trong config.
- File test: `src/**/*.spec.{ts,tsx}` (đặt cạnh source). Đã **loại trừ khỏi `tsconfig.app.json`**
  để `npm run build` (vite + tsc -b) không lôi test vào bundle.

## Helper (`src/test/`)

- **`render.tsx`** — `renderWithStore(ui, store?)` bọc component trong Redux `<Provider>` với
  store thật (đủ 5 slice). `makeTestStore(preloadedState?)` tạo store tuỳ biến.
- **`setup.ts`** — chạy trước toàn bộ test (khai báo trong `setupFiles`).

## Pattern test theo lớp

- **Slice** (`redux/*.spec.ts`): mock repository bằng `vi.hoisted` + `vi.mock`, dispatch thunk
  trên store thật, assert state. Ví dụ:
  ```ts
  const mocks = vi.hoisted(() => ({ listUsersAsync: vi.fn() }));
  vi.mock('@/app/repositories/UserRepository', () => ({ UserRepository: vi.fn(() => mocks) }));
  ```
- **Repository** (`AuthRepository.spec.ts`): mock `axios` (default export) + `sonner`, assert URL
  và body request, và nhánh `processError` (toast khi lỗi).
- **Component** (`*.spec.tsx`): mock `@tanstack/react-router` (`useNavigate`/`Link`), `sonner`,
  `AuthRepository`, và `jwt-decode` khi cần; render bằng `renderWithStore`; dùng `userEvent` +
  `findByText` cho validation/submit.

## Đã cover (73 test, 12 file)

| Lớp | File |
|-----|------|
| Util | `lib/utils.spec.ts` (cn) |
| Util | `app/shared/config/jwt.extention.spec.ts` (isAuthenValidate) |
| Enum | `app/shared/enums/enums.spec.ts` (ERole/isPrivilegedRole, EResultCode) |
| Slice | `redux/authSlice.spec.ts` (reducers + login/getMe/logout/changePassword thunks) |
| Slice | `redux/usersSlice.spec.ts` (filters + fetch/create/updateStatus/delete) |
| Slice | `redux/tasksSlice.spec.ts` (cleanQuery + fetch/create/update/delete) |
| Slice | `redux/projectsSlice.spec.ts` (CRUD + members add/remove + directory + selection) |
| Slice | `redux/commentsSlice.spec.ts` (fetch/create/delete + pending reset khi đổi task) |
| Repo | `app/repositories/AuthRepository.spec.ts` (axios mock + error toast) |
| Component | `components/pages/auth/LoginForm.spec.tsx` |
| Component | `components/pages/auth/ChangePasswordForm.spec.tsx` |
| Guard | `layouts/Guards.spec.tsx` (AuthGuard/GuestGuard/MustChangePasswordGuard: redirect, children/outlet, loader) |

## Lint — NỢ KỸ THUẬT CÓ SẴN (không do test)

`npm run lint` hiện **đỏ sẵn từ trước** (~12 lỗi trong code app: `components/ui/sidebar.tsx`,
`button.tsx`, `main.tsx`, `pages/projects/ProjectsPage.tsx`, vài dialog, `BaseApiDataSource.ts`...).
Các file test mới **đã lint sạch**. Vì lint đỏ sẵn, CI để bước lint **không chặn**
(`continue-on-error`); cổng chặn thật là **build (tsc) + test**. Khi dọn xong nợ lint, có thể
bật lint thành bước chặn.

## Khi thêm test component phức tạp hơn

- Component dùng router context nhiều (Outlet, useParams) → cân nhắc mock `@tanstack/react-router`
  sâu hơn hoặc tạo router test memory. Hiện tại mock `useNavigate`/`Link` là đủ cho form.
- Component gọi nhiều repository → mock từng repository như pattern slice.

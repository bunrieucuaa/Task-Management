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
  `findByText` cho validation/submit. Dialog thuần (presentational) thì render thẳng (`render`),
  truyền props giả (xem `ProjectMembersDialog.spec.tsx`).
- **Page** (`pages/**/*.spec.tsx`): mock `@tanstack/react-router` (cả `useNavigate` lẫn `Navigate`
  cho guard redirect) + `sonner`; render bằng `renderWithStore(<Page/>, makeTestStore({ auth, users, ... }))`
  với `auth.user` đúng role. **Page luôn `fetch*` khi mount** → đẩy dữ liệu list qua **repository mock**
  và assert bằng `findBy*`; KHÔNG preload `items` (sẽ bị mount-fetch ghi đè). Xem `UsersPage.spec.tsx`.

## Đã cover (108 test, 20 file)

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
| Config | `app/shared/config/axios-interceptor.spec.ts` (401 refresh một lần + retry, logout khi fail, 403 handling) |
| Dialog | `components/pages/users/UserCreateDialog.spec.tsx` (validation + submit) |
| Dialog | `components/pages/projects/ProjectFormDialog.spec.tsx` (create/edit, member picker) |
| Dialog | `components/pages/tasks/TaskFormDialog.spec.tsx` (create/edit, require project, normalize) |
| Dialog | `components/pages/tasks/TaskCommentsDialog.spec.tsx` (fetch/submit qua repository mock) |
| Dialog | `components/pages/users/TemporaryPasswordDialog.spec.tsx` (hiển thị email + mật khẩu tạm, onClose, placeholder) |
| Dialog | `components/pages/projects/ProjectMembersDialog.spec.tsx` (loại member khỏi danh sách add, filter search, add/remove, ẩn khi không manageable) |
| Page | `pages/users/UsersPage.spec.tsx` (redirect non-admin, fetch on mount, render rows, empty-state, mở create dialog, search → page 1) |

## Lint — ĐÃ DỌN SẠCH (phiên 4, 2026-06-18)

`npm run lint` hiện **sạch** và là **bước chặn** trong CI. Cách đã xử lý 15 lỗi cũ:
- App code sửa thật: `BaseApiDataSource.ts` (`any`→`unknown`, `Object`→`object`),
  `TypedResponseApi.ts` (`message: unknown`), `EResultCode.ts` (disable
  `no-duplicate-enum-values` cho `DELETE = 200` — là HTTP code, cố ý), 2 chỗ
  `set-state-in-effect` (reset form khi mở/đóng dialog — cố ý, disable theo dòng).
- File generated/đặc thù: thêm override trong `eslint.config.js` cho
  `src/components/ui/**` + `src/main.tsx` → tắt `react-refresh/only-export-components`
  và `react-hooks/purity` (skeleton dùng `Math.random`).
- Khi thêm rule mới mà generated UI vi phạm → mở rộng override thay vì sửa file shadcn.

## Khi thêm test component phức tạp hơn

- Component dùng router context nhiều (Outlet, useParams) → cân nhắc mock `@tanstack/react-router`
  sâu hơn hoặc tạo router test memory. Hiện tại mock `useNavigate`/`Link` là đủ cho form.
- Component gọi nhiều repository → mock từng repository như pattern slice.

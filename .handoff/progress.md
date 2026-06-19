# Nhật ký & trạng thái — Frontend

> Cập nhật file này cuối mỗi phiên. Mục quan trọng nhất: **Trạng thái hiện tại** + **Việc kế tiếp**.

## Trạng thái hiện tại

- 2026-06-19 (phiên 8): ✅ **Bật coverage threshold**. Thêm `coverage.thresholds` vào
  `vitest.config.ts` (floor: stmts 64 / branch 70 / **funcs 42** / lines 64) và đổi bước test
  trong CI sang `npm run test:coverage`. `funcs` thấp (~47%) vì nhiều trang phụ/aux chưa test
  (HomePage, AccountPage, auth pages, layouts, vài repository). Coverage hiện tại: **68.84% stmts /
  75.47% branch / 47.45% funcs / 68.84% lines**, exit 0. Floor đặt dưới mức thực tế để CI không đỏ.
- 2026-06-19 (phiên 7): ✅ Test trang **Tasks** (`src/pages/Tasks.tsx`, route `/(app)/tasks`).
  Thêm `Tasks.spec.tsx` (8 test): load tasks + project options on mount, render rows (project +
  assignee), empty-state, search → page 1, mở create dialog, mở comments dialog từ row menu (gọi
  `listCommentsAsync`), và **phân quyền row menu** (member không phải creator/assignee → "Chỉnh sửa"/
  "Xoá" `aria-disabled`; admin thì không). **Tổng: 124 test / 22 file, tất cả PASS**, lint sạch.
  (Tăng từ 116/21.)
  ⚠️ **Đính chính phiên 5/6:** *có* trang Tasks riêng — file tên `src/pages/Tasks.tsx` (component
  `Tasks`, không có hậu tố "Page" nên glob cũ không thấy). Mọi trang chính giờ đã có test.
- 2026-06-19 (phiên 6): ✅ Test `ProjectsPage`. Thêm `ProjectsPage.spec.tsx` (8 test): fetch
  projects on mount + directory chỉ cho manager, ẩn/hiện nút "Tạo project" theo role, render rows
  (owner + member count), empty-state, search → page 1, mở create dialog, mở members dialog từ
  row dropdown (gọi `listMembersAsync`). **Tổng: 116 test / 21 file, tất cả PASS**, lint sạch.
  (Tăng từ 108/20.) Lưu ý: Radix `DropdownMenu` cần polyfill `hasPointerCapture`/`setPointerCapture`/
  `releasePointerCapture` trong test mới mở được menu (đặt ở `beforeAll` của spec).
- 2026-06-19 (phiên 5): ✅ Test 2 dialog còn lại + trang đầu tiên. Thêm
  `TemporaryPasswordDialog.spec.tsx` (3 test), `ProjectMembersDialog.spec.tsx` (6 test: lọc
  available, filter search, add/remove, ẩn khi không manageable) và `UsersPage.spec.tsx` (6 test:
  redirect non-admin, fetch on mount, render rows, empty-state, mở create dialog, search → page 1).
  **Tổng: 108 test / 20 file, tất cả PASS**, lint sạch, build OK. (Tăng từ 93/17.)
  Lưu ý pattern test page: page **luôn refetch khi mount** nên dữ liệu rows phải đẩy qua repository
  mock + `findBy*` (preloaded `items` sẽ bị ghi đè); mock `@tanstack/react-router` (`useNavigate` +
  `Navigate`) và `sonner`.
- 2026-06-18 (phiên 4): ✅ Test dialog + interceptor + **dọn sạch nợ lint, bật lint chặn CI**.
  Thêm `axios-interceptor.spec.tsx` (6 test: refresh 401 một lần, logout khi fail, 403 handling)
  và test 4 dialog: `UserCreateDialog`, `ProjectFormDialog`, `TaskFormDialog`, `TaskCommentsDialog`
  (14 test). Sửa nợ lint app (BaseApiDataSource `any`→`unknown`, EResultCode duplicate, 2 chỗ
  set-state-in-effect) + override eslint cho `components/ui/**` & `main.tsx`. `npm run lint` giờ
  **sạch** và CI đã chuyển lint thành bước chặn. **Tổng: 93 test / 17 file, tất cả PASS**, build OK.
  (Tăng từ 73/12.)
- 2026-06-18 (phiên 3): ✅ Test route Guard. Thêm `layouts/Guards.spec.tsx` (9 test) cho
  `AuthGuard` / `GuestGuard` / `MustChangePasswordGuard` (redirect, render children/outlet,
  loader khi init). **Tổng: 73 test / 12 file, tất cả PASS.** `npm run build` vẫn OK.
  (Tăng từ 64/11.)
- 2026-06-18 (phiên 2): ✅ Mở rộng test slice. Thêm `projectsSlice.spec.ts` (11 test) +
  `commentsSlice.spec.ts` (5 test). **Tổng: 64 test / 11 file, tất cả PASS.** `npm run build`
  vẫn OK. (Tăng từ 48/9.)
- 2026-06-18: ✅ Hoàn tất hạ tầng test + bộ test FE. **48 test / 9 file, tất cả PASS.**
  `npm run build` (vite + tsc) chạy OK (test bị loại khỏi build). CI đã thêm.

## Mục tiêu phiên này

- [x] Cài Vitest + jsdom + Testing Library, cấu hình `vitest.config.ts` + `src/test/setup.ts`.
- [x] Unit test: lib/utils, jwt.extention, enums (ERole/EResultCode).
- [x] Redux slice test (mock repository): auth, users, tasks.
- [x] Repository test (mock axios): AuthRepository (+ BaseApiDataSource gián tiếp).
- [x] Component test (RTL): LoginForm, ChangePasswordForm.
- [x] GitHub Actions CI (lint non-blocking + build + test) → `.github/workflows/ci.yml`.

## Quyết định

- Test framework: **Vitest** + React Testing Library + jsdom. Chốt với user 2026-06-18.
- Mức độ: ưu tiên logic (slices, repositories, utils) + component auth chính.
- CI: ban đầu lint **không chặn** (nợ lint app) — cổng chặn = build + test.
  Từ phiên 4: nợ lint đã dọn → **lint thành bước chặn** cùng build + test.

## Việc kế tiếp (gợi ý cho phiên sau)

- ~~Thêm test cho các slice còn lại: `projectsSlice`, `commentsSlice`~~ ✅ xong (phiên 2).
  → Mọi slice giờ đã có test.
- ~~Test các Guard: `AuthGuard`, `GuestGuard`, `MustChangePasswordGuard`~~ ✅ xong (phiên 3).
- ~~Test component dialog (`ProjectFormDialog`, `TaskFormDialog`, `UserCreateDialog`,
  `TaskCommentsDialog`)~~ ✅ xong (phiên 4).
- ~~Test `axios-interceptor` (refresh-token flow)~~ ✅ xong (phiên 4).
- ~~Dọn nợ lint app + bật lint chặn CI~~ ✅ xong (phiên 4) — `npm run lint` sạch.
- ~~Test `ProjectMembersDialog` + `TemporaryPasswordDialog` (2 dialog còn lại)~~ ✅ xong (phiên 5).
  → Mọi dialog giờ đã có test.
- ~~Test trang `UsersPage`~~ ✅ xong (phiên 5).
- ~~Test `ProjectsPage`~~ ✅ xong (phiên 6).
- ~~Test trang Tasks~~ ✅ xong (phiên 7) — `src/pages/Tasks.tsx` (route `/(app)/tasks`).
  → **Mọi trang chính (`UsersPage`, `ProjectsPage`, `Tasks`) đã có test.**
- ~~Sửa bug BE `verifyToken`~~ ✅ xong (BE phiên 6). ~~Bật `coverage` threshold đồng bộ FE + BE~~
  ✅ xong (FE phiên 8 / BE phiên 7).
- **(gợi ý kế tiếp)** Tăng coverage `functions` (đang ~47%): test `HomePage`/`AccountPage`, các
  trang auth (`reset-password`, `register`) và repository chưa cover → rồi **nâng dần floor** trong
  `vitest.config.ts`. Cân nhắc DB integration test thật (Testcontainers) ở BE.

## Lệnh nhanh

- `npm test` · `npm run test:coverage` · `npm run build`

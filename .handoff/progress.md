# Nhật ký & trạng thái — Frontend

> Cập nhật file này cuối mỗi phiên. Mục quan trọng nhất: **Trạng thái hiện tại** + **Việc kế tiếp**.

## Trạng thái hiện tại

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
- **(gợi ý kế tiếp)** Test trang chính (`ProjectsPage`, `TasksPage`, `UsersPage`): mock
  repository, render với store, kiểm tra filter/pagination + mở dialog. Cân nhắc bật
  `coverage` threshold (vd 70%) trong `vitest.config.ts`. Có thể thêm test cho `ProjectMembersDialog`
  và `TemporaryPasswordDialog` (2 dialog còn lại chưa cover).

## Lệnh nhanh

- `npm test` · `npm run test:coverage` · `npm run build`

# Nhật ký & trạng thái — Frontend

> Cập nhật file này cuối mỗi phiên. Mục quan trọng nhất: **Trạng thái hiện tại** + **Việc kế tiếp**.

## Trạng thái hiện tại

🟢 **DEPLOY LIVE (2026-06-21):** FE trên **Vercel**, BE trên Render, DB Neon. Admin đăng nhập OK.
**156 test PASS**, coverage floor 72/75/56/72 (CI chạy `test:coverage`, lint chặn). P0 (HomePage
dashboard thay placeholder) + P1 (xoá debug log lộ refresh token trong `axios-interceptor.ts`) đã xong.

**Cấu hình Vercel:** import repo, Preset Vite, branch `dev`; build/output để `vercel.json` lo
(`npm run build` → `dist` + SPA rewrite; có cả `public/_redirects` cho Netlify). Env
**`VITE_BASE_API_URL`** = `https://<be>.onrender.com/api/v1` (**bắt buộc đuôi `/api/v1`**, không `/`
cuối; Vite nướng vào lúc build → đặt TRƯỚC khi deploy).

**Bài học deploy:**
1. **Luôn commit + push trước khi deploy** (Vercel kéo `origin/dev`).
2. **401 sau login KHÔNG phải lỗi FE** — do BE: (a) `CORS_ORIGIN` chưa trỏ domain Vercel, (b) admin
   chưa seed. Đọc lỗi: DevTools → Network → request `login` (CORS-blocked vs 401 vs 500).
3. Vercel sinh nhiều URL preview khác origin → CORS chỉ whitelist domain production thì preview bị
   chặn. Dùng domain production cố định.

⚠️ **Nên làm:** đổi mật khẩu admin mặc định; cân nhắc merge `dev → master` rồi trỏ Vercel sang `master`.

<details><summary>Lịch sử (gọn)</summary>

- Hạ tầng test (Vitest + RTL + jsdom) + bộ test: utils/enums/jwt, redux slices (auth/users/tasks/
  projects/comments), repository (mock axios), Guards, dialog, `axios-interceptor` (refresh flow),
  trang chính (Users/Projects/Tasks/HomePage) → **156 test / 27 file**. Lint sạch & chặn CI.
- Lưu ý test: page **luôn refetch khi mount** → đẩy data qua repository mock + `findBy*`; mock
  `@tanstack/react-router` (`useNavigate`/`Navigate`/`Link`) + `sonner`; Radix `DropdownMenu` cần
  polyfill `hasPointerCapture`/`setPointerCapture`/`releasePointerCapture` ở `beforeAll`.
- Trang còn 0% coverage (nếu muốn nâng floor): `AccountPage`, `Register`, `ResetPassword`, layouts.
</details>

## Việc kế tiếp — P2

> Spec Đợt 1: `task-be/.handoff/specs/2026-06-21-tags-activitylog.md`. Quyết định đã chốt: Tags
> **global**, ActivityLog **timeline trong dialog task**, Kanban **theo status** (Đợt 2),
> dnd-kit + Framer Motion. **BE Đợt 1 ĐÃ XONG** (commit `25614fe` + `ae85f1f`, 213 test).

### ⏭️ FE Đợt 1 — Tags + ActivityLog (làm tiếp ở chat mới)

**BE đã sẵn sàng — hợp đồng API (base đã có `/api/v1`):**
- `GET /tags` → `{ tags: [{id,name}] }` · `POST /tags {name}` (admin/PM, 409 trùng) ·
  `DELETE /tags/:id` (admin).
- `POST /tasks/:taskId/tags {tagId}` · `DELETE /tasks/:taskId/tags/:tagId` (cần quyền sửa task).
- Task list/detail **đã kèm** `tags: [{id,name}]`; lọc `GET /tasks?tagId=<id>`.
- `GET /tasks/:taskId/activities` → paginated, mới nhất trước; mỗi item `{id, action, oldValue,
  newValue, createdAt, user}`. Action: `TASK_CREATED, STATUS_CHANGED, ASSIGNEE_CHANGED,
  DEADLINE_CHANGED, PRIORITY_CHANGED, TAG_ADDED, TAG_REMOVED`.

**Việc FE (theo TDD, mirror `CommentRepository`/`TaskCommentsDialog`):**
1. `TagRepository` (list/create/delete/attachToTask/detachFromTask) + `ActivityRepository`
   (listByTask). Có thể thêm `tagsSlice`.
2. **TaskFormDialog:** combobox multi-select gắn/gỡ tag (Radix sẵn có); admin/PM tạo tag inline.
3. **Tasks.tsx:** badge tag trên mỗi row (màu từ hash tên — util `tagColor(name)`, KHÔNG có cột color);
   dropdown lọc theo tag → set query `tagId`.
4. **Dialog task:** tab/khu **"Lịch sử"** — timeline render từ `ActivityRepository`; util
   `describeActivity(activity)` map action → câu mô tả tiếng Việt + `date-fns formatDistanceToNow`.
5. Test: repository spec (mock axios), component spec combobox/badge/lọc/timeline. Giữ trên floor.

### Đợt 2 (sau Đợt 1)
- **dnd-kit** Kanban theo status (kéo đổi status → BE tự sinh ActivityLog).
- **Framer Motion**: transition chuyển trang + hiệu ứng toggle light/dark.

### Còn lại P2
- Task attachments (upload — `postWithFile` có sẵn chưa dùng), AI (`AiHistory`).

## Quyết định

- Test: **Vitest** + RTL + jsdom. Ưu tiên logic (slices/repositories/utils) + trang chính. CI: lint
  (chặn) + build + `test:coverage`.

## Lệnh nhanh

- `npm test` · `npm run test:coverage` · `npm run build` · `npm run lint`

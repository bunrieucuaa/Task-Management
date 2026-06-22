# Nhật ký & trạng thái — Frontend

> Cập nhật file này cuối mỗi phiên. Mục quan trọng nhất: **Trạng thái hiện tại** + **Việc kế tiếp**.

## Trạng thái hiện tại

🟢 **DEPLOY LIVE (2026-06-21):** FE trên **Vercel**, BE trên Render, DB Neon. Admin đăng nhập OK.
**186 test PASS**, coverage 77/80/64/77 (floor 72/75/56/72, CI chạy `test:coverage`, lint chặn).
P0/P1 đã xong từ trước.

✅ **FE Đợt 1 — Tags + ActivityLog (2026-06-22): XONG, đã commit `0361e3d` + push `origin/dev`.** Build + lint + tsc sạch.
- `TagRepository` (list/create/delete/attach/detach) + `ActivityRepository` (listByTask) + spec (mock axios).
- `tagsSlice` (fetchTags/createTag/deleteTag, đăng ký store + test/render.tsx) + spec.
- Util `tagColor(name)` (hash tên → màu badge, không cột color) + `describeActivity(activity)` (action → câu
  tiếng Việt) ở `src/lib/`, có spec.
- `TaskActivityDialog` (mirror CommentsDialog, fetch trực tiếp qua repository, timeline + icon theo action +
  `formatDistanceToNow` locale vi) — mở từ dropdown "Lịch sử" ở Tasks.tsx.
- `TagPicker` (Popover multi-select, badge màu, tạo tag inline cho admin/PM) — presentational thuần.
- `TaskFormDialog`: TagPicker **chỉ ở edit mode** (attach/detach cần taskId; props optional để không phá test
  cũ dùng `render` không Provider). Wiring (Redux + TagRepository, optimistic + revert) ở Tasks.tsx.
- `Tasks.tsx`: badge tag trên row, dropdown lọc theo `tagId`, refetch khi đóng dialog edit.
- `task.entity.ts`: thêm `tags: ITag[]` vào ITask + `tagId?` vào ITaskListQuery.

✅ **Commit + push xong** (FE `0361e3d`, BE `25614fe`/`ae85f1f` — đều trên `origin/dev`, 0 ahead/behind).
⏭️ **Còn lại:** smoke trên app live (tạo tag → gắn vào task → lọc → đổi status → xem dòng lịch sử) + bắt đầu Đợt 2.

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

### ✅ FE Đợt 1 — Tags + ActivityLog: ĐÃ XONG (2026-06-22). Xem mục "Trạng thái hiện tại".

### ✅ Đợt 2 — Kanban + Framer Motion: XONG (2026-06-22, commit `9b91f78` + push `origin/dev`). Spec: `task-be/.handoff/specs/2026-06-22-kanban-animation.md`
- **dnd-kit Kanban** (view toggle Bảng ⇄ Kanban trên `Tasks.tsx`, mặc định Bảng): kéo card sang cột
  khác → đổi status qua `handleQuickUpdate` (BE tự sinh ActivityLog). Chỉ task `canEdit` mới kéo được.
  Logic thuần ở `src/lib/kanban.ts` (KANBAN_COLUMNS/groupTasksByStatus/resolveStatusChange, 100% cover);
  component `src/components/pages/tasks/TaskBoard.tsx` (DndContext, 5 cột = 5 status).
- **Framer Motion**: `src/components/PageTransition.tsx` (fade+slide theo pathname, bọc `{children}` trong
  `layout.tsx`) + animate icon Sun/Moon khi toggle dark mode. Cả hai tôn trọng `prefers-reduced-motion`.
- **208 test pass** (186 → +22), coverage 77.81/81/64.23/77.81 (trên floor). Build + lint + tsc sạch.
- ⏭️ **Còn lại:** smoke trên app live sau khi Vercel deploy xong: mở Kanban, kéo TODO→IN_PROGRESS,
  xem status đổi + dòng ActivityLog mới; toggle dark mode; chuyển trang có transition.

### Còn lại P2
- Task attachments (upload — `postWithFile` có sẵn chưa dùng), AI (`AiHistory`).

## Quyết định

- Test: **Vitest** + RTL + jsdom. Ưu tiên logic (slices/repositories/utils) + trang chính. CI: lint
  (chặn) + build + `test:coverage`.

## Lệnh nhanh

- `npm test` · `npm run test:coverage` · `npm run build` · `npm run lint`

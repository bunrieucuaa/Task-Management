# Nhật ký & trạng thái — Frontend

> Cập nhật file này cuối mỗi phiên. Mục quan trọng nhất: **Trạng thái hiện tại** + **Việc kế tiếp**.

## Trạng thái hiện tại

🟢 **DEPLOY LIVE:** FE trên **Vercel**, BE trên Render, DB Neon. Admin đăng nhập OK.
**208 test PASS**, coverage 77.81/81/64.23/77.81 (floor 72/75/56/72, CI chạy `test:coverage`, lint chặn).
Build + lint + tsc sạch. Nhánh `dev` đồng bộ `origin/dev`.

✅ **Đợt 1 (Tags + ActivityLog)** và ✅ **Đợt 2 (Kanban dnd-kit + Framer Motion)** đều đã xong & push.
Đợt cuối: FE `c699f82` trên `origin/dev` → Vercel auto-deploy.

⚠️ **Nên làm:** đổi mật khẩu admin mặc định; cân nhắc merge `dev → master` rồi trỏ Vercel sang `master`.

**Cấu hình Vercel:** import repo, Preset Vite, branch `dev`; build/output để `vercel.json` lo. Env
**`VITE_BASE_API_URL`** = `https://<be>.onrender.com/api/v1` (**bắt buộc đuôi `/api/v1`**, không `/`
cuối; Vite nướng vào lúc build → đặt TRƯỚC khi deploy).

**Bài học deploy:**
1. **Luôn commit + push trước khi deploy** (Vercel kéo `origin/dev`).
2. **401 sau login KHÔNG phải lỗi FE** — do BE: `CORS_ORIGIN` chưa trỏ domain Vercel, hoặc admin chưa
   seed. Đọc lỗi ở DevTools → Network → request `login` (CORS-blocked vs 401 vs 500).
3. Vercel sinh nhiều URL preview khác origin → CORS chỉ whitelist domain production → preview bị chặn.

## Việc kế tiếp — P2

- ⏭️ **Smoke app live** sau khi Vercel deploy: mở Kanban → kéo TODO→IN_PROGRESS → xem status đổi +
  dòng ActivityLog mới; toggle dark mode; chuyển trang có transition.
- **Còn lại P2:** Task attachments (upload — `postWithFile` có sẵn chưa dùng), AI (`AiHistory`).
- (tuỳ chọn) nâng coverage trang còn 0%: `AccountPage`, `Register`, `ResetPassword`, layouts.

## Quyết định

- Test: **Vitest** + RTL + jsdom. Ưu tiên logic (slices/repositories/utils) + trang chính. CI: lint
  (chặn) + build + `test:coverage`. Logic Kanban tách `src/lib/kanban.ts` (pure, dễ test) — component
  dnd-kit chỉ wiring (jsdom khó test pointer drag thật → spec mock `@dnd-kit/core`).

## Lệnh nhanh

- `npm test` · `npm run test:coverage` · `npm run build` · `npm run lint`

<details><summary>Lịch sử (gọn)</summary>

- **Đợt 2** (`9b91f78`): dnd-kit Kanban (view toggle Bảng ⇄ Kanban; kéo đổi status qua `handleQuickUpdate`,
  chỉ task `canEdit`; `src/lib/kanban.ts` + `components/pages/tasks/TaskBoard.tsx`) + Framer Motion
  (`components/PageTransition.tsx` fade+slide theo pathname + animate Sun/Moon toggle dark mode; tôn trọng
  `prefers-reduced-motion`). Spec `task-be/.handoff/specs/2026-06-22-kanban-animation.md`.
- **Đợt 1** (`0361e3d`): TagRepository/ActivityRepository + `tagsSlice` + util `tagColor`/`describeActivity`,
  TagPicker trong TaskFormDialog (edit mode), badge + lọc theo `tagId` ở Tasks.tsx, TaskActivityDialog
  (timeline). `task.entity.ts`: `tags` vào ITask + `tagId?` vào ITaskListQuery.
- Hạ tầng test (Vitest + RTL + jsdom) + bộ test: utils/enums/jwt, redux slices, repository (mock axios),
  Guards, dialog, `axios-interceptor` (refresh flow), trang chính (Users/Projects/Tasks/HomePage).
- Lưu ý test: page **luôn refetch khi mount** → đẩy data qua repository mock + `findBy*`; mock
  `@tanstack/react-router` (`useNavigate`/`Navigate`/`Link`) + `sonner`; Radix `DropdownMenu` cần polyfill
  `hasPointerCapture`/`setPointerCapture`/`releasePointerCapture` ở `beforeAll`.

</details>

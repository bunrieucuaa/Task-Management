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

## Việc kế tiếp — P2 (chưa implement)

> Bắt đầu đợt này (2026-06-21): **Tags + ActivityLog + animation + kéo thả**.

- **Tags / TaskTag** (BE đã có model): UI gán/gỡ tag cho task, badge tag trên row, lọc theo tag.
- **ActivityLog** (BE đã có model): timeline lịch sử thay đổi của task (trong dialog task).
- **Kéo thả:** dùng **dnd-kit** (`@dnd-kit/core` + `sortable`) — vd board theo status hoặc sắp xếp.
- **Animation:** transition chuyển trang + toggle light/dark (xem mục Quyết định bên dưới).
- Còn lại: Task attachments (upload — `postWithFile` có sẵn chưa dùng), AI (`AiHistory`).

## Quyết định

- Test: **Vitest** + RTL + jsdom. Ưu tiên logic (slices/repositories/utils) + trang chính. CI: lint
  (chặn) + build + `test:coverage`.

## Lệnh nhanh

- `npm test` · `npm run test:coverage` · `npm run build` · `npm run lint`

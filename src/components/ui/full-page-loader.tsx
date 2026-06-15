import { Loader2 } from "lucide-react";

/**
 * Loader giữ layout ổn định trong lúc khởi tạo auth.
 * Dùng thay cho việc render `null` ở các guard để tránh màn hình trắng
 * nhấp nháy khi tải trang đầu tiên.
 */
export default function FullPageLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-dvh w-full flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
        {label ? <span className="text-sm">{label}</span> : null}
      </div>
    </div>
  );
}

import AuthSplitLayout from "@/components/pages/auth/AuthSplitLayout";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const mismatch = useMemo(() => {
    if (!newPassword || !confirmPassword) return false;
    return newPassword !== confirmPassword;
  }, [newPassword, confirmPassword]);

  return (
    <AuthSplitLayout>
      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitError(null);

          if (!oldPassword || !newPassword || !confirmPassword) {
            setSubmitError("Vui lòng nhập đầy đủ thông tin.");
            return;
          }

          if (mismatch) {
            setSubmitError("Mật khẩu xác nhận không khớp.");
            return;
          }

          if (newPassword === oldPassword) {
            setSubmitError("Mật khẩu mới phải khác mật khẩu cũ.");
            return;
          }

          void navigate({ to: "/login" });
        }}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h2 className="text-2xl font-bold bg-linear-to-r from-[#22c55e] via-[#60a5fa] to-[#a78bfa] bg-clip-text text-transparent">
              Đổi mật khẩu lần đầu
            </h2>
            <FieldDescription className="text-center">
              Nhập mật khẩu admin đã cấp, sau đó tạo mật khẩu mới để tiếp tục sử
              dụng.
            </FieldDescription>
          </div>

          <Field>
            <FieldLabel htmlFor="oldPassword">Mật khẩu cũ</FieldLabel>
            <Input
              id="oldPassword"
              type="password"
              placeholder="•••••••••••••"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="newPassword">Mật khẩu mới</FieldLabel>
            <Input
              id="newPassword"
              type="password"
              placeholder="•••••••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              aria-invalid={mismatch || undefined}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="confirmPassword">Xác nhận mật khẩu mới</FieldLabel>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="•••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              aria-invalid={mismatch || undefined}
            />
          </Field>

          {submitError ? (
            <FieldDescription className="text-center text-destructive">
              {submitError}
            </FieldDescription>
          ) : null}

          <Field>
            <Button
              className="bg-linear-to-r from-[#22c55e] via-[#60a5fa] to-[#a78bfa]"
              type="submit"
            >
              Xác nhận
            </Button>
          </Field>

          <FieldDescription className="text-center">
            Đã có mật khẩu mới?{" "}
            <button
              type="button"
              className="underline underline-offset-4"
              onClick={() => void navigate({ to: "/login" })}
            >
              Quay lại đăng nhập
            </button>
          </FieldDescription>
        </FieldGroup>
      </form>
    </AuthSplitLayout>
  );
}


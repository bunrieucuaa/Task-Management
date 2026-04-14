import AuthSplitLayout from "@/components/pages/auth/AuthSplitLayout";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldSeparator,
} from "@/components/ui/field";
import { Link } from "@tanstack/react-router";

export default function RegisterPage() {
  return (
    <AuthSplitLayout>
      <div className="flex flex-col gap-6">
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h2 className="text-2xl font-bold bg-linear-to-r from-[#22c55e] via-[#60a5fa] to-[#a78bfa] bg-clip-text text-transparent">
              Đăng ký
            </h2>
          </div>

          <Field>
            <FieldDescription className="text-center">
              Ứng dụng không hỗ trợ tự tạo tài khoản. Vui lòng liên hệ admin để
              được cấp tài khoản và mật khẩu đăng nhập lần đầu.
            </FieldDescription>
          </Field>

          <FieldSeparator>Hoặc</FieldSeparator>

          <Field className="gap-3">
            <Button asChild>
              <Link to="/login">Quay lại đăng nhập</Link>
            </Button>
          </Field>
        </FieldGroup>
      </div>
    </AuthSplitLayout>
  );
}


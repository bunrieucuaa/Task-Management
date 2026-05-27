import { ChangePasswordForm } from "@/components/pages/auth/ChangePasswordForm";
import AuthSplitLayout from "@/components/pages/auth/AuthSplitLayout";

export default function ChangePasswordPage() {
  return (
    <AuthSplitLayout>
      <ChangePasswordForm />
    </AuthSplitLayout>
  );
}

import { LoginForm } from "@/components/pages/auth/LoginForm";
import AuthSplitLayout from "@/components/pages/auth/AuthSplitLayout";

export default function LoginPage() {
  return (
    <AuthSplitLayout>
      <LoginForm />
    </AuthSplitLayout>
  );
}

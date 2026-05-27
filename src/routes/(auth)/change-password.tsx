import MustChangePasswordGuard from "@/layouts/MustChangePasswordGuard";
import ChangePasswordPage from "@/pages/auth/ChangePassword";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)/change-password")({
  component: () => (
    <MustChangePasswordGuard>
      <ChangePasswordPage />
    </MustChangePasswordGuard>
  ),
});

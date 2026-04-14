import ResetPasswordPage from "@/pages/auth/ResetPassword";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)/reset-password")({
  component: ResetPasswordPage,
});


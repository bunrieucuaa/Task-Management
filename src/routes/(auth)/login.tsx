import LoginPage from "@/pages/auth/Login";
import GuestGuard from "@/layouts/GuestGuard";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)/login")({
  component: () => (
    <GuestGuard>
      <LoginPage />
    </GuestGuard>
  ),
});

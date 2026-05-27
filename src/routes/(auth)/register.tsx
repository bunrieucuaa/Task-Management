import RegisterPage from "@/pages/auth/Register";
import GuestGuard from "@/layouts/GuestGuard";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(auth)/register")({
  component: () => (
    <GuestGuard>
      <RegisterPage />
    </GuestGuard>
  ),
});


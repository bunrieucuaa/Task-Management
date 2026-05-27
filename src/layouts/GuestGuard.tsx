import { useAppSelector } from "@/app/hooks";
import { Navigate } from "@tanstack/react-router";

export default function GuestGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, mustChangePassword } = useAppSelector((s) => s.auth);

  if (isAuthenticated) {
    return (
      <Navigate to={mustChangePassword ? "/change-password" : "/"} replace />
    );
  }

  return children;
}


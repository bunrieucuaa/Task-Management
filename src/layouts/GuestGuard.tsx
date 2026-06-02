import { useAppSelector } from "@/app/hooks";
import { hasStoredAuthTokens } from "@/redux/authSlice";
import { Navigate } from "@tanstack/react-router";

export default function GuestGuard({ children }: { children: React.ReactNode }) {
  const { initialized, isAuthenticated, mustChangePassword } = useAppSelector(
    (s) => s.auth,
  );

  if (!initialized && hasStoredAuthTokens()) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to={mustChangePassword ? "/change-password" : "/"} replace />;
  }

  return children;
}

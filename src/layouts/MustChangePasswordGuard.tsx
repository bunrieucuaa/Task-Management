import { useAppSelector } from "@/app/hooks";
import { hasStoredAuthTokens } from "@/redux/authSlice";
import { Navigate } from "@tanstack/react-router";
import FullPageLoader from "@/components/ui/full-page-loader";

export default function MustChangePasswordGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { initialized, isAuthenticated, mustChangePassword } = useAppSelector(
    (s) => s.auth,
  );

  if (!initialized && hasStoredAuthTokens()) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!mustChangePassword) {
    return <Navigate to="/" replace />;
  }

  return children;
}

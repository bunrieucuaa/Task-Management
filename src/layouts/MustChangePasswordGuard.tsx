import { useAppSelector } from "@/app/hooks";
import { Navigate } from "@tanstack/react-router";
export default function MustChangePasswordGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, mustChangePassword } = useAppSelector((s) => s.auth);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!mustChangePassword) {
    return <Navigate to="/" replace />;
  }
  return children;
}

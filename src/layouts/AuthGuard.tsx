import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { getMe, hasStoredAuthTokens } from "@/redux/authSlice";
import { Navigate, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import FullPageLoader from "@/components/ui/full-page-loader";

interface AuthGuardProps {
  isPrivate: boolean;
}

const AuthGuard = ({ isPrivate }: AuthGuardProps) => {
  const dispatch = useAppDispatch();
  const { initialized, isAuthenticated, user, mustChangePassword, userLoading } =
    useAppSelector((state) => state.auth);

  useEffect(() => {
    if (
      !initialized ||
      !isAuthenticated ||
      user !== null ||
      mustChangePassword ||
      userLoading
    ) {
      return;
    }

    void dispatch(getMe());
  }, [initialized, isAuthenticated, user, mustChangePassword, userLoading, dispatch]);

  if (!initialized && hasStoredAuthTokens()) {
    return <FullPageLoader label="Đang khởi tạo phiên đăng nhập..." />;
  }

  return isAuthenticated && isPrivate ? <Outlet /> : <Navigate to="/login" />;
};

export default AuthGuard;

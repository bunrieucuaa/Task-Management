import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { getMe } from "@/redux/authSlice";
import { Navigate, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";

interface AuthGuardProps {
  isPrivate: boolean;
}

const AuthGuard = ({ isPrivate }: AuthGuardProps) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  // Sau khi reload trang: token vẫn hợp lệ nhưng user bị reset về null
  // → Gọi lại /me để khôi phục thông tin user vào store
  useEffect(() => {
    if (isAuthenticated && user === null) {
      dispatch(getMe());
    }
  }, [isAuthenticated, user, dispatch]);

  return isAuthenticated && isPrivate ? <Outlet /> : <Navigate to="/login" />;
};

export default AuthGuard;
